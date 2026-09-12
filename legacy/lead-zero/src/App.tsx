/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LandingPage from "./components/LandingPage";
import InboxSection from "./components/InboxSection";
import FollowUpSection from "./components/FollowUpSection";
import RevenueSection from "./components/RevenueSection";
import TemplateSection from "./components/TemplateSection";
import TeamSection from "./components/TeamSection";
import BillingSection from "./components/BillingSection";
import CustomersSection from "./components/CustomersSection";
import SuperAdminSection from "./components/SuperAdminSection";

import {
  Role,
  ConversationStatus,
  Message,
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

import {
  MOCK_USERS,
  MOCK_BUSINESS,
  MOCK_TEMPLATES,
  MOCK_CONVERSATIONS,
  MOCK_FOLLOWUPS,
  MOCK_REVENUE_EVENTS,
  MOCK_ACTIVITY_LOGS,
  MOCK_INVOICES
} from "./mockData";

// Pre-configured Super Admin Account
const ADMIN_SUPER_USER: User = {
  id: "super_admin",
  name: "Zeero Codes (Super Admin)",
  phone: "+234 809 123 9999",
  role: Role.ADMIN,
  email: "zeerocodes@gmail.com",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
  isOnline: true
};

export default function App() {
  const [onboarding, setOnboarding] = useState<boolean>(() => {
    const saved = localStorage.getItem("lz_onboarding_done");
    return saved === "false" ? true : false;
  });

  const [activeTab, setActiveTab] = useState<string>("inbox");

  // System layout theme configuration
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("lz_theme");
    return saved === "light" ? "light" : "dark";
  });

  // Ensure Admin User session is directly initialized and active
  useEffect(() => {
    if (!localStorage.getItem("lz_admin_session_initialized")) {
      localStorage.setItem("lz_admin_session_initialized", "true");
      localStorage.setItem("lz_onboarding_done", "true");
      localStorage.setItem("lz_current_user_id", "super_admin");
      setCurrentUser(ADMIN_SUPER_USER);
      setOnboarding(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lz_theme", theme);
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.style.colorScheme = "light";
    } else {
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    }
  }, [theme]);

  // Reset scroll position on tab or page level screen changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, onboarding]);

  // Core App states
  const [business, setBusiness] = useState<Business>(() => {
    const saved = localStorage.getItem("lz_business");
    return saved ? JSON.parse(saved) : MOCK_BUSINESS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("lz_users");
    let list: User[] = saved ? JSON.parse(saved) : MOCK_USERS;
    if (!list.some(u => u.email === "zeerocodes@gmail.com" || u.id === "super_admin")) {
      list = [ADMIN_SUPER_USER, ...list];
    }
    return list;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem("lz_current_user_id");
    const savedUsers = localStorage.getItem("lz_users");
    const parsedUsers: User[] = savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
    const adminFound = parsedUsers.find(u => u.email === "zeerocodes@gmail.com" || u.id === "super_admin");
    if (!saved || saved === "super_admin") {
      return adminFound || ADMIN_SUPER_USER;
    }
    const found = parsedUsers.find(u => u.id === saved);
    return found || adminFound || ADMIN_SUPER_USER;
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem("lz_conversations");
    return saved ? JSON.parse(saved) : MOCK_CONVERSATIONS;
  });

  const [followups, setFollowups] = useState<FollowUp[]>(() => {
    const saved = localStorage.getItem("lz_followups");
    return saved ? JSON.parse(saved) : MOCK_FOLLOWUPS;
  });

  const [templates, setTemplates] = useState<QuickReplyTemplate[]>(() => {
    const saved = localStorage.getItem("lz_templates");
    return saved ? JSON.parse(saved) : MOCK_TEMPLATES;
  });

  const [revenueEvents, setRevenueEvents] = useState<RevenueEvent[]>(() => {
    const saved = localStorage.getItem("lz_revenue");
    return saved ? JSON.parse(saved) : MOCK_REVENUE_EVENTS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("lz_logs");
    return saved ? JSON.parse(saved) : MOCK_ACTIVITY_LOGS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem("lz_invoices");
    return saved ? JSON.parse(saved) : MOCK_INVOICES;
  });

  const [teammateConversations, setTeammateConversations] = useState<any[]>(() => {
    const saved = localStorage.getItem("lz_teammate_convs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // failed parse, ignore
      }
    }
    // Default seed conversations between Emeka and Chioma
    return [
      {
        id: "user1_user2", // Chioma (user1) & Emeka (user2)
        participants: ["user1", "user2"],
        messages: [
          {
            id: "tm1",
            senderId: "user1",
            senderName: "Chioma (Admin)",
            body: "Hey Emeka! Check out the brand assets we got from the designers. 🚀",
            timestamp: "2026-05-21T09:00:00Z",
            type: "text"
          },
          {
            id: "tm2",
            senderId: "user2",
            senderName: "Emeka",
            body: "Great! Can you post the new promotional graphic & video here inside LeadZero so the team has access?",
            timestamp: "2026-05-21T09:15:00Z",
            type: "text"
          },
          {
            id: "tm3",
            senderId: "user1",
            senderName: "Chioma (Admin)",
            body: "Absolutely! Sharing our brand equipment video and logo graphic.",
            timestamp: "2026-05-21T09:20:00Z",
            type: "video",
            mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-with-glove-cleaning-office-desk-41221-large.mp4"
          },
          {
            id: "tm4",
            senderId: "user1",
            senderName: "Chioma (Admin)",
            body: "We also have the cleaning equipment shot:",
            timestamp: "2026-05-21T09:21:00Z",
            type: "image",
            mediaUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80"
          }
        ]
      },
      {
        id: "user1_user1", // Chioma (self chat)
        participants: ["user1"],
        messages: [
          {
            id: "tm_self1",
            senderId: "user1",
            senderName: "Chioma (Admin)",
            body: "Draft pricing plans: Growth package includes up to 2 seats, target setting, tracker progress.",
            timestamp: "2026-05-21T09:30:00Z",
            type: "text"
          }
        ]
      }
    ];
  });

  // Selected chat state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(MOCK_CONVERSATIONS[0]?.id || null);

  // Connection offline toggle
  const [isOffline, setIsOffline] = useState(false);

  // Persistent synchronizations
  useEffect(() => {
    localStorage.setItem("lz_business", JSON.stringify(business));
    localStorage.setItem("lz_users", JSON.stringify(users));
    localStorage.setItem("lz_current_user_id", currentUser.id);
    localStorage.setItem("lz_conversations", JSON.stringify(conversations));
    localStorage.setItem("lz_followups", JSON.stringify(followups));
    localStorage.setItem("lz_templates", JSON.stringify(templates));
    localStorage.setItem("lz_revenue", JSON.stringify(revenueEvents));
    localStorage.setItem("lz_logs", JSON.stringify(activityLogs));
    localStorage.setItem("lz_invoices", JSON.stringify(invoices));
    localStorage.setItem("lz_teammate_convs", JSON.stringify(teammateConversations));
  }, [business, users, currentUser, conversations, followups, templates, revenueEvents, activityLogs, invoices, teammateConversations]);

  // Sync background triggers (check when follow-ups are overdue)
  useEffect(() => {
    const checkOverdueInterval = setInterval(() => {
      const now = new Date();
      setFollowups((current) => {
        let changed = false;
        const next = current.map((f) => {
          if (f.status === "pending" && new Date(f.dueDate) < now) {
            changed = true;
            return { ...f, status: "overdue" as const };
          }
          return f;
        });
        return changed ? next : current;
      });
    }, 10000); // check indices every 10s
    return () => clearInterval(checkOverdueInterval);
  }, []);

  // Simulator helper: add activity log
  const logActivity = (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: "act_" + Date.now(),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Switch workspace Identity profile
  const handleSwitchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      logActivity("Switched User Profile", `Switched to workspace profile of ${found.name} (${found.role})`);
    }
  };

  // Invite Sales Assistant
  const handleInviteUser = (name: string, phone: string, role: Role) => {
    const newUser: User = {
      id: "user_" + Date.now(),
      name,
      phone,
      role,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
      isOnline: true
    };
    setUsers((prev) => [...prev, newUser]);
    logActivity("Teammate Invited", `Invited ${name} with standard ${role} privileges.`);
  };

  // Remove Sales Assistant
  const handleRemoveUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    logActivity("Teammate Deleted", `Removed teammate ID: ${userId} immediately.`);
  };

  // Outgoing replies dispatches
  const handleSendReply = (
    chatId: string, 
    messageBody: string, 
    type: "text" | "image" | "video" | "document" | "voice" | "location" = "text",
    mediaUrl?: string
  ) => {
    setConversations((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === chatId) {
          const newMsg: Message = {
            id: "msg_user_" + Date.now(),
            sender: "user",
            senderName: currentUser.name,
            body: messageBody,
            timestamp: new Date().toISOString(),
            type,
            mediaUrl,
            status: isOffline ? "sent" : "read"
          };
          return {
            ...chat,
            status: ConversationStatus.REPLIED,
            messages: [...chat.messages, newMsg],
            lastMessage: newMsg
          };
        }
        return chat;
      });
    });

    logActivity("Sent Reply", `Sent WhatsApp reply message to conversation with ID: ${chatId}`);

    // If template matching variable usage count, update metric
    const matchedTemp = templates.find((t) => messageBody.includes(t.title) || messageBody.toLowerCase().includes(t.title.toLowerCase()));
    if (matchedTemp) {
      setTemplates((prev) => {
        return prev.map((t) => (t.id === matchedTemp.id ? { ...t, usageCount: t.usageCount + 1 } : t));
      });
    }
  };

  const handleSendTeammateMessage = (
    partnerId: string,
    body: string,
    type: "text" | "image" | "video" | "document" | "voice" | "location" = "text",
    mediaUrl?: string
  ) => {
    setTeammateConversations((prev) => {
      const pArray = partnerId === currentUser.id ? [currentUser.id] : [currentUser.id, partnerId].sort();
      const convId = pArray.join("_");

      const existingChat = prev.find((c) => c.id === convId);
      const newMsg = {
        id: "tm_msg_" + Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        body,
        timestamp: new Date().toISOString(),
        type,
        mediaUrl
      };

      if (existingChat) {
        return prev.map((c) => {
          if (c.id === convId) {
            return {
              ...c,
              messages: [...c.messages, newMsg]
            };
          }
          return c;
        });
      } else {
        return [
          ...prev,
          {
            id: convId,
            participants: pArray,
            messages: [newMsg]
          }
        ];
      }
    });

    logActivity("Team Private Chat", `You sent an internal DM (${type}) to a team member.`);
  };

  // Ingest/receive incoming customer messages triggers
  const handleSimulateIncoming = (chatId: string, text: string) => {
    setConversations((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === chatId) {
          const newMsg: Message = {
            id: "msg_client_" + Date.now(),
            sender: "customer",
            senderName: chat.contact.name,
            body: text,
            timestamp: new Date().toISOString(),
            type: "text",
            status: "read"
          };
          return {
            ...chat,
            status: ConversationStatus.UNREAD,
            messages: [...chat.messages, newMsg],
            lastMessage: newMsg
          };
        }
        return chat;
      });
    });

    logActivity("Received Reply", `Simulated WhatsApp webhook captured client reply from: ${conversations.find((c)=>c.id === chatId)?.contact.name}`);
  };

  // Assign chat to teammate
  const handleAssignChat = (chatId: string, userId: string | undefined) => {
    const assignee = users.find((u) => u.id === userId);
    setConversations((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, assignedTo: assignee };
        }
        return chat;
      });
    });

    logActivity("Assigned Conversation", `Assigned conversation ${chatId} to ${assignee ? assignee.name : "unassigned"}`);
  };

  // Update tags
  const handleUpdateTags = (chatId: string, tags: string[]) => {
    setConversations((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, tags };
        }
        return chat;
      });
    });
  };

  // Update notes
  const handleUpdateNotes = (chatId: string, notes: string[]) => {
    setConversations((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, internalNotes: notes };
        }
        return chat;
      });
    });
    logActivity("Notes Updated", `Updated handoff internal remarks for chat ID: ${chatId}`);
  };

  // Mark Won/outcome deals (FR-4.1)
  const handleUpdateOutcome = (chatId: string, outcome: OutcomeStatus, amount?: number) => {
    const chat = conversations.find((c) => c.id === chatId);
    if (!chat) return;

    setConversations((prevChats) => {
      return prevChats.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            selectedOutcome: outcome,
            revenueAmount: outcome === OutcomeStatus.WON ? (amount || 0) : undefined
          };
        }
        return c;
      });
    });

    if (outcome === OutcomeStatus.WON && amount) {
      // Record a revenue log
      const newRev: RevenueEvent = {
        id: "rev_" + Date.now(),
        conversationId: chatId,
        customerName: chat.contact.name,
        amount,
        status: OutcomeStatus.WON,
        date: new Date().toISOString(),
        repId: currentUser.id,
        repName: currentUser.name
      };
      setRevenueEvents((prev) => [newRev, ...prev]);
      logActivity("Revenue Captured", `Captured Won Deal with ${chat.contact.name} for ₦${amount.toLocaleString()}`);

      // Also update contact's total lifetime value (LTV)
      setConversations((prevChats) => {
        return prevChats.map((c) => {
          if (c.id === chatId) {
            return {
              ...c,
              contact: {
                ...c.contact,
                totalLTV: c.contact.totalLTV + amount
              }
            };
          }
          return c;
        });
      });
    } else {
      logActivity("Outcome Marked", `Marked conversation status outcome to: ${outcome} (${chat.contact.name})`);
    }
  };

  const handleUpdateContactSegment = (chatId: string, segment: CustomerSegment) => {
    setConversations((prevChats) => {
      return prevChats.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            contact: {
              ...c.contact,
              segment
            }
          };
        }
        return c;
      });
    });
    logActivity("Segment Updated", `Updated segment of ${conversations.find((c) => c.id === chatId)?.contact.name} to ${segment}`);
  };

  const handleAddNewCustomer = (name: string, phone: string, segment: CustomerSegment, initialNote: string) => {
    const contactId = "contact_" + Date.now();
    const chatId = "conv_" + Date.now();
    
    const newContact: Contact = {
      id: contactId,
      name,
      phone,
      segment,
      totalLTV: 0,
      conversationCount: 1,
      firstContactDate: new Date().toISOString(),
      lastContactDate: new Date().toISOString(),
      notes: initialNote ? [initialNote] : []
    };

    const initialMessage: Message = {
      id: "msg_init_" + Date.now(),
      sender: "customer",
      senderName: name,
      body: "Initial contact added via CRM Lead Manager",
      timestamp: new Date().toISOString(),
      type: "text",
      status: "read"
    };

    const newConversation: Conversation = {
      id: chatId,
      contact: newContact,
      status: ConversationStatus.UNREAD,
      lastMessage: initialMessage,
      messages: [initialMessage],
      assignedTo: currentUser,
      tags: ["New Lead"],
      internalNotes: initialNote ? [initialNote] : []
    };

    setConversations((prev) => [newConversation, ...prev]);
    logActivity("Customer Created", `Created manual CRM client entry for ${name} (${phone})`);
  };

  // Schedule a Follow-up reminder
  const handleAddFollowUp = (data: Omit<FollowUp, "id" | "status" | "snoozedCount">) => {
    const newFollowUp: FollowUp = {
      ...data,
      id: "f_" + Date.now(),
      status: "pending",
      snoozedCount: 0
    };
    setFollowups((prev) => [newFollowUp, ...prev]);
    logActivity("Follow-up Booked", `Booked follow-up schedule with ${data.customerName} due WAT`);
  };

  // Snooze follow-up logic
  const handleSnoozeFollowUp = (id: string, mins: number) => {
    setFollowups((prev) => {
      return prev.map((f) => {
        if (f.id === id) {
          const originalDate = new Date(f.dueDate);
          originalDate.setMinutes(originalDate.getMinutes() + mins);
          return {
            ...f,
            dueDate: originalDate.toISOString(),
            status: "pending" as const,
            snoozedCount: f.snoozedCount + 1
          };
        }
        return f;
      });
    });
    logActivity("Snoozed Alert", `Snoozed reminder callback ID: ${id} by ${mins} minutes.`);
  };

  // Complete follow-up logic
  const handleCompleteFollowUp = (id: string, outcome: string, notes?: string) => {
    const fNode = followups.find((f) => f.id === id);
    if (!fNode) return;

    setFollowups((prev) => {
      return prev.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            status: "completed" as const,
            outcomeCompleted: outcome as any,
            outcomeNotes: notes
          };
        }
        return f;
      });
    });
    logActivity("Follow-up Resolved", `Marked follow-up callback complete with ${fNode.customerName} on channel: ${outcome}`);
  };

  // Templates CRUD operations
  const handleAddTemplate = (temp: Omit<QuickReplyTemplate, "id" | "usageCount">) => {
    const newTemp: QuickReplyTemplate = {
      ...temp,
      id: "temp_" + Date.now(),
      usageCount: 0
    };
    setTemplates((prev) => [...prev, newTemp]);
    logActivity("Template Created", `Published message draft template titled "${temp.title}"`);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    logActivity("Template Removed", `Deleted quick draft template ID: ${id}`);
  };

  // Subscription Billings checks
  const handleUpgradeTier = (tier: SubscriptionTier) => {
    const isPro = tier === SubscriptionTier.PRO;
    const isGrowth = tier === SubscriptionTier.GROWTH;
    const rate = isPro ? 15000 : isGrowth ? 5000 : 0;

    // Register invoice receipts
    const newInv: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: `INV-2026-${Math.floor(Math.random() * 90) + 10}`,
      date: new Date().toISOString().slice(0, 10),
      amount: rate,
      tier,
      paymentMethod: "Paystack (Visa ending in 4242)",
      status: "Paid"
    };

    setBusiness((prev) => ({ ...prev, subscriptionTier: tier }));
    setInvoices((prev) => [newInv, ...prev]);

    logActivity("Subscription Renewed", `Upgraded billing SaaS status successfully to level: ${tier}`);
  };

  // Finished onboarding scan sequences
  const handleCompleteOnboarding = (bizName: string, phoneNo: string, email?: string) => {
    setBusiness((prev) => ({
      ...prev,
      name: bizName,
      phone: phoneNo
    }));

    if (email === "zeerocodes@gmail.com") {
      const adminUser: User = {
        id: "super_admin",
        name: "Zeero Codes (Super Admin)",
        phone: phoneNo,
        role: Role.ADMIN,
        email: "zeerocodes@gmail.com",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
        isOnline: true
      };

      setUsers((prev) => {
        if (!prev.some((u) => u.email === "zeerocodes@gmail.com")) {
          return [adminUser, ...prev];
        }
        return prev;
      });
      setCurrentUser(adminUser);
      localStorage.setItem("lz_current_user_id", "super_admin");
      setActiveTab("superadmin");
    }

    localStorage.setItem("lz_onboarding_done", "true");
    setOnboarding(false);
    logActivity("Onboard Completed", `Welcome to LeadZero! Configured business name "${bizName}" with active number workspace.`);
  };

  const handleAdminEmailLogin = (email: string) => {
    if (email.trim().toLowerCase() === "zeerocodes@gmail.com") {
      const adminUser: User = {
        id: "super_admin",
        name: "Zeero Codes (Super Admin)",
        phone: "+234 809 123 9999",
        role: Role.ADMIN,
        email: "zeerocodes@gmail.com",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
        isOnline: true
      };

      setUsers((prev) => {
        if (!prev.some((u) => u.email === "zeerocodes@gmail.com")) {
          return [adminUser, ...prev];
        }
        return prev;
      });
      setCurrentUser(adminUser);
      localStorage.setItem("lz_current_user_id", "super_admin");
      setActiveTab("superadmin");
      logActivity("Super Admin Login", "Authenticated super admin account (zeerocodes@gmail.com) successfully.");
    } else {
      alert("Invalid admin email address.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lz_current_user_id");
    localStorage.removeItem("lz_onboarding_done");
    
    // Set user to first user or default representative
    if (users.length > 0) {
      setCurrentUser(users[0]);
    }
    setOnboarding(true);
    logActivity("Session Terminated", "Logged out from current workspace session safely.");
  };

  // For restarting and showing the walk step step parameters
  const handleReplayTour = () => {
    localStorage.removeItem("lz_onboarding_done");
    setOnboarding(true);
  };

  // Helper counters
  const overdueCount = followups.filter((f) => f.status === "overdue").length;
  const unassignedCount = conversations.filter((c) => !c.assignedTo).length;

  if (onboarding) {
    return (
      <LandingPage
        onCompleteOnboarding={handleCompleteOnboarding}
        onBypassOnboarding={() => {
          localStorage.setItem("lz_onboarding_done", "true");
          setOnboarding(false);
          logActivity("Sandbox Bypass", "Bypassed standard SME configuration to enter live demo container directly.");
        }}
        onLoginAsAdmin={() => {
          handleAdminEmailLogin("zeerocodes@gmail.com");
          setOnboarding(false);
          localStorage.setItem("lz_onboarding_done", "true");
        }}
        currentBusinessName={business.name}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar layouts */}
      <Sidebar
        currentTab={activeTab}
        setCurrentTab={setActiveTab}
        currentUser={currentUser}
        onUserSwitch={handleSwitchUser}
        onAdminEmailLogin={handleAdminEmailLogin}
        allUsers={users}
        overdueCount={overdueCount}
        unassignedCount={unassignedCount}
        onStartTour={handleReplayTour}
        isOffline={isOffline}
        onGoToLanding={() => setOnboarding(true)}
      />

      {/* Main workspaces widgets dispatcher panels */}
      <main className="flex-1 w-full relative h-full overflow-hidden flex flex-col min-h-0">
        {activeTab === "inbox" && (
          <InboxSection
            conversations={conversations}
            selectedConvId={selectedConvId}
            onSelectConv={setSelectedConvId}
            currentUser={currentUser}
            allUsers={users}
            templates={templates}
            onAssignChat={handleAssignChat}
            onUpdateTags={handleUpdateTags}
            onUpdateNotes={handleUpdateNotes}
            onUpdateOutcome={handleUpdateOutcome}
            onSendReply={handleSendReply}
            onSimulateIncoming={handleSimulateIncoming}
            businessName={business.name}
            teammateConversations={teammateConversations}
            onSendTeammateMessage={handleSendTeammateMessage}
            onGoToLanding={() => setOnboarding(true)}
          />
        )}

        {activeTab === "followups" && (
          <FollowUpSection
            followups={followups}
            conversations={conversations}
            currentUser={currentUser}
            allUsers={users}
            onAddFollowUp={handleAddFollowUp}
            onSnoozeFollowUp={handleSnoozeFollowUp}
            onCompleteFollowUp={handleCompleteFollowUp}
            businessName={business.name}
          />
        )}

        {activeTab === "customers" && (
          <CustomersSection
            conversations={conversations}
            allUsers={users}
            onUpdateNotes={handleUpdateNotes}
            onUpdateOutcome={handleUpdateOutcome}
            onAssignChat={handleAssignChat}
            onUpdateContactSegment={handleUpdateContactSegment}
            onAddNewCustomer={handleAddNewCustomer}
          />
        )}

        {activeTab === "revenue" && (
          <RevenueSection
            revenueEvents={revenueEvents}
            reps={users}
            monthlyTarget={business.monthlyTarget || 500000}
            onUpdateTarget={(tgt) => setBusiness(b => ({ ...b, monthlyTarget: tgt }))}
          />
        )}

        {activeTab === "templates" && (
          <TemplateSection
            templates={templates}
            activeTier={business.subscriptionTier}
            onAddTemplate={handleAddTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}

        {activeTab === "team" && (
          <TeamSection
            currentUser={currentUser}
            usersList={users}
            activityLogs={activityLogs}
            onInviteUser={handleInviteUser}
            onRemoveUser={handleRemoveUser}
          />
        )}

        {activeTab === "settings" && (
          <BillingSection
            currentTier={business.subscriptionTier}
            invoices={invoices}
            onUpgradeTier={handleUpgradeTier}
            businessName={business.name}
            theme={theme}
            onThemeChange={setTheme}
            onLogout={handleLogout}
          />
        )}

        {activeTab === "superadmin" && (currentUser.email === "zeerocodes@gmail.com" || currentUser.role === Role.ADMIN) && (
          <SuperAdminSection
            business={business}
            conversations={conversations}
            users={users}
            revenueEvents={revenueEvents}
            activityLogs={activityLogs}
            invoices={invoices}
            currentUser={currentUser}
            onUpdateBusiness={setBusiness}
            onUpdateUsers={setUsers}
            onUpdateConversations={setConversations}
            onUpdateRevenueEvents={setRevenueEvents}
            onUpdateActivityLogs={setActivityLogs}
            onUpdateInvoices={setInvoices}
            onLogActivity={logActivity}
          />
        )}
      </main>

    </div>
  );
}
