import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { ConversationService } from './src/application/conversation-service';
import { QualificationOrchestrator } from './src/application/qualification-orchestrator';
import { ClientConfigurationService } from './src/application/client-configuration-service';
import { RevenueEngineService } from './src/application/revenue-engine-service';
import { TenantMembershipService } from './src/application/tenant-membership-service';
import { MembershipIdentityResolver, requireRole, type AuthenticatedRequestContext } from './src/application/request-context';
import { SessionIdentityResolver, signSession } from './src/application/session-auth';
import { TenantLeadEventRepositoryImpl } from './src/application/tenant-repository';
import { MemoryClientConfigurationStore } from './src/integrations/memory-client-configuration';
import { MemoryConversationStore, MemoryMessageStore } from './src/integrations/memory-messaging';
import { MemoryLeadStore } from './src/integrations/memory-lead-store';
import { MemoryLeadEventStore } from './src/integrations/memory-lead-events';
import { MemoryTenantMembershipRepository } from './src/integrations/memory-tenant-membership';
import { PostgresDatabase } from './src/integrations/postgres';
import { PostgresTenantMembershipRepository } from './src/integrations/postgres-tenant-membership';
import { PostgresLeadStore, PostgresConversationStore, PostgresMessageStore, PostgresLeadEventStore, PostgresClientConfigurationStore } from './src/integrations/postgres-repositories';
import { PostgresRevenueWorkflowRepository } from './src/integrations/postgres-workflow';
import { WebhookDispatcher } from './src/integrations/webhooks';
import { runPostgresMigrations } from './src/integrations/postgres-migrations';
import type { ClientConfiguration } from './src/domain/client-configuration';
import type { TenantRole } from './src/domain/tenant';
import type { LeadStore } from './src/application/revenue-engine-service';
import type { LeadEventStore } from './src/domain/lead-events';
import type { LeadOutcomeType } from './src/domain/revenue-workflow';

const __filename=fileURLToPath(import.meta.url),__dirname=path.dirname(__filename),app=express(),port=Number(process.env.PORT||3000),usePostgres=Boolean(process.env.DATABASE_URL);
if(process.env.NODE_ENV==='production'&&!usePostgres)throw new Error('DATABASE_URL is required in production');
if(process.env.NODE_ENV==='production'&&!process.env.SESSION_SECRET)throw new Error('SESSION_SECRET is required in production');
const db=usePostgres?new PostgresDatabase():undefined;
const leadStore:LeadStore=db?new PostgresLeadStore(db):new MemoryLeadStore();
const leadEventStore:LeadEventStore=db?new PostgresLeadEventStore(db):new MemoryLeadEventStore();
const tenantEventRepository=new TenantLeadEventRepositoryImpl(leadEventStore);
const clientConfigurationStore=db?new PostgresClientConfigurationStore(db):new MemoryClientConfigurationStore();
const clientConfigurationService=new ClientConfigurationService(clientConfigurationStore);
const workflow=db?new PostgresRevenueWorkflowRepository(db):undefined;
const webhookDispatcher=db?new WebhookDispatcher(db):undefined;
const revenueEngine=new RevenueEngineService(leadStore,undefined,leadEventStore,clientConfigurationService,workflow);
const conversationStore=db?new PostgresConversationStore(db):new MemoryConversationStore();
const messageStore=db?new PostgresMessageStore(db):new MemoryMessageStore();
const conversationService=new ConversationService(leadStore,conversationStore,messageStore);
const qualificationOrchestrator=new QualificationOrchestrator(leadStore,leadEventStore);
const memoryMembershipRepository=new MemoryTenantMembershipRepository();
const postgresMembershipRepository=db?new PostgresTenantMembershipRepository(db):undefined;
const membershipRepository=postgresMembershipRepository??memoryMembershipRepository;
const membershipService=new TenantMembershipService(membershipRepository);
const headerIdentityResolver=new MembershipIdentityResolver(membershipService);
const sessionIdentityResolver=new SessionIdentityResolver(membershipService);

if(!usePostgres&&process.env.NODE_ENV!=='production'){
  const tenantId=process.env.DEV_TENANT_ID||'demo-tenant',userId=process.env.DEV_USER_ID||'demo-user',role=(process.env.DEV_USER_ROLE||'owner') as TenantRole;
  const validRoles:TenantRole[]=['viewer','agent','manager','admin','owner'];if(!validRoles.includes(role))throw new Error('Invalid DEV_USER_ROLE');
  memoryMembershipRepository.seedTenant({id:tenantId,name:'Demo Tenant',slug:'demo-tenant',status:'active',createdAt:new Date().toISOString()});
  memoryMembershipRepository.seedMembership({id:`membership_${userId}_${tenantId}`,userId,tenantId,email:process.env.DEV_USER_EMAIL||'demo@example.com',role,active:true,createdAt:new Date().toISOString()});
}

app.use(express.json());
type RequestWithContext=express.Request&{context?:AuthenticatedRequestContext};
function contextOf(req:RequestWithContext):AuthenticatedRequestContext{if(!req.context)throw new Error('Authenticated request context is required');return req.context;}
function tenantError(error:unknown){const message=error instanceof Error?error.message:'Request failed';if(message==='Tenant access denied'||message==='Insufficient tenant role')return 403;if(message.includes('membership')||message==='Tenant is suspended'||message==='Tenant not found')return 403;return 400;}

app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'zeerocodes-revenue-engine',mode:usePostgres?'postgres':'memory',workflow:'lead-to-revenue',rls:usePostgres}));
app.post('/api/auth/dev-session',(req,res)=>{
  if(process.env.NODE_ENV==='production')return res.status(404).json({error:'Not found'});
  const tenantId=String(req.body?.tenantId||process.env.DEV_TENANT_ID||'demo-tenant'),userId=String(req.body?.userId||process.env.DEV_USER_ID||'demo-user');
  return res.json({token:signSession(userId,tenantId),tenantId,userId});
});

async function authMiddleware(req:RequestWithContext,res:express.Response,next:express.NextFunction){
  try{
    let context:AuthenticatedRequestContext;
    const bearer=req.header('authorization');
    if(bearer?.startsWith('Bearer ')) context=await sessionIdentityResolver.resolveBearer(bearer.slice(7));
    else if(process.env.NODE_ENV!=='production'){
      const userId=req.header('x-user-id'),tenantId=req.header('x-tenant-id');
      if(!userId||!tenantId) return res.status(401).json({error:'Bearer session required'});
      context=await headerIdentityResolver.resolve({userId,tenantId});
    } else return res.status(401).json({error:'Bearer session required'});
    req.context=context;
    if(db){
      const transaction=await db.beginRequestTenant(context.tenantId);
      db.runRequestContext(context.tenantId,transaction.client,()=>{
        let settled=false;
        const finish=async()=>{if(settled)return;settled=true;await transaction.finish(res.statusCode<500);};
        res.on('finish',()=>{void finish();});
        next();
      });
      return;
    }
    next();
  }catch(error){return res.status(401).json({error:error instanceof Error?error.message:'Authentication failed'});}
}
app.use('/api',authMiddleware);

app.get('/api/configuration',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'viewer');return res.json({configuration:await clientConfigurationService.get(c.tenantId)});}catch(e){return res.status(tenantError(e)).json({error:e instanceof Error?e.message:'Unable to load configuration'});}});
app.put('/api/configuration',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'admin');return res.json({configuration:await clientConfigurationService.save({...req.body as ClientConfiguration,organizationId:c.tenantId})});}catch(e){return res.status(tenantError(e)).json({error:e instanceof Error?e.message:'Unable to save configuration'});}});

app.post('/api/leads/intake',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'agent');const result=await revenueEngine.intake({...req.body,organizationId:c.tenantId});if(webhookDispatcher)await webhookDispatcher.enqueue({id:randomUUID(),organizationId:c.tenantId,type:'lead.created',occurredAt:new Date().toISOString(),payload:{lead:result.lead,decision:result.decision}});return res.status(201).json(result);}catch(e){return res.status(tenantError(e)).json({error:e instanceof Error?e.message:'Invalid lead intake'});}});
app.get('/api/leads',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'viewer');return res.json({leads:await leadStore.list(c.tenantId)});}catch(e){return res.status(tenantError(e)).json({error:e instanceof Error?e.message:'Unable to list leads'});}});
app.get('/api/leads/:id',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'viewer');return res.json({lead:await revenueEngine.getLeadForOrganization(req.params.id,c.tenantId)});}catch(e){const m=e instanceof Error?e.message:'Lead not found';return res.status(m==='Tenant access denied'?403:m.startsWith('Lead not found')?404:tenantError(e)).json({error:m});}});
app.get('/api/leads/:id/events',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'viewer');await revenueEngine.getLeadForOrganization(req.params.id,c.tenantId);return res.json({events:await tenantEventRepository.listForTenant(req.params.id,c.tenantId)});}catch(e){const m=e instanceof Error?e.message:'Lead not found';return res.status(m==='Tenant access denied'?403:m.startsWith('Lead not found')?404:tenantError(e)).json({error:m});}});
app.get('/api/leads/:id/conversation',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'viewer');return res.json(await conversationService.getConversation(req.params.id,c.tenantId));}catch(e){const m=e instanceof Error?e.message:'Conversation unavailable';return res.status(m==='Tenant access denied'?403:tenantError(e)).json({error:m});}});
app.post('/api/leads/:id/messages',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'agent');return res.json(await conversationService.sendMessage({...req.body,leadId:req.params.id,organizationId:c.tenantId}));}catch(e){const m=e instanceof Error?e.message:'Unable to send message';return res.status(m==='Tenant access denied'?403:tenantError(e)).json({error:m});}});
app.post('/api/leads/:id/conversation-decision',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'agent');await revenueEngine.getLeadForOrganization(req.params.id,c.tenantId);const configuration=await clientConfigurationService.get(c.tenantId);return res.json(await qualificationOrchestrator.process({leadId:req.params.id,organizationId:c.tenantId,text:req.body.message,configuration,policy:configuration.qualification}));}catch(e){const m=e instanceof Error?e.message:'Unable to process conversation';return res.status(m==='Tenant access denied'?403:tenantError(e)).json({error:m});}});
app.post('/api/leads/:id/redecide',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'manager');return res.json(await revenueEngine.redecide(req.params.id,c.tenantId));}catch(e){const m=e instanceof Error?e.message:'Unable to redecide lead';return res.status(m==='Tenant access denied'?403:m.startsWith('Lead not found')?404:tenantError(e)).json({error:m});}});

app.post('/api/leads/:id/appointments',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'agent');if(!workflow)return res.status(503).json({error:'Workflow persistence requires PostgreSQL'});const lead=await revenueEngine.getLeadForOrganization(req.params.id,c.tenantId);if(!['qualified','nurture'].includes(lead.state))throw new Error('Lead must be qualified before booking');const now=new Date().toISOString();const appointment={id:randomUUID(),organizationId:c.tenantId,leadId:lead.id,scheduledAt:new Date(req.body.scheduledAt).toISOString(),status:'scheduled' as const,ownerUserId:c.userId,source:req.body.source,metadata:req.body.metadata,createdAt:now,updatedAt:now};await workflow.saveAppointment(appointment);lead.state='booked';lead.updatedAt=now;await leadStore.save(lead);await leadEventStore.append({id:randomUUID(),leadId:lead.id,organizationId:c.tenantId,type:'lead.booked',actor:'sdr',timestamp:now,fromState:'qualified',toState:'booked',reason:'appointment booked',metadata:{appointmentId:appointment.id}});if(webhookDispatcher)await webhookDispatcher.enqueue({id:randomUUID(),organizationId:c.tenantId,type:'appointment.booked',occurredAt:now,payload:{lead,appointment}});return res.status(201).json({appointment,lead});}catch(e){return res.status(tenantError(e)).json({error:e instanceof Error?e.message:'Unable to book appointment'});}});
app.get('/api/leads/:id/appointments',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'viewer');if(!workflow)return res.json({appointments:[]});await revenueEngine.getLeadForOrganization(req.params.id,c.tenantId);return res.json({appointments:await workflow.listAppointments(c.tenantId,req.params.id)});}catch(e){return res.status(tenantError(e)).json({error:e instanceof Error?e.message:'Unable to load appointments'});}});
app.post('/api/leads/:id/outcome',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'manager');if(!workflow)return res.status(503).json({error:'Workflow persistence requires PostgreSQL'});const lead=await revenueEngine.getLeadForOrganization(req.params.id,c.tenantId);const outcome=req.body.outcome as LeadOutcomeType;if(!['won','lost','no_sale','no_show','cancelled','unqualified'].includes(outcome))throw new Error('Invalid outcome');const now=new Date().toISOString();const outcomeRecord={id:randomUUID(),organizationId:c.tenantId,leadId:lead.id,outcome,revenueAmount:typeof req.body.revenueAmount==='number'?req.body.revenueAmount:null,currency:req.body.currency||'NGN',reason:req.body.reason,ownerUserId:c.userId,occurredAt:now,metadata:req.body.metadata};await workflow.saveOutcome(outcomeRecord);const previousState=lead.state;lead.state=outcome==='won'?'won':outcome==='unqualified'?'invalid':'lost';lead.updatedAt=now;await leadStore.save(lead);await leadEventStore.append({id:randomUUID(),leadId:lead.id,organizationId:c.tenantId,type:outcome==='won'?'lead.won':'lead.lost',actor:'closer',timestamp:now,fromState:previousState,toState:lead.state,reason:outcomeRecord.reason||outcome,metadata:{outcomeId:outcomeRecord.id,revenueAmount:outcomeRecord.revenueAmount}});if(outcome==='won'&&outcomeRecord.revenueAmount){await workflow.saveAttribution({id:randomUUID(),organizationId:c.tenantId,leadId:lead.id,outcomeId:outcomeRecord.id,source:lead.source, campaign:String(lead.metadata?.campaign||''),medium:String(lead.metadata?.medium||''),attributionModel:'first_touch',attributedAmount:outcomeRecord.revenueAmount,currency:outcomeRecord.currency,createdAt:now});}if(webhookDispatcher)await webhookDispatcher.enqueue({id:randomUUID(),organizationId:c.tenantId,type:'lead.outcome',occurredAt:now,payload:{lead,outcome:outcomeRecord}});return res.json({lead,outcome:outcomeRecord});}catch(e){return res.status(tenantError(e)).json({error:e instanceof Error?e.message:'Unable to record outcome'});}});
app.get('/api/revenue/usage',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'manager');if(!workflow)return res.json({usage:[]});return res.json({usage:await workflow.usageSummary(c.tenantId)});}catch(e){return res.status(tenantError(e)).json({error:e instanceof Error?e.message:'Unable to load usage'});}});
app.post('/api/webhooks/deliver',async(req:RequestWithContext,res)=>{try{const c=contextOf(req);requireRole(c,'admin');if(!webhookDispatcher)return res.status(503).json({error:'Webhook delivery requires PostgreSQL'});return res.json({delivered:await webhookDispatcher.deliverPending(Number(req.body?.limit||20))});}catch(e){return res.status(tenantError(e)).json({error:e instanceof Error?e.message:'Unable to deliver webhooks'});}});

app.use(express.static(path.join(__dirname,'dist')));
app.get('*',(_req,res)=>res.sendFile(path.join(__dirname,'dist','index.html')));

async function bootstrap(){if(db)await runPostgresMigrations(db);app.listen(port,()=>console.log(`Zeerocodes Revenue Engine listening on ${port} (${usePostgres?'postgres':'memory'})`));}
void bootstrap().catch((error)=>{console.error('Startup failed',error);process.exit(1);});
