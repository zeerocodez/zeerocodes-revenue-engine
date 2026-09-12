import { ConversationStatus, OutcomeStatus, type Conversation } from './types';
import type { LeadState } from '../../domain/lead-state';

/** Maps Lead Zero conversation/outcome semantics into the unified lead-state machine. */
export function mapConversationToLeadState(conversation: Conversation): LeadState {
  if (conversation.selectedOutcome === OutcomeStatus.WON) return 'won';
  if (conversation.selectedOutcome === OutcomeStatus.LOST) return 'lost';
  if (conversation.selectedOutcome === OutcomeStatus.NURTURE) return 'nurture';
  if (conversation.status === ConversationStatus.ARCHIVED) return 'lost';
  if (conversation.status === ConversationStatus.FOLLOW_UP_SCHEDULED) return 'contacting';
  if (conversation.status === ConversationStatus.REPLIED) return 'engaged';
  if (conversation.status === ConversationStatus.READ) return 'contacting';
  return 'new';
}

export function isHumanEscalationRequired(conversation: Conversation): boolean {
  return Boolean(conversation.assignedTo || conversation.status === ConversationStatus.REPLIED || conversation.selectedOutcome);
}
