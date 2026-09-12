/**
 * Lead Zero domain types carried into the unified Revenue Engine.
 * Original source: zeerocodez/lead-zero/src/types.ts
 */
export enum Role { ADMIN = 'Admin', REPRESENTATIVE = 'Sales Rep', VIEWER = 'Viewer' }
export enum ConversationStatus { UNREAD = 'Unread', READ = 'Read', REPLIED = 'Replied', FOLLOW_UP_SCHEDULED = 'Follow-up Scheduled', ARCHIVED = 'Archived' }
export enum OutcomeStatus { WON = 'Won', LOST = 'Lost', PENDING = 'Pending', NURTURE = 'Nurture' }
export enum TemplateCategory { GREETING = 'Greeting', PRICING = 'Pricing', FOLLOW_UP = 'Follow-up', CLOSING = 'Closing', CUSTOM = 'Custom' }
export enum CustomerSegment { VIP = 'VIP', REGULAR = 'Regular', ONE_TIME = 'One-time', DORMANT = 'Dormant' }
export enum SubscriptionTier { FREE = 'Free', GROWTH = 'Growth', PRO = 'Pro' }

export interface User { id: string; name: string; phone: string; role: Role; avatarUrl?: string; isOnline: boolean; email?: string }
export interface Business { name: string; phone: string; currency: string; timezone: string; subscriptionTier: SubscriptionTier; subscriptionExpiresAt?: string; monthlyTarget?: number }
export interface Contact { id: string; name: string; phone: string; avatarUrl?: string; segment: CustomerSegment; totalLTV: number; conversationCount: number; firstContactDate: string; lastContactDate: string; notes: string[] }
export interface Message { id: string; sender: 'customer' | 'user'; senderName: string; body: string; timestamp: string; type: 'text' | 'image' | 'video' | 'document' | 'voice' | 'location'; status: 'sent' | 'delivered' | 'read'; mediaUrl?: string }
export interface FollowUp { id: string; conversationId: string; customerName: string; customerPhone: string; dueDate: string; status: 'pending' | 'completed' | 'overdue'; outcomeCompleted?: 'Called' | 'Messaged' | 'Closed' | 'No Response'; outcomeNotes?: string; assignedToId?: string; snoozedCount: number }
export interface QuickReplyTemplate { id: string; title: string; category: TemplateCategory; body: string; usageCount: number }
export interface RevenueEvent { id: string; conversationId: string; customerName: string; amount: number; status: OutcomeStatus; date: string; repId: string; repName: string }
export interface Conversation { id: string; contact: Contact; status: ConversationStatus; lastMessage: Message; messages: Message[]; assignedTo?: User; tags: string[]; internalNotes: string[]; typingIndicator?: boolean; lockedBy?: string; selectedOutcome?: OutcomeStatus; revenueAmount?: number }
export interface ActivityLog { id: string; timestamp: string; userId: string; userName: string; action: string; details: string }
export interface Invoice { id: string; invoiceNumber: string; date: string; amount: number; tier: SubscriptionTier; paymentMethod: string; status: 'Paid' | 'Refunded' | 'Failed' }
