/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Role,
  ConversationStatus,
  OutcomeStatus,
  TemplateCategory,
  CustomerSegment,
  SubscriptionTier,
  User,
  Business,
  Contact,
  Conversation,
  QuickReplyTemplate,
  FollowUp,
  RevenueEvent,
  ActivityLog,
  Invoice
} from "./types";

export const MOCK_USERS: User[] = [
  {
    id: "super_admin",
    name: "Zeero Codes (Super Admin)",
    phone: "+234 809 123 9999",
    role: Role.ADMIN,
    email: "zeerocodes@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    isOnline: true
  },
  {
    id: "user1",
    name: "Chioma (Admin)",
    phone: "+234 803 111 2222",
    role: Role.ADMIN,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    isOnline: true
  },
  {
    id: "user2",
    name: "Emeka",
    phone: "+234 812 333 4444",
    role: Role.REPRESENTATIVE,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    isOnline: true
  },
  {
    id: "user3",
    name: "Fatima",
    phone: "+234 905 555 6666",
    role: Role.VIEWER,
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
    isOnline: false
  }
];

export const MOCK_BUSINESS: Business = {
  name: "Chioma's Ultimate Services",
  phone: "+234 803 111 2222",
  currency: "₦",
  timezone: "WAT (UTC+1)",
  subscriptionTier: SubscriptionTier.GROWTH,
  subscriptionExpiresAt: "2026-06-21T00:00:00Z",
  monthlyTarget: 500000 // ₦500,000 monthly target
};

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "contact1",
    name: "Adeleke Benson",
    phone: "+234 802 444 5555",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    segment: CustomerSegment.VIP,
    totalLTV: 180000,
    conversationCount: 8,
    firstContactDate: "2026-01-10T09:00:00Z",
    lastContactDate: "2026-05-21T10:15:00Z",
    notes: [
      "Inquired about luxury 3-bedroom flat viewing in Lekki Phase 1.",
      "Requires high speed internet and backup generator.",
      "Prefer voice calls or WhatsApp in morning."
    ]
  },
  {
    id: "contact2",
    name: "Kunle Olubadewa",
    phone: "+234 703 666 7777",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80",
    segment: CustomerSegment.REGULAR,
    totalLTV: 45000,
    conversationCount: 3,
    firstContactDate: "2026-03-15T14:22:00Z",
    lastContactDate: "2026-05-21T11:45:00Z",
    notes: [
      "Booked office general cleaning for next Tuesday.",
      "Has premium wooden floors, requested custom non-abrasive oil cleaner."
    ]
  },
  {
    id: "contact3",
    name: "Chinedu Okafor",
    phone: "+234 901 888 9999",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    segment: CustomerSegment.ONE_TIME,
    totalLTV: 25000,
    conversationCount: 1,
    firstContactDate: "2026-05-18T08:10:00Z",
    lastContactDate: "2026-05-21T12:05:00Z",
    notes: [
      "Purchased iPhone 13 Pro screen guards and case bundle."
    ]
  },
  {
    id: "contact4",
    name: "Amina Yusuf",
    phone: "+234 818 222 3333",
    avatarUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&h=150&q=80",
    segment: CustomerSegment.DORMANT,
    totalLTV: 0,
    conversationCount: 4,
    firstContactDate: "2026-02-05T10:00:00Z",
    lastContactDate: "2026-02-28T16:30:00Z",
    notes: [
      "Bright Academy parent inquiry: nursery registration fees.",
      "Did not reply after pricing template list was shared.",
      "Needs a follow-up discount suggestion."
    ]
  },
  {
    id: "contact5",
    name: "Olumide Johnson",
    phone: "+234 809 111 4444",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80",
    segment: CustomerSegment.REGULAR,
    totalLTV: 75000,
    conversationCount: 5,
    firstContactDate: "2024-11-20T11:00:00Z",
    lastContactDate: "2026-05-21T13:10:00Z",
    notes: [
      "Interested in buying land in Ibeju-Lekki.",
      "Ready to pay ₦5M deposit if papers are complete.",
      "Has requested structural survey coordinates."
    ]
  }
];

export const MOCK_TEMPLATES: QuickReplyTemplate[] = [
  {
    id: "temp1",
    title: "Welcome Greeting",
    category: TemplateCategory.GREETING,
    body: "Hi {{customer_name}}, thank you for contacting {{business_name}}! 🌟 We're here to help. How may we assist you today?",
    usageCount: 45
  },
  {
    id: "temp2",
    title: "Cleaning Price List",
    category: TemplateCategory.PRICING,
    body: "Hello {{customer_name}}, here is our service package. Our deep home dusting starts at {{price}} per room, including full sanitization. Standard bookings require 24h advance notice. Rest assured, your flat will sparkle!",
    usageCount: 28
  },
  {
    id: "temp3",
    title: "Lekki Property Rates",
    category: TemplateCategory.PRICING,
    body: "Good day {{customer_name}}, the modern 3-Bedroom flat in Lekki Phase 1 is offered at {{price}} per year. This includes 24hr estate security, power supply, and premium finishing. Let us know when you'd like to schedule a viewing!",
    usageCount: 35
  },
  {
    id: "temp4",
    title: "Follow-up Reminder",
    category: TemplateCategory.FOLLOW_UP,
    body: "Hi {{customer_name}}! Just checking back regarding your request. We'd love to lock down the bookings for you. Let us know if you have any questions!",
    usageCount: 19
  },
  {
    id: "temp5",
    title: "Payment Confirmation",
    category: TemplateCategory.CLOSING,
    body: "Wonderful! We've received your payment of {{price}} via Paystack. Your receipt has been drafted and your booking is fully secured. Thank you for choosing {{business_name}}! 🙌",
    usageCount: 40
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1",
    contact: MOCK_CONTACTS[0],
    status: ConversationStatus.UNREAD,
    lastMessage: {
      id: "m_conv1_4",
      sender: "customer",
      senderName: "Adeleke Benson",
      body: "Good afternoon. Please, is the Lekki terrace still available for viewing this Saturday at 2 PM?",
      timestamp: "2026-05-21T13:25:00Z",
      type: "text",
      status: "read"
    },
    messages: [
      {
        id: "m_conv1_1",
        sender: "customer",
        senderName: "Adeleke Benson",
        body: "Hello, I saw your Listing on Instagram for flats around Lekki.",
        timestamp: "2026-05-21T09:15:00Z",
        type: "text",
        status: "read"
      },
      {
        id: "m_conv1_2",
        sender: "user",
        senderName: "Chioma (Admin)",
        body: "Hi Adeleke, thank you for contacting Chioma's Ultimate Services! 🌟 Yes we have a stunning 3-Bedroom terrace in Lekki Phase 1.",
        timestamp: "2026-05-21T09:18:00Z",
        type: "text",
        status: "read"
      },
      {
        id: "m_conv1_3",
        sender: "user",
        senderName: "Chioma (Admin)",
        body: "It is fully premium with high speed internet & water filtration system.",
        timestamp: "2026-05-21T09:20:00Z",
        type: "text",
        status: "read"
      },
      {
        id: "m_conv1_4",
        sender: "customer",
        senderName: "Adeleke Benson",
        body: "Good afternoon. Please, is the Lekki terrace still available for viewing this Saturday at 2 PM?",
        timestamp: "2026-05-21T13:25:00Z",
        type: "text",
        status: "read"
      }
    ],
    assignedTo: MOCK_USERS[0],
    tags: ["Hot Lead", "Lekki Viewings"],
    internalNotes: ["Highly motivated buyer, looking to close within a month."]
  },
  {
    id: "conv2",
    contact: MOCK_CONTACTS[1],
    status: ConversationStatus.READ,
    lastMessage: {
      id: "m_conv2_2",
      sender: "user",
      senderName: "Emeka",
      body: "That will be ₦25,000 deep cleaning. We will arrive by 9:00 AM. Does that work, Kunle?",
      timestamp: "2026-05-21T11:45:00Z",
      type: "text",
      status: "read"
    },
    messages: [
      {
        id: "m_conv2_1",
        sender: "customer",
        senderName: "Kunle Olubadewa",
        body: "Thanks! Can I confirm the price for 2 bedrooms and a study room cleaning?",
        timestamp: "2026-05-21T11:30:00Z",
        type: "text",
        status: "read"
      },
      {
        id: "m_conv2_2",
        sender: "user",
        senderName: "Emeka",
        body: "That will be ₦25,000 deep cleaning. We will arrive by 9:00 AM. Does that work, Kunle?",
        timestamp: "2026-05-21T11:45:00Z",
        type: "text",
        status: "read"
      }
    ],
    assignedTo: MOCK_USERS[1],
    tags: ["Cleaning Request", "Regular Client"],
    internalNotes: ["Demands exact time slot due to back-to-back virtual office meetings."]
  },
  {
    id: "conv3",
    contact: MOCK_CONTACTS[2],
    status: ConversationStatus.REPLIED,
    lastMessage: {
      id: "m_conv3_2",
      sender: "user",
      senderName: "Emeka",
      body: "You're welcome, Chinedu. The payment has been captured successfully. Your order is dispatched!",
      timestamp: "2026-05-21T12:05:00Z",
      type: "text",
      status: "read"
    },
    messages: [
      {
        id: "m_conv3_1",
        sender: "customer",
        senderName: "Chinedu Okafor",
        body: "Perfect! Just transferred the ₦25,000 via USSD.",
        timestamp: "2026-05-21T11:58:00Z",
        type: "text",
        status: "read"
      },
      {
        id: "m_conv3_2",
        sender: "user",
        senderName: "Emeka",
        body: "You're welcome, Chinedu. The payment has been captured successfully. Your order is dispatched!",
        timestamp: "2026-05-21T12:05:00Z",
        type: "text",
        status: "read"
      }
    ],
    assignedTo: MOCK_USERS[1],
    tags: ["Paid", "Electronics Shop"],
    internalNotes: ["Deliver via transport rider to Surulere."],
    selectedOutcome: OutcomeStatus.WON,
    revenueAmount: 25000
  },
  {
    id: "conv4",
    contact: MOCK_CONTACTS[3],
    status: ConversationStatus.FOLLOW_UP_SCHEDULED,
    lastMessage: {
      id: "m_conv4_1",
      sender: "customer",
      senderName: "Amina Yusuf",
      body: "Is there an sibling discount for two kids? Bright academy prices are a bit high.",
      timestamp: "2026-02-28T16:30:00Z",
      type: "text",
      status: "read"
    },
    messages: [
      {
        id: "m_conv4_1",
        sender: "customer",
        senderName: "Amina Yusuf",
        body: "Is there an sibling discount for two kids? Bright academy prices are a bit high.",
        timestamp: "2026-02-28T16:30:00Z",
        type: "text",
        status: "read"
      }
    ],
    assignedTo: MOCK_USERS[0],
    tags: ["Tuition", "Price Negotiating"],
    internalNotes: ["Amina is interested but budget sensitive. Offer standard 10% second-sibling discount."]
  },
  {
    id: "conv5",
    contact: MOCK_CONTACTS[4],
    status: ConversationStatus.UNREAD,
    lastMessage: {
      id: "m_conv5_2",
      sender: "customer",
      senderName: "Olumide Johnson",
      body: "Let's meet tomorrow to review original land survey documents. I am driving in from Ibadan.",
      timestamp: "2026-05-21T13:10:00Z",
      type: "text",
      status: "delivered"
    },
    messages: [
      {
        id: "m_conv5_1",
        sender: "user",
        senderName: "Chioma (Admin)",
        body: "Hi Olumide, the surveyor has certified the coordinates. We have the legal papers here.",
        timestamp: "2026-05-21T11:20:00Z",
        type: "text",
        status: "read"
      },
      {
        id: "m_conv5_2",
        sender: "customer",
        senderName: "Olumide Johnson",
        body: "Let's meet tomorrow to review original land survey documents. I am driving in from Ibadan.",
        timestamp: "2026-05-21T13:10:00Z",
        type: "text",
        status: "delivered"
      }
    ],
    tags: ["Ibeju Land", "VIP Lead"],
    internalNotes: []
  }
];

export const MOCK_FOLLOWUPS: FollowUp[] = [
  {
    id: "f1",
    conversationId: "conv1",
    customerName: "Adeleke Benson",
    customerPhone: "+234 802 444 5555",
    dueDate: "2026-05-21T14:30:00Z", // due soon
    status: "pending",
    assignedToId: "user1",
    snoozedCount: 0
  },
  {
    id: "f2",
    conversationId: "conv4",
    customerName: "Amina Yusuf",
    customerPhone: "+234 818 222 3333",
    dueDate: "2026-05-20T10:00:00Z", // overdue
    status: "overdue",
    assignedToId: "user1",
    snoozedCount: 1
  },
  {
    id: "f3",
    conversationId: "conv2",
    customerName: "Kunle Olubadewa",
    customerPhone: "+234 703 666 7777",
    dueDate: "2026-05-22T09:00:00Z",
    status: "pending",
    assignedToId: "user2",
    snoozedCount: 0
  }
];

export const MOCK_REVENUE_EVENTS: RevenueEvent[] = [
  {
    id: "rev1",
    conversationId: "conv3",
    customerName: "Chinedu Okafor",
    amount: 25000,
    status: OutcomeStatus.WON,
    date: "2026-05-21T12:00:00Z",
    repId: "user2",
    repName: "Emeka"
  },
  {
    id: "rev2",
    conversationId: "conv2_past",
    customerName: "Kunle Olubadewa",
    amount: 35000,
    status: OutcomeStatus.WON,
    date: "2026-05-15T15:00:00Z",
    repId: "user2",
    repName: "Emeka"
  },
  {
    id: "rev3",
    conversationId: "conv1_past",
    customerName: "Adeleke Benson",
    amount: 120000,
    status: OutcomeStatus.WON,
    date: "2026-05-10T11:20:00Z",
    repId: "user1",
    repName: "Chioma (Admin)"
  },
  {
    id: "rev4",
    conversationId: "conv_lost_1",
    customerName: "Anonymous Client",
    amount: 50000,
    status: OutcomeStatus.LOST,
    date: "2026-05-18T16:00:00Z",
    repId: "user1",
    repName: "Chioma (Admin)"
  }
];

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "act1",
    timestamp: "2026-05-21T12:05:00Z",
    userId: "user2",
    userName: "Emeka",
    action: "Sent Reply",
    details: "Sent order confirmation to Chinedu Okafor (₦25,000 won)."
  },
  {
    id: "act2",
    timestamp: "2026-05-21T11:45:00Z",
    userId: "user2",
    userName: "Emeka",
    action: "Sent Reply",
    details: "Shared clean quote to Kunle Olubadewa (₦25,000)."
  },
  {
    id: "act3",
    timestamp: "2026-05-21T11:20:00Z",
    userId: "user1",
    userName: "Chioma (Admin)",
    action: "Assigned Conversation",
    details: "Assigned conversation with Kunle Olubadewa to Emeka."
  },
  {
    id: "act4",
    timestamp: "2026-05-21T10:15:00Z",
    userId: "user1",
    userName: "Chioma (Admin)",
    action: "Scheduled Follow-up",
    details: "Scheduled follow-up with Adeleke Benson for today 2:30 PM."
  }
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv1",
    invoiceNumber: "INV-2026-003",
    date: "2026-05-21",
    amount: 5000,
    tier: SubscriptionTier.GROWTH,
    paymentMethod: "Paystack (Visa ending in 4242)",
    status: "Paid"
  },
  {
    id: "inv2",
    invoiceNumber: "INV-2026-002",
    date: "2026-04-21",
    amount: 5000,
    tier: SubscriptionTier.GROWTH,
    paymentMethod: "Paystack (Bank Transfer)",
    status: "Paid"
  },
  {
    id: "inv3",
    invoiceNumber: "INV-2026-001",
    date: "2026-03-21",
    amount: 5000,
    tier: SubscriptionTier.GROWTH,
    paymentMethod: "Paystack (USSD)",
    status: "Paid"
  }
];
