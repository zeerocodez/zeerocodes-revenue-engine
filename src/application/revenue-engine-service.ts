import { qualifyLead } from '../domain/qualification';
import { createAuditEvent, type AuditEvent } from '../domain/audit';
import { decideLeadAction, type DecisionResult } from '../domain/decision-engine';
import { canTransition, type LeadState } from '../domain/lead-state';
import { evaluateLeadTransition } from '../domain/lead-state-machine';
import type { LeadIntakeInput, LeadRecord } from '../domain/lead';
import { scoreLead } from '../domain/scoring';
import type { ClientQualificationPolicy } from '../domain/client-policy';
import { evaluateClientPolicy } from '../domain/client-policy';
import type { ClientConfiguration } from '../domain/client-configuration';
import type { LeadEvent, LeadEventStore } from '../domain/lead-events';

export interface LeadStore { get(id:string):Promise<LeadRecord|null>; save(lead:LeadRecord):Promise<void>; list(organizationId:string):Promise<LeadRecord[]>; }
export interface ClientConfigurationProvider { get(organizationId:string):Promise<ClientConfiguration>; }
export interface UsageLedgerWriter { recordUsage(entry:{id:string;organizationId:string;leadId?:string;eventType:string;quantity:number;unitPrice:number;currency:string;amount:number;idempotencyKey:string;metadata?:Record<string,unknown>;createdAt:string}):Promise<boolean>; }
export interface LeadDecisionResponse { lead:LeadRecord; decision:DecisionResult; auditEvent:AuditEvent; }
function id(prefix:string):string{return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;}
function toLeadEvent(lead:LeadRecord,type:LeadEvent['type'],reason:string,fromState?:LeadState,toState?:LeadState,metadata?:Record<string,unknown>):LeadEvent{return {id:id('evt'),leadId:lead.id,organizationId:lead.organizationId,type,actor:'system',timestamp:new Date().toISOString(),fromState,toState,reason,metadata};}

export class RevenueEngineService {
  constructor(private readonly store:LeadStore,private readonly policy?:ClientQualificationPolicy,private readonly eventStore?:LeadEventStore,private readonly configurationProvider?:ClientConfigurationProvider,private readonly usageLedger?:UsageLedgerWriter){}
  private async configurationFor(organizationId:string){return this.configurationProvider?.get(organizationId);}

  async intake(input:LeadIntakeInput):Promise<LeadDecisionResponse>{
    if(!input.organizationId?.trim()) throw new Error('organizationId is required');
    if(!input.name?.trim()) throw new Error('lead name is required');
    const now=new Date().toISOString(), profile=input.profile??{}, configuration=await this.configurationFor(input.organizationId), policy=configuration?.qualification??this.policy, scoringConfig=configuration?.scoring;
    const qualification=qualifyLead(profile,scoringConfig?{threshold:scoringConfig.threshold,maxUrgencyDays:policy?.maximumUrgencyDays??30,requireDecisionMaker:false,requireBudget:false,weights:scoringConfig.weights}:undefined);
    const score=scoreLead(profile,scoringConfig);
    const policyResult=policy?evaluateClientPolicy(profile,policy,scoringConfig):{...qualification,qualified:qualification.qualified};
    const consent=input.consent!==false;
    const decision=decideLeadAction({score:{...score,qualified:policyResult.qualified,hardDisqualified:policyResult.hardDisqualified},consent,hardDisqualified:policyResult.hardDisqualified});
    const nextState:LeadState=decision.action==='reject'?'invalid':decision.action==='nurture'?'nurture':'contacting';
    const transition=evaluateLeadTransition({from:'new',to:nextState,consent,qualification:{...qualification,qualified:policyResult.qualified,hardDisqualified:policyResult.hardDisqualified}});
    if(!transition.allowed) throw new Error(transition.reason);
    const lead:LeadRecord={id:id('lead'),organizationId:input.organizationId,name:input.name.trim(),email:input.email,phone:input.phone,source:input.source,campaignId:input.campaignId,state:nextState,profile,commercial:input.commercial,consent,createdAt:now,updatedAt:now,score:score.score,qualification:{...qualification,qualified:policyResult.qualified,hardDisqualified:policyResult.hardDisqualified},decision,metadata:{...input.metadata,configurationVersion:configuration?.version,initialAction:decision.action,statePolicy:transition.reason}};
    await this.store.save(lead);
    const auditEvent=createAuditEvent({organizationId:lead.organizationId,leadId:lead.id,actor:'system',action:'lead_intake_decision',fromState:'new',toState:lead.state,reason:decision.reason,source:input.source,metadata:{score:score.score,qualified:policyResult.qualified,route:decision.route,action:decision.action,configurationVersion:configuration?.version,statePolicy:transition.reason}});
    await this.eventStore?.append(toLeadEvent(lead,'lead.created','lead captured',undefined,lead.state,{source:input.source}));
    await this.eventStore?.append(toLeadEvent(lead,'lead.scored',decision.reason,lead.state,lead.state,{score:score.score,band:score.band,qualified:policyResult.qualified,configurationVersion:configuration?.version}));
    await this.eventStore?.append(toLeadEvent(lead,'lead.routed',decision.reason,lead.state,lead.state,{route:decision.route,action:decision.action}));
    if(this.usageLedger){
      await this.usageLedger.recordUsage({id:id('usage'),organizationId:lead.organizationId,leadId:lead.id,eventType:'lead.intake',quantity:1,unitPrice:0,amount:0,currency:'NGN',idempotencyKey:`lead.intake:${lead.id}`,metadata:{qualified:policyResult.qualified},createdAt:now});
      if(policyResult.qualified) await this.usageLedger.recordUsage({id:id('usage'),organizationId:lead.organizationId,leadId:lead.id,eventType:'qualified.lead',quantity:1,unitPrice:0,amount:0,currency:'NGN',idempotencyKey:`qualified.lead:${lead.id}`,metadata:{score:score.score},createdAt:now});
    }
    return {lead,decision,auditEvent};
  }

  async getLeadForOrganization(id:string,organizationId:string):Promise<LeadRecord>{const lead=await this.store.get(id);if(!lead)throw new Error(`Lead not found: ${id}`);if(lead.organizationId!==organizationId)throw new Error('Tenant access denied');return lead;}

  async redecide(id:string,organizationId?:string):Promise<LeadDecisionResponse>{
    const lead=await this.store.get(id);if(!lead)throw new Error(`Lead not found: ${id}`);if(organizationId&&lead.organizationId!==organizationId)throw new Error('Tenant access denied');
    const previousState=lead.state,configuration=await this.configurationFor(lead.organizationId),policy=configuration?.qualification??this.policy,scoringConfig=configuration?.scoring,score=scoreLead(lead.profile,scoringConfig),policyResult=policy?evaluateClientPolicy(lead.profile,policy,scoringConfig):{score:score.score,qualified:score.qualified,reasons:score.reasons,hardDisqualified:score.hardDisqualified};
    const decision=decideLeadAction({score:{...score,qualified:policyResult.qualified,hardDisqualified:policyResult.hardDisqualified},consent:lead.consent,hardDisqualified:policyResult.hardDisqualified});
    const desiredState:LeadState=decision.action==='reject'?'invalid':decision.action==='nurture'?'nurture':previousState;
    let nextState=previousState;
    let statePolicyReason='state preserved';
    if(desiredState!==previousState&&canTransition(previousState,desiredState)){
      const transition=evaluateLeadTransition({from:previousState,to:desiredState,consent:lead.consent,qualification:{...lead.qualification,...policyResult}});
      if(transition.allowed){nextState=desiredState;statePolicyReason=transition.reason;}
      else statePolicyReason=transition.reason;
    }
    lead.state=nextState;lead.previousState=previousState===nextState?lead.previousState:previousState;lead.score=score.score;lead.qualification={...lead.qualification,score:score.score,qualified:policyResult.qualified,reasons:policyResult.reasons,hardDisqualified:policyResult.hardDisqualified};lead.decision=decision;lead.updatedAt=new Date().toISOString();lead.metadata={...lead.metadata,configurationVersion:configuration?.version,initialAction:decision.action,statePolicy:statePolicyReason};await this.store.save(lead);
    const auditEvent=createAuditEvent({organizationId:lead.organizationId,leadId:lead.id,actor:'system',action:'lead_redecision',fromState:previousState,toState:nextState,reason:decision.reason,source:lead.source,metadata:{score:score.score,qualified:policyResult.qualified,route:decision.route,action:decision.action,statePreserved:nextState===previousState&&desiredState!==previousState,statePolicy:statePolicyReason,configurationVersion:configuration?.version}});
    await this.eventStore?.append(toLeadEvent(lead,'lead.scored','decision recalculated',previousState,nextState,{score:score.score,band:score.band,qualified:policyResult.qualified,configurationVersion:configuration?.version}));
    if(previousState!==nextState)await this.eventStore?.append(toLeadEvent(lead,'lead.state_changed',decision.reason,previousState,nextState,{route:decision.route,action:decision.action,statePolicy:statePolicyReason}));
    await this.eventStore?.append(toLeadEvent(lead,decision.action==='reject'?'lead.rejected':'lead.routed',decision.reason,nextState,nextState,{route:decision.route,action:decision.action,statePreserved:nextState===previousState&&desiredState!==previousState}));
    return {lead,decision,auditEvent};
  }
}
