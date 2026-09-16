// server.ts
import express from "express";
import path2 from "node:path";
import { randomUUID as randomUUID5 } from "node:crypto";

// src/application/conversation-service.ts
function id(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
var ConversationService = class {
  constructor(leads, conversations, messages) {
    this.leads = leads;
    this.conversations = conversations;
    this.messages = messages;
  }
  async sendMessage(input) {
    const lead = await this.leads.get(input.leadId);
    if (!lead) throw new Error(`Lead not found: ${input.leadId}`);
    if (lead.organizationId !== input.organizationId) throw new Error("Tenant access denied");
    if (!input.body.trim()) throw new Error("Message body is required");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let conversation = await this.conversations.getByLead(input.leadId);
    if (conversation && conversation.organizationId !== input.organizationId) throw new Error("Tenant access denied");
    if (!conversation) {
      conversation = {
        id: id("conv"),
        organizationId: input.organizationId,
        leadId: input.leadId,
        channel: input.channel ?? "web",
        status: input.actor === "lead" ? "open" : "waiting",
        owner: input.actor === "lead" ? "ai" : input.actor === "closer" ? "closer" : input.actor === "sdr" ? "sdr" : "ai",
        createdAt: now,
        updatedAt: now
      };
    }
    const actor = input.actor ?? "ai";
    conversation.channel = input.channel ?? conversation.channel;
    conversation.updatedAt = now;
    conversation.lastMessageAt = now;
    conversation.status = actor === "lead" ? "open" : actor === "ai" ? "waiting" : "human";
    conversation.owner = actor === "lead" || actor === "system" ? conversation.owner : actor;
    const message = {
      id: id("msg"),
      organizationId: input.organizationId,
      leadId: input.leadId,
      conversationId: conversation.id,
      direction: actor === "lead" ? "inbound" : "outbound",
      actor,
      channel: conversation.channel,
      body: input.body.trim(),
      timestamp: now
    };
    await this.conversations.save(conversation);
    await this.messages.append(message);
    return { conversation, message };
  }
  async getConversation(leadId, organizationId) {
    const lead = await this.leads.get(leadId);
    if (!lead) throw new Error(`Lead not found: ${leadId}`);
    if (lead.organizationId !== organizationId) throw new Error("Tenant access denied");
    const conversation = await this.conversations.getByLead(leadId);
    if (!conversation) return { conversation: null, messages: [] };
    if (conversation.organizationId !== organizationId) throw new Error("Tenant access denied");
    const messages = await this.messages.list(conversation.id);
    if (messages.some((message) => message.organizationId !== organizationId)) throw new Error("Tenant access denied");
    return { conversation, messages };
  }
};

// src/domain/qualification-config.ts
var DEFAULT_QUALIFICATION_CONFIG = {
  threshold: 70,
  weights: {
    serviceFit: 25,
    needConfirmed: 20,
    decisionMaker: 20,
    locationFit: 15,
    urgency: 10,
    budget: 10
  },
  maxUrgencyDays: 14,
  requireDecisionMaker: false,
  requireBudget: false
};

// src/domain/qualification.ts
function qualifyLead(profile, config = DEFAULT_QUALIFICATION_CONFIG) {
  const reasons = [];
  let score = 0;
  if (config.requireDecisionMaker && profile.decisionMaker !== true) {
    return { score: 0, qualified: false, reasons: ["decision maker required"], hardDisqualified: true };
  }
  if (config.requireBudget && !(typeof profile.budget === "number" && profile.budget > 0)) {
    return { score: 0, qualified: false, reasons: ["budget required"], hardDisqualified: true };
  }
  if (profile.serviceFit === true) {
    score += config.weights.serviceFit;
    reasons.push("service fit");
  }
  if (profile.needConfirmed === true) {
    score += config.weights.needConfirmed;
    reasons.push("need confirmed");
  }
  if (profile.decisionMaker === true) {
    score += config.weights.decisionMaker;
    reasons.push("decision maker");
  }
  if (profile.locationFit === true) {
    score += config.weights.locationFit;
    reasons.push("location fit");
  }
  if (typeof profile.urgencyDays === "number" && profile.urgencyDays <= config.maxUrgencyDays) {
    score += config.weights.urgency;
    reasons.push("near-term urgency");
  }
  if (typeof profile.budget === "number" && profile.budget > 0) {
    score += config.weights.budget;
    reasons.push("budget identified");
  }
  return { score, qualified: score >= config.threshold, reasons, hardDisqualified: false };
}

// src/domain/client-policy.ts
var DEFAULT_CLIENT_POLICY = {
  qualificationThreshold: 70,
  requireDecisionMaker: false,
  requireServiceFit: true,
  requireLocationFit: false
};
function evaluateClientPolicy(profile, policy = DEFAULT_CLIENT_POLICY, scoringConfig) {
  if (policy.requireServiceFit && profile.serviceFit === false) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: "service fit failed" };
  }
  if (policy.requireDecisionMaker && profile.decisionMaker !== true) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: "decision maker required" };
  }
  if (policy.requireLocationFit && profile.locationFit !== true) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: "location fit failed" };
  }
  if (policy.minimumBudget != null && (profile.budget == null || profile.budget < policy.minimumBudget)) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: "minimum budget not met" };
  }
  if (policy.maximumUrgencyDays != null && profile.urgencyDays != null && profile.urgencyDays > policy.maximumUrgencyDays) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: "urgency window outside policy" };
  }
  const baseline = qualifyLead(profile, scoringConfig ? {
    threshold: scoringConfig.threshold,
    maxUrgencyDays: policy.maximumUrgencyDays ?? 30,
    requireDecisionMaker: false,
    requireBudget: false,
    weights: scoringConfig.weights
  } : void 0);
  return {
    ...baseline,
    qualified: baseline.score >= policy.qualificationThreshold,
    hardDisqualified: false
  };
}

// src/domain/conversation-decision-engine.ts
var patterns = [
  { intent: "stop", patterns: [/\bstop\b/i, /unsubscribe/i, /do not contact/i, /remove me/i] },
  { intent: "human_request", patterns: [/speak to (a )?human/i, /talk to (someone|a person|an agent)/i, /call me/i, /real person/i] },
  { intent: "booking_intent", patterns: [/book/i, /schedule/i, /appointment/i, /available (today|tomorrow|this week)/i, /when can we meet/i] },
  { intent: "pricing", patterns: [/how much/i, /price/i, /cost/i, /fee/i, /pricing/i, /what do you charge/i] },
  { intent: "complaint", patterns: [/angry/i, /terrible/i, /complain/i, /complaint/i, /refund/i, /fraud/i, /scam/i] },
  { intent: "objection", patterns: [/too expensive/i, /not interested/i, /think about it/i, /not sure/i, /send me details/i, /no budget/i, /later/i] },
  { intent: "greeting", patterns: [/^hi[!. ]*$/i, /^hello[!. ]*$/i, /^hey[!. ]*$/i, /^good (morning|afternoon|evening)[!. ]*$/i] },
  { intent: "information_request", patterns: [/what is/i, /how does/i, /tell me more/i, /details/i, /explain/i, /do you offer/i] }
];
function detectConversationIntent(text) {
  const value = text.trim();
  if (!value) return "unknown";
  for (const candidate of patterns) if (candidate.patterns.some((p) => p.test(value))) return candidate.intent;
  return "qualification_answer";
}
function decideConversation(context) {
  const intent = detectConversationIntent(context.text);
  if (context.consent === false || intent === "stop") return { intent, action: "opt-out", owner: "system", reason: "contact consent is absent or opt-out intent detected", confidence: 0.99 };
  if (intent === "complaint") return { intent, action: "escalate-complaint", owner: "sdr", reason: "complaint requires human review", confidence: 0.95 };
  if (context.requestedHuman || intent === "human_request") return { intent, action: "escalate-sdr", owner: "sdr", reason: "lead requested human assistance", confidence: 0.98 };
  if (intent === "booking_intent") {
    if (context.appointmentBooked) return { intent, action: "handoff-closer", owner: "closer", reason: "appointment already booked", confidence: 0.99 };
    if (context.leadScore.qualified) return { intent, action: "handoff-closer", owner: "closer", reason: "qualified lead expressed booking intent", confidence: 0.94 };
    return { intent, action: "ask-qualification", owner: "ai", reason: "booking intent detected but qualification is incomplete", confidence: 0.91 };
  }
  if (intent === "pricing") return { intent, action: "answer-pricing", owner: "ai", reason: "pricing question detected", confidence: 0.93 };
  if (intent === "objection") return { intent, action: "handle-objection", owner: "ai", reason: "sales objection detected", confidence: 0.9 };
  if (intent === "information_request") return { intent, action: "answer-information", owner: "ai", reason: "information request detected", confidence: 0.9 };
  if (intent === "greeting") return { intent, action: context.qualificationComplete ? "acknowledge" : "ask-qualification", owner: "ai", reason: "greeting received", confidence: 0.99 };
  if (intent === "qualification_answer") return { intent, action: context.qualificationComplete ? "acknowledge" : "ask-qualification", owner: "ai", reason: "message treated as qualification input", confidence: 0.7 };
  return { intent, action: "clarify", owner: "ai", reason: "intent could not be determined safely", confidence: 0.4 };
}

// src/domain/lead-state.ts
var transitions = {
  new: ["contacting", "nurture", "invalid"],
  contacting: ["engaged", "nurture", "invalid"],
  engaged: ["qualifying", "nurture", "lost"],
  qualifying: ["qualified", "nurture", "lost"],
  qualified: ["booked", "lost", "nurture"],
  booked: ["won", "lost", "nurture"],
  won: [],
  lost: ["nurture"],
  nurture: ["contacting", "qualified", "lost"],
  invalid: []
};
function canTransition(from, to) {
  return from === to || transitions[from].includes(to);
}
function transitionLead(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid lead transition: ${from} -> ${to}`);
  }
  return to;
}

// src/domain/scoring.ts
function scoreLead(profile, config) {
  const result = qualifyLead(profile, config ? {
    threshold: config.threshold,
    maxUrgencyDays: 30,
    requireDecisionMaker: false,
    requireBudget: false,
    weights: config.weights
  } : void 0);
  const hotScore = config?.hotScore ?? 80;
  const warmScore = config?.warmScore ?? 50;
  const band = result.score >= hotScore ? "hot" : result.score >= warmScore ? "warm" : "cold";
  return { ...result, band };
}

// src/domain/revenue-priority.ts
var INTENT_MULTIPLIER = {
  unknown: 0.8,
  information: 0.75,
  pricing: 1.1,
  qualification: 1.15,
  objection: 1,
  booking: 1.35,
  human_request: 1.25,
  complaint: 0.7,
  stop: 0,
  purchase: 1.5
};
function urgencyMultiplier(days) {
  if (days === void 0) return 1;
  if (days <= 1) return 1.5;
  if (days <= 3) return 1.35;
  if (days <= 7) return 1.2;
  if (days <= 14) return 1.05;
  return 0.9;
}
function valueMultiplier(value) {
  if (!value || value <= 0) return 0.8;
  if (value >= 5e6) return 1.5;
  if (value >= 2e6) return 1.3;
  if (value >= 1e6) return 1.15;
  if (value >= 5e5) return 1.05;
  return 0.9;
}
function calculateRevenuePriority(context) {
  const base = Math.max(0, Math.min(100, context.score));
  const intent = INTENT_MULTIPLIER[context.intent];
  const urgency = urgencyMultiplier(context.urgencyDays);
  const value = valueMultiplier(context.estimatedDealValue);
  const raw = base * intent * urgency * value;
  const score = Math.round(Math.max(0, Math.min(100, raw)));
  const reason = [];
  if (intent >= 1.25) reason.push("strong buying or human intent");
  if (urgency >= 1.35) reason.push("immediate urgency");
  if (value >= 1.3) reason.push("high estimated deal value");
  if (context.temperature === "hot") reason.push("hot lead temperature");
  if (context.intent === "stop") reason.push("lead requested no further contact");
  return {
    score,
    band: score >= 85 ? "critical" : score >= 70 ? "high" : score >= 45 ? "medium" : "low",
    intentMultiplier: intent,
    urgencyMultiplier: urgency,
    valueMultiplier: value,
    reason
  };
}

// src/domain/qualification-question-engine.ts
var questions = {
  serviceFit: {
    id: "service_fit",
    field: "serviceFit",
    prompt: "Is this service what you are looking for?",
    required: true,
    priority: 10
  },
  needConfirmed: {
    id: "need_confirmed",
    field: "needConfirmed",
    prompt: "What result are you trying to achieve?",
    required: true,
    priority: 20
  },
  budget: {
    id: "budget",
    field: "budget",
    prompt: "What budget range have you set aside for this?",
    required: false,
    priority: 30
  },
  urgencyDays: {
    id: "urgency",
    field: "urgencyDays",
    prompt: "When would you like to get started?",
    required: false,
    priority: 40
  },
  decisionMaker: {
    id: "decision_maker",
    field: "decisionMaker",
    prompt: "Are you the person who will make the final decision?",
    required: false,
    priority: 50
  },
  locationFit: {
    id: "location_fit",
    field: "locationFit",
    prompt: "What location will the service be delivered in?",
    required: false,
    priority: 60
  }
};
function answered(profile, field) {
  const value = profile[field];
  return value !== void 0 && value !== null;
}
function requiredForPolicy(field, policy) {
  if (field === "serviceFit") return policy.requireServiceFit === true;
  if (field === "decisionMaker") return policy.requireDecisionMaker === true;
  if (field === "locationFit") return policy.requireLocationFit === true;
  if (field === "budget") return policy.minimumBudget != null;
  return field === "needConfirmed";
}
function getNextQualificationQuestion(profile, policy, asked = []) {
  const missing = Object.values(questions).filter((question) => !answered(profile, question.field)).map((question) => ({ ...question, required: requiredForPolicy(question.field, policy) })).filter((question) => question.required || !asked.includes(question.field)).sort((a, b) => Number(b.required) - Number(a.required) || a.priority - b.priority);
  return missing[0];
}
function getQualificationProgress(profile, policy, asked = []) {
  const fields = Object.keys(questions);
  const answeredFields = fields.filter((field) => answered(profile, field));
  const missingRequired = fields.filter((field) => requiredForPolicy(field, policy) && !answered(profile, field));
  const nextQuestion = getNextQualificationQuestion(profile, policy, asked);
  const progressPercent = Math.round(answeredFields.length / fields.length * 100);
  return {
    asked,
    answered: answeredFields,
    missingRequired,
    complete: missingRequired.length === 0,
    progressPercent,
    nextQuestion
  };
}

// src/application/qualification-orchestrator.ts
function extractAnswers(text) {
  const value = text.trim();
  const lower = value.toLowerCase();
  const result = {};
  if (/\b(yes|yeah|yep|correct|exactly|that'?s right)\b/i.test(value)) {
    result.serviceFit = true;
    result.needConfirmed = true;
  }
  if (/\b(no|nope|not really|not interested)\b/i.test(value)) result.serviceFit = false;
  if (/\b(i am|i'm|im|yes,? i)\b.*\b(decision maker|owner|boss|director|manager)\b/i.test(value) || /\b(i|we) (own|run) the business\b/i.test(value)) result.decisionMaker = true;
  if (/\b(not me|someone else|my boss|my partner|my manager)\b/i.test(value)) result.decisionMaker = false;
  const budget = value.match(/(?:₦|ngn|n)\s*([\d,]+(?:\.\d+)?)\s*(k|m|million|thousand)?\b/i) || value.match(/\b([\d,]+(?:\.\d+)?)\s*(k|m|million|thousand)\b/i);
  if (budget) {
    let amount = Number(budget[1].replace(/,/g, ""));
    const unit = (budget[2] || "").toLowerCase();
    if (unit === "k" || unit === "thousand") amount *= 1e3;
    if (unit === "m" || unit === "million") amount *= 1e6;
    if (Number.isFinite(amount)) result.budget = amount;
  }
  if (/\b(today|now|immediately|asap)\b/i.test(value)) result.urgencyDays = 0;
  else if (/\btomorrow\b/i.test(value)) result.urgencyDays = 1;
  else {
    const days = lower.match(/\b(?:in|within)\s+(\d+)\s+days?\b/);
    if (days) result.urgencyDays = Number(days[1]);
  }
  if (/\b(lagos|abuja|port harcourt|ibadan|calabar|enugu|benin|online|remote|nationwide)\b/i.test(value)) result.locationFit = true;
  if (value.length > 20 && !result.needConfirmed) result.needConfirmed = true;
  return result;
}
function desiredState(lead, decision2) {
  if (decision2.action === "opt-out") return "lost";
  if (decision2.action === "escalate-complaint" || decision2.action === "escalate-sdr") return "engaged";
  if (decision2.action === "handoff-closer") return lead.state === "qualified" ? "qualified" : "engaged";
  if (lead.qualification?.qualified) return "qualified";
  return "qualifying";
}
var QualificationOrchestrator = class {
  constructor(leads, events) {
    this.leads = leads;
    this.events = events;
  }
  async process(input) {
    if (!input.text.trim()) throw new Error("Conversation text is required");
    const lead = await this.leads.get(input.leadId);
    if (!lead) throw new Error(`Lead not found: ${input.leadId}`);
    if (lead.organizationId !== input.organizationId) throw new Error("Tenant access denied");
    const policy = input.configuration?.qualification ?? input.policy;
    if (!policy) throw new Error("Client qualification configuration is required");
    const extractedFields = extractAnswers(input.text);
    lead.profile = { ...lead.profile, ...extractedFields };
    const scoringConfig = input.configuration?.scoring;
    const policyResult = evaluateClientPolicy(lead.profile, policy, scoringConfig);
    const score = scoreLead(lead.profile, scoringConfig);
    lead.score = score.score;
    lead.qualification = { score: score.score, qualified: policyResult.qualified, reasons: policyResult.reasons, hardDisqualified: policyResult.hardDisqualified };
    const asked = Array.isArray(lead.metadata?.qualificationAsked) ? lead.metadata.qualificationAsked.filter((field) => typeof field === "string") : [];
    const progress = getQualificationProgress(lead.profile, policy, asked);
    const conversationDecision = decideConversation({ text: input.text, leadScore: { ...score, qualified: policyResult.qualified, hardDisqualified: policyResult.hardDisqualified }, consent: lead.consent, appointmentBooked: lead.state === "booked", qualificationComplete: progress.complete });
    const nextQuestion = getNextQualificationQuestion(lead.profile, policy, asked);
    if (nextQuestion && !asked.includes(nextQuestion.field)) asked.push(nextQuestion.field);
    const previousState = lead.state;
    const targetState = desiredState(lead, conversationDecision);
    const stateChanged = canTransition(previousState, targetState) && previousState !== targetState;
    if (stateChanged) lead.state = transitionLead(previousState, targetState);
    const estimatedDealValue = lead.commercial?.estimatedDealValue ?? void 0;
    const urgencyDays = lead.profile.urgencyDays ?? void 0;
    const priority = calculateRevenuePriority({
      score: score.score,
      intent: conversationDecision.action === "handoff-closer" ? "booking" : conversationDecision.action === "escalate-sdr" ? "human_request" : "qualification",
      urgencyDays,
      estimatedDealValue,
      temperature: score.band
    });
    lead.decision = { action: conversationDecision.action === "handoff-closer" ? "closer-handoff" : conversationDecision.action === "escalate-sdr" || conversationDecision.action === "escalate-complaint" ? "sdr-follow-up" : conversationDecision.action === "opt-out" ? "reject" : "ai-follow-up", route: conversationDecision.owner === "closer" ? "closer" : conversationDecision.owner === "sdr" ? "sdr" : "ai-follow-up", reason: conversationDecision.reason, priority };
    lead.metadata = { ...lead.metadata, qualificationAsked: asked, lastConversationDecision: conversationDecision, configurationVersion: input.configuration?.version };
    lead.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.leads.save(lead);
    await this.events?.append({ id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, leadId: lead.id, organizationId: lead.organizationId, type: "lead.scored", actor: "system", timestamp: (/* @__PURE__ */ new Date()).toISOString(), fromState: previousState, toState: lead.state, reason: conversationDecision.reason, metadata: { extractedFields, score: score.score, qualified: policyResult.qualified, priority, nextQuestion: nextQuestion?.id, configurationVersion: input.configuration?.version } });
    if (stateChanged) await this.events?.append({ id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, leadId: lead.id, organizationId: lead.organizationId, type: "lead.state_changed", actor: "system", timestamp: (/* @__PURE__ */ new Date()).toISOString(), fromState: previousState, toState: lead.state, reason: conversationDecision.reason });
    return { lead, conversationDecision, progress, nextQuestion: nextQuestion?.prompt, extractedFields, stateChanged };
  }
};

// src/domain/client-configuration.ts
var DEFAULT_CLIENT_CONFIGURATION = {
  qualification: DEFAULT_CLIENT_POLICY,
  scoring: {
    threshold: 70,
    hotScore: 80,
    warmScore: 50,
    weights: {
      serviceFit: 25,
      needConfirmed: 20,
      decisionMaker: 15,
      locationFit: 10,
      urgency: 15,
      budget: 15
    }
  },
  conversation: {
    allowedChannels: ["whatsapp", "sms", "email", "voice", "web"],
    handoffOnHumanRequest: "sdr",
    handoffOnComplaint: "sdr",
    handoffOnBooking: "closer",
    maxAiMessagesBeforeHumanHandoff: 8
  },
  acceptedServiceTypes: [],
  locations: [],
  version: 1,
  active: true
};
function createDefaultClientConfiguration(organizationId, now = (/* @__PURE__ */ new Date()).toISOString()) {
  return {
    ...structuredClone(DEFAULT_CLIENT_CONFIGURATION),
    organizationId,
    updatedAt: now
  };
}
function validateClientConfiguration(config) {
  if (!config.organizationId.trim()) throw new Error("organizationId is required");
  if (config.qualification.qualificationThreshold < 0 || config.qualification.qualificationThreshold > 100) {
    throw new Error("qualification threshold must be between 0 and 100");
  }
  if (config.scoring.hotScore < config.scoring.warmScore) throw new Error("hot score must be >= warm score");
  if (config.conversation.maxAiMessagesBeforeHumanHandoff < 1) throw new Error("AI message limit must be at least 1");
  if (config.conversation.allowedChannels.length === 0) throw new Error("at least one conversation channel is required");
}

// src/application/client-configuration-service.ts
var ClientConfigurationService = class {
  constructor(store) {
    this.store = store;
  }
  async get(organizationId) {
    const existing = await this.store.get(organizationId);
    if (existing) return existing;
    const configuration = createDefaultClientConfiguration(organizationId);
    await this.store.save(configuration);
    return configuration;
  }
  async save(configuration) {
    validateClientConfiguration(configuration);
    const current = await this.store.get(configuration.organizationId);
    const next = {
      ...configuration,
      version: current ? current.version + 1 : configuration.version,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.store.save(next);
    return next;
  }
};

// src/domain/audit.ts
function createAuditEvent(input) {
  return {
    ...input,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/domain/routing.ts
function routeLead(context) {
  const { score, hasHumanReply, requestedHuman, appointmentBooked } = context;
  if (score.hardDisqualified) return "reject";
  if (appointmentBooked) return "closer";
  if (requestedHuman || hasHumanReply) return "sdr";
  if (score.qualified) return "ai-follow-up";
  return score.band === "cold" ? "nurture" : "sdr";
}

// src/domain/decision-engine.ts
function decideLeadAction(context) {
  const intent = context.intent ?? "unknown";
  const priority = calculateRevenuePriority({
    score: context.score.score,
    intent,
    urgencyDays: context.urgencyDays,
    estimatedDealValue: context.estimatedDealValue,
    temperature: context.score.band
  });
  if (context.consent === false || intent === "stop") {
    return { action: "reject", route: "reject", reason: intent === "stop" ? "lead requested no further contact" : "missing or withdrawn consent", priority };
  }
  if (context.hardDisqualified || context.score.hardDisqualified) {
    return { action: "reject", route: "reject", reason: "hard disqualification rule matched", priority };
  }
  if (context.appointmentBooked) {
    return { action: "closer-handoff", route: "closer", reason: "appointment booked", priority };
  }
  if (intent === "purchase" || intent === "booking" || priority.band === "critical") {
    return { action: "closer-handoff", route: "closer", reason: "high revenue intent requires immediate human ownership", priority };
  }
  const route = routeLead(context);
  if (route === "sdr") {
    return { action: "sdr-follow-up", route, reason: "human intent detected", priority };
  }
  if (route === "ai-follow-up") {
    return { action: "ai-follow-up", route, reason: "qualified lead requires automated follow-up", priority };
  }
  if (route === "nurture") {
    return { action: "nurture", route, reason: "lead is not currently sales-ready", priority };
  }
  return { action: "reject", route, reason: "routing policy rejected lead", priority };
}

// src/domain/lead-state-machine.ts
var LEAD_STATE_SLA_MINUTES = {
  new: 5,
  contacting: 15,
  engaged: 5,
  qualifying: 30,
  qualified: 60,
  booked: null,
  won: null,
  lost: null,
  nurture: 1440,
  invalid: null
};
var terminalStates = /* @__PURE__ */ new Set(["won", "invalid"]);
function decision(context, allowed, reason, action2) {
  return {
    allowed,
    from: context.from,
    to: context.to,
    reason,
    action: action2,
    terminal: terminalStates.has(context.to),
    slaMinutes: LEAD_STATE_SLA_MINUTES[context.to]
  };
}
function evaluateLeadTransition(context) {
  const { from, to } = context;
  if (from === to) return decision(context, true, "lead remains in the current state", "none");
  if (!canTransition(from, to)) return decision(context, false, `transition ${from} -> ${to} is not allowed by the state graph`, "none");
  if (to === "invalid") {
    return decision(context, true, "lead is invalid or must be removed from active sales processing", "stop_contact");
  }
  if (!context.consent) {
    return decision(context, false, "active lead processing requires consent", "stop_contact");
  }
  switch (to) {
    case "contacting":
      return decision(context, true, from === "nurture" ? "lead reactivated into active contact" : "lead is ready for first contact", "respond");
    case "engaged":
      return decision(context, Boolean(context.hasInboundMessage), "engaged state requires inbound engagement", "follow_up");
    case "qualifying":
      return decision(context, Boolean(context.hasInboundMessage), "qualification starts after an inbound interaction", "qualify");
    case "qualified":
      return decision(context, context.qualification?.qualified === true && !context.qualification.hardDisqualified, "qualified state requires a positive qualification result", "book");
    case "booked":
      return decision(
        context,
        context.appointmentStatus === "scheduled" || context.appointmentStatus === "confirmed",
        "booked state requires a scheduled or confirmed appointment",
        "book"
      );
    case "won":
      return decision(context, context.outcome === "won", "won state requires an explicit won outcome", "record_outcome");
    case "lost":
      return decision(
        context,
        context.outcome === "lost" || context.outcome === "no_sale" || context.outcome === "unqualified",
        "lost state requires an explicit negative sales outcome",
        "record_outcome"
      );
    case "nurture":
      return decision(
        context,
        context.outcome === "no_show" || context.outcome === "cancelled" || context.from === "new" || context.from === "contacting" || context.from === "engaged" || context.from === "qualifying" || context.from === "qualified" || context.from === "booked" || context.from === "lost",
        "lead can be nurtured and reactivated later",
        "nurture"
      );
    default:
      return decision(context, false, "no business policy exists for this transition", "none");
  }
}
function transitionLeadWithPolicy(context) {
  const result = evaluateLeadTransition(context);
  if (!result.allowed) throw new Error(result.reason);
  transitionLead(context.from, context.to);
  return result;
}
function evaluateLeadStateSla(state, lastActivityAt, now = (/* @__PURE__ */ new Date()).toISOString()) {
  const slaMinutes = LEAD_STATE_SLA_MINUTES[state];
  if (slaMinutes === null || !lastActivityAt) {
    return { state, dueAt: null, breached: false, slaMinutes, reason: slaMinutes === null ? "state has no active SLA" : "activity timestamp is unavailable" };
  }
  const activityMs = new Date(lastActivityAt).getTime();
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(activityMs) || !Number.isFinite(nowMs)) {
    return { state, dueAt: null, breached: false, slaMinutes, reason: "invalid activity timestamp" };
  }
  const dueAt = new Date(activityMs + slaMinutes * 6e4).toISOString();
  return {
    state,
    dueAt,
    breached: nowMs > new Date(dueAt).getTime(),
    slaMinutes,
    reason: nowMs > new Date(dueAt).getTime() ? `${state} SLA breached` : `${state} SLA is within target`
  };
}
function stateHistoryMetadata(context, result) {
  return {
    fromState: context.from,
    toState: context.to,
    reason: result.reason,
    action: result.action,
    terminal: result.terminal,
    slaMinutes: result.slaMinutes,
    outcome: context.outcome,
    appointmentStatus: context.appointmentStatus,
    requestedHuman: context.requestedHuman ?? false,
    transitionedAt: context.now ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/application/revenue-engine-service.ts
function id2(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function toLeadEvent(lead, type, reason, fromState, toState, metadata) {
  return { id: id2("evt"), leadId: lead.id, organizationId: lead.organizationId, type, actor: "system", timestamp: (/* @__PURE__ */ new Date()).toISOString(), fromState, toState, reason, metadata };
}
var RevenueEngineService = class {
  constructor(store, policy, eventStore, configurationProvider, usageLedger) {
    this.store = store;
    this.policy = policy;
    this.eventStore = eventStore;
    this.configurationProvider = configurationProvider;
    this.usageLedger = usageLedger;
  }
  async configurationFor(organizationId) {
    return this.configurationProvider?.get(organizationId);
  }
  async intake(input) {
    if (!input.organizationId?.trim()) throw new Error("organizationId is required");
    if (!input.name?.trim()) throw new Error("lead name is required");
    const now = (/* @__PURE__ */ new Date()).toISOString(), profile = input.profile ?? {}, configuration = await this.configurationFor(input.organizationId), policy = configuration?.qualification ?? this.policy, scoringConfig = configuration?.scoring;
    const qualification = qualifyLead(profile, scoringConfig ? { threshold: scoringConfig.threshold, maxUrgencyDays: policy?.maximumUrgencyDays ?? 30, requireDecisionMaker: false, requireBudget: false, weights: scoringConfig.weights } : void 0);
    const score = scoreLead(profile, scoringConfig);
    const policyResult = policy ? evaluateClientPolicy(profile, policy, scoringConfig) : { ...qualification, qualified: qualification.qualified };
    const consent = input.consent !== false;
    const decision2 = decideLeadAction({ score: { ...score, qualified: policyResult.qualified, hardDisqualified: policyResult.hardDisqualified }, consent, hardDisqualified: policyResult.hardDisqualified });
    const nextState = decision2.action === "reject" ? "invalid" : decision2.action === "nurture" ? "nurture" : "contacting";
    const transition = evaluateLeadTransition({ from: "new", to: nextState, consent, qualification: { ...qualification, qualified: policyResult.qualified, hardDisqualified: policyResult.hardDisqualified } });
    if (!transition.allowed) throw new Error(transition.reason);
    const lead = { id: id2("lead"), organizationId: input.organizationId, name: input.name.trim(), email: input.email, phone: input.phone, source: input.source, campaignId: input.campaignId, state: nextState, profile, commercial: input.commercial, consent, createdAt: now, updatedAt: now, score: score.score, qualification: { ...qualification, qualified: policyResult.qualified, hardDisqualified: policyResult.hardDisqualified }, decision: decision2, metadata: { ...input.metadata, configurationVersion: configuration?.version, initialAction: decision2.action, statePolicy: transition.reason } };
    await this.store.save(lead);
    const auditEvent = createAuditEvent({ organizationId: lead.organizationId, leadId: lead.id, actor: "system", action: "lead_intake_decision", fromState: "new", toState: lead.state, reason: decision2.reason, source: input.source, metadata: { score: score.score, qualified: policyResult.qualified, route: decision2.route, action: decision2.action, configurationVersion: configuration?.version, statePolicy: transition.reason } });
    await this.eventStore?.append(toLeadEvent(lead, "lead.created", "lead captured", void 0, lead.state, { source: input.source }));
    await this.eventStore?.append(toLeadEvent(lead, "lead.scored", decision2.reason, lead.state, lead.state, { score: score.score, band: score.band, qualified: policyResult.qualified, configurationVersion: configuration?.version }));
    await this.eventStore?.append(toLeadEvent(lead, "lead.routed", decision2.reason, lead.state, lead.state, { route: decision2.route, action: decision2.action }));
    if (this.usageLedger) {
      await this.usageLedger.recordUsage({ id: id2("usage"), organizationId: lead.organizationId, leadId: lead.id, eventType: "lead.intake", quantity: 1, unitPrice: 0, amount: 0, currency: "NGN", idempotencyKey: `lead.intake:${lead.id}`, metadata: { qualified: policyResult.qualified }, createdAt: now });
      if (policyResult.qualified) await this.usageLedger.recordUsage({ id: id2("usage"), organizationId: lead.organizationId, leadId: lead.id, eventType: "qualified.lead", quantity: 1, unitPrice: 0, amount: 0, currency: "NGN", idempotencyKey: `qualified.lead:${lead.id}`, metadata: { score: score.score }, createdAt: now });
    }
    return { lead, decision: decision2, auditEvent };
  }
  async getLeadForOrganization(id3, organizationId) {
    const lead = await this.store.get(id3);
    if (!lead) throw new Error(`Lead not found: ${id3}`);
    if (lead.organizationId !== organizationId) throw new Error("Tenant access denied");
    return lead;
  }
  async redecide(id3, organizationId) {
    const lead = await this.store.get(id3);
    if (!lead) throw new Error(`Lead not found: ${id3}`);
    if (organizationId && lead.organizationId !== organizationId) throw new Error("Tenant access denied");
    const previousState = lead.state, configuration = await this.configurationFor(lead.organizationId), policy = configuration?.qualification ?? this.policy, scoringConfig = configuration?.scoring, score = scoreLead(lead.profile, scoringConfig), policyResult = policy ? evaluateClientPolicy(lead.profile, policy, scoringConfig) : { score: score.score, qualified: score.qualified, reasons: score.reasons, hardDisqualified: score.hardDisqualified };
    const decision2 = decideLeadAction({ score: { ...score, qualified: policyResult.qualified, hardDisqualified: policyResult.hardDisqualified }, consent: lead.consent, hardDisqualified: policyResult.hardDisqualified });
    const desiredState2 = decision2.action === "reject" ? "invalid" : decision2.action === "nurture" ? "nurture" : previousState;
    let nextState = previousState;
    let statePolicyReason = "state preserved";
    if (desiredState2 !== previousState && canTransition(previousState, desiredState2)) {
      const transition = evaluateLeadTransition({ from: previousState, to: desiredState2, consent: lead.consent, qualification: { ...lead.qualification, ...policyResult } });
      if (transition.allowed) {
        nextState = desiredState2;
        statePolicyReason = transition.reason;
      } else statePolicyReason = transition.reason;
    }
    lead.state = nextState;
    lead.previousState = previousState === nextState ? lead.previousState : previousState;
    lead.score = score.score;
    lead.qualification = { ...lead.qualification, score: score.score, qualified: policyResult.qualified, reasons: policyResult.reasons, hardDisqualified: policyResult.hardDisqualified };
    lead.decision = decision2;
    lead.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    lead.metadata = { ...lead.metadata, configurationVersion: configuration?.version, initialAction: decision2.action, statePolicy: statePolicyReason };
    await this.store.save(lead);
    const auditEvent = createAuditEvent({ organizationId: lead.organizationId, leadId: lead.id, actor: "system", action: "lead_redecision", fromState: previousState, toState: nextState, reason: decision2.reason, source: lead.source, metadata: { score: score.score, qualified: policyResult.qualified, route: decision2.route, action: decision2.action, statePreserved: nextState === previousState && desiredState2 !== previousState, statePolicy: statePolicyReason, configurationVersion: configuration?.version } });
    await this.eventStore?.append(toLeadEvent(lead, "lead.scored", "decision recalculated", previousState, nextState, { score: score.score, band: score.band, qualified: policyResult.qualified, configurationVersion: configuration?.version }));
    if (previousState !== nextState) await this.eventStore?.append(toLeadEvent(lead, "lead.state_changed", decision2.reason, previousState, nextState, { route: decision2.route, action: decision2.action, statePolicy: statePolicyReason }));
    await this.eventStore?.append(toLeadEvent(lead, decision2.action === "reject" ? "lead.rejected" : "lead.routed", decision2.reason, nextState, nextState, { route: decision2.route, action: decision2.action, statePreserved: nextState === previousState && desiredState2 !== previousState }));
    return { lead, decision: decision2, auditEvent };
  }
};

// src/application/lead-lifecycle-service.ts
function eventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function transitionEvent(lead, decision2, context) {
  return {
    id: eventId(),
    leadId: lead.id,
    organizationId: lead.organizationId,
    type: "lead.state_changed",
    actor: context.requestedHuman ? "sdr" : "system",
    timestamp: context.now ?? (/* @__PURE__ */ new Date()).toISOString(),
    fromState: context.from,
    toState: context.to,
    reason: decision2.reason,
    metadata: stateHistoryMetadata(context, decision2)
  };
}
var LeadLifecycleService = class {
  constructor(store, eventStore) {
    this.store = store;
    this.eventStore = eventStore;
  }
  async transition(input) {
    const lead = await this.store.get(input.leadId);
    if (!lead) throw new Error(`Lead not found: ${input.leadId}`);
    if (lead.organizationId !== input.organizationId) throw new Error("Tenant access denied");
    if (lead.state !== input.from) throw new Error(`Lead state conflict: expected ${input.from}, found ${lead.state}`);
    const context = {
      ...input,
      from: lead.state,
      to: input.to
    };
    const decision2 = evaluateLeadTransition(context);
    if (!decision2.allowed) throw new Error(decision2.reason);
    transitionLeadWithPolicy(context);
    const now = input.now ?? (/* @__PURE__ */ new Date()).toISOString();
    lead.previousState = lead.state;
    lead.state = input.to;
    lead.updatedAt = now;
    lead.metadata = {
      ...lead.metadata,
      lastStateTransition: stateHistoryMetadata(context, decision2)
    };
    if (input.outcome === "won") lead.outcome = { ...lead.outcome, wonAt: now };
    if (input.outcome === "lost" || input.outcome === "no_sale" || input.outcome === "unqualified") {
      lead.outcome = { ...lead.outcome, lostAt: now, lostReason: input.outcome };
    }
    await this.store.save(lead);
    await this.eventStore?.append(transitionEvent(lead, decision2, context));
    if (input.to === "won") {
      await this.eventStore?.append({
        id: eventId(),
        leadId: lead.id,
        organizationId: lead.organizationId,
        type: "lead.won",
        actor: context.requestedHuman ? "closer" : "system",
        timestamp: now,
        fromState: input.from,
        toState: input.to,
        reason: "lead won",
        metadata: { outcome: input.outcome }
      });
    }
    if (input.to === "lost") {
      await this.eventStore?.append({
        id: eventId(),
        leadId: lead.id,
        organizationId: lead.organizationId,
        type: "lead.lost",
        actor: context.requestedHuman ? "sdr" : "system",
        timestamp: now,
        fromState: input.from,
        toState: input.to,
        reason: input.outcome ?? "lead lost",
        metadata: { outcome: input.outcome }
      });
    }
    return { lead, decision: decision2 };
  }
  async evaluateSla(leadId, organizationId, now = (/* @__PURE__ */ new Date()).toISOString()) {
    const lead = await this.store.get(leadId);
    if (!lead) throw new Error(`Lead not found: ${leadId}`);
    if (lead.organizationId !== organizationId) throw new Error("Tenant access denied");
    const lastActivityAt = lead.engagement?.lastInboundAt ?? lead.updatedAt ?? lead.createdAt;
    return evaluateLeadStateSla(lead.state, lastActivityAt, now);
  }
};

// src/domain/sdr-work-item.ts
var BASE_QUESTIONS = [
  "What exactly are you trying to achieve?",
  "When do you need this solved?",
  "Who will make the final decision?",
  "Have you already set aside a budget for it?"
];
var DISPOSITIONS = [
  "connected",
  "no-answer",
  "callback-requested",
  "qualified",
  "appointment-booked",
  "won",
  "not-qualified",
  "lost",
  "nurture",
  "wrong-number",
  "do-not-contact"
];
function mapAction(nextAction, slaBreached) {
  if (nextAction === "closer-call-now") return "handoff-closer";
  if (slaBreached) return "recover-sla";
  if (nextAction === "sdr-call-now") return "call-now";
  if (nextAction === "send-follow-up") return "follow-up";
  return "review";
}
function deadline(now, minutes) {
  return new Date(Date.parse(now) + minutes * 6e4).toISOString();
}
function buildScript(intent, action2) {
  const objective = action2 === "recover-sla" ? "Recover the delayed response, rebuild trust, and determine whether the opportunity is still active." : action2 === "handoff-closer" ? "Confirm buying intent and move the opportunity cleanly to the closer." : "Understand the need, qualify the opportunity, and secure the next commercial step.";
  const objectionResponses = [
    "I understand. Before you decide, can I clarify the one thing that is holding you back?",
    "That makes sense. If we can solve that concern, would you be open to the next step?",
    "No pressure. Would a short call at a better time be more useful?"
  ];
  const opening = intent === "booking" || action2 === "handoff-closer" ? "Hi, this is the team following up on your request. I understand you are looking to move forward, so I wanted to make this quick and useful." : "Hi, this is the team following up on your enquiry. I want to understand what you need and see if we can help.";
  return {
    opening,
    objective,
    qualificationQuestions: BASE_QUESTIONS,
    objectionResponses,
    closing: "Based on what you have shared, the best next step is to ____. Does that work for you?"
  };
}
function createSdrWorkItem(input, now = input.now ?? (/* @__PURE__ */ new Date()).toISOString()) {
  const slaMinutes = Math.max(5, input.responseSlaMinutes ?? (input.priorityBand === "critical" ? 5 : input.priorityBand === "high" ? 15 : 60));
  const action2 = mapAction(input.nextAction, input.slaBreached);
  const whyNow = input.slaBreached ? "Lead response SLA has been breached; recover the opportunity immediately." : input.priorityBand === "critical" ? "Critical revenue opportunity requires immediate human action." : input.priorityBand === "high" ? "High-priority opportunity should be worked before lower-value leads." : "Lead requires a human commercial follow-up.";
  return {
    id: `sdr_${input.leadId}_${Date.parse(now)}`,
    organizationId: input.organizationId,
    leadId: input.leadId,
    leadName: input.leadName,
    priorityScore: input.priorityScore,
    priorityBand: input.priorityBand,
    action: action2,
    whyNow,
    whyEscalated: input.reason,
    leadState: input.leadState,
    intent: input.intent,
    recommendedAction: input.reason,
    deadlineAt: deadline(now, slaMinutes),
    slaMinutes,
    slaBreached: input.slaBreached,
    script: buildScript(input.intent, action2),
    dispositionOptions: [...DISPOSITIONS],
    ownerId: input.ownerId,
    createdAt: now,
    status: "open",
    leakageOpportunityId: input.leakageOpportunityId,
    leakageType: input.leakageType,
    estimatedRecoverableRevenue: input.estimatedRecoverableRevenue,
    currency: input.currency || "NGN"
  };
}

// src/application/sdr-queue-service.ts
var SdrQueueService = class {
  constructor(store) {
    this.store = store;
  }
  async enqueue(input) {
    const item = createSdrWorkItem(input);
    await this.store.save(item);
    return item;
  }
  async queue(organizationId, now = (/* @__PURE__ */ new Date()).toISOString()) {
    if (!organizationId?.trim()) throw new Error("organizationId is required");
    const items = (await this.store.list(organizationId)).filter((item) => item.status === "open" || item.status === "claimed").sort((a, b) => {
      const bandRank = { critical: 4, high: 3, medium: 2, low: 1 };
      const bandDelta = bandRank[b.priorityBand] - bandRank[a.priorityBand];
      if (bandDelta !== 0) return bandDelta;
      const deadlineDelta = Date.parse(a.deadlineAt) - Date.parse(b.deadlineAt);
      if (deadlineDelta !== 0) return deadlineDelta;
      return b.priorityScore - a.priorityScore;
    });
    return {
      items,
      openCount: items.filter((item) => item.status === "open").length,
      criticalCount: items.filter((item) => item.priorityBand === "critical").length,
      breachedCount: items.filter((item) => Date.parse(now) > Date.parse(item.deadlineAt)).length
    };
  }
  async claim(organizationId, itemId, ownerId, now = (/* @__PURE__ */ new Date()).toISOString()) {
    if (!organizationId?.trim()) throw new Error("organizationId is required");
    if (!itemId?.trim()) throw new Error("itemId is required");
    if (!ownerId?.trim()) throw new Error("ownerId is required");
    if (this.store.claimSdrWorkItemAtomic) {
      const claimed = await this.store.claimSdrWorkItemAtomic(organizationId, itemId, ownerId, now);
      if (!claimed) {
        const item2 = this.store.getSdrWorkItem ? await this.store.getSdrWorkItem(organizationId, itemId) : null;
        if (!item2) throw new Error("SDR work item not found");
        if (item2.organizationId !== organizationId) throw new Error("Tenant access denied");
        throw new Error("SDR work item is not open");
      }
      return claimed;
    }
    const items = await this.store.list(organizationId);
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error("SDR work item not found");
    if (item.organizationId !== organizationId) throw new Error("Tenant access denied");
    if (item.status !== "open") throw new Error("SDR work item is not open");
    item.status = "claimed";
    item.ownerId = ownerId;
    item.claimedAt = now;
    await this.store.save(item);
    return item;
  }
  async complete(organizationId, itemId, disposition, completedByOrMetadata, outcomeRevenue, now = (/* @__PURE__ */ new Date()).toISOString()) {
    if (!organizationId?.trim()) throw new Error("organizationId is required");
    if (!itemId?.trim()) throw new Error("itemId is required");
    let completedBy;
    let revenue = outcomeRevenue;
    let completedAt = now;
    if (typeof completedByOrMetadata === "object" && completedByOrMetadata !== null) {
      completedBy = completedByOrMetadata.ownerId;
      if (completedByOrMetadata.outcomeRevenue !== void 0) {
        revenue = Math.max(0, Math.round(completedByOrMetadata.outcomeRevenue));
      }
    } else {
      completedBy = completedByOrMetadata;
    }
    if (this.store.completeSdrWorkItem) {
      const completed = await this.store.completeSdrWorkItem(
        organizationId,
        itemId,
        disposition,
        revenue,
        completedBy,
        completedAt
      );
      if (completed) return completed;
    }
    const items = await this.store.list(organizationId);
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error("SDR work item not found");
    if (item.organizationId !== organizationId) throw new Error("Tenant access denied");
    if (!item.script || !item.dispositionOptions.includes(disposition)) throw new Error("Invalid disposition");
    if (item.status !== "claimed" && item.status !== "open") throw new Error("SDR work item is not active");
    item.status = "completed";
    item.disposition = disposition;
    if (completedBy) item.ownerId = completedBy;
    item.completedBy = completedBy;
    if (revenue !== void 0) item.outcomeRevenue = Math.max(0, Math.round(revenue));
    item.completedAt = completedAt;
    item.recommendedAction = `Completed with disposition: ${disposition}`;
    await this.store.save(item);
    return item;
  }
};

// src/application/sdr-disposition-service.ts
var SdrDispositionService = class {
  constructor(lifecycle) {
    this.lifecycle = lifecycle;
  }
  async apply(input) {
    if (input.item.organizationId !== input.organizationId) throw new Error("Tenant access denied");
    if (!input.item.dispositionOptions.includes(input.disposition)) throw new Error("Invalid disposition");
    const now = input.now ?? (/* @__PURE__ */ new Date()).toISOString();
    const state = input.item.leadState;
    let nextState;
    let outcome;
    switch (input.disposition) {
      case "appointment-booked":
        if (!input.appointmentId) throw new Error("appointment-booked requires appointmentId");
        if (input.appointmentStatus !== "scheduled" && input.appointmentStatus !== "confirmed") {
          throw new Error("appointment-booked requires a scheduled or confirmed appointment");
        }
        if (state !== "qualified") throw new Error(`appointment-booked requires lead to be qualified, found ${state}`);
        nextState = "booked";
        break;
      case "won":
        if (state !== "booked") throw new Error(`won requires lead to be booked, found ${state}`);
        nextState = "won";
        outcome = "won";
        break;
      case "lost":
        nextState = "lost";
        outcome = "lost";
        break;
      case "not-qualified":
        nextState = "lost";
        outcome = "unqualified";
        break;
      case "nurture":
        nextState = "nurture";
        break;
      case "do-not-contact":
        nextState = "invalid";
        break;
      default:
        break;
    }
    if (!nextState || nextState === state) {
      return { disposition: input.disposition, transitioned: false, state };
    }
    const result = await this.lifecycle.transition({
      leadId: input.item.leadId,
      organizationId: input.organizationId,
      from: state,
      to: nextState,
      consent: true,
      qualification: input.qualification,
      appointmentStatus: input.appointmentStatus,
      outcome,
      requestedHuman: true,
      now
    });
    return {
      disposition: input.disposition,
      transitioned: true,
      state: result.lead.state,
      lifecycleReason: result.decision.reason
    };
  }
};

// src/application/revenue-recovery-service.ts
import { randomUUID } from "node:crypto";

// src/domain/recovery-attribution.ts
function calculateRecoveryRate(recoveredAmount, leakageValue) {
  if (recoveredAmount <= 0) return 0;
  const denominator = leakageValue > 0 ? leakageValue : recoveredAmount;
  const rawRate = recoveredAmount / denominator * 100;
  const rounded = Math.round(rawRate * 100) / 100;
  return Math.min(100, Math.max(0, rounded));
}
function createRecoveryAttribution(input) {
  if (!input.organizationId?.trim()) throw new Error("organizationId is required");
  if (!input.leadId?.trim()) throw new Error("leadId is required");
  if (!input.leakageOpportunityId?.trim()) throw new Error("leakageOpportunityId is required");
  if (!input.ownerId?.trim()) throw new Error("ownerId is required");
  if (!Number.isFinite(input.recoveredAmount) || input.recoveredAmount <= 0) {
    throw new Error("recoveredAmount must be greater than zero");
  }
  const leakageValue = input.leakageValue && input.leakageValue > 0 ? Math.round(input.leakageValue) : Math.round(input.recoveredAmount);
  const recoveryRate = calculateRecoveryRate(input.recoveredAmount, leakageValue);
  const recoveredAt = input.recoveredAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const evidence = input.evidence ?? "won-outcome";
  if (evidence !== "won-outcome") {
    throw new Error("Recovery attribution requires won-outcome evidence");
  }
  return {
    id: input.id,
    organizationId: input.organizationId,
    leadId: input.leadId,
    leakageOpportunityId: input.leakageOpportunityId,
    leakageType: input.leakageType,
    ownerId: input.ownerId,
    recoveredAmount: Math.round(input.recoveredAmount),
    currency: input.currency || "NGN",
    leakageValue,
    recoveryRate,
    recoveredAt,
    recoverySource: input.recoverySource || "sdr",
    evidence,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata
  };
}

// src/application/revenue-recovery-service.ts
var RevenueRecoveryService = class {
  workflow;
  leadStore;
  lifecycleService;
  eventStore;
  db;
  queue;
  dispositionService;
  revenueRecordingService;
  constructor(first, second, third, eventStore, db2) {
    if ("queue" in first || typeof first.enqueue === "function") {
      this.queue = first;
      this.dispositionService = second;
      this.revenueRecordingService = third;
    } else {
      this.workflow = first;
      this.leadStore = second;
      this.lifecycleService = third;
      this.eventStore = eventStore;
      this.db = db2;
    }
  }
  /**
   * Comprehensive end-to-end recovery execution:
   * Validates session owner -> Atomically claims work item -> Verifies 'booked' state ->
   * Creates Server-derived Recovery Attribution -> Transitions lifecycle to 'won' ->
   * Records financial outcome & attribution -> Completes work item -> Emits audit event.
   */
  async executeRecovery(input) {
    if (!this.workflow || !this.leadStore || !this.lifecycleService) {
      throw new Error("RevenueRecoveryService not configured for direct workflow repository execution");
    }
    if (!input.organizationId?.trim()) throw new Error("organizationId is required");
    if (!input.workItemId?.trim()) throw new Error("workItemId is required");
    if (!input.ownerUserId?.trim()) throw new Error("ownerUserId is required");
    if (!Number.isFinite(input.recoveredAmount) || input.recoveredAmount <= 0) {
      throw new Error("recoveredAmount must be a positive number");
    }
    const now = input.now ?? (/* @__PURE__ */ new Date()).toISOString();
    const currency = input.currency || "NGN";
    const deterministicIdempotencyKey = input.idempotencyKey?.trim() || `recovery:${input.workItemId}:won`;
    const existingRecovery = await this.workflow.findRecoveryAttributionByIdempotency(
      input.organizationId,
      deterministicIdempotencyKey
    );
    if (existingRecovery) {
      const lead2 = await this.leadStore.get(existingRecovery.leadId);
      const workItem2 = await this.workflow.getSdrWorkItem(input.organizationId, input.workItemId);
      const outcome = await this.workflow.findOutcomeByIdempotency(
        input.organizationId,
        `outcome:${deterministicIdempotencyKey}`
      );
      if (lead2 && workItem2 && outcome) {
        return {
          success: true,
          lead: lead2,
          workItem: workItem2,
          outcome,
          recoveryAttribution: existingRecovery,
          idempotentReplay: true
        };
      }
    }
    const workItem = await this.workflow.getSdrWorkItem(input.organizationId, input.workItemId);
    if (!workItem) throw new Error(`SDR work item not found: ${input.workItemId}`);
    if (workItem.organizationId !== input.organizationId) throw new Error("Tenant access denied");
    if (workItem.status === "completed") {
      throw new Error("SDR work item is already completed");
    }
    if (workItem.status === "cancelled") {
      throw new Error("SDR work item is cancelled");
    }
    let claimedItem = workItem;
    if (workItem.status === "open") {
      claimedItem = await this.workflow.claimSdrWorkItemAtomic(
        input.organizationId,
        workItem.id,
        input.ownerUserId,
        now
      );
      if (!claimedItem) {
        throw new Error("Failed to claim SDR work item. It may have been claimed by another agent.");
      }
    } else if (workItem.ownerId && workItem.ownerId !== input.ownerUserId) {
      throw new Error(`SDR work item is claimed by another user (${workItem.ownerId})`);
    }
    const lead = await this.leadStore.get(claimedItem.leadId);
    if (!lead) throw new Error(`Lead not found: ${claimedItem.leadId}`);
    if (lead.organizationId !== input.organizationId) throw new Error("Tenant access denied");
    if (lead.state !== "booked") {
      throw new Error(`Revenue recovery requires lead to be in 'booked' state, current state is '${lead.state}'`);
    }
    const leakageOpportunityId = claimedItem.leakageOpportunityId || `leak_${lead.id}_recovery`;
    const leakageType = claimedItem.leakageType || "qualified-no-booking";
    const leakageValue = claimedItem.estimatedRecoverableRevenue && claimedItem.estimatedRecoverableRevenue > 0 ? claimedItem.estimatedRecoverableRevenue : input.recoveredAmount;
    const outcomeId = randomUUID();
    const outcomeRecord = {
      id: outcomeId,
      organizationId: input.organizationId,
      leadId: lead.id,
      outcome: "won",
      revenueAmount: input.recoveredAmount,
      currency,
      reason: input.notes || `Recovered via SDR work item ${claimedItem.id}`,
      ownerUserId: input.ownerUserId,
      idempotencyKey: `outcome:${deterministicIdempotencyKey}`,
      occurredAt: now,
      metadata: { workItemId: claimedItem.id, recovery: true }
    };
    const recoveryAttribution = createRecoveryAttribution({
      id: randomUUID(),
      organizationId: input.organizationId,
      leadId: lead.id,
      leakageOpportunityId,
      leakageType,
      ownerId: input.ownerUserId,
      recoveredAmount: input.recoveredAmount,
      currency,
      leakageValue,
      recoverySource: "sdr",
      recoveredAt: now,
      evidence: "won-outcome",
      idempotencyKey: deterministicIdempotencyKey,
      metadata: { workItemId: claimedItem.id, outcomeId }
    });
    const lifecycleResult = await this.lifecycleService.transition({
      leadId: lead.id,
      organizationId: input.organizationId,
      from: "booked",
      to: "won",
      consent: true,
      outcome: "won",
      now
    });
    await this.workflow.saveOutcome(outcomeRecord);
    await this.workflow.saveAttribution({
      id: randomUUID(),
      organizationId: input.organizationId,
      leadId: lead.id,
      outcomeId: outcomeRecord.id,
      source: lead.source,
      campaign: String(lead.metadata?.campaign || ""),
      medium: String(lead.metadata?.medium || ""),
      attributionModel: "first_touch",
      attributedAmount: input.recoveredAmount,
      currency,
      createdAt: now
    });
    await this.workflow.saveRecoveryAttribution(recoveryAttribution);
    const completedWorkItem = await this.workflow.completeSdrWorkItem(
      input.organizationId,
      claimedItem.id,
      "won",
      input.recoveredAmount,
      input.ownerUserId,
      now
    );
    if (claimedItem.leakageOpportunityId) {
      await this.workflow.updateLeakageStatus(
        input.organizationId,
        claimedItem.leakageOpportunityId,
        "recovered"
      );
    }
    if (this.eventStore) {
      await this.eventStore.append({
        id: randomUUID(),
        leadId: lead.id,
        organizationId: input.organizationId,
        type: "lead.won",
        actor: "sdr",
        timestamp: now,
        fromState: "booked",
        toState: "won",
        reason: `Revenue recovered: \u20A6${input.recoveredAmount.toLocaleString()}`,
        metadata: {
          workItemId: claimedItem.id,
          outcomeId,
          recoveredAmount: input.recoveredAmount,
          recoveryRate: recoveryAttribution.recoveryRate
        }
      });
    }
    return {
      success: true,
      lead: lifecycleResult.lead,
      workItem: completedWorkItem || claimedItem,
      outcome: outcomeRecord,
      recoveryAttribution
    };
  }
  /**
   * Closes the operational loop: claim -> disposition -> lifecycle outcome ->
   * revenue attribution -> work-item completion.
   */
  async recover(input) {
    if (!this.queue || !this.dispositionService || !this.revenueRecordingService) {
      throw new Error("RevenueRecoveryService not configured for queue disposition workflow");
    }
    if (!input.organizationId) throw new Error("organizationId is required");
    if (!input.ownerId) throw new Error("ownerId is required");
    const revenueAmount = Math.max(0, Math.round(input.outcomeRevenue ?? 0));
    if (input.disposition === "won") {
      if (revenueAmount <= 0) throw new Error("won recovery requires outcomeRevenue");
      if (!input.currency) throw new Error("won recovery requires currency");
    }
    const queue = await this.queue.queue(input.organizationId, input.now);
    const item = queue.items.find((candidate) => candidate.id === input.workItemId);
    if (!item) throw new Error("SDR work item not found or already completed");
    if (item.organizationId !== input.organizationId) throw new Error("Tenant access denied");
    if (item.status === "open") await this.queue.claim(input.organizationId, item.id, input.ownerId);
    const current = (await this.queue.queue(input.organizationId, input.now)).items.find(
      (candidate) => candidate.id === input.workItemId
    );
    if (!current) throw new Error("SDR work item disappeared during recovery");
    const lifecycle = await this.dispositionService.apply({
      organizationId: input.organizationId,
      item: current,
      disposition: input.disposition,
      appointmentStatus: input.appointmentStatus,
      appointmentId: input.appointmentId,
      qualification: input.qualification,
      now: input.now
    });
    let revenueRecorded = false;
    let duplicateRevenue = false;
    if (input.disposition === "won") {
      const recording = await this.revenueRecordingService.record({
        id: `rev_${current.id}_won`,
        organizationId: input.organizationId,
        leadId: current.leadId,
        attributionType: "recovered",
        amount: revenueAmount,
        currency: input.currency,
        ownerId: input.ownerId,
        recordedAt: input.now,
        evidence: "won-outcome",
        idempotencyKey: `recovery:${current.id}:won`
      });
      revenueRecorded = true;
      duplicateRevenue = recording.duplicate;
    }
    const completed = await this.queue.complete(
      input.organizationId,
      current.id,
      input.disposition,
      { ownerId: input.ownerId, outcomeRevenue: revenueAmount || void 0 }
    );
    return {
      workItem: completed,
      disposition: input.disposition,
      lifecycleState: lifecycle.state,
      transitioned: lifecycle.transitioned,
      revenueRecorded,
      revenueAmount,
      duplicateRevenue
    };
  }
};

// src/domain/revenue-leakage.ts
var DEFAULT_DEAL_VALUE = 12e4;
function deriveEstimatedDealValue(lead, baselineValue = DEFAULT_DEAL_VALUE) {
  if (lead.commercial?.estimatedDealValue && lead.commercial.estimatedDealValue > 0) {
    return Math.round(lead.commercial.estimatedDealValue);
  }
  if (typeof lead.profile?.budget === "number" && lead.profile.budget > 0) {
    return Math.round(lead.profile.budget);
  }
  return baselineValue;
}
function detectLeadRevenueLeakage(input) {
  const now = input.now ?? (/* @__PURE__ */ new Date()).toISOString();
  const nowMs = Date.parse(now);
  const { lead } = input;
  const leadUpdatedMs = Date.parse(lead.updatedAt || lead.createdAt);
  const elapsedMinutes = Math.max(0, Math.floor((nowMs - leadUpdatedMs) / 6e4));
  const estimatedValue = deriveEstimatedDealValue(lead, input.baselineAverageDealValue ?? DEFAULT_DEAL_VALUE);
  const currency = lead.commercial?.currency || "NGN";
  const leadScore = lead.score ?? 0;
  if (lead.state === "new") {
    const sla = LEAD_STATE_SLA_MINUTES.new ?? 5;
    if (elapsedMinutes > sla) {
      const severity = elapsedMinutes > sla * 4 ? "critical" : elapsedMinutes > sla * 2 ? "high" : "medium";
      return {
        id: `leak_${lead.id}_uncontacted_${Date.parse(now)}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        leadName: lead.name,
        leakageType: "uncontacted",
        severity,
        reason: `New lead uncontacted for ${elapsedMinutes} minutes (SLA: ${sla}m).`,
        estimatedRecoverableRevenue: Math.round(estimatedValue * (leadScore >= 70 ? 0.8 : 0.5)),
        currency,
        recommendedAction: "Trigger immediate automated outreach or SDR call-now.",
        detectedAt: now,
        status: "active",
        evidence: { elapsedMinutes, sla, state: lead.state, score: leadScore }
      };
    }
  }
  if (lead.state === "contacting" || lead.state === "engaged" || lead.state === "qualifying") {
    const sla = LEAD_STATE_SLA_MINUTES[lead.state] ?? 15;
    if (elapsedMinutes > sla * 2) {
      const severity = elapsedMinutes > sla * 6 ? "critical" : elapsedMinutes > sla * 3 ? "high" : "medium";
      return {
        id: `leak_${lead.id}_stalled_${Date.parse(now)}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        leadName: lead.name,
        leakageType: "stalled-engagement",
        severity,
        reason: `Lead stalled in ${lead.state} for ${elapsedMinutes} minutes without activity.`,
        estimatedRecoverableRevenue: Math.round(estimatedValue * (lead.state === "qualifying" ? 0.6 : 0.4)),
        currency,
        recommendedAction: "Send multi-channel follow-up or assign SDR intervention.",
        detectedAt: now,
        status: "active",
        evidence: { elapsedMinutes, sla, state: lead.state, score: leadScore }
      };
    }
  }
  if (lead.state === "qualified") {
    const appointments = input.appointments ?? [];
    const activeAppointment = appointments.find(
      (a) => a.leadId === lead.id && (a.status === "scheduled" || a.status === "confirmed")
    );
    const sla = LEAD_STATE_SLA_MINUTES.qualified ?? 60;
    if (!activeAppointment && elapsedMinutes > sla) {
      const severity = elapsedMinutes > sla * 3 ? "critical" : "high";
      return {
        id: `leak_${lead.id}_qualified_nobooking_${Date.parse(now)}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        leadName: lead.name,
        leakageType: "qualified-no-booking",
        severity,
        reason: `High-value qualified lead has had no appointment scheduled for ${elapsedMinutes} minutes.`,
        estimatedRecoverableRevenue: Math.round(estimatedValue * 0.75),
        currency,
        recommendedAction: "Closer/SDR call-now with priority booking link to secure appointment.",
        detectedAt: now,
        status: "active",
        evidence: { elapsedMinutes, sla, state: lead.state, score: leadScore }
      };
    }
  }
  if (lead.state === "booked") {
    const appointments = input.appointments ?? [];
    const outcomes = input.outcomes ?? [];
    const hasWonOutcome = outcomes.some((o) => o.leadId === lead.id && o.outcome === "won");
    if (!hasWonOutcome) {
      const pastAppointment = appointments.find((a) => {
        if (a.leadId !== lead.id) return false;
        const scheduledMs = Date.parse(a.scheduledAt);
        return scheduledMs < nowMs && nowMs - scheduledMs > 60 * 6e4;
      });
      if (pastAppointment) {
        const appointmentElapsedHrs = Math.floor((nowMs - Date.parse(pastAppointment.scheduledAt)) / 36e5);
        return {
          id: `leak_${lead.id}_booked_nosale_${Date.parse(now)}`,
          organizationId: lead.organizationId,
          leadId: lead.id,
          leadName: lead.name,
          leakageType: "booked-no-sale",
          severity: appointmentElapsedHrs > 24 ? "critical" : "high",
          reason: `Appointment completed ${appointmentElapsedHrs} hours ago without commercial outcome or closing follow-up.`,
          estimatedRecoverableRevenue: Math.round(estimatedValue * 0.9),
          currency,
          recommendedAction: "Conduct same-day closing follow-up and log deal outcome or reschedule.",
          detectedAt: now,
          status: "active",
          evidence: { appointmentId: pastAppointment.id, scheduledAt: pastAppointment.scheduledAt, hoursPast: appointmentElapsedHrs }
        };
      }
    }
  }
  if (lead.state === "nurture") {
    const sla = LEAD_STATE_SLA_MINUTES.nurture ?? 1440;
    if (elapsedMinutes > sla * 7) {
      return {
        id: `leak_${lead.id}_stale_nurture_${Date.parse(now)}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        leadName: lead.name,
        leakageType: "stale-lost",
        severity: "medium",
        reason: `Lead has been idle in nurture for ${Math.floor(elapsedMinutes / 1440)} days without reactivation campaign.`,
        estimatedRecoverableRevenue: Math.round(estimatedValue * 0.3),
        currency,
        recommendedAction: "Enroll in automated nurture sequence or re-engagement offer.",
        detectedAt: now,
        status: "active",
        evidence: { elapsedMinutes, state: lead.state }
      };
    }
  }
  return null;
}

// src/application/revenue-leakage-service.ts
var RevenueLeakageService = class {
  constructor(leadStore2, workflow2) {
    this.leadStore = leadStore2;
    this.workflow = workflow2;
  }
  async detectAndSyncTenantLeakage(organizationId, now = (/* @__PURE__ */ new Date()).toISOString(), baselineAverageDealValue = 12e4) {
    if (!organizationId?.trim()) throw new Error("organizationId is required");
    const leads = await this.leadStore.list(organizationId);
    const appointments = await this.workflow.listAppointments(organizationId);
    const existingWorkItems = await this.workflow.listSdrWorkItems(organizationId);
    const detectedLeakages = [];
    const enqueuedWorkItems = [];
    let totalRecoverableRevenue = 0;
    for (const lead of leads) {
      if (lead.state === "won" || lead.state === "invalid") continue;
      const leadAppointments = appointments.filter((a) => a.leadId === lead.id);
      const leakage = detectLeadRevenueLeakage({
        lead,
        appointments: leadAppointments,
        now,
        baselineAverageDealValue
      });
      if (leakage) {
        detectedLeakages.push(leakage);
        totalRecoverableRevenue += leakage.estimatedRecoverableRevenue;
        await this.workflow.saveLeakageOpportunity(leakage);
        const hasActiveWorkItem = existingWorkItems.some(
          (w) => w.leadId === lead.id && (w.status === "open" || w.status === "claimed")
        );
        if (!hasActiveWorkItem) {
          const priorityBand = leakage.severity === "critical" ? "critical" : leakage.severity === "high" ? "high" : "medium";
          const priorityScore = leakage.severity === "critical" ? 95 : leakage.severity === "high" ? 80 : 60;
          const nextAction = leakage.leakageType === "qualified-no-booking" || leakage.leakageType === "booked-no-sale" ? "sdr-call-now" : leakage.severity === "critical" ? "sdr-call-now" : "send-follow-up";
          const workItem = createSdrWorkItem(
            {
              organizationId,
              leadId: lead.id,
              leadName: lead.name,
              leadState: lead.state,
              priorityScore,
              priorityBand,
              nextAction,
              reason: leakage.reason,
              slaBreached: leakage.severity === "critical" || leakage.severity === "high",
              now,
              leakageOpportunityId: leakage.id,
              leakageType: leakage.leakageType,
              estimatedRecoverableRevenue: leakage.estimatedRecoverableRevenue,
              currency: leakage.currency
            },
            now
          );
          await this.workflow.saveSdrWorkItem(workItem);
          enqueuedWorkItems.push(workItem);
        }
      }
    }
    return {
      scannedLeads: leads.length,
      detectedLeakages,
      enqueuedWorkItems,
      totalRecoverableRevenue
    };
  }
  async listActiveLeakage(organizationId) {
    return this.workflow.listLeakageOpportunities(organizationId, "active");
  }
};

// src/application/tenant-membership-service.ts
var TenantMembershipService = class {
  constructor(repository) {
    this.repository = repository;
  }
  async authenticate(userId, tenantId) {
    if (!userId.trim()) throw new Error("Authenticated user is required");
    if (!tenantId.trim()) throw new Error("Tenant context is required");
    const tenant = await this.repository.getTenant(tenantId);
    if (!tenant) throw new Error("Tenant not found");
    if (tenant.status !== "active") throw new Error("Tenant is suspended");
    const membership = await this.repository.getUserMembership(userId, tenantId);
    if (!membership) throw new Error("Tenant membership not found");
    if (!membership.active) throw new Error("Tenant membership is inactive");
    return membership;
  }
  async requireRole(userId, tenantId, minimumRole) {
    const membership = await this.authenticate(userId, tenantId);
    const rank = { viewer: 10, agent: 20, manager: 30, admin: 40, owner: 50 };
    if (rank[membership.role] < rank[minimumRole]) throw new Error("Insufficient tenant role");
    return membership;
  }
};

// src/application/request-context.ts
var MembershipIdentityResolver = class {
  constructor(memberships) {
    this.memberships = memberships;
  }
  async resolve(identity) {
    const membership = await this.memberships.authenticate(identity.userId, identity.tenantId);
    return { userId: membership.userId, tenantId: membership.tenantId, role: membership.role };
  }
};
function requireRole(context, minimum) {
  const rank = { viewer: 10, agent: 20, manager: 30, admin: 40, owner: 50 };
  if (rank[context.role] < rank[minimum]) throw new Error("Insufficient tenant role");
}

// src/application/session-auth.ts
import { createHmac, timingSafeEqual } from "node:crypto";
function secretValue(secret) {
  return secret ?? process.env.SESSION_SECRET ?? "zeerocodes-default-secure-session-secret-key-2026";
}
function base64url(value) {
  return Buffer.from(value).toString("base64url");
}
function decode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}
function signSession(userId, tenantId, secret) {
  const key = secretValue(secret);
  const now = Math.floor(Date.now() / 1e3);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      sub: userId,
      tenant_id: tenantId,
      iat: now,
      exp: now + Number(process.env.SESSION_TTL_SECONDS ?? 604800)
      // Default: 7 days
    })
  );
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${createHmac("sha256", key).update(unsigned).digest("base64url")}`;
}
function verifySession(token, secret) {
  const key = secretValue(secret);
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid session token");
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", key).update(unsigned).digest();
  const actual = Buffer.from(parts[2], "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Invalid session signature");
  }
  const claims = JSON.parse(decode(parts[1]));
  if (!claims.sub || !claims.tenant_id || !claims.exp || claims.exp <= Math.floor(Date.now() / 1e3)) {
    throw new Error("Session expired");
  }
  return claims;
}
var SessionIdentityResolver = class {
  constructor(memberships) {
    this.memberships = memberships;
  }
  async resolveBearer(token) {
    const claims = verifySession(token);
    const membership = await this.memberships.authenticate(claims.sub, claims.tenant_id);
    return {
      userId: membership.userId,
      tenantId: membership.tenantId,
      role: membership.role
    };
  }
};

// src/application/tenant-repository.ts
var TenantLeadEventRepositoryImpl = class {
  constructor(delegate) {
    this.delegate = delegate;
  }
  async append(event) {
    if (!event.organizationId) throw new Error("Event tenant is required");
    return this.delegate.append(event);
  }
  list(leadId) {
    return this.delegate.list(leadId);
  }
  async listForTenant(leadId, organizationId) {
    const events = await this.delegate.list(leadId);
    return events.filter((event) => event.organizationId === organizationId);
  }
};

// src/application/follow-up-worker.ts
var FollowUpWorker = class {
  constructor(repository, adapters, messageSink) {
    this.repository = repository;
    this.adapters = adapters;
    this.messageSink = messageSink;
  }
  async runOnce(organizationId, limit = 25) {
    const tasks = await this.repository.listDue(organizationId, limit);
    const result = { processed: 0, completed: 0, failed: 0, skipped: 0 };
    for (const task2 of tasks) {
      result.processed += 1;
      const adapter = this.adapters.get(task2.channel);
      if (!adapter) {
        result.skipped += 1;
        await this.repository.fail(task2.id, `No adapter configured for ${task2.channel}`);
        continue;
      }
      const claimed = this.repository.markProcessing ? await this.repository.markProcessing(task2.id) : true;
      if (!claimed) {
        result.skipped += 1;
        continue;
      }
      try {
        const body = this.render(task2);
        const outbound = {
          organizationId: task2.organizationId,
          leadId: task2.leadId,
          channel: task2.channel,
          body,
          metadata: { taskId: task2.id, taskType: task2.taskType, attempts: task2.attempts }
        };
        const sent = await adapter.send(outbound);
        await this.messageSink?.({ ...outbound, externalId: sent.externalId, metadata: { ...outbound.metadata, ...sent.metadata } });
        await this.repository.complete(task2.id);
        result.completed += 1;
      } catch (error) {
        result.failed += 1;
        await this.repository.fail(task2.id, error instanceof Error ? error.message : String(error));
      }
    }
    return result;
  }
  render(task2) {
    const payload = task2.payload ?? {};
    const custom = typeof payload.message === "string" ? payload.message.trim() : "";
    if (custom) return custom;
    switch (task2.taskType) {
      case "instant_response":
        return "Hi! Thanks for reaching out. We have received your request and will help you shortly. A few quick questions will help us understand what you need.";
      case "qualification":
        return "To help us recommend the right option, could you tell us what service you need and when you would like to get started?";
      case "reminder":
        return "Just checking in on your request. Would you like us to help you book the next step?";
      case "nurture":
        return "We are still here when you are ready. If you would like to continue, simply reply to this message.";
      case "recycle":
        return "Checking back in to see whether your plans have changed. Would you like to continue your request?";
      case "human_handoff":
        return "Thanks. I am connecting you with a member of our team now.";
    }
  }
};
var LoggingChannelAdapter = class {
  constructor(channel) {
    this.channel = channel;
  }
  async send(message) {
    console.info(JSON.stringify({ event: "follow_up.sent", ...message }));
    return { metadata: { adapter: "logging" } };
  }
};

// src/application/follow-up-planner.ts
import { randomUUID as randomUUID2 } from "node:crypto";
function channelFor(lead) {
  if (lead.phone) return "whatsapp";
  if (lead.email) return "email";
  return "web";
}
function task(lead, taskType, dueAt, message) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: randomUUID2(),
    organizationId: lead.organizationId,
    leadId: lead.id,
    taskType,
    channel: channelFor(lead),
    dueAt,
    status: "pending",
    attempts: 0,
    payload: message ? { message } : {},
    createdAt: now,
    updatedAt: now
  };
}
async function planInitialFollowUps(scheduler, lead, decision2) {
  if (lead.consent === false || decision2.action === "reject") return 0;
  const now = Date.now();
  let scheduled = 0;
  if (await scheduler.enqueue(task(lead, "instant_response", new Date(now).toISOString()))) scheduled += 1;
  if (decision2.action === "ai-follow-up") {
    if (await scheduler.enqueue(task(lead, "qualification", new Date(now + 2 * 6e4).toISOString()))) scheduled += 1;
    if (await scheduler.enqueue(task(lead, "reminder", new Date(now + 24 * 60 * 6e4).toISOString()))) scheduled += 1;
  } else if (decision2.action === "nurture") {
    if (await scheduler.enqueue(task(lead, "nurture", new Date(now + 3 * 24 * 60 * 6e4).toISOString()))) scheduled += 1;
  } else if (decision2.action === "sdr-follow-up") {
    if (await scheduler.enqueue(task(lead, "human_handoff", new Date(now).toISOString()))) scheduled += 1;
  }
  return scheduled;
}

// src/integrations/memory-client-configuration.ts
var MemoryClientConfigurationStore = class {
  configurations = /* @__PURE__ */ new Map();
  async get(organizationId) {
    const configuration = this.configurations.get(organizationId);
    return configuration ? structuredClone(configuration) : null;
  }
  async save(configuration) {
    this.configurations.set(configuration.organizationId, structuredClone(configuration));
  }
};

// src/integrations/memory-messaging.ts
var MemoryMessageStore = class {
  messages = [];
  async append(message) {
    this.messages.push(structuredClone(message));
  }
  async list(conversationId) {
    return this.messages.filter((message) => message.conversationId === conversationId).map((message) => structuredClone(message));
  }
};
var MemoryConversationStore = class {
  conversations = [];
  async get(id3) {
    const conversation = this.conversations.find((item) => item.id === id3);
    return conversation ? structuredClone(conversation) : null;
  }
  async getByLead(leadId) {
    const conversation = this.conversations.find((item) => item.leadId === leadId);
    return conversation ? structuredClone(conversation) : null;
  }
  async save(conversation) {
    const index = this.conversations.findIndex((item) => item.id === conversation.id);
    if (index >= 0) this.conversations[index] = structuredClone(conversation);
    else this.conversations.push(structuredClone(conversation));
  }
};

// src/integrations/memory-lead-store.ts
var MemoryLeadStore = class {
  leads = /* @__PURE__ */ new Map();
  async get(id3) {
    const lead = this.leads.get(id3);
    return lead ? structuredClone(lead) : null;
  }
  async save(lead) {
    this.leads.set(lead.id, structuredClone(lead));
  }
  async list(organizationId) {
    return [...this.leads.values()].filter((lead) => lead.organizationId === organizationId).map((lead) => structuredClone(lead));
  }
};

// src/integrations/memory-lead-events.ts
var MemoryLeadEventStore = class {
  events = [];
  async append(event) {
    this.events.push(structuredClone(event));
  }
  async list(leadId) {
    return this.events.filter((event) => event.leadId === leadId).map((event) => structuredClone(event));
  }
};

// src/integrations/memory-tenant-membership.ts
var MemoryTenantMembershipRepository = class {
  tenants = /* @__PURE__ */ new Map();
  memberships = /* @__PURE__ */ new Map();
  seedTenant(tenant) {
    this.tenants.set(tenant.id, structuredClone(tenant));
  }
  seedMembership(membership) {
    this.memberships.set(`${membership.userId}:${membership.tenantId}`, structuredClone(membership));
  }
  async getUserMembership(userId, tenantId) {
    const membership = this.memberships.get(`${userId}:${tenantId}`);
    return membership ? structuredClone(membership) : null;
  }
  async getTenant(tenantId) {
    const tenant = this.tenants.get(tenantId);
    return tenant ? structuredClone(tenant) : null;
  }
};

// src/integrations/memory-workflow.ts
var MemoryRevenueWorkflowRepository = class {
  appointments = [];
  outcomes = [];
  attributions = [];
  recoveryAttributions = [];
  leakageOpportunities = [];
  sdrWorkItems = [];
  usageEntries = [];
  async saveAppointment(record) {
    const idx = this.appointments.findIndex(
      (a) => a.id === record.id || record.idempotencyKey && a.organizationId === record.organizationId && a.idempotencyKey === record.idempotencyKey
    );
    if (idx >= 0) this.appointments[idx] = structuredClone(record);
    else this.appointments.push(structuredClone(record));
  }
  async findAppointmentByIdempotency(organizationId, idempotencyKey) {
    const found = this.appointments.find((a) => a.organizationId === organizationId && a.idempotencyKey === idempotencyKey);
    return found ? structuredClone(found) : null;
  }
  async listAppointments(organizationId, leadId) {
    return this.appointments.filter((a) => a.organizationId === organizationId && (!leadId || a.leadId === leadId)).map((a) => structuredClone(a));
  }
  async saveOutcome(record) {
    const idx = this.outcomes.findIndex(
      (o) => o.id === record.id || record.idempotencyKey && o.organizationId === record.organizationId && o.idempotencyKey === record.idempotencyKey
    );
    if (idx >= 0) this.outcomes[idx] = structuredClone(record);
    else this.outcomes.push(structuredClone(record));
  }
  async findOutcomeByIdempotency(organizationId, idempotencyKey) {
    const found = this.outcomes.find((o) => o.organizationId === organizationId && o.idempotencyKey === idempotencyKey);
    return found ? structuredClone(found) : null;
  }
  async listOutcomes(organizationId, leadId) {
    return this.outcomes.filter((o) => o.organizationId === organizationId && (!leadId || o.leadId === leadId)).map((o) => structuredClone(o));
  }
  async saveAttribution(record) {
    this.attributions.push(structuredClone(record));
  }
  async listAttributions(organizationId, leadId) {
    return this.attributions.filter((a) => a.organizationId === organizationId && (!leadId || a.leadId === leadId)).map((a) => structuredClone(a));
  }
  async saveRecoveryAttribution(record) {
    const exists = this.recoveryAttributions.find(
      (r) => r.id === record.id || record.idempotencyKey && r.organizationId === record.organizationId && r.idempotencyKey === record.idempotencyKey
    );
    if (!exists) {
      this.recoveryAttributions.push(structuredClone(record));
    }
  }
  async findRecoveryAttributionByIdempotency(organizationId, idempotencyKey) {
    const found = this.recoveryAttributions.find((r) => r.organizationId === organizationId && r.idempotencyKey === idempotencyKey);
    return found ? structuredClone(found) : null;
  }
  async listRecoveryAttributions(organizationId, leadId) {
    return this.recoveryAttributions.filter((r) => r.organizationId === organizationId && (!leadId || r.leadId === leadId)).map((r) => structuredClone(r));
  }
  async saveLeakageOpportunity(record) {
    const idx = this.leakageOpportunities.findIndex((l) => l.id === record.id);
    if (idx >= 0) this.leakageOpportunities[idx] = structuredClone(record);
    else this.leakageOpportunities.push(structuredClone(record));
  }
  async findLeakageOpportunity(organizationId, id3) {
    const found = this.leakageOpportunities.find((l) => l.organizationId === organizationId && l.id === id3);
    return found ? structuredClone(found) : null;
  }
  async listLeakageOpportunities(organizationId, status) {
    return this.leakageOpportunities.filter((l) => l.organizationId === organizationId && (!status || l.status === status)).map((l) => structuredClone(l));
  }
  async updateLeakageStatus(organizationId, id3, status) {
    const item = this.leakageOpportunities.find((l) => l.organizationId === organizationId && l.id === id3);
    if (item) item.status = status;
  }
  // SdrWorkItemStore implementation
  async list(organizationId) {
    return this.listSdrWorkItems(organizationId);
  }
  async save(item) {
    return this.saveSdrWorkItem(item);
  }
  async saveSdrWorkItem(item) {
    const idx = this.sdrWorkItems.findIndex((w) => w.id === item.id);
    if (idx >= 0) this.sdrWorkItems[idx] = structuredClone(item);
    else this.sdrWorkItems.push(structuredClone(item));
  }
  async getSdrWorkItem(organizationId, id3) {
    const found = this.sdrWorkItems.find((w) => w.organizationId === organizationId && w.id === id3);
    return found ? structuredClone(found) : null;
  }
  async listSdrWorkItems(organizationId) {
    return this.sdrWorkItems.filter((w) => w.organizationId === organizationId).map((w) => structuredClone(w));
  }
  async claimSdrWorkItemAtomic(organizationId, id3, ownerId, claimedAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const item = this.sdrWorkItems.find((w) => w.organizationId === organizationId && w.id === id3 && w.status === "open");
    if (!item) return null;
    item.status = "claimed";
    item.ownerId = ownerId;
    item.claimedAt = claimedAt;
    return structuredClone(item);
  }
  async completeSdrWorkItem(organizationId, id3, disposition, outcomeRevenue, completedBy, completedAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const item = this.sdrWorkItems.find((w) => w.organizationId === organizationId && w.id === id3 && (w.status === "open" || w.status === "claimed"));
    if (!item) return null;
    item.status = "completed";
    item.disposition = disposition;
    item.outcomeRevenue = outcomeRevenue;
    item.completedBy = completedBy;
    item.completedAt = completedAt;
    return structuredClone(item);
  }
  async recordUsage(entry) {
    const exists = this.usageEntries.some((u) => u.organizationId === entry.organizationId && u.idempotencyKey === entry.idempotencyKey);
    if (exists) return false;
    this.usageEntries.push(structuredClone(entry));
    return true;
  }
  async usageSummary(organizationId) {
    const scoped = this.usageEntries.filter((u) => u.organizationId === organizationId);
    const map = /* @__PURE__ */ new Map();
    for (const entry of scoped) {
      const cur = map.get(entry.eventType) || { quantity: 0, amount: 0 };
      cur.quantity += entry.quantity;
      cur.amount += entry.amount;
      map.set(entry.eventType, cur);
    }
    return [...map.entries()].map(([eventType, data]) => ({
      eventType,
      quantity: data.quantity,
      amount: data.amount
    }));
  }
};

// src/integrations/postgres.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { Pool } from "pg";
var requestDbContext = new AsyncLocalStorage();
var PostgresDatabase = class {
  pool;
  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) throw new Error("DATABASE_URL is required for PostgreSQL");
    this.pool = new Pool({ connectionString, max: Number(process.env.DB_POOL_MAX ?? 10) });
  }
  async query(text, values = []) {
    const context = requestDbContext.getStore();
    return context ? context.client.query(text, values) : this.pool.query(text, values);
  }
  async beginRequestTenant(tenantId) {
    if (!tenantId.trim()) throw new Error("Tenant context is required");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    } catch (error) {
      client.release();
      throw error;
    }
    let finished = false;
    return { client, finish: async (commit) => {
      if (finished) return;
      finished = true;
      try {
        await client.query(commit ? "COMMIT" : "ROLLBACK");
      } finally {
        client.release();
      }
    } };
  }
  runRequestContext(tenantId, client, next) {
    requestDbContext.run({ client, tenantId }, next);
  }
  async withTenant(tenantId, work) {
    if (!tenantId.trim()) throw new Error("Tenant context is required");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async close() {
    await this.pool.end();
  }
};
function json(value) {
  return JSON.stringify(value ?? {});
}
function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "string") return JSON.parse(value);
  return value;
}

// src/integrations/postgres-tenant-membership.ts
var PostgresTenantMembershipRepository = class {
  constructor(db2) {
    this.db = db2;
  }
  async getUserMembership(userId, tenantId) {
    const result = await this.db.query(
      `select id, tenant_id as "tenantId", user_id as "userId", email, role, active, created_at as "createdAt"
       from tenant_users where user_id = $1 and tenant_id = $2 limit 1`,
      [userId, tenantId]
    );
    return result.rows[0] ?? null;
  }
  async getTenant(tenantId) {
    const result = await this.db.query(
      `select id, name, slug, status, created_at as "createdAt" from tenants where id = $1 limit 1`,
      [tenantId]
    );
    return result.rows[0] ?? null;
  }
  async upsertTenant(tenant) {
    await this.db.query(
      `insert into tenants (id, name, slug, status, created_at) values ($1,$2,$3,$4,$5)
       on conflict (id) do update set name=excluded.name, slug=excluded.slug, status=excluded.status`,
      [tenant.id, tenant.name, tenant.slug, tenant.status, tenant.createdAt]
    );
  }
  async upsertMembership(membership) {
    await this.db.query(
      `insert into tenant_users (id, tenant_id, user_id, email, role, active, created_at)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (tenant_id,user_id) do update set email=excluded.email, role=excluded.role, active=excluded.active`,
      [membership.id, membership.tenantId, membership.userId, membership.email, membership.role, membership.active, membership.createdAt]
    );
  }
};

// src/integrations/postgres-repositories.ts
var PostgresLeadStore = class {
  constructor(db2) {
    this.db = db2;
  }
  async get(id3) {
    const r = await this.db.query("select * from leads where id = $1 limit 1", [id3]);
    return r.rows[0] ? leadFromRow(r.rows[0]) : null;
  }
  async save(lead) {
    await this.db.query(
      `insert into leads (id, organization_id, name, email, phone, source, state, profile, consent, score, qualification, decision, metadata, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14,$15)
       on conflict (id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,source=excluded.source,state=excluded.state,
       profile=excluded.profile,consent=excluded.consent,score=excluded.score,qualification=excluded.qualification,decision=excluded.decision,metadata=excluded.metadata,updated_at=excluded.updated_at`,
      [lead.id, lead.organizationId, lead.name, lead.email ?? null, lead.phone ?? null, lead.source ?? null, lead.state, json(lead.profile), lead.consent, lead.score ?? null, json(lead.qualification), json(lead.decision), json(lead.metadata), lead.createdAt, lead.updatedAt]
    );
  }
  async list(organizationId) {
    const r = await this.db.query("select * from leads where organization_id = $1 order by created_at desc", [organizationId]);
    return r.rows.map(leadFromRow);
  }
};
function leadFromRow(row) {
  return { id: row.id, organizationId: row.organization_id, name: row.name, email: row.email ?? void 0, phone: row.phone ?? void 0, source: row.source ?? void 0, state: row.state, profile: parseJson(row.profile, {}), consent: row.consent, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(), score: row.score ?? void 0, qualification: parseJson(row.qualification, void 0), decision: parseJson(row.decision, void 0), metadata: parseJson(row.metadata, {}) };
}
var PostgresConversationStore = class {
  constructor(db2) {
    this.db = db2;
  }
  async get(id3) {
    const r = await this.db.query("select * from conversations where id = $1 limit 1", [id3]);
    return r.rows[0] ? conversationFromRow(r.rows[0]) : null;
  }
  async getByLead(leadId) {
    const r = await this.db.query("select * from conversations where lead_id = $1 limit 1", [leadId]);
    return r.rows[0] ? conversationFromRow(r.rows[0]) : null;
  }
  async save(c) {
    await this.db.query(`insert into conversations (id,organization_id,lead_id,channel,status,owner,created_at,updated_at,last_message_at,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) on conflict (id) do update set status=excluded.status,owner=excluded.owner,updated_at=excluded.updated_at,last_message_at=excluded.last_message_at,metadata=excluded.metadata`, [c.id, c.organizationId, c.leadId, c.channel, c.status, c.owner, c.createdAt, c.updatedAt, c.lastMessageAt ?? null, json(c.metadata)]);
  }
};
function conversationFromRow(row) {
  return { id: row.id, organizationId: row.organization_id, leadId: row.lead_id, channel: row.channel, status: row.status, owner: row.owner, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(), lastMessageAt: row.last_message_at ? new Date(row.last_message_at).toISOString() : void 0, metadata: parseJson(row.metadata, {}) };
}
var PostgresMessageStore = class {
  constructor(db2) {
    this.db = db2;
  }
  async append(m) {
    await this.db.query(`insert into messages (id,organization_id,lead_id,conversation_id,direction,actor,channel,body,timestamp,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`, [m.id, m.organizationId, m.leadId, m.conversationId, m.direction, m.actor, m.channel, m.body, m.timestamp, json(m.metadata)]);
  }
  async list(conversationId) {
    const r = await this.db.query("select * from messages where conversation_id = $1 order by timestamp asc", [conversationId]);
    return r.rows.map((row) => ({ id: row.id, organizationId: row.organization_id, leadId: row.lead_id, conversationId: row.conversation_id, direction: row.direction, actor: row.actor, channel: row.channel, body: row.body, timestamp: new Date(row.timestamp).toISOString(), metadata: parseJson(row.metadata, {}) }));
  }
};
var PostgresLeadEventStore = class {
  constructor(db2) {
    this.db = db2;
  }
  async append(e) {
    await this.db.query(`insert into lead_events (id,organization_id,lead_id,type,actor,timestamp,from_state,to_state,reason,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`, [e.id, e.organizationId, e.leadId, e.type, e.actor, e.timestamp, e.fromState ?? null, e.toState ?? null, e.reason ?? null, json(e.metadata)]);
  }
  async list(leadId) {
    const r = await this.db.query("select * from lead_events where lead_id = $1 order by timestamp asc", [leadId]);
    return r.rows.map((row) => ({ id: row.id, leadId: row.lead_id, organizationId: row.organization_id, type: row.type, actor: row.actor, timestamp: new Date(row.timestamp).toISOString(), fromState: row.from_state ?? void 0, toState: row.to_state ?? void 0, reason: row.reason ?? void 0, metadata: parseJson(row.metadata, {}) }));
  }
};
var PostgresClientConfigurationStore = class {
  constructor(db2) {
    this.db = db2;
  }
  async get(organizationId) {
    const r = await this.db.query("select * from client_configurations where organization_id = $1 limit 1", [organizationId]);
    if (!r.rows[0]) return null;
    const row = r.rows[0];
    const defaults = createDefaultClientConfiguration(organizationId);
    return { organizationId: row.organization_id, qualification: { ...defaults.qualification, ...parseJson(row.qualification, {}) }, scoring: { ...defaults.scoring, ...parseJson(row.scoring, {}) }, conversation: { ...defaults.conversation, ...parseJson(row.conversation, {}) }, acceptedServiceTypes: parseJson(row.accepted_service_types, defaults.acceptedServiceTypes), locations: parseJson(row.locations, defaults.locations), version: row.version, active: row.active, updatedAt: new Date(row.updated_at).toISOString() };
  }
  async save(c) {
    await this.db.query(`insert into client_configurations (organization_id,qualification,scoring,conversation,accepted_service_types,locations,version,active,updated_at) values ($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9) on conflict (organization_id) do update set qualification=excluded.qualification,scoring=excluded.scoring,conversation=excluded.conversation,accepted_service_types=excluded.accepted_service_types,locations=excluded.locations,version=excluded.version,active=excluded.active,updated_at=excluded.updated_at`, [c.organizationId, json(c.qualification), json(c.scoring), json(c.conversation), json(c.acceptedServiceTypes), json(c.locations), c.version, c.active, c.updatedAt]);
  }
};

// src/integrations/postgres-workflow.ts
var DEFAULT_SCRIPT = {
  opening: "Hi, this is the team following up on your enquiry.",
  objective: "Understand the need, qualify the opportunity, and secure the next commercial step.",
  qualificationQuestions: [
    "What exactly are you trying to achieve?",
    "When do you need this solved?",
    "Who will make the final decision?",
    "Have you already set aside a budget for it?"
  ],
  objectionResponses: [
    "I understand. Before you decide, can I clarify the one thing that is holding you back?",
    "That makes sense. If we can solve that concern, would you be open to the next step?",
    "No pressure. Would a short call at a better time be more useful?"
  ],
  closing: "Based on what you have shared, the best next step is to ____. Does that work for you?"
};
var PostgresRevenueWorkflowRepository = class {
  constructor(db2) {
    this.db = db2;
  }
  async saveAppointment(record) {
    await this.db.query(
      `insert into appointments (id,organization_id,lead_id,scheduled_at,status,owner_user_id,source,idempotency_key,metadata,created_at,updated_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
      on conflict (organization_id,idempotency_key) where idempotency_key is not null do update set scheduled_at=excluded.scheduled_at,status=excluded.status,owner_user_id=excluded.owner_user_id,source=excluded.source,metadata=excluded.metadata,updated_at=excluded.updated_at`,
      [record.id, record.organizationId, record.leadId, record.scheduledAt, record.status, record.ownerUserId ?? null, record.source ?? null, record.idempotencyKey ?? null, json(record.metadata), record.createdAt, record.updatedAt]
    );
  }
  async findAppointmentByIdempotency(organizationId, idempotencyKey) {
    const r = await this.db.query("select * from appointments where organization_id=$1 and idempotency_key=$2 limit 1", [organizationId, idempotencyKey]);
    if (!r.rows[0]) return null;
    const row = r.rows[0];
    return { id: row.id, organizationId: row.organization_id, leadId: row.lead_id, scheduledAt: new Date(row.scheduled_at).toISOString(), status: row.status, ownerUserId: row.owner_user_id ?? void 0, source: row.source ?? void 0, idempotencyKey: row.idempotency_key ?? void 0, metadata: parseJson(row.metadata, {}), createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString() };
  }
  async listAppointments(organizationId, leadId) {
    const r = leadId ? await this.db.query("select * from appointments where organization_id=$1 and lead_id=$2 order by scheduled_at desc", [organizationId, leadId]) : await this.db.query("select * from appointments where organization_id=$1 order by scheduled_at desc", [organizationId]);
    return r.rows.map((row) => ({ id: row.id, organizationId: row.organization_id, leadId: row.lead_id, scheduledAt: new Date(row.scheduled_at).toISOString(), status: row.status, ownerUserId: row.owner_user_id ?? void 0, source: row.source ?? void 0, idempotencyKey: row.idempotency_key ?? void 0, metadata: parseJson(row.metadata, {}), createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString() }));
  }
  async saveOutcome(record) {
    await this.db.query(
      `insert into lead_outcomes (id,organization_id,lead_id,outcome,revenue_amount,currency,reason,owner_user_id,idempotency_key,occurred_at,metadata)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
      on conflict (organization_id,idempotency_key) where idempotency_key is not null do update set outcome=excluded.outcome,revenue_amount=excluded.revenue_amount,currency=excluded.currency,reason=excluded.reason,owner_user_id=excluded.owner_user_id,occurred_at=excluded.occurred_at,metadata=excluded.metadata`,
      [record.id, record.organizationId, record.leadId, record.outcome, record.revenueAmount ?? null, record.currency, record.reason ?? null, record.ownerUserId ?? null, record.idempotencyKey ?? null, record.occurredAt, json(record.metadata)]
    );
  }
  async findOutcomeByIdempotency(organizationId, idempotencyKey) {
    const r = await this.db.query("select * from lead_outcomes where organization_id=$1 and idempotency_key=$2 limit 1", [organizationId, idempotencyKey]);
    if (!r.rows[0]) return null;
    const row = r.rows[0];
    return { id: row.id, organizationId: row.organization_id, leadId: row.lead_id, outcome: row.outcome, revenueAmount: row.revenue_amount === null ? null : Number(row.revenue_amount), currency: row.currency, reason: row.reason ?? void 0, ownerUserId: row.owner_user_id ?? void 0, idempotencyKey: row.idempotency_key ?? void 0, occurredAt: new Date(row.occurred_at).toISOString(), metadata: parseJson(row.metadata, {}) };
  }
  async saveAttribution(record) {
    await this.db.query(
      `insert into revenue_attributions (id,organization_id,lead_id,outcome_id,source,campaign,medium,attribution_model,attributed_amount,currency,created_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [record.id, record.organizationId, record.leadId, record.outcomeId, record.source ?? null, record.campaign ?? null, record.medium ?? null, record.attributionModel, record.attributedAmount, record.currency, record.createdAt]
    );
  }
  async saveRecoveryAttribution(record) {
    await this.db.query(
      `insert into recovery_attributions (id,organization_id,lead_id,leakage_opportunity_id,leakage_type,owner_id,recovered_amount,currency,leakage_value,recovery_rate,recovered_at,recovery_source,evidence,idempotency_key,metadata)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)
      on conflict (organization_id,idempotency_key) where idempotency_key is not null do nothing`,
      [record.id, record.organizationId, record.leadId, record.leakageOpportunityId, record.leakageType, record.ownerId, record.recoveredAmount, record.currency, record.leakageValue, record.recoveryRate, record.recoveredAt, record.recoverySource, record.evidence, record.idempotencyKey ?? null, json(record.metadata)]
    );
  }
  async findRecoveryAttributionByIdempotency(organizationId, idempotencyKey) {
    const r = await this.db.query("select * from recovery_attributions where organization_id=$1 and idempotency_key=$2 limit 1", [organizationId, idempotencyKey]);
    if (!r.rows[0]) return null;
    const row = r.rows[0];
    return {
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leakageOpportunityId: row.leakage_opportunity_id,
      leakageType: row.leakage_type,
      ownerId: row.owner_id,
      recoveredAmount: Number(row.recovered_amount),
      currency: row.currency,
      leakageValue: Number(row.leakage_value),
      recoveryRate: Number(row.recovery_rate),
      recoveredAt: new Date(row.recovered_at).toISOString(),
      recoverySource: row.recovery_source,
      evidence: row.evidence,
      idempotencyKey: row.idempotency_key ?? void 0,
      metadata: parseJson(row.metadata, {})
    };
  }
  async listRecoveryAttributions(organizationId, leadId) {
    const r = leadId ? await this.db.query("select * from recovery_attributions where organization_id=$1 and lead_id=$2 order by recovered_at desc", [organizationId, leadId]) : await this.db.query("select * from recovery_attributions where organization_id=$1 order by recovered_at desc", [organizationId]);
    return r.rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leakageOpportunityId: row.leakage_opportunity_id,
      leakageType: row.leakage_type,
      ownerId: row.owner_id,
      recoveredAmount: Number(row.recovered_amount),
      currency: row.currency,
      leakageValue: Number(row.leakage_value),
      recoveryRate: Number(row.recovery_rate),
      recoveredAt: new Date(row.recovered_at).toISOString(),
      recoverySource: row.recovery_source,
      evidence: row.evidence,
      idempotencyKey: row.idempotency_key ?? void 0,
      metadata: parseJson(row.metadata, {})
    }));
  }
  async saveLeakageOpportunity(record) {
    await this.db.query(
      `insert into revenue_leakage_opportunities (id,organization_id,lead_id,lead_name,leakage_type,severity,reason,estimated_recoverable_revenue,currency,recommended_action,detected_at,status,evidence)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
      on conflict (id) do update set severity=excluded.severity,reason=excluded.reason,estimated_recoverable_revenue=excluded.estimated_recoverable_revenue,recommended_action=excluded.recommended_action,status=excluded.status,evidence=excluded.evidence`,
      [record.id, record.organizationId, record.leadId, record.leadName, record.leakageType, record.severity, record.reason, record.estimatedRecoverableRevenue, record.currency, record.recommendedAction, record.detectedAt, record.status, json(record.evidence)]
    );
  }
  async findLeakageOpportunity(organizationId, id3) {
    const r = await this.db.query("select * from revenue_leakage_opportunities where organization_id=$1 and id=$2 limit 1", [organizationId, id3]);
    if (!r.rows[0]) return null;
    const row = r.rows[0];
    return {
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      leakageType: row.leakage_type,
      severity: row.severity,
      reason: row.reason,
      estimatedRecoverableRevenue: Number(row.estimated_recoverable_revenue),
      currency: row.currency,
      recommendedAction: row.recommended_action,
      detectedAt: new Date(row.detected_at).toISOString(),
      status: row.status,
      evidence: parseJson(row.evidence, {})
    };
  }
  async listLeakageOpportunities(organizationId, status) {
    const r = status ? await this.db.query("select * from revenue_leakage_opportunities where organization_id=$1 and status=$2 order by detected_at desc", [organizationId, status]) : await this.db.query("select * from revenue_leakage_opportunities where organization_id=$1 order by detected_at desc", [organizationId]);
    return r.rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      leakageType: row.leakage_type,
      severity: row.severity,
      reason: row.reason,
      estimatedRecoverableRevenue: Number(row.estimated_recoverable_revenue),
      currency: row.currency,
      recommendedAction: row.recommended_action,
      detectedAt: new Date(row.detected_at).toISOString(),
      status: row.status,
      evidence: parseJson(row.evidence, {})
    }));
  }
  async updateLeakageStatus(organizationId, id3, status) {
    await this.db.query("update revenue_leakage_opportunities set status=$1 where organization_id=$2 and id=$3", [status, organizationId, id3]);
  }
  // SdrWorkItemStore implementation
  async list(organizationId) {
    return this.listSdrWorkItems(organizationId);
  }
  async save(item) {
    return this.saveSdrWorkItem(item);
  }
  async saveSdrWorkItem(item) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await this.db.query(
      `insert into sdr_work_items (id,organization_id,lead_id,lead_name,priority_score,priority_band,action,why_now,why_escalated,lead_state,intent,recommended_action,deadline_at,sla_minutes,sla_breached,script,disposition_options,owner_id,claimed_at,completed_by,completed_at,disposition,outcome_revenue,currency,leakage_opportunity_id,leakage_type,estimated_recoverable_revenue,status,created_at,updated_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
      on conflict (id) do update set priority_score=excluded.priority_score,priority_band=excluded.priority_band,action=excluded.action,why_now=excluded.why_now,why_escalated=excluded.why_escalated,lead_state=excluded.lead_state,intent=excluded.intent,recommended_action=excluded.recommended_action,deadline_at=excluded.deadline_at,sla_minutes=excluded.sla_minutes,sla_breached=excluded.sla_breached,script=excluded.script,disposition_options=excluded.disposition_options,owner_id=excluded.owner_id,claimed_at=excluded.claimed_at,completed_by=excluded.completed_by,completed_at=excluded.completed_at,disposition=excluded.disposition,outcome_revenue=excluded.outcome_revenue,leakage_opportunity_id=excluded.leakage_opportunity_id,leakage_type=excluded.leakage_type,estimated_recoverable_revenue=excluded.estimated_recoverable_revenue,status=excluded.status,updated_at=excluded.updated_at`,
      [item.id, item.organizationId, item.leadId, item.leadName, item.priorityScore, item.priorityBand, item.action, item.whyNow, item.whyEscalated ?? null, item.leadState, item.intent ?? null, item.recommendedAction, item.deadlineAt, item.slaMinutes, item.slaBreached, json(item.script), json(item.dispositionOptions), item.ownerId ?? null, item.claimedAt ?? null, item.completedBy ?? null, item.completedAt ?? null, item.disposition ?? null, item.outcomeRevenue ?? null, item.currency ?? "NGN", item.leakageOpportunityId ?? null, item.leakageType ?? null, item.estimatedRecoverableRevenue ?? null, item.status, item.createdAt, now]
    );
  }
  async getSdrWorkItem(organizationId, id3) {
    const r = await this.db.query("select * from sdr_work_items where organization_id=$1 and id=$2 limit 1", [organizationId, id3]);
    if (!r.rows[0]) return null;
    return this.mapSdrWorkItem(r.rows[0]);
  }
  async listSdrWorkItems(organizationId) {
    const r = await this.db.query("select * from sdr_work_items where organization_id=$1 order by created_at desc", [organizationId]);
    return r.rows.map((row) => this.mapSdrWorkItem(row));
  }
  async claimSdrWorkItemAtomic(organizationId, id3, ownerId, claimedAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const r = await this.db.query(
      `update sdr_work_items
       set status = 'claimed', owner_id = $1, claimed_at = $2, updated_at = $2
       where id = $3 and organization_id = $4 and status = 'open'
       returning *`,
      [ownerId, claimedAt, id3, organizationId]
    );
    if (!r.rows[0]) return null;
    return this.mapSdrWorkItem(r.rows[0]);
  }
  async completeSdrWorkItem(organizationId, id3, disposition, outcomeRevenue, completedBy, completedAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const r = await this.db.query(
      `update sdr_work_items
       set status = 'completed', disposition = $1, outcome_revenue = $2, completed_by = $3, completed_at = $4, updated_at = $4
       where id = $5 and organization_id = $6 and status in ('open', 'claimed')
       returning *`,
      [disposition, outcomeRevenue ?? null, completedBy ?? null, completedAt, id3, organizationId]
    );
    if (!r.rows[0]) return null;
    return this.mapSdrWorkItem(r.rows[0]);
  }
  async recordUsage(entry) {
    const r = await this.db.query(
      `insert into usage_ledger (id,organization_id,lead_id,event_type,quantity,unit_price,currency,idempotency_key,metadata,created_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) on conflict (organization_id,idempotency_key) do nothing`,
      [entry.id, entry.organizationId, entry.leadId ?? null, entry.eventType, entry.quantity, entry.unitPrice, entry.currency, entry.idempotencyKey, json(entry.metadata), entry.createdAt]
    );
    return r.rowCount === 1;
  }
  async usageSummary(organizationId) {
    const r = await this.db.query(`select event_type,sum(quantity)::text quantity,sum(amount)::text amount from usage_ledger where organization_id=$1 group by event_type order by event_type`, [organizationId]);
    return r.rows.map((row) => ({ eventType: row.event_type, quantity: Number(row.quantity), amount: Number(row.amount) }));
  }
  mapSdrWorkItem(row) {
    return {
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      priorityScore: Number(row.priority_score),
      priorityBand: row.priority_band,
      action: row.action,
      whyNow: row.why_now,
      whyEscalated: row.why_escalated ?? void 0,
      leadState: row.lead_state,
      intent: row.intent ?? void 0,
      recommendedAction: row.recommended_action,
      deadlineAt: new Date(row.deadline_at).toISOString(),
      slaMinutes: Number(row.sla_minutes),
      slaBreached: Boolean(row.sla_breached),
      script: parseJson(row.script, DEFAULT_SCRIPT),
      dispositionOptions: parseJson(row.disposition_options, []),
      ownerId: row.owner_id ?? void 0,
      claimedAt: row.claimed_at ? new Date(row.claimed_at).toISOString() : void 0,
      completedBy: row.completed_by ?? void 0,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : void 0,
      disposition: row.disposition ?? void 0,
      outcomeRevenue: row.outcome_revenue === null ? void 0 : Number(row.outcome_revenue),
      currency: row.currency,
      leakageOpportunityId: row.leakage_opportunity_id ?? void 0,
      leakageType: row.leakage_type ?? void 0,
      estimatedRecoverableRevenue: row.estimated_recoverable_revenue === null ? void 0 : Number(row.estimated_recoverable_revenue),
      status: row.status,
      createdAt: new Date(row.created_at).toISOString()
    };
  }
};

// src/integrations/postgres-follow-up.ts
var PostgresFollowUpRepository = class {
  constructor(db2) {
    this.db = db2;
  }
  async enqueue(task2) {
    const r = await this.db.query(
      `insert into follow_up_tasks (id,organization_id,lead_id,task_type,channel,due_at,status,attempts,payload,created_at,updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
       on conflict (organization_id,lead_id,task_type,due_at) do nothing`,
      [task2.id, task2.organizationId, task2.leadId, task2.taskType, task2.channel, task2.dueAt, task2.status, task2.attempts, json(task2.payload), task2.createdAt, task2.updatedAt]
    );
    return r.rowCount === 1;
  }
  async listDue(organizationId, limit = 50) {
    const r = await this.db.query(
      `select * from follow_up_tasks
       where organization_id=$1 and status='pending' and due_at<=now()
       order by due_at limit $2`,
      [organizationId, limit]
    );
    return r.rows.map((row) => this.fromRow(row));
  }
  async markProcessing(id3) {
    const r = await this.db.query(
      `update follow_up_tasks set status='processing',updated_at=now()
       where id=$1 and status='pending' and due_at<=now()
       returning id`,
      [id3]
    );
    return r.rowCount === 1;
  }
  async complete(id3) {
    await this.db.query(`update follow_up_tasks set status='completed',updated_at=now() where id=$1 and status='processing'`, [id3]);
  }
  async fail(id3, error) {
    await this.db.query(
      `update follow_up_tasks
       set status=case when attempts+1>=8 then 'failed' else 'pending' end,
           attempts=attempts+1,last_error=$2,updated_at=now()
       where id=$1 and status='processing'`,
      [id3, error.slice(0, 2e3)]
    );
  }
  fromRow(row) {
    return {
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      taskType: row.task_type,
      channel: row.channel,
      dueAt: new Date(row.due_at).toISOString(),
      status: row.status,
      attempts: row.attempts,
      payload: parseJson(row.payload, {}),
      lastError: row.last_error ?? void 0,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    };
  }
};

// src/integrations/postgres-control-plane.ts
import { randomUUID as randomUUID3 } from "node:crypto";

// src/domain/revenue-control-plane.ts
var severityRank = { critical: 3, high: 2, medium: 1 };
function action(organizationId, type, severity, title, reason, recommendedAction, now, leadId, ownerId) {
  return {
    id: `${organizationId}_${type}_${leadId ?? ownerId ?? "team"}_${Date.parse(now)}`,
    type,
    severity,
    title,
    reason,
    leadId,
    ownerId,
    recommendedAction,
    createdAt: now
  };
}
function buildRevenueControlPlane(input) {
  const now = input.now ?? (/* @__PURE__ */ new Date()).toISOString();
  const actions = [];
  const scopedItems = input.workItems.filter((item) => item.organizationId === input.organizationId);
  const scopedLeaks = (input.leakageOpportunities ?? []).filter(
    (leak) => leak.organizationId === input.organizationId && leak.status === "active"
  );
  for (const item of scopedItems) {
    if (item.status === "completed" || item.status === "cancelled") continue;
    if (item.priorityBand === "critical") {
      actions.push(action(
        input.organizationId,
        "critical-opportunity",
        "critical",
        `Critical opportunity: ${item.leadName}`,
        item.whyNow,
        item.recommendedAction,
        now,
        item.leadId,
        item.ownerId
      ));
    }
    if (item.slaBreached) {
      actions.push(action(
        input.organizationId,
        "sla-breach",
        item.priorityBand === "critical" ? "critical" : "high",
        `SLA breach: ${item.leadName}`,
        "The lead response deadline has been missed.",
        "Recover the lead immediately and record the outcome.",
        now,
        item.leadId,
        item.ownerId
      ));
    }
  }
  for (const leak of scopedLeaks) {
    if (leak.severity === "critical" || leak.severity === "high") {
      actions.push(action(
        input.organizationId,
        "revenue-leakage",
        leak.severity === "critical" ? "critical" : "high",
        `Revenue leak: ${leak.leadName} (${leak.leakageType})`,
        leak.reason,
        leak.recommendedAction,
        now,
        leak.leadId
      ));
    }
  }
  if (input.managerEscalationCount && input.managerEscalationCount > 0) {
    actions.push(action(
      input.organizationId,
      "manager-escalation",
      "high",
      `${input.managerEscalationCount} manager escalation${input.managerEscalationCount === 1 ? "" : "s"} open`,
      "Exceptions require management intervention.",
      "Review escalations and assign a clear owner and deadline.",
      now
    ));
  }
  if (input.intelligence.funnel.qualified > 0 && input.intelligence.funnel.booked === 0) {
    actions.push(action(
      input.organizationId,
      "pipeline-leakage",
      "high",
      "Qualified leads are not reaching booked appointments",
      `${input.intelligence.funnel.qualified} qualified lead${input.intelligence.funnel.qualified === 1 ? "" : "s"} have produced no booking.`,
      "Audit follow-up, objection handling, and appointment-setting execution.",
      now
    ));
  }
  const atRiskOwners = input.performance.filter((owner) => owner.slaAdherenceRate < 80 || owner.assigned >= 5 && owner.closeRate < 10).map((owner) => owner.ownerId);
  for (const ownerId of atRiskOwners) {
    const owner = input.performance.find((item) => item.ownerId === ownerId);
    actions.push(action(
      input.organizationId,
      "underperforming-owner",
      "medium",
      `Owner needs intervention: ${ownerId}`,
      owner && owner.slaAdherenceRate < 80 ? `SLA adherence is ${owner.slaAdherenceRate}%.` : `Close rate is ${owner?.closeRate ?? 0}% with ${owner?.assigned ?? 0} assigned items.`,
      "Review workload, call quality, follow-up discipline, and coaching needs.",
      now,
      void 0,
      ownerId
    ));
  }
  actions.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  const criticalOpenWorkItems = scopedItems.filter(
    (item) => item.status !== "completed" && item.status !== "cancelled" && item.priorityBand === "critical"
  ).length;
  const slaBreaches = scopedItems.filter(
    (item) => item.status !== "completed" && item.status !== "cancelled" && item.slaBreached
  ).length;
  const estimatedRecoverableRevenue = scopedLeaks.reduce((sum, item) => sum + item.estimatedRecoverableRevenue, 0);
  const revenueLeakCount = scopedLeaks.length;
  const revenueRecovered = input.intelligence.revenueRecovered;
  const unrecoveredRevenue = Math.max(0, estimatedRecoverableRevenue - revenueRecovered);
  const totalLeakageValue = estimatedRecoverableRevenue + revenueRecovered;
  const recoveryRate = totalLeakageValue > 0 ? Math.min(100, Math.round(revenueRecovered / totalLeakageValue * 1e4) / 100) : 0;
  const totalLeads = input.intelligence.funnel.leads;
  const leakageRate = totalLeads > 0 ? Math.round(revenueLeakCount / totalLeads * 1e4) / 100 : 0;
  const status = actions.some((item) => item.severity === "critical") ? "intervene" : actions.length > 0 ? "watch" : "clear";
  return {
    organizationId: input.organizationId,
    currency: input.intelligence.funnel.currency,
    revenue: input.intelligence.funnel.revenue,
    revenueRecovered,
    revenuePerLead: input.intelligence.revenuePerLead,
    criticalOpenWorkItems,
    slaBreaches,
    openManagerEscalations: input.managerEscalationCount ?? 0,
    estimatedRecoverableRevenue,
    revenueLeakCount,
    unrecoveredRevenue,
    recoveryRate,
    leakageRate,
    atRiskOwners,
    actions,
    status,
    generatedAt: now
  };
}

// src/integrations/postgres-control-plane.ts
var DEFAULT_SCRIPT2 = {
  opening: "Hi, this is the team following up on your enquiry.",
  objective: "Understand the need, qualify the opportunity, and secure the next commercial step.",
  qualificationQuestions: [
    "What exactly are you trying to achieve?",
    "When do you need this solved?",
    "Who will make the final decision?",
    "Have you already set aside a budget for it?"
  ],
  objectionResponses: [
    "I understand. Before you decide, can I clarify the one thing that is holding you back?",
    "That makes sense. If we can solve that concern, would you be open to the next step?",
    "No pressure. Would a short call at a better time be more useful?"
  ],
  closing: "Based on what you have shared, the best next step is to ____. Does that work for you?"
};
var PostgresRevenueControlPlaneReader = class {
  constructor(db2) {
    this.db = db2;
  }
  async calculate(organizationId, now = (/* @__PURE__ */ new Date()).toISOString()) {
    if (!organizationId.trim()) throw new Error("Tenant context is required");
    const result = await this.db.query(`
      with funnel as (
        select
          count(*)::text as leads,
          count(*) filter (where state <> 'new')::text as contacted,
          count(*) filter (where state in ('engaged','qualifying','qualified','booked','won'))::text as engaged,
          count(*) filter (where state in ('qualified','booked','won'))::text as qualified,
          count(*) filter (where state in ('booked','won'))::text as booked,
          count(*) filter (where state = 'won')::text as won
        from leads
        where organization_id = $1
      ), revenue as (
        select coalesce(sum(revenue_amount),0)::text as revenue,
               coalesce(max(currency),'NGN') as currency
        from lead_outcomes
        where organization_id = $1 and outcome = 'won'
      ), attribution as (
        select coalesce(sum(attributed_amount),0)::text as attributed_revenue
        from revenue_attributions
        where organization_id = $1
      ), recovery as (
        select coalesce(sum(recovered_amount),0)::text as recovered_revenue
        from recovery_attributions
        where organization_id = $1
      ), escalations as (
        select count(*)::text as escalations
        from lead_events
        where organization_id = $1 and type = 'lead.escalated'
      )
      select funnel.*, revenue.revenue, revenue.currency, attribution.attributed_revenue, recovery.recovered_revenue, escalations.escalations
      from funnel cross join revenue cross join attribution cross join recovery cross join escalations
    `, [organizationId]);
    const row = result.rows[0];
    if (!row) throw new Error("Unable to calculate revenue control plane");
    const workItemsResult = await this.db.query(
      `select * from sdr_work_items where organization_id = $1 and status in ('open', 'claimed')`,
      [organizationId]
    );
    const workItems = workItemsResult.rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      leadId: r.lead_id,
      leadName: r.lead_name,
      priorityScore: Number(r.priority_score),
      priorityBand: r.priority_band,
      action: r.action,
      whyNow: r.why_now,
      whyEscalated: r.why_escalated ?? void 0,
      leadState: r.lead_state,
      intent: r.intent ?? void 0,
      recommendedAction: r.recommended_action,
      deadlineAt: new Date(r.deadline_at).toISOString(),
      slaMinutes: Number(r.sla_minutes),
      slaBreached: Boolean(r.sla_breached) || Date.parse(now) > Date.parse(r.deadline_at),
      script: parseJson(r.script, DEFAULT_SCRIPT2),
      dispositionOptions: parseJson(r.disposition_options, []),
      ownerId: r.owner_id ?? void 0,
      claimedAt: r.claimed_at ? new Date(r.claimed_at).toISOString() : void 0,
      completedBy: r.completed_by ?? void 0,
      completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : void 0,
      disposition: r.disposition ?? void 0,
      outcomeRevenue: r.outcome_revenue === null ? void 0 : Number(r.outcome_revenue),
      currency: r.currency,
      leakageOpportunityId: r.leakage_opportunity_id ?? void 0,
      leakageType: r.leakage_type ?? void 0,
      estimatedRecoverableRevenue: r.estimated_recoverable_revenue === null ? void 0 : Number(r.estimated_recoverable_revenue),
      status: r.status,
      createdAt: new Date(r.created_at).toISOString()
    }));
    const leakageResult = await this.db.query(
      `select * from revenue_leakage_opportunities where organization_id = $1 and status = 'active'`,
      [organizationId]
    );
    const leakageOpportunities = leakageResult.rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      leadId: r.lead_id,
      leadName: r.lead_name,
      leakageType: r.leakage_type,
      severity: r.severity,
      reason: r.reason,
      estimatedRecoverableRevenue: Number(r.estimated_recoverable_revenue),
      currency: r.currency,
      recommendedAction: r.recommended_action,
      detectedAt: new Date(r.detected_at).toISOString(),
      status: r.status,
      evidence: parseJson(r.evidence, {})
    }));
    const intelligence = {
      funnel: {
        leads: Number(row.leads),
        contacted: Number(row.contacted),
        engaged: Number(row.engaged),
        qualified: Number(row.qualified),
        booked: Number(row.booked),
        won: Number(row.won),
        revenue: Math.round(Number(row.revenue)),
        currency: row.currency || "NGN"
      },
      contactRate: this.rate(Number(row.contacted), Number(row.leads)),
      qualificationRate: this.rate(Number(row.qualified), Number(row.leads)),
      bookingRate: this.rate(Number(row.booked), Number(row.qualified)),
      closeRate: this.rate(Number(row.won), Number(row.booked)),
      revenuePerLead: Number(row.leads) > 0 ? Math.round(Number(row.revenue) / Number(row.leads)) : 0,
      revenueRecovered: Math.round(Number(row.recovered_revenue)),
      attributedRevenue: Math.round(Number(row.attributed_revenue))
    };
    const snapshot = buildRevenueControlPlane({
      organizationId,
      intelligence,
      workItems,
      performance: [],
      leakageOpportunities,
      managerEscalationCount: Number(row.escalations),
      now
    });
    await this.persist(snapshot);
    return snapshot;
  }
  async latest(organizationId) {
    if (!organizationId.trim()) throw new Error("Tenant context is required");
    const result = await this.db.query(
      "select * from revenue_control_snapshots where organization_id = $1 order by generated_at desc limit 1",
      [organizationId]
    );
    const row = result.rows[0];
    if (!row) return null;
    const actions = parseJson(row.actions, []);
    return {
      organizationId: row.organization_id,
      currency: row.currency,
      revenue: Number(row.revenue),
      revenueRecovered: Number(row.revenue_recovered),
      revenuePerLead: Number(row.revenue_per_lead),
      criticalOpenWorkItems: Number(row.critical_open_work_items),
      slaBreaches: Number(row.sla_breaches),
      openManagerEscalations: Number(row.open_manager_escalations),
      estimatedRecoverableRevenue: actions.reduce(
        (sum, a) => a.type === "revenue-leakage" ? sum + 1e5 : sum,
        0
      ),
      revenueLeakCount: actions.filter((a) => a.type === "revenue-leakage").length,
      unrecoveredRevenue: Math.max(0, Number(row.revenue_recovered) ? 0 : 0),
      recoveryRate: Number(row.revenue_recovered) > 0 ? 100 : 0,
      leakageRate: 0,
      atRiskOwners: parseJson(row.at_risk_owners, []),
      actions,
      status: row.status,
      generatedAt: new Date(row.generated_at).toISOString()
    };
  }
  async persist(snapshot) {
    await this.db.query(`
      insert into revenue_control_snapshots
      (id,organization_id,status,currency,revenue,revenue_recovered,revenue_per_lead,critical_open_work_items,sla_breaches,open_manager_escalations,at_risk_owners,actions,generated_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13)
    `, [
      randomUUID3(),
      snapshot.organizationId,
      snapshot.status,
      snapshot.currency,
      snapshot.revenue,
      snapshot.revenueRecovered,
      snapshot.revenuePerLead,
      snapshot.criticalOpenWorkItems,
      snapshot.slaBreaches,
      snapshot.openManagerEscalations,
      json(snapshot.atRiskOwners),
      json(snapshot.actions),
      snapshot.generatedAt
    ]);
  }
  rate(numerator, denominator) {
    return denominator <= 0 ? 0 : Math.round(numerator / denominator * 1e4) / 100;
  }
};

// src/integrations/webhooks.ts
import { createHmac as createHmac2, randomUUID as randomUUID4 } from "node:crypto";
var WebhookDispatcher = class {
  constructor(db2) {
    this.db = db2;
  }
  async enqueue(event) {
    const endpoints = await this.db.query(`select id,url,secret_hash,event_types from webhook_endpoints where organization_id=$1 and active=true`, [event.organizationId]);
    let count = 0;
    for (const endpoint of endpoints.rows) {
      const eventTypes = Array.isArray(endpoint.event_types) ? endpoint.event_types : [];
      if (eventTypes.length && !eventTypes.includes(event.type)) continue;
      await this.db.query(
        `insert into webhook_deliveries (id,endpoint_id,organization_id,event_id,event_type,payload,status,next_attempt_at)
        values ($1,$2,$3,$4,$5,$6::jsonb,'pending',now()) on conflict (endpoint_id,event_id) do nothing`,
        [randomUUID4(), endpoint.id, event.organizationId, event.id, event.type, json(event.payload)]
      );
      count++;
    }
    return count;
  }
  async deliverPending(limit = 20) {
    const pending = await this.db.query(`select d.id,d.endpoint_id,d.event_type,d.payload,e.url,e.secret_hash from webhook_deliveries d join webhook_endpoints e on e.id=d.endpoint_id where d.status='pending' and (d.next_attempt_at is null or d.next_attempt_at <= now()) order by d.created_at limit $1`, [limit]);
    let delivered = 0;
    for (const delivery of pending.rows) {
      const body = JSON.stringify(delivery.payload);
      const signature = createHmac2("sha256", delivery.secret_hash).update(body).digest("hex");
      try {
        const response = await fetch(delivery.url, { method: "POST", headers: { "content-type": "application/json", "x-zeerocodes-event": delivery.event_type, "x-zeerocodes-signature": signature }, body });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await this.db.query(`update webhook_deliveries set status='delivered',attempts=attempts+1,response_code=$2,delivered_at=now() where id=$1`, [delivery.id, response.status]);
        delivered++;
      } catch (error) {
        await this.db.query(`update webhook_deliveries set status=case when attempts+1 >= 8 then 'failed' else 'pending' end,attempts=attempts+1,last_error=$2,next_attempt_at=now() + ((least(attempts+1,6)::text || ' minutes')::interval) where id=$1`, [delivery.id, error instanceof Error ? error.message : "Webhook delivery failed"]);
      }
    }
    return delivered;
  }
};

// src/integrations/postgres-migrations.ts
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
var migrationDirectory = path.resolve(process.cwd(), "docs/migrations");
async function runPostgresMigrations(db2) {
  await db2.query(`create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())`);
  const files = (await readdir(migrationDirectory)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  const applied = new Set((await db2.query("select version from schema_migrations order by version")).rows.map((row) => row.version));
  const completed = [];
  for (const file of files) {
    const version = file.split("_", 1)[0];
    if (applied.has(version)) continue;
    const sql = await readFile(path.join(migrationDirectory, file), "utf8");
    await db2.withTenant("migration", async (client) => {
      await client.query(sql);
      await client.query("insert into schema_migrations(version) values ($1)", [version]);
    });
    completed.push(version);
  }
  return completed;
}

// src/domain/audit-request.ts
function validateAuditRequest(input) {
  const required = [
    ["name", "name"],
    ["business", "business"],
    ["email", "email"],
    ["phone", "phone"],
    ["monthlyLeadVolume", "monthly lead volume"],
    ["biggestSalesBottleneck", "biggest sales bottleneck"]
  ];
  for (const [key, label] of required) {
    const value = input[key];
    if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  }
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) throw new Error("valid email is required");
  if (input.averageDealValue !== void 0 && (!Number.isFinite(input.averageDealValue) || input.averageDealValue < 0)) {
    throw new Error("average deal value must be a non-negative number");
  }
}
function createAuditRequest(input, id3, now = (/* @__PURE__ */ new Date()).toISOString()) {
  validateAuditRequest(input);
  return {
    ...input,
    id: id3,
    name: input.name.trim(),
    business: input.business.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    createdAt: now,
    status: "new"
  };
}

// src/domain/lead-source.ts
function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}
function parseLeadCsv(csv) {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map(
    (header) => header.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
  );
  return lines.slice(1).map(
    (line) => Object.fromEntries(
      splitCsvLine(line).map((value, index) => [headers[index] ?? `column_${index + 1}`, value])
    )
  );
}
function rowToLeadInput(row, organizationId, source = "csv-import") {
  const name = row.name || row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" ");
  const serviceType = row.service_type || row.product || row.interest || "General enquiry";
  const dealVal = Number(row.estimated_deal_value || row.deal_value || row.value || 0);
  return {
    organizationId,
    name: name || "Unnamed Lead",
    email: row.email?.trim() || void 0,
    phone: (row.phone || row.phone_number || row.mobile)?.trim() || void 0,
    source,
    campaignId: row.campaign_id || row.campaign || void 0,
    consent: row.consent !== "false" && row.consent !== "0",
    profile: {
      serviceFit: Boolean(serviceType),
      needConfirmed: row.need_confirmed !== "false",
      decisionMaker: row.decision_maker === "true" || row.decision_maker === "1",
      budget: Number.isFinite(dealVal) && dealVal > 0 ? dealVal : void 0
    },
    commercial: {
      estimatedDealValue: Number.isFinite(dealVal) ? dealVal : 0,
      currency: row.currency || "NGN",
      serviceType
    },
    metadata: { importedRow: row }
  };
}

// src/integrations/memory-audit-requests.ts
var MemoryAuditRequestStore = class {
  requests = [];
  async create(request) {
    this.requests.unshift(structuredClone(request));
  }
  async list() {
    return structuredClone(this.requests);
  }
  async findById(id3) {
    const found = this.requests.find((r) => r.id === id3);
    return found ? structuredClone(found) : null;
  }
};

// src/integrations/postgres-audit-requests.ts
var PostgresAuditRequestStore = class {
  constructor(db2) {
    this.db = db2;
  }
  async create(request) {
    await this.db.query(
      `insert into audit_requests (
        id, name, business, email, phone, website, monthly_lead_volume,
        current_crm, biggest_sales_bottleneck, average_deal_value,
        where_leads_are_lost, status, created_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      on conflict (id) do nothing`,
      [
        request.id,
        request.name,
        request.business,
        request.email,
        request.phone,
        request.website ?? null,
        request.monthlyLeadVolume,
        request.currentCrm ?? null,
        request.biggestSalesBottleneck,
        request.averageDealValue ?? null,
        request.whereLeadsAreLost ?? null,
        request.status,
        request.createdAt
      ]
    );
  }
  async list() {
    const result = await this.db.query(
      `select * from audit_requests order by created_at desc`
    );
    return result.rows.map((row) => this.mapRow(row));
  }
  async findById(id3) {
    const result = await this.db.query(
      `select * from audit_requests where id = $1`,
      [id3]
    );
    if (!result.rows.length) return null;
    return this.mapRow(result.rows[0]);
  }
  mapRow(row) {
    return {
      id: row.id,
      name: row.name,
      business: row.business,
      email: row.email,
      phone: row.phone,
      website: row.website ?? void 0,
      monthlyLeadVolume: row.monthly_lead_volume,
      currentCrm: row.current_crm ?? void 0,
      biggestSalesBottleneck: row.biggest_sales_bottleneck,
      averageDealValue: row.average_deal_value ? Number(row.average_deal_value) : void 0,
      whereLeadsAreLost: row.where_leads_are_lost ?? void 0,
      status: row.status,
      createdAt: typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString()
    };
  }
};

// server.ts
var app = express();
var port = Number(process.env.PORT || 3e3);
var usePostgres = Boolean(process.env.DATABASE_URL);
var db = usePostgres ? new PostgresDatabase() : void 0;
var auditRequestStore = db ? new PostgresAuditRequestStore(db) : new MemoryAuditRequestStore();
var leadStore = db ? new PostgresLeadStore(db) : new MemoryLeadStore();
var leadEventStore = db ? new PostgresLeadEventStore(db) : new MemoryLeadEventStore();
var tenantEventRepository = new TenantLeadEventRepositoryImpl(leadEventStore);
var clientConfigurationStore = db ? new PostgresClientConfigurationStore(db) : new MemoryClientConfigurationStore();
var clientConfigurationService = new ClientConfigurationService(clientConfigurationStore);
var workflow = db ? new PostgresRevenueWorkflowRepository(db) : new MemoryRevenueWorkflowRepository();
var followUpRepository = db ? new PostgresFollowUpRepository(db) : void 0;
var revenueControlPlaneReader = db ? new PostgresRevenueControlPlaneReader(db) : void 0;
var followUpAdapters = new Map(
  ["whatsapp", "sms", "email", "voice", "web"].map((channel) => [channel, new LoggingChannelAdapter(channel)])
);
var followUpWorker = followUpRepository ? new FollowUpWorker(followUpRepository, followUpAdapters) : void 0;
var webhookDispatcher = db ? new WebhookDispatcher(db) : void 0;
var lifecycleService = new LeadLifecycleService(leadStore, leadEventStore);
var revenueEngine = new RevenueEngineService(leadStore, void 0, leadEventStore, clientConfigurationService, workflow);
var sdrQueueService = new SdrQueueService(workflow);
var sdrDispositionService = new SdrDispositionService(lifecycleService);
var revenueRecoveryService = new RevenueRecoveryService(workflow, leadStore, lifecycleService, leadEventStore, db);
var revenueLeakageService = new RevenueLeakageService(leadStore, workflow);
var conversationStore = db ? new PostgresConversationStore(db) : new MemoryConversationStore();
var messageStore = db ? new PostgresMessageStore(db) : new MemoryMessageStore();
var conversationService = new ConversationService(leadStore, conversationStore, messageStore);
var qualificationOrchestrator = new QualificationOrchestrator(leadStore, leadEventStore);
var memoryMembershipRepository = new MemoryTenantMembershipRepository();
var postgresMembershipRepository = db ? new PostgresTenantMembershipRepository(db) : void 0;
var membershipRepository = postgresMembershipRepository ?? memoryMembershipRepository;
var membershipService = new TenantMembershipService(membershipRepository);
var headerIdentityResolver = new MembershipIdentityResolver(membershipService);
var sessionIdentityResolver = new SessionIdentityResolver(membershipService);
if (!usePostgres) {
  const tenantId = process.env.DEV_TENANT_ID || "demo-tenant", userId = process.env.DEV_USER_ID || "demo-user", role = process.env.DEV_USER_ROLE || "owner";
  const validRoles = ["viewer", "agent", "manager", "admin", "owner"];
  if (!validRoles.includes(role)) throw new Error("Invalid DEV_USER_ROLE");
  memoryMembershipRepository.seedTenant({ id: tenantId, name: "Demo Tenant", slug: "demo-tenant", status: "active", createdAt: (/* @__PURE__ */ new Date()).toISOString() });
  memoryMembershipRepository.seedMembership({ id: `membership_${userId}_${tenantId}`, userId, tenantId, email: process.env.DEV_USER_EMAIL || "demo@example.com", role, active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
}
app.use(express.json({ limit: "2mb" }));
function contextOf(req) {
  if (!req.context) throw new Error("Authenticated request context is required");
  return req.context;
}
function tenantError(error) {
  const message = error instanceof Error ? error.message : "Request failed";
  if (message === "Tenant access denied" || message === "Insufficient tenant role") return 403;
  if (message.includes("membership") || message === "Tenant is suspended" || message === "Tenant not found") return 403;
  if (message.includes("not found") || message.startsWith("Lead not found") || message.startsWith("SDR work item not found")) return 404;
  if (message.includes("already completed") || message.includes("already belongs") || message.includes("claimed by another")) return 409;
  return 400;
}
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "zeerocodes-revenue-engine", mode: usePostgres ? "postgres" : "memory", workflow: "lead-to-revenue", rls: usePostgres }));
app.post("/api/auth/dev-session", (req, res) => {
  const tenantId = String(req.body?.tenantId || process.env.DEV_TENANT_ID || "demo-tenant");
  const userId = String(req.body?.userId || process.env.DEV_USER_ID || "demo-user");
  return res.json({ token: signSession(userId, tenantId), tenantId, userId });
});
app.post("/api/public/audit-requests", async (req, res) => {
  try {
    const input = req.body;
    const auditRequest = createAuditRequest(input, `audit_${randomUUID5()}`);
    await auditRequestStore.create(auditRequest);
    return res.status(201).json({ auditRequest, message: "Audit request received successfully" });
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : "Invalid audit request submission" });
  }
});
app.get("/api/public/audit-requests", async (_req, res) => {
  try {
    const requests = await auditRequestStore.list();
    return res.json({ auditRequests: requests });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch audit requests" });
  }
});
async function authMiddleware(req, res, next) {
  try {
    let context;
    const bearer = req.header("authorization");
    if (bearer?.startsWith("Bearer ")) {
      context = await sessionIdentityResolver.resolveBearer(bearer.slice(7));
    } else if (process.env.NODE_ENV !== "production") {
      const userId = req.header("x-user-id"), tenantId = req.header("x-tenant-id");
      if (!userId || !tenantId) return res.status(401).json({ error: "Bearer session required" });
      context = await headerIdentityResolver.resolve({ userId, tenantId });
    } else {
      return res.status(401).json({ error: "Bearer session required" });
    }
    req.context = context;
    if (db) {
      const transaction = await db.beginRequestTenant(context.tenantId);
      db.runRequestContext(context.tenantId, transaction.client, () => {
        let settled = false;
        const finish = async () => {
          if (settled) return;
          settled = true;
          await transaction.finish(res.statusCode < 500);
        };
        res.on("finish", () => {
          void finish();
        });
        next();
      });
      return;
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: error instanceof Error ? error.message : "Authentication failed" });
  }
}
app.use("/api", authMiddleware);
app.get("/api/configuration", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    return res.json({ configuration: await clientConfigurationService.get(c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to load configuration" });
  }
});
app.put("/api/configuration", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "admin");
    return res.json({ configuration: await clientConfigurationService.save({ ...req.body, organizationId: c.tenantId }) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to save configuration" });
  }
});
app.post("/api/leads/intake", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "agent");
    const result = await revenueEngine.intake({ ...req.body, organizationId: c.tenantId });
    if (followUpRepository) await planInitialFollowUps(followUpRepository, result.lead, result.decision);
    if (webhookDispatcher) await webhookDispatcher.enqueue({ id: randomUUID5(), organizationId: c.tenantId, type: "lead.created", occurredAt: (/* @__PURE__ */ new Date()).toISOString(), payload: { lead: result.lead, decision: result.decision } });
    return res.status(201).json(result);
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Invalid lead intake" });
  }
});
app.get("/api/leads", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    return res.json({ leads: await leadStore.list(c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to list leads" });
  }
});
app.get("/api/leads/:id", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    return res.json({ lead: await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Lead not found" });
  }
});
app.get("/api/leads/:id/events", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    return res.json({ events: await tenantEventRepository.listForTenant(req.params.id, c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Lead not found" });
  }
});
app.get("/api/leads/:id/conversation", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    return res.json(await conversationService.getConversation(req.params.id, c.tenantId));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Conversation unavailable" });
  }
});
app.post("/api/leads/:id/messages", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "agent");
    return res.json(await conversationService.sendMessage({ ...req.body, leadId: req.params.id, organizationId: c.tenantId }));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to send message" });
  }
});
app.post("/api/leads/:id/conversation-decision", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "agent");
    await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    const configuration = await clientConfigurationService.get(c.tenantId);
    return res.json(await qualificationOrchestrator.process({ leadId: req.params.id, organizationId: c.tenantId, text: req.body.message, configuration, policy: configuration.qualification }));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to process conversation" });
  }
});
app.post("/api/leads/:id/redecide", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "manager");
    return res.json(await revenueEngine.redecide(req.params.id, c.tenantId));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to redecide lead" });
  }
});
app.post("/api/follow-ups/run", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "manager");
    if (!followUpWorker) return res.status(503).json({ error: "Follow-up worker requires PostgreSQL" });
    return res.json(await followUpWorker.runOnce(c.tenantId, Math.min(Number(req.body?.limit || 25), 100)));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to run follow-ups" });
  }
});
app.post("/api/leads/:id/appointments", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "agent");
    const lead = await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    const idempotencyKey = req.header("idempotency-key")?.trim();
    if (idempotencyKey) {
      const existing = await workflow.findAppointmentByIdempotency(c.tenantId, idempotencyKey);
      if (existing) {
        if (existing.leadId !== lead.id) throw new Error("Idempotency key already belongs to another lead");
        return res.status(200).json({ appointment: existing, lead });
      }
    }
    if (!["qualified", "nurture"].includes(lead.state)) throw new Error("Lead must be qualified before booking");
    const scheduledAt = new Date(req.body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new Error("Invalid scheduledAt");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const previousState = lead.state;
    const nextState = transitionLead(previousState, "booked");
    const appointment = { id: randomUUID5(), organizationId: c.tenantId, leadId: lead.id, scheduledAt: scheduledAt.toISOString(), status: "scheduled", ownerUserId: c.userId, source: req.body.source, idempotencyKey, metadata: req.body.metadata, createdAt: now, updatedAt: now };
    await workflow.saveAppointment(appointment);
    lead.state = nextState;
    lead.updatedAt = now;
    await leadStore.save(lead);
    await leadEventStore.append({ id: randomUUID5(), leadId: lead.id, organizationId: c.tenantId, type: "lead.booked", actor: "sdr", timestamp: now, fromState: previousState, toState: nextState, reason: "appointment booked", metadata: { appointmentId: appointment.id, idempotencyKey } });
    if (webhookDispatcher) await webhookDispatcher.enqueue({ id: randomUUID5(), organizationId: c.tenantId, type: "appointment.booked", occurredAt: now, payload: { lead, appointment } });
    return res.status(201).json({ appointment, lead });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to book appointment" });
  }
});
app.get("/api/leads/:id/appointments", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    return res.json({ appointments: await workflow.listAppointments(c.tenantId, req.params.id) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to load appointments" });
  }
});
app.post("/api/leads/:id/outcome", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "manager");
    const lead = await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    const outcome = req.body.outcome;
    if (!["won", "lost", "no_sale", "no_show", "cancelled", "unqualified"].includes(outcome)) throw new Error("Invalid outcome");
    const idempotencyKey = req.header("idempotency-key")?.trim();
    if (idempotencyKey) {
      const existing = await workflow.findOutcomeByIdempotency(c.tenantId, idempotencyKey);
      if (existing) {
        if (existing.leadId !== lead.id) throw new Error("Idempotency key already belongs to another lead");
        return res.status(200).json({ lead, outcome: existing });
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const outcomeRecord = { id: randomUUID5(), organizationId: c.tenantId, leadId: lead.id, outcome, revenueAmount: typeof req.body.revenueAmount === "number" ? req.body.revenueAmount : null, currency: req.body.currency || "NGN", reason: req.body.reason, ownerUserId: c.userId, idempotencyKey, occurredAt: now, metadata: req.body.metadata };
    const previousState = lead.state;
    const targetState = outcome === "won" ? "won" : outcome === "no_show" || outcome === "cancelled" ? "nurture" : "lost";
    if (!canTransition(previousState, targetState)) throw new Error(`Outcome ${outcome} cannot move lead from ${previousState} to ${targetState}`);
    const nextState = transitionLead(previousState, targetState);
    await workflow.saveOutcome(outcomeRecord);
    lead.state = nextState;
    lead.updatedAt = now;
    await leadStore.save(lead);
    await leadEventStore.append({ id: randomUUID5(), leadId: lead.id, organizationId: c.tenantId, type: outcome === "won" ? "lead.won" : "lead.lost", actor: "closer", timestamp: now, fromState: previousState, toState: nextState, reason: outcomeRecord.reason || outcome, metadata: { outcomeId: outcomeRecord.id, revenueAmount: outcomeRecord.revenueAmount, idempotencyKey } });
    if (outcome === "won" && outcomeRecord.revenueAmount) {
      await workflow.saveAttribution({ id: randomUUID5(), organizationId: c.tenantId, leadId: lead.id, outcomeId: outcomeRecord.id, source: lead.source, campaign: String(lead.metadata?.campaign || ""), medium: String(lead.metadata?.medium || ""), attributionModel: "first_touch", attributedAmount: outcomeRecord.revenueAmount, currency: outcomeRecord.currency, createdAt: now });
    }
    if (webhookDispatcher) await webhookDispatcher.enqueue({ id: randomUUID5(), organizationId: c.tenantId, type: "lead.outcome", occurredAt: now, payload: { lead, outcome: outcomeRecord } });
    return res.json({ lead, outcome: outcomeRecord });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to record outcome" });
  }
});
app.get("/api/sdr/queue", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    return res.json(await sdrQueueService.queue(c.tenantId));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to load SDR queue" });
  }
});
app.post("/api/sdr/work-items", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "agent");
    const item = await sdrQueueService.enqueue({ ...req.body, organizationId: c.tenantId });
    return res.status(201).json({ workItem: item });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to create work item" });
  }
});
app.post("/api/sdr/work-items/:id/claim", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "agent");
    const item = await sdrQueueService.claim(c.tenantId, req.params.id, c.userId);
    return res.json({ workItem: item });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to claim work item" });
  }
});
app.post("/api/sdr/work-items/:id/disposition", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "agent");
    const item = await workflow.getSdrWorkItem(c.tenantId, req.params.id);
    if (!item) throw new Error("SDR work item not found");
    const disposition = req.body.disposition;
    const dispositionResult = await sdrDispositionService.apply({
      organizationId: c.tenantId,
      item,
      disposition,
      appointmentId: req.body.appointmentId,
      appointmentStatus: req.body.appointmentStatus,
      qualification: req.body.qualification
    });
    const completedItem = await sdrQueueService.complete(c.tenantId, req.params.id, disposition, c.userId, req.body.outcomeRevenue);
    return res.json({ workItem: completedItem, lifecycle: dispositionResult });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to apply disposition" });
  }
});
app.post("/api/revenue/recovery", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "agent");
    const idempotencyKey = req.header("idempotency-key")?.trim();
    const result = await revenueRecoveryService.executeRecovery({
      organizationId: c.tenantId,
      workItemId: req.body.workItemId,
      recoveredAmount: Number(req.body.recoveredAmount),
      currency: req.body.currency,
      ownerUserId: c.userId,
      idempotencyKey,
      notes: req.body.notes
    });
    return res.status(result.idempotentReplay ? 200 : 201).json(result);
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Revenue recovery failed" });
  }
});
app.get("/api/revenue/recovery/attributions", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    return res.json({ attributions: await workflow.listRecoveryAttributions(c.tenantId, req.query.leadId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to load recovery attributions" });
  }
});
app.get("/api/revenue/leakage", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    return res.json({ leakages: await revenueLeakageService.listActiveLeakage(c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to list leakage" });
  }
});
app.post("/api/revenue/leakage/detect", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "manager");
    const summary = await revenueLeakageService.detectAndSyncTenantLeakage(c.tenantId);
    return res.json(summary);
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Leakage detection failed" });
  }
});
app.get("/api/revenue/usage", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "manager");
    return res.json({ usage: await workflow.usageSummary(c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to load usage" });
  }
});
app.get("/api/revenue/control-plane", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "manager");
    if (revenueControlPlaneReader) {
      return res.json({ controlPlane: await revenueControlPlaneReader.calculate(c.tenantId) });
    }
    const leads = await leadStore.list(c.tenantId);
    const workItems = await workflow.listSdrWorkItems(c.tenantId);
    const recoveries = await workflow.listRecoveryAttributions(c.tenantId);
    const leakages = await workflow.listLeakageOpportunities(c.tenantId, "active");
    const totalRecovered = recoveries.reduce((sum, r) => sum + r.recoveredAmount, 0);
    const snapshot = buildRevenueControlPlane({
      organizationId: c.tenantId,
      intelligence: {
        funnel: {
          leads: leads.length,
          contacted: leads.filter((l) => l.state !== "new").length,
          engaged: leads.filter((l) => ["engaged", "qualifying", "qualified", "booked", "won"].includes(l.state)).length,
          qualified: leads.filter((l) => ["qualified", "booked", "won"].includes(l.state)).length,
          booked: leads.filter((l) => ["booked", "won"].includes(l.state)).length,
          won: leads.filter((l) => l.state === "won").length,
          revenue: totalRecovered,
          currency: "NGN"
        },
        contactRate: leads.length > 0 ? leads.filter((l) => l.state !== "new").length / leads.length * 100 : 0,
        qualificationRate: leads.length > 0 ? leads.filter((l) => ["qualified", "booked", "won"].includes(l.state)).length / leads.length * 100 : 0,
        bookingRate: 0,
        closeRate: 0,
        revenuePerLead: leads.length > 0 ? totalRecovered / leads.length : 0,
        revenueRecovered: totalRecovered,
        attributedRevenue: totalRecovered
      },
      workItems,
      performance: [],
      leakageOpportunities: leakages
    });
    return res.json({ controlPlane: snapshot });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to calculate revenue control plane" });
  }
});
app.get("/api/revenue/control-plane/latest", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "manager");
    if (revenueControlPlaneReader) {
      return res.json({ controlPlane: await revenueControlPlaneReader.latest(c.tenantId) });
    }
    return res.json({ controlPlane: null });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to load revenue control plane" });
  }
});
app.post("/api/webhooks/deliver", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "admin");
    if (!webhookDispatcher) return res.status(503).json({ error: "Webhook delivery requires PostgreSQL" });
    return res.json({ delivered: await webhookDispatcher.deliverPending(Number(req.body?.limit || 20)) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Unable to deliver webhooks" });
  }
});
app.get("/api/audit-requests", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "viewer");
    const requests = await auditRequestStore.list();
    return res.json({ auditRequests: requests });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Failed to fetch audit requests" });
  }
});
app.post("/api/leads/import-csv", async (req, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, "agent");
    const { csv, source = "csv-import" } = req.body || {};
    if (typeof csv !== "string" || !csv.trim()) {
      return res.status(400).json({ error: "Valid CSV string is required" });
    }
    const rows = parseLeadCsv(csv);
    let accepted = 0;
    let rejected = 0;
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const leadInput = rowToLeadInput(rows[i], c.tenantId, source);
        await revenueEngine.intake(leadInput);
        accepted++;
      } catch (err) {
        rejected++;
        errors.push({ row: i + 1, message: err instanceof Error ? err.message : "Intake failed" });
      }
    }
    return res.json({
      total: rows.length,
      accepted,
      rejected,
      duplicates: 0,
      errors
    });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : "Failed to import CSV" });
  }
});
if (!process.env.VERCEL) {
  const staticDist = path2.resolve(process.cwd(), "dist");
  app.use(express.static(staticDist));
  app.get("*", (_req, res) => res.sendFile(path2.join(staticDist, "index.html")));
}
app.use((err, _req, res, _next) => {
  console.error("Unhandled API Error:", err);
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return res.status(500).json({ error: message });
});
async function start() {
  if (usePostgres) {
    await runPostgresMigrations(db);
  }
  app.listen(port, () => console.log(`Zeerocodes Revenue Engine listening on ${port}`));
}
var isDirectExecution = typeof process.argv[1] === "string" && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.cjs") || process.argv[1].endsWith("server.js"));
if (isDirectExecution && !process.env.VERCEL) {
  void start();
}
var server_default = app;

// src/api-serverless.ts
var api_serverless_default = server_default;
export {
  api_serverless_default as default
};
