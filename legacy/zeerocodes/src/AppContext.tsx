import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Lead, 
  FollowUp, 
  LeadStatus, 
  LeadSource, 
  LeadIndustry, 
  FollowUpType, 
  FollowUpStatus, 
  FollowUpInterval,
  AppNotification,
  Ticket,
  Transaction,
  TicketStatus,
  TicketType,
  TicketPriority,
  ClientRegistration,
  TeamMember,
  Organization,
  EmailSettings,
  ClientEmailAccount
} from './types';
import { MOCK_LEADS, MOCK_FOLLOW_UPS } from './mockData';
import { auth, db, signInWithGoogle, logout, signInWithGoogleRedirect, getGoogleRedirectResult } from './lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  Timestamp, 
  setDoc, 
  getDoc,
  getDocs,
  writeBatch,
  getDocFromServer,
  increment,
  runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AppContextType {
  user: User | null;
  authLoading: boolean;
  login: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  creditBalance: number;
  registration: ClientRegistration | null;
  settingsLoaded: boolean;
  isAuthProcessing: boolean;
  organizationId: string | null;
  completeRegistration: (data: Omit<ClientRegistration, 'completed'>) => Promise<void>;
  buyCredits: (credits: number) => Promise<void>;
  leads: Lead[];
  allLeads: Lead[];
  followUps: FollowUp[];
  qualificationRules: string;
  isProcessing: boolean;
  processedCount: number;
  totalToProcess: number;
  isQuotaReached: boolean;
  setIsQuotaReached: (reached: boolean) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  isSimulating: boolean;
  setSimulationActive: (active: boolean) => void;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setQualificationRules: (rules: string) => void;
  reprocessLeads: (rules?: string) => Promise<void>;
  reprocessSingleLead: (leadId: string) => Promise<void>;
  fetchWithAuth: (url: string, options?: any, timeout?: number) => Promise<Response>;
  seedHighIntentLeads: () => Promise<void>;
  clearLeads: () => void;
  deduplicateLeads: () => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'qualificationScore' | 'aiSummary' | 'organizationId'>) => void;
  bulkAddLeads: (leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'qualificationScore' | 'aiSummary' | 'organizationId'>[]) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  bulkUpdateLeadStatus: (ids: string[], status: LeadStatus) => void;
  deleteLead: (id: string) => void;
  bulkDeleteLeads: (ids: string[]) => void;
  updateFollowUpStatus: (id: string, status: FollowUpStatus) => void;
  addLeadComment: (leadId: string, text: string) => Promise<void>;
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  dismissNotification: (id: string) => void;
  scheduleFollowUp: (followUp: Omit<FollowUp, 'id'>) => void;
  bulkScheduleFollowUps: (leadIds: string[], type: FollowUpType, notes: string) => void;
  followUpIntervals: FollowUpInterval[];
  setFollowUpIntervals: (intervals: FollowUpInterval[]) => void;
  tickets: Ticket[];
  allTickets: Ticket[];
  transactions: Transaction[];
  allTransactions: Transaction[];
  allOrganizations: Organization[];
  giftCredits: (orgId: string, credits: number) => Promise<void>;
  addTicket: (ticket: Omit<Ticket, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<void>;
  members: TeamMember[];
  addTeamMember: (email: string) => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;
  isUserAuthorized: boolean;
  emailSettings: EmailSettings | null;
  updateEmailSettings: (updates: Partial<EmailSettings>) => Promise<void>;
  addClientEmailAccount: (account: Omit<ClientEmailAccount, 'id'>) => Promise<void>;
  updateClientEmailAccount: (accountId: string, updates: Partial<ClientEmailAccount>) => Promise<void>;
  deleteClientEmailAccount: (accountId: string) => Promise<void>;
}

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  enabled: false,
  minScore: 70,
  templateSubject: "New Qualified Lead Alert: {{name}} (Score: {{score}})",
  templateBody: `Hello,

A new qualified lead has been successfully registered by our AI Sales Engine!

Lead Details:
- Name: {{name}}
- Industry: {{industry}}
- Declared Budget: {{budget}}
- Qualification Score: {{score}} %
- AI Summary Verdict: {{aiSummary}}

Contact Information:
- Email: {{email}}
- Phone: {{phone}}
- Lead Inquiry Details: {{notes}}

Please reach out to follow up immediately.

Regards,
Zeerocodes CRM Engine`,
  provider: 'Simulated Sandbox',
  clients: []
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [registration, setRegistration] = useState<ClientRegistration | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [qualificationRules, setQualificationRules] = useState<string>("1. High budget prospects (₦1M+) are prioritized.\n2. Prospects with clear business intent (mentions growth, expansion, or specific tools).\n3. Valid contact info (whatsapp preferred).");
  const [followUpIntervals, setFollowUpIntervals] = useState<FollowUpInterval[]>([
    { minScore: 85, maxScore: 100, days: 1, type: 'Call' },
    { minScore: 70, maxScore: 84, days: 3, type: 'WhatsApp' },
    { minScore: 40, maxScore: 69, days: 7, type: 'Email' },
  ]);

  // Auth State & Initial Connection Test
  useEffect(() => {
    // Handle Auth Redirect Result
    getGoogleRedirectResult().catch((error) => {
      if (error.code !== 'auth/no-auth-event') {
        console.error("Redirect auth error:", error);
        addNotification('Login Failed', 'Redirect authentication failed.', 'error');
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u?.email === 'zeerocodes@gmail.com');
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (isAuthProcessing) return;
    setIsAuthProcessing(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed", error);
      if (error?.code === 'auth/popup-blocked') {
        addNotification('Popup Blocked', 'Attempting redirect login...', 'warning');
        try {
          await signInWithGoogleRedirect();
        } catch (redirectError: any) {
          console.error("Redirect failed", redirectError);
          addNotification('Login Failed', 'Please allow popups or open in a new tab.', 'error');
        }
      } else if (error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
        addNotification('Cancelled', 'Login attempt was cancelled.', 'info');
      } else {
        addNotification('Login Failed', error?.message || 'Login failed', 'error');
      }
    } finally {
      // Note: If redirect started, this might not matter as page will navigate
      setIsAuthProcessing(false);
    }
  };

  const signOutUser = async () => {
    if (isAuthProcessing) return;
    setIsAuthProcessing(true);
    try {
      await logout();
    } catch (error: any) {
      console.error("Logout failed", error);
      addNotification('Logout Failed', 'Logout failed', 'error');
    } finally {
      setIsAuthProcessing(false);
    }
  };

  // Helper for safe Date conversion from Firestore
  const safeDate = (ts: any) => {
    if (!ts) return new Date().toISOString();
    try {
      if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
      if (typeof ts === 'string') return new Date(ts).toISOString();
      if (ts instanceof Date) return ts.toISOString();
      if (ts.seconds) return new Date(ts.seconds * 1000).toISOString();
    } catch (e) {
      console.warn("Date conversion failed for:", ts, e);
    }
    return new Date().toISOString();
  };

  // Authorization and Organization Discovery
  useEffect(() => {
    if (!user) {
      setMembers([]);
      setIsUserAuthorized(false);
      setOrganizationId(null);
      return;
    }

    const emailLower = user.email?.toLowerCase();
    const memberDocRef = doc(db, 'members', emailLower || '');

    const unsubscribeMember = onSnapshot(memberDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const memberData = snapshot.data();
        const orgId = memberData.organizationId;
        setOrganizationId(orgId);
        setIsUserAuthorized(true);
        setIsAdmin(memberData.role === 'Admin' || user.email === 'zeerocodes@gmail.com');
        console.log(`[AUTH] User ${user.email} belongs to organization: ${orgId}`);
      } else {
        // Special case for global admin
        if (user.email === 'zeerocodes@gmail.com') {
          setOrganizationId('organization_v1'); // Default legacy org for main admin
          setIsUserAuthorized(true);
          setIsAdmin(true);
          // If we are a global admin, we might need settingsLoaded true but organization listener 
          // will set it once it starts.
        } else {
          setOrganizationId(null);
          setIsUserAuthorized(false);
          setIsAdmin(false);
          setSettingsLoaded(true); // Allow new users to see Registration/Landing page
        }
      }
    }, (error) => {
      setSettingsLoaded(true);
      handleFirestoreError(error, OperationType.GET, `members/${emailLower}`);
    });

    return () => unsubscribeMember();
  }, [user]);

  // Members List Listener (Scoped to Organization)
  useEffect(() => {
    if (!user || !organizationId) return;

    const membersQuery = query(collection(db, 'members'), where('organizationId', '==', organizationId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as TeamMember[];
      setMembers(membersData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'members'));

    return () => unsubscribeMembers();
  }, [user, organizationId]);

  // Firestore Listeners (Scoped to Organization)
  useEffect(() => {
    if (!user || !isUserAuthorized || !organizationId) {
      setLeads([]);
      setFollowUps([]);
      setTickets([]);
      setTransactions([]);
      return;
    }

    const leadsQuery = query(collection(db, 'leads'), where('organizationId', '==', organizationId));
    const unsubscribeLeads = onSnapshot(leadsQuery, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: safeDate(doc.data().createdAt),
        updatedAt: safeDate(doc.data().updatedAt),
      })) as Lead[];
      setLeads(leadsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leads'));

    const followUpsQuery = query(collection(db, 'followUps'), where('organizationId', '==', organizationId));
    const unsubscribeFollowUps = onSnapshot(followUpsQuery, (snapshot) => {
      const followUpsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        scheduledAt: safeDate(doc.data().scheduledAt),
      })) as FollowUp[];
      setFollowUps(followUpsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'followUps'));

    const ticketsQuery = query(collection(db, 'tickets'), where('organizationId', '==', organizationId));
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: safeDate(doc.data().createdAt),
        updatedAt: safeDate(doc.data().updatedAt),
      })) as Ticket[];
      setTickets(ticketsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));

    const transactionsQuery = query(collection(db, 'transactions'), where('organizationId', '==', organizationId));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: safeDate(doc.data().createdAt),
      })) as Transaction[];
      
      // Sort by creation date descending
      const sorted = transactionsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTransactions(sorted);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));

    // Organization Settings Listener
    const settingsDoc = doc(db, 'organizations', organizationId);
    const unsubscribeSettings = onSnapshot(settingsDoc, (snapshot) => {
      const processOrgData = (data: any, isLegacy: boolean = false) => {
        console.log(`[SETTINGS] ${isLegacy ? 'Legacy' : 'Main'} Snapshot received:`, data);
        if (data.qualificationRules) setQualificationRules(data.qualificationRules);
        if (data.followUpIntervals) setFollowUpIntervals(data.followUpIntervals);
        if (data.emailSettings) {
          setEmailSettings(data.emailSettings);
        } else {
          setEmailSettings(DEFAULT_EMAIL_SETTINGS);
        }
        if (data.creditBalance !== undefined) {
          // If we have data in both, we might need to handle it. 
          // For now, we trust the one we found.
          setCreditBalance(data.creditBalance);
        }
        if (data.registration) setRegistration(data.registration);
        setSettingsLoaded(true);
      };

      if (snapshot.exists()) {
        const data = snapshot.data();
        processOrgData(data);
        
        // If it's organization_v1 and missing crucial fields like registration, 
        // we check if it's because we just migrated partially (e.g. via buyCredits)
        if (organizationId === 'organization_v1' && !data.registration) {
          const legacyRef = doc(db, 'settings', 'organization_v1');
          getDoc(legacyRef).then(legacySnap => {
            if (legacySnap.exists()) {
              const legacyData = legacySnap.data();
              console.log("[SETTINGS] Found legacy registration to merge into organization_v1");
              if (legacyData.registration) setRegistration(legacyData.registration);
              // Also merge rules/intervals if missing
              if (!data.qualificationRules && legacyData.qualificationRules) setQualificationRules(legacyData.qualificationRules);
              if (!data.followUpIntervals && legacyData.followUpIntervals) setFollowUpIntervals(legacyData.followUpIntervals);
              // NOTE: We don't merge creditBalance here because if organization_v1 exists, 
              // it's the new source of truth for balance.
            }
          });
        }
      } else {
        // Fallback for settings/organization_v1 legacy path
        if (organizationId === 'organization_v1') {
          const legacyRef = doc(db, 'settings', 'organization_v1');
          getDoc(legacyRef).then(legacySnap => {
            if (legacySnap.exists()) {
              processOrgData(legacySnap.data(), true);
            } else {
              console.log(`[SETTINGS] Organization doc not found. Setting defaults.`);
              setCreditBalance(0);
              setSettingsLoaded(true);
            }
          });
        } else {
          console.log(`[SETTINGS] Non-legacy organization doc not found: ${organizationId}`);
          setCreditBalance(0);
          setSettingsLoaded(true);
        }
      }
    }, (error) => {
      setSettingsLoaded(true);
      handleFirestoreError(error, OperationType.GET, `organizations/${organizationId}`);
    });

    let unsubscribeAllLeads = () => {};
    let unsubscribeAllTickets = () => {};
    let unsubscribeAllTransactions = () => {};
    let unsubscribeAllOrgs = () => {};

    if (isAdmin) {
      const allLeadsQuery = query(collection(db, 'leads'));
      unsubscribeAllLeads = onSnapshot(allLeadsQuery, (snapshot) => {
        const leadsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: safeDate(doc.data().createdAt),
          updatedAt: safeDate(doc.data().updatedAt),
        })) as Lead[];
        setAllLeads(leadsData);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'leads/all'));

      const allTicketsQuery = query(collection(db, 'tickets'));
      unsubscribeAllTickets = onSnapshot(allTicketsQuery, (snapshot) => {
        const ticketsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: safeDate(doc.data().createdAt),
          updatedAt: safeDate(doc.data().updatedAt),
        })) as Ticket[];
        setAllTickets(ticketsData);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets/all'));

      const allTransactionsQuery = query(collection(db, 'transactions'));
      unsubscribeAllTransactions = onSnapshot(allTransactionsQuery, (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: safeDate(doc.data().createdAt),
        })) as Transaction[];
        setAllTransactions(transactionsData);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions/all'));

      const allOrgsQuery = query(collection(db, 'organizations'));
      unsubscribeAllOrgs = onSnapshot(allOrgsQuery, (snapshot) => {
        const orgsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Organization[];
        setAllOrganizations(orgsData);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'organizations/all'));
    }

    return () => {
      unsubscribeLeads();
      unsubscribeFollowUps();
      unsubscribeTickets();
      unsubscribeTransactions();
      unsubscribeSettings();
      unsubscribeAllLeads();
      unsubscribeAllTickets();
      unsubscribeAllTransactions();
      unsubscribeAllOrgs();
    };
  }, [user, isAdmin, isUserAuthorized, organizationId]);

  const [isQuotaReached, setIsQuotaReached] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => {
      // Avoid duplicate notifications for the same event if they happen rapidly
      const isDuplicate = prev.some(n => n.title === title && n.message === message);
      if (isDuplicate) return prev;
      return [{ id, title, message, type, createdAt: new Date().toISOString() }, ...prev];
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Check for overdue follow-ups
  useEffect(() => {
    const checkOverdue = () => {
      const now = new Date();
      const overdueCount = followUps.filter(f => f.status === 'Upcoming' && new Date(f.scheduledAt) < now).length;
      
      if (overdueCount > 0) {
        // Only notify if count changed or every 30 mins if still overdue
        addNotification('Overdue Tasks!', `You have ${overdueCount} follow-up(s) that need immediate attention.`, 'warning');
      }
    };

    const interval = setInterval(checkOverdue, 60000); // Check every minute
    checkOverdue(); // Initial check
    return () => clearInterval(interval);
  }, [followUps]);

  const localHeuristicQualify = (lead: any, rules: string) => {
    let score = 45; // slightly higher base for neutral leads
    const notes = (lead.notes || '').toLowerCase();
    const industry = (lead.industry || '').toLowerCase();
    const company = (lead.company || '').toLowerCase();
    const name = (lead.name || '').toLowerCase();
    const budgetRange = (lead.budgetRange || '').toLowerCase();
    const rulesLower = rules.toLowerCase();
    
    let reasoningParts: string[] = [];

    // 1. Strategic Fit (Industry & Keywords)
    const highValueIndustries = ['real estate', 'tech', 'finance', 'logistics', 'education', 'healthcare'];
    const ruleKeywords = rulesLower.split(/[\s,.\n]+/).filter(k => k.length > 3);
    
    let ruleMatches = 0;
    ruleKeywords.forEach(kw => {
      if (notes.includes(kw) || industry.includes(kw) || company.includes(kw)) {
        ruleMatches++;
      }
    });

    if (ruleMatches > 0) {
      const bonus = Math.min(ruleMatches * 8, 25);
      score += bonus;
      reasoningParts.push(`Matches ${ruleMatches} custom rule keywords (+${bonus}).`);
    }

    if (highValueIndustries.some(i => industry.includes(i))) {
      score += 5;
      reasoningParts.push("High-value target industry (+5).");
    }

    // 2. Intent Detection
    const intentKeywords = [
      { kw: 'urgent', pts: 12, msg: 'Urgent intent' },
      { kw: 'immediately', pts: 12, msg: 'Immediate readiness' },
      { kw: 'asap', pts: 10, msg: 'High speed' },
      { kw: 'buy', pts: 8, msg: 'Purchase intent' },
      { kw: 'interest', pts: 5, msg: 'General interest' },
      { kw: 'quote', pts: 7, msg: 'Quote requested' },
      { kw: 'expansion', pts: 10, msg: 'Growth focus' },
      { kw: 'scale', pts: 8, msg: 'Scaling focus' }
    ];

    intentKeywords.forEach(ik => {
      if (notes.includes(ik.kw)) {
        score += ik.pts;
        reasoningParts.push(`${ik.msg} detected (+${ik.pts}).`);
      }
    });

    // 3. Financial/Budget Signals
    const budgetSignals = [
      { kw: 'million', pts: 15, msg: 'High budget (Millions)' },
      { kw: 'thous', pts: 5, msg: 'Budget mentioned' },
      { kw: '₦', pts: 8, msg: 'Local currency signals' },
      { kw: 'milli', pts: 10, msg: 'Scale signals' },
      { kw: 'budget', pts: 5, msg: 'Budget awareness' }
    ];

    budgetSignals.forEach(bs => {
      if (notes.includes(bs.kw)) {
        score += bs.pts;
        reasoningParts.push(`${bs.msg} (+${bs.pts}).`);
      }
    });

    if (budgetRange.includes('₦1m') || budgetRange.includes('₦5m') || budgetRange.includes('₦10m')) {
      score += 10;
      reasoningParts.push("Tier 1 budget selection (+10).");
    }

    // 4. Contactability & Data Quality
    if (!lead.email || !lead.phone) {
      score -= 30;
      reasoningParts.push("Missing primary contact info (-30).");
    } else {
      score += 5;
    }

    if (notes.length < 20) {
      score -= 10;
      reasoningParts.push("Insufficient inquiry depth (-10).");
    }

    // Specific Nigerian context bonuses
    const locations = ['lekki', 'vi', 'victoria island', 'abuja', 'portharcourt', 'ikoyi', 'mainland'];
    if (locations.some(l => notes.includes(l) || company.includes(l))) {
      score += 5;
      reasoningParts.push("Tier 1 location detected (+5).");
    }

    const finalScore = Math.min(Math.max(score, 0), 100);
    const reasoning = reasoningParts.join(' ') || "Neutral lead signals.";
    
    let summary = `Heuristic Check: ${finalScore}% match.`;
    if (finalScore > 80) summary = "High Quality Prospect (Fallback).";
    else if (finalScore < 40) summary = "Low Quality / Missing Info (Fallback).";

    return {
      score: finalScore,
      summary: summary,
      reasoning: reasoning
    };
  };

  const autoScheduleFollowUp = (leadId: string, leadName: string, score: number, summary?: string) => {
    const intervalRule = followUpIntervals.find(rule => score >= rule.minScore && score <= rule.maxScore);
    if (!intervalRule) return;

    setFollowUps(prev => {
      // Avoid duplicates
      const exists = prev.some(f => f.leadId === leadId && f.notes?.includes('[AUTO]'));
      if (exists) return prev;

      const now = new Date();
      const scheduledDate = new Date(now.getTime() + intervalRule.days * 24 * 60 * 60 * 1000);
      
      const note = `[AUTO] Follow-up based on rule (Score: ${score}). Strategy: ${intervalRule.type} in ${intervalRule.days} day(s). ${summary || ''}`;

      const followUp: FollowUp = {
        id: Math.random().toString(36).substr(2, 9),
        organizationId: organizationId!,
        leadId,
        type: intervalRule.type,
        scheduledAt: scheduledDate.toISOString(),
        notes: note,
        status: 'Upcoming',
      };

      console.log(`[AI AGENT] Auto-task created: ${intervalRule.type} for ${leadName} in ${intervalRule.days} days`);
      return [followUp, ...prev];
    });
  };

  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 30000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(id);
    }
  };

  const fetchWithAuth = async (url: string, options: any = {}, timeout = 30000) => {
    const headers = { ...(options.headers || {}) };
    
    // Add default JSON Content-Type if not overridden and body is provided
    if (options.body && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Could not retrieve auth token", e);
    }

    return fetchWithTimeout(url, { ...options, headers }, timeout);
  };

  const reprocessLeads = async (customRules?: string) => {
    if (leads.length === 0) return;
    
    setIsProcessing(true);
    setProcessedCount(0);
    setTotalToProcess(leads.length);
    
    try {
      const activeRules = customRules || qualificationRules;
      let quotaReached = isQuotaReached;
      
      // Process all existing leads in batches
      const BATCH_SIZE = 40; 
      for (let i = 0; i < leads.length; i += BATCH_SIZE) {
        const batch = leads.slice(i, i + BATCH_SIZE);
        
        try {
          if (quotaReached) {
            setIsQuotaReached(true);
            // Fallback immediately if we already know quota is hit
            setLeads(prev => {
              const leadMap = new Map<string, Lead>(prev.map(l => [l.id, l]));
              batch.forEach(b => {
                const res = localHeuristicQualify(b, activeRules);
                const lead = leadMap.get(b.id);
                if (lead) {
                  leadMap.set(b.id, {
                    ...lead,
                    qualificationScore: res.score,
                    aiSummary: res.summary,
                    qualificationReasoning: res.reasoning,
                    updatedAt: new Date().toISOString()
                  });
                  autoScheduleFollowUp(b.id, lead.name, res.score, res.summary);
                }
              });
              return Array.from(leadMap.values());
            });
            setProcessedCount(prev => Math.min(prev + batch.length, leads.length));
            continue;
          }

          if (leads.length > BATCH_SIZE && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Slightly faster but still safe
          }

          const response = await fetchWithAuth('/api/ai/qualify-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              leads: batch,
              rules: activeRules,
              companyName: registration?.companyName || 'Zeerocodes'
            })
          }, 45000); 
          
          if (response.status === 429) {
            quotaReached = true;
            setIsQuotaReached(true);
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "GEMINI_QUOTA_REACHED");
          }

          const data = await response.json();
          
          if (data.results && Array.isArray(data.results)) {
            setLeads(prev => {
              const leadMap = new Map<string, Lead>(prev.map(l => [l.id, l]));
              data.results.forEach((res: any) => {
                if (leadMap.has(res.id)) {
                  const lead = leadMap.get(res.id);
                  if (lead) {
                    const numericScore = typeof res.score === 'number' ? res.score : parseInt(String(res.score || 0));
                    const scoreValue = isNaN(numericScore) ? 0 : numericScore;
                    leadMap.set(res.id, {
                      ...lead,
                      qualificationScore: scoreValue,
                      aiSummary: res.summary || lead.aiSummary,
                      qualificationReasoning: res.reasoning || lead.qualificationReasoning,
                      budgetRange: res.budget || lead.budgetRange,
                      updatedAt: new Date().toISOString()
                    });
                    autoScheduleFollowUp(res.id, lead.name, scoreValue, res.summary);
                  }
                }
              });
              return Array.from(leadMap.values());
            });
          }
          setProcessedCount(prev => Math.min(prev + batch.length, leads.length));
        } catch (err: any) {
          console.warn(`Batch re-qualification issues:`, err.message);
          const msg = String(err.message || "").toUpperCase();
          const isQuotaErr = msg.includes("QUOTA") || msg.includes("LIMIT") || msg.includes("429") || msg.includes("EXHAUSTED") || quotaReached;
          
          if (isQuotaErr) {
            quotaReached = true;
            setIsQuotaReached(true);
            // Apply fallback to this batch
            setLeads(prev => {
              const leadMap = new Map<string, Lead>(prev.map(l => [l.id, l]));
              batch.forEach(b => {
                const res = localHeuristicQualify(b, activeRules);
                const lead = leadMap.get(b.id);
                if (lead) {
                  leadMap.set(b.id, {
                    ...lead,
                    qualificationScore: res.score,
                    aiSummary: res.summary,
                    qualificationReasoning: res.reasoning,
                    updatedAt: new Date().toISOString()
                  });
                  autoScheduleFollowUp(b.id, lead.name, res.score, res.summary);
                }
              });
              return Array.from(leadMap.values());
            });
            setProcessedCount(prev => Math.min(prev + batch.length, leads.length));
          } else {
            // Non-quota error, still continue with other batches or just rethrow?
            // Let's continue to avoid getting stuck
            setProcessedCount(prev => Math.min(prev + batch.length, leads.length));
          }
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const reprocessSingleLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalToProcess(1);

    try {
      if (isQuotaReached) throw new Error("QUOTA REACHED");

      const response = await fetchWithAuth('/api/ai/qualify-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          industry: lead.industry,
          notes: lead.notes,
          source: lead.source,
          budgetRange: lead.budgetRange,
          rules: qualificationRules,
          companyName: registration?.companyName || 'Zeerocodes'
        })
      });
      
      if (response.status === 429) {
        setIsQuotaReached(true);
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || "GEMINI_QUOTA_REACHED");
      }

      const data = await response.json();

      if (data && (data.score !== undefined || data.summary)) {
        const numericScore = typeof data.score === 'number' ? data.score : parseInt(String(data.score || 0));
        const scoreValue = isNaN(numericScore) ? 0 : numericScore;
        
        if (scoreValue >= 70) {
          addNotification('High Intent Lead!', `${lead.name} has been qualified with a score of ${scoreValue}%`, 'success');
        }

        setLeads(prev => prev.map(l => l.id === leadId ? { 
          ...l, 
          qualificationScore: scoreValue, 
          aiSummary: data.summary,
          qualificationReasoning: data.reasoning,
          budgetRange: data.budget || l.budgetRange,
          updatedAt: new Date().toISOString() 
        } : l));
        autoScheduleFollowUp(leadId, lead.name, scoreValue, data.summary);
      }
    } catch (err: any) {
      console.warn("Manual qualification fallback activated:", err.message);
      const msg = String(err.message || "").toUpperCase();
      if (msg.includes("QUOTA") || msg.includes("LIMIT") || msg.includes("429") || msg.includes("EXHAUSTED") || isQuotaReached) {
        setIsQuotaReached(true);
        const res = localHeuristicQualify(lead, qualificationRules);
        setLeads(prev => prev.map(l => l.id === leadId ? { 
          ...l, 
          qualificationScore: res.score, 
          aiSummary: res.summary,
          qualificationReasoning: res.reasoning,
          updatedAt: new Date().toISOString()
        } : l));
        autoScheduleFollowUp(leadId, lead.name, res.score, res.summary);
      }
    } finally {
      setProcessedCount(1);
      setIsProcessing(false);
    }
  };

  const normalizePhone = (p: string | undefined): string => {
    if (!p) return '';
    const digits = p.replace(/\D/g, '');
    // For Nigerian numbers, if it starts with 234, keep it. If it starts with 0, replace with 234.
    // Or simpler for dedupe: just take the last 10 digits.
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  const addLead = async (newLead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'qualificationScore' | 'aiSummary' | 'organizationId'>) => {
    if (!user || !organizationId) return;
    
    // Check for duplicates
    const email = newLead.email?.toLowerCase().trim();
    const phone = normalizePhone(newLead.phone);
    
    if (email || phone !== '') {
      const isDuplicate = leads.some(l => 
        (email && l.email?.toLowerCase().trim() === email) || 
        (phone !== '' && normalizePhone(l.phone) === phone)
      );
      
      if (isDuplicate) {
        if (!window.confirm("A lead with this email or phone already exists. Do you want to add it anyway?")) {
          return;
        }
      }
    }

    try {
      const leadData = {
        ...newLead,
        organizationId: organizationId,
        ownerId: user.uid,
        qualificationScore: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        budgetRange: newLead.budgetRange || '₦10k - ₦100k',
      };
      
      const docRef = await addDoc(collection(db, 'leads'), leadData);
      const leadId = docRef.id;
      
      addNotification('New Lead!', `A new lead "${newLead.name}" has entered your pipeline.`, 'info');
      setIsProcessing(true);
      setProcessedCount(0);
      setTotalToProcess(1);

      // Qualification Logic (remains same but updates doc)
      try {
        if (isQuotaReached) throw new Error("QUOTA REACHED");

        const response = await fetchWithAuth('/api/ai/qualify-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadName: newLead.name,
            industry: newLead.industry,
            notes: newLead.notes,
            source: newLead.source,
            budgetRange: newLead.budgetRange,
            rules: qualificationRules
          })
        });
        
        if (response.status === 429) {
          setIsQuotaReached(true);
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || data.error || "GEMINI_QUOTA_REACHED");
        }

        const data = await response.json();

        if (data && (data.score !== undefined || data.summary)) {
          const numericScore = typeof data.score === 'number' ? data.score : parseInt(String(data.score || 0));
          const scoreValue = isNaN(numericScore) ? 0 : numericScore;
          
          await updateDoc(doc(db, 'leads', leadId), {
            qualificationScore: scoreValue,
            aiSummary: data.summary,
            qualificationReasoning: data.reasoning,
            budgetRange: data.budget || newLead.budgetRange,
            updatedAt: serverTimestamp()
          });
          
          autoScheduleFollowUp(leadId, newLead.name, scoreValue, data.summary);
          
          const fullLead: Lead = {
            ...newLead,
            id: leadId,
            organizationId: organizationId!,
            qualificationScore: scoreValue,
            aiSummary: data.summary || "",
            qualificationReasoning: data.reasoning || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          autoNotifyClientOnQualifiedLead(fullLead, scoreValue);
        }
      } catch (err: any) {
        console.warn("Auto-qualification fallback strategy activated:", err.message);
        const msg = String(err.message || "").toUpperCase();
        if (msg.includes("QUOTA") || msg.includes("LIMIT") || msg.includes("429") || msg.includes("EXHAUSTED") || isQuotaReached) {
          setIsQuotaReached(true);
          const res = localHeuristicQualify(newLead, qualificationRules);
          await updateDoc(doc(db, 'leads', leadId), {
            qualificationScore: res.score,
            aiSummary: res.summary,
            qualificationReasoning: res.reasoning,
            updatedAt: serverTimestamp()
          });
          autoScheduleFollowUp(leadId, newLead.name, res.score, res.summary);
          
          const fullLead: Lead = {
            ...newLead,
            id: leadId,
            organizationId: organizationId!,
            qualificationScore: res.score,
            aiSummary: res.summary || "",
            qualificationReasoning: res.reasoning || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          autoNotifyClientOnQualifiedLead(fullLead, res.score);
        }
      } finally {
        setProcessedCount(1);
        setIsProcessing(false);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leads');
    }
  };

  const bulkAddLeads = async (newLeads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'qualificationScore' | 'aiSummary' | 'organizationId'>[]) => {
    // Deduplicate incoming leads against existing leads
    const existingEmails = new Set(leads.map(l => l.email?.toLowerCase().trim()).filter(Boolean));
    const existingPhones = new Set(leads.map(l => normalizePhone(l.phone)).filter(Boolean));
    const existingNameCompany = new Set(leads.map(l => `${l.name?.toLowerCase().trim()}|${l.company?.toLowerCase().trim()}`).filter(s => s !== '|'));

    const filteredNewLeads = newLeads.filter(nl => {
      const email = nl.email?.toLowerCase().trim();
      const phone = normalizePhone(nl.phone);
      const ncKey = `${nl.name?.toLowerCase().trim()}|${nl.company?.toLowerCase().trim()}`;
      
      if (email && existingEmails.has(email)) return false;
      if (phone !== '' && existingPhones.has(phone)) return false;
      if (ncKey !== '|' && existingNameCompany.has(ncKey)) return false;
      
      if (email) existingEmails.add(email);
      if (phone !== '') existingPhones.add(phone);
      if (ncKey !== '|') existingNameCompany.add(ncKey);
      
      return true;
    });

    if (!user || !organizationId) return;

    try {
      const batch = writeBatch(db);
      const addedLeadIds: string[] = [];
      
      filteredNewLeads.forEach(nl => {
        const docRef = doc(collection(db, 'leads'));
        batch.set(docRef, {
          ...nl,
          organizationId: organizationId,
          ownerId: user.uid,
          qualificationScore: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          budgetRange: nl.budgetRange || '₦10k - ₦100k',
        });
        addedLeadIds.push(docRef.id);
      });
      
      await batch.commit();

      if (addedLeadIds.length === 1) {
        addNotification('New Lead!', `A new lead "${filteredNewLeads[0].name}" has been added.`, 'info');
      } else {
        addNotification('Bulk Import Success', `Successfully added ${addedLeadIds.length} new leads.`, 'success');
      }
      
      setIsProcessing(true);
      setProcessedCount(0);
      setTotalToProcess(addedLeadIds.length);

      // Processing qualification for the batch
      // For simplicity, we'll iterate and update each doc after batch commit
      // In a more complex app, this could be a cloud function
      const BATCH_SIZE = 40; 
      let localQuotaHit = isQuotaReached;
      
      for (let i = 0; i < addedLeadIds.length; i += BATCH_SIZE) {
        const batchIds = addedLeadIds.slice(i, i + BATCH_SIZE);
        const batchLeads = filteredNewLeads.slice(i, i + BATCH_SIZE).map((l, idx) => ({ ...l, id: batchIds[idx] }));
        
        try {
          if (localQuotaHit) {
            for (const b of batchLeads) {
              const res = localHeuristicQualify(b, qualificationRules);
              await updateDoc(doc(db, 'leads', b.id), {
                qualificationScore: res.score,
                aiSummary: res.summary,
                qualificationReasoning: res.reasoning,
                updatedAt: serverTimestamp()
              });
              autoScheduleFollowUp(b.id, b.name, res.score, res.summary);
            }
            setProcessedCount(prev => Math.min(prev + batchLeads.length, addedLeadIds.length));
            continue;
          }

          if (addedLeadIds.length > BATCH_SIZE && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 6000));
          }

          const response = await fetchWithAuth('/api/ai/qualify-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              leads: batchLeads,
              rules: qualificationRules
            })
          }, 45000);
          
          if (response.status === 429) {
            setIsQuotaReached(true);
            localQuotaHit = true;
            throw new Error("GEMINI_QUOTA_REACHED");
          }

          const data = await response.json();
          
          if (data.results && Array.isArray(data.results)) {
            for (const res of data.results) {
              const numericScore = typeof res.score === 'number' ? res.score : parseInt(String(res.score || 0));
              const scoreValue = isNaN(numericScore) ? 0 : numericScore;
              const leadObj = batchLeads.find(l => l.id === res.id);
              
              await updateDoc(doc(db, 'leads', res.id), {
                qualificationScore: scoreValue,
                aiSummary: res.summary,
                qualificationReasoning: res.reasoning,
                budgetRange: res.budget || leadObj?.budgetRange,
                updatedAt: serverTimestamp()
              });
              
              if (leadObj) autoScheduleFollowUp(res.id, leadObj.name, scoreValue, res.summary);
            }
          }
          setProcessedCount(prev => Math.min(prev + batchLeads.length, addedLeadIds.length));
        } catch (err: any) {
          console.warn(`Batch qualification issues:`, err.message);
          localQuotaHit = true;
          setIsQuotaReached(true);
          // Apply fallback
          for (const b of batchLeads) {
            const res = localHeuristicQualify(b, qualificationRules);
            await updateDoc(doc(db, 'leads', b.id), {
              qualificationScore: res.score,
              aiSummary: res.summary,
              qualificationReasoning: res.reasoning,
              updatedAt: serverTimestamp()
            });
            autoScheduleFollowUp(b.id, b.name, res.score, res.summary);
          }
          setProcessedCount(prev => Math.min(prev + batchLeads.length, addedLeadIds.length));
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'leads/bulk');
    }
    console.log(`[AI AGENT] Finished qualification process for ${newLeads.length} leads.`);
  };

  const seedHighIntentLeads = async () => {
    setIsProcessing(true);
    const mockLeads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'qualificationScore' | 'aiSummary' | 'organizationId'>[] = [
      {
        name: 'Olusegun Obasanjo',
        email: 'segun.o@legacyventures.ng',
        phone: '+2348039281726',
        company: 'Legacy Ventures Nigeria',
        industry: 'Real Estate',
        source: 'Instagram',
        status: 'New',
        budgetRange: '₦5M+',
        notes: 'Interested in bulk acquisition of residential units in Lekki Phase 1. Ready to deploy capital immediately. Please send commercial terms.',
      },
      {
        name: 'Chinyere Uzo',
        email: 'chinyere.u@techhub.africa',
        phone: '+2347019284756',
        company: 'TechHub Africa',
        industry: 'Education',
        source: 'WhatsApp',
        status: 'New',
        budgetRange: '₦1M - ₦5M',
        notes: 'Looking for a CRM solution and automated outreach system for our training programs. We need a system that supports WhatsApp integration in Nigeria.',
      },
      {
        name: 'Musa Bello',
        email: 'musa.b@abujaexports.com',
        phone: '+2348123456789',
        company: 'Abuja Export Hub',
        industry: 'Other',
        source: 'Website',
        status: 'New',
        budgetRange: '₦300k - ₦1M',
        notes: 'Inquiry regarding logistics software and lead tracking for our export business. Need local support and NGN pricing.',
      }
    ];

    await bulkAddLeads(mockLeads);
    setIsProcessing(false);
  };

  const setSimulationActive = (active: boolean) => {
    setIsSimulating(active);
  };

  useEffect(() => {
    const fetchWebhookInbox = async () => {
      if (!organizationId) return;
      try {
        const res = await fetchWithAuth(`/api/webhook/inbox?org=${organizationId}`);
        const data = await res.json();
        if (data.leads && data.leads.length > 0) {
          console.log(`[REAL-TIME] Received ${data.leads.length} new leads from website form.`);
          bulkAddLeads(data.leads);
        }
      } catch (e) {
        // Silent error for poll
      }
    };

    fetchWebhookInbox();
    const inboxInterval = setInterval(fetchWebhookInbox, 30000); // Check every 30s
    
    return () => clearInterval(inboxInterval);
  }, [bulkAddLeads, organizationId]);

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const names = ['Ade', 'Chioma', 'Musa', 'Fatima', 'Bisi', 'Oluchi', 'Tunde', 'Ife', 'Zainab', 'Chidi'];
      const lastNames = ['Okonkwo', 'Balogun', 'Adeyemi', 'Ibrahim', 'Eze', 'Okoro', 'Sanni', 'Nwosu'];
      const sources: LeadSource[] = ['WhatsApp', 'Instagram', 'Facebook', 'Website', 'Referral'];
      const industries: LeadIndustry[] = ['Home Services', 'Real Estate', 'Education', 'Beauty', 'Healthcare', 'Other'];
      const budgets = ['₦500k - ₦1M', '₦1M - ₦5M', '₦5M - ₦10M', '₦10M+', 'Unsure'];

      const lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'qualificationScore' | 'aiSummary' | 'organizationId'> = {
        name: `${names[Math.floor(Math.random() * names.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        email: `lead_${Math.random().toString(36).substr(2, 5)}@example.com`,
        phone: `+234${Math.floor(7000000000 + Math.random() * 2000000000)}`,
        company: Math.random() > 0.5 ? 'Global Ventures Ltd' : undefined,
        industry: industries[Math.floor(Math.random() * industries.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        status: 'New',
        budgetRange: budgets[Math.floor(Math.random() * budgets.length)],
        notes: `Simulated real-time inquiry from ${sources[Math.floor(Math.random() * sources.length)]} regarding services.`,
      };

      console.log(`[LIVE FEED] New Lead Received: ${lead.name} via ${lead.source}`);
      addLead(lead);
    }, 15000); // New lead every 15 seconds

    return () => clearInterval(interval);
  }, [isSimulating, qualificationRules]);

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    try {
      const lead = leads.find(l => l.id === id);
      const oldStatus = lead?.status;
      
      await updateDoc(doc(db, 'leads', id), {
        status,
        updatedAt: serverTimestamp()
      });
      
      // Log status change
      if (oldStatus !== status) {
        await addLeadComment(id, `Status updated from ${oldStatus} to ${status}`);
      }
      
      // Automatic billing engine: Charge if marked as Qualified
      if (status === 'Qualified' && oldStatus !== 'Qualified') {
        await createLeadCharge(id, lead?.name || 'Unknown Lead');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  };

  const bulkUpdateLeadStatus = async (ids: string[], status: LeadStatus) => {
    try {
      const batch = writeBatch(db);
      for (const id of ids) {
        const lead = leads.find(l => l.id === id);
        const oldStatus = lead?.status;
        
        batch.update(doc(db, 'leads', id), {
          status,
          updatedAt: serverTimestamp()
        });

        // Log status change in batch
        if (oldStatus !== status) {
          const commentRef = doc(collection(db, 'leads', id, 'comments'));
          batch.set(commentRef, {
            authorId: user?.uid,
            text: `Bulk status update: ${oldStatus} → ${status}`,
            createdAt: serverTimestamp()
          });
        }
      }
      await batch.commit();
      console.log(`[AI AGENT] Bulk updated ${ids.length} leads to ${status}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'leads/bulk');
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Delete Lead
      batch.delete(doc(db, 'leads', id));

      // 2. Cleanup follow-ups (We need to fetch them first, then add to batch)
      const fuQuery = query(collection(db, 'followUps'), where('leadId', '==', id));
      const fuSnap = await getDocs(fuQuery);
      fuSnap.docs.forEach(d => batch.delete(d.ref));

      // 3. Cleanup comments
      const commSnap = await getDocs(collection(db, 'leads', id, 'comments'));
      commSnap.docs.forEach(d => batch.delete(d.ref));

      await batch.commit();
      addNotification('Lead Deleted', 'The lead and all associated data have been removed.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
    }
  };

  const bulkDeleteLeads = async (ids: string[]) => {
    try {
      const batch = writeBatch(db);
      for (const id of ids) {
        batch.delete(doc(db, 'leads', id));
        // Note: bulk cleaning of subcollections/related docs is harder in simple batches 
        // usually would trigger via cloud functions or just leave (security rules block access anyway)
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'leads/bulk');
    }
  };
  
  const updateFollowUpStatus = async (id: string, status: FollowUpStatus) => {
    try {
      await updateDoc(doc(db, 'followUps', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `followUps/${id}`);
    }
  };
  
  const addLeadComment = async (leadId: string, text: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'leads', leadId, 'comments'), {
        authorId: user.uid,
        text,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'leads', leadId), { updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `leads/${leadId}/comments`);
    }
  };

  const updateQualificationRules = async (rules: string) => {
    setQualificationRules(rules);
    if (!user || !organizationId) return;
    try {
      await updateDoc(doc(db, 'organizations', organizationId), {
        qualificationRules: rules,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("[SETTINGS] Failed to save rules:", error);
    }
  };

  const updateFollowUpIntervals = async (intervals: FollowUpInterval[]) => {
    setFollowUpIntervals(intervals);
    if (!user || !organizationId) return;
    try {
      await updateDoc(doc(db, 'organizations', organizationId), {
        followUpIntervals: intervals,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("[SETTINGS] Failed to save intervals:", error);
    }
  };

  const autoNotifyClientOnQualifiedLead = useCallback(async (lead: Lead, score: number) => {
    if (!emailSettings || !emailSettings.enabled) return;
    if (score < emailSettings.minScore) return;
    
    try {
      console.log(`[EMAIL NOTIFICATION] Triggering qualified email notification for ${lead.name} (Score: ${score})`);
      const response = await fetchWithAuth('/api/email/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: { ...lead, qualificationScore: score },
          settings: emailSettings,
          isTest: false
        })
      });
      const data = await response.json();
      console.log(`[EMAIL NOTIFICATION] Response:`, data);
    } catch (err) {
      console.error("[EMAIL NOTIFICATION] Failed to dispatch qualified lead email notification:", err);
    }
  }, [emailSettings]);

  const updateEmailSettings = async (updates: Partial<EmailSettings>) => {
    if (!user || !organizationId) return;
    const current = emailSettings || DEFAULT_EMAIL_SETTINGS;
    const updated = {
      ...current,
      ...updates
    } as EmailSettings;
    
    setEmailSettings(updated);
    try {
      await updateDoc(doc(db, 'organizations', organizationId), {
        emailSettings: updated,
        updatedAt: serverTimestamp()
      });
      addNotification('Settings Saved', 'Email notification settings updated successfully.', 'success');
    } catch (error) {
      console.error("[EMAIL SETTINGS] Failed to save email settings:", error);
      handleFirestoreError(error, OperationType.WRITE, `organizations/${organizationId}/emailSettings`);
    }
  };

  const addClientEmailAccount = async (account: Omit<ClientEmailAccount, 'id'>) => {
    if (!user || !organizationId) return;
    const current = emailSettings || DEFAULT_EMAIL_SETTINGS;
    const newAccountObj: ClientEmailAccount = {
      ...account,
      id: Math.random().toString(36).substring(2, 11)
    };
    const updatedClients = [...(current.clients || []), newAccountObj];
    await updateEmailSettings({ clients: updatedClients });
  };

  const updateClientEmailAccount = async (accountId: string, updates: Partial<ClientEmailAccount>) => {
    if (!user || !organizationId) return;
    const current = emailSettings || DEFAULT_EMAIL_SETTINGS;
    const updatedClients = (current.clients || []).map(c => 
      c.id === accountId ? { ...c, ...updates } : c
    );
    await updateEmailSettings({ clients: updatedClients });
  };

  const deleteClientEmailAccount = async (accountId: string) => {
    if (!user || !organizationId) return;
    const current = emailSettings || DEFAULT_EMAIL_SETTINGS;
    const updatedClients = (current.clients || []).filter(c => c.id !== accountId);
    await updateEmailSettings({ clients: updatedClients });
  };

  const clearLeads = async () => {
    if (!user || !organizationId) return;
    if (window.confirm("ARE YOU SURE? This will permanently delete all leads in the organizational database.")) {
      try {
        const batch = writeBatch(db);
        const leadsSnap = await getDocs(query(collection(db, 'leads'), where('organizationId', '==', organizationId)));
        leadsSnap.docs.forEach(d => batch.delete(d.ref));
        const fuSnap = await getDocs(query(collection(db, 'followUps'), where('organizationId', '==', organizationId)));
        fuSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        addNotification('System Cleared', 'All organizational leads and tasks have been deleted.', 'warning');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'all');
      }
    }
  };

  const deduplicateLeads = () => {
    setLeads(prev => {
      // Prioritize leads: Converted > Qualified > Contacted > New; then those with scores/summaries
      const sorted = [...prev].sort((a, b) => {
        const statusWeight = { 'Converted': 5, 'Qualified': 4, 'Contacted': 3, 'New': 2, 'Lost': 1 };
        const weightA = statusWeight[a.status] || 0;
        const weightB = statusWeight[b.status] || 0;
        if (weightA !== weightB) return weightB - weightA;
        return (b.qualificationScore || 0) - (a.qualificationScore || 0);
      });

      const seen = new Set<string>();
      const result: Lead[] = [];
      let removedCount = 0;
      
      sorted.forEach(lead => {
        const email = lead.email?.toLowerCase().trim();
        const phone = normalizePhone(lead.phone);
        const name = lead.name?.toLowerCase().trim();
        const company = lead.company?.toLowerCase().trim();
        
        const emailKey = email && email !== '' ? `e:${email}` : null;
        const phoneKey = phone !== '' ? `p:${phone}` : null;
        const nameCompanyKey = (name && company) ? `nc:${name}|${company}` : null;
        
        let existingIndex = -1;
        
        // Use keys to find existing
        if (emailKey && seen.has(emailKey)) {
          existingIndex = result.findIndex(r => r.email?.toLowerCase().trim() === email);
        } else if (phoneKey && seen.has(phoneKey)) {
          existingIndex = result.findIndex(r => normalizePhone(r.phone) === phone);
        } else if (nameCompanyKey && seen.has(nameCompanyKey)) {
          existingIndex = result.findIndex(r => r.name?.toLowerCase().trim() === name && r.company?.toLowerCase().trim() === company);
        }
        
        if (existingIndex !== -1) {
          // Merge logic
          const existing = result[existingIndex];
          // Transfer data if missing
          if (!existing.phone && lead.phone) existing.phone = lead.phone;
          if (!existing.email && lead.email) existing.email = lead.email;
          if (!existing.company && lead.company) existing.company = lead.company;
          
          // Combine notes if different
          if (lead.notes && lead.notes !== 'Imported via CSV' && !existing.notes?.includes(lead.notes)) {
             existing.notes = `${existing.notes}\n---\nAdditional Note: ${lead.notes}`;
          }
          
          // Add all keys of the discarded lead to seen so they also match the 'existing' lead
          if (emailKey) seen.add(emailKey);
          if (phoneKey) seen.add(phoneKey);
          if (nameCompanyKey) seen.add(nameCompanyKey);
          
          removedCount++;
        } else {
          if (emailKey) seen.add(emailKey);
          if (phoneKey) seen.add(phoneKey);
          if (nameCompanyKey) seen.add(nameCompanyKey);
          result.push({ ...lead });
        }
      });

      if (removedCount > 0) {
        console.log(`[AI AGENT] Deduplication complete. ${removedCount} duplicates merged/removed.`);
      }
      return result;
    });
  };

  const scheduleFollowUp = async (newFollowUp: Omit<FollowUp, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'followUps'), {
        ...newFollowUp,
        organizationId: organizationId,
        ownerId: user.uid,
        scheduledAt: Timestamp.fromDate(new Date(newFollowUp.scheduledAt))
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'followUps');
    }
  };

  const bulkScheduleFollowUps = async (leadIds: string[], type: FollowUpType, notes: string) => {
    if (!user) return;
    try {
      const now = new Date();
      const batch = writeBatch(db);
      leadIds.forEach(leadId => {
        const docRef = doc(collection(db, 'followUps'));
        batch.set(docRef, {
          organizationId: organizationId,
          ownerId: user.uid,
          leadId,
          type,
          scheduledAt: Timestamp.fromDate(new Date(now.getTime() + 60 * 60 * 1000)),
          notes: `[BULK] ${notes}`,
          status: 'Upcoming'
        });
      });
      await batch.commit();
      console.log(`[AI AGENT] Bulk scheduled ${leadIds.length} ${type} tasks.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'followUps/bulk');
    }
  };

  const addTicket = async (newTicket: Omit<Ticket, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'tickets'), {
        ...newTicket,
        organizationId: organizationId,
        userId: user.uid,
        status: 'Open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      addNotification('Ticket Created', 'Our support team has received your request.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
    }
  };

  const updateTicketStatus = async (id: string, status: TicketStatus) => {
    try {
      await updateDoc(doc(db, 'tickets', id), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
    }
  };

  const calculateLeadCreditCost = (lead: Lead): number => {
    const baseCredit = 1;
    let multiplier = 1;

    const ind = lead.industry.toLowerCase();
    const notes = lead.notes.toLowerCase();
    const budget = lead.budgetRange.toLowerCase();

    // Industry based multipliers
    if (ind.includes('real estate')) multiplier = 5;
    else if (ind.includes('tech') || ind.includes('saas')) multiplier = 5;
    else if (ind.includes('education') || ind.includes('coaching')) multiplier = 2;
    else if (ind.includes('beauty') || ind.includes('health')) multiplier = 1.5;

    // Budget based overrides (high intent override)
    if (budget.includes('5m') || budget.includes('10m') || notes.includes('million')) {
      multiplier = Math.max(multiplier, 5);
    }

    return baseCredit * multiplier;
  };

  const createLeadCharge = async (leadId: string, leadName: string) => {
    if (!user) return;
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const creditCost = calculateLeadCreditCost(lead);
    const nairaValue = creditCost * 100;

    if (creditBalance < creditCost) {
      addNotification('Wallet Empty', `Low balance! Recharge to unlock details for ${leadName}.`, 'warning');
      console.warn(`[BILLING] Insufficient credits for lead ${leadId}. Required: ${creditCost}, Have: ${creditBalance}`);
      // In a real app, you might prevent marking as qualified or hide data
      return;
    }

    try {
      const finalOrgId = organizationId || 'organization_v1';
      const settingsRef = doc(db, 'organizations', finalOrgId);
      
      // Check if we need to migrate first
      let migrationData: any = null;
      if (finalOrgId === 'organization_v1') {
        const orgSnap = await getDoc(settingsRef);
        if (!orgSnap.exists()) {
          const legacyRef = doc(db, 'settings', 'organization_v1');
          const legacySnap = await getDoc(legacyRef);
          if (legacySnap.exists()) {
            migrationData = legacySnap.data();
            console.log("[BILLING] Preparing legacy migration for charge");
          }
        }
      }

      const batch = writeBatch(db);
      
      // 1. Record Transaction
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        organizationId: finalOrgId,
        userId: user.uid,
        leadId,
        amount: nairaValue,
        credits: creditCost,
        type: 'Charge',
        status: 'Completed',
        description: `Qualified lead unlock: ${leadName} (${lead.industry})`,
        createdAt: serverTimestamp()
      });

      // 2. Deduct Credits from Shared Org Wallet
      if (migrationData) {
        batch.set(settingsRef, {
          ...migrationData,
          creditBalance: (migrationData.creditBalance || 0) - creditCost,
          updatedAt: serverTimestamp(),
          migratedAt: serverTimestamp()
        });
      } else {
        batch.set(settingsRef, {
          creditBalance: increment(-creditCost),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      await batch.commit();
      addNotification('Lead Unlocked', `${creditCost} credits (₦${nairaValue}) deducted for ${leadName}.`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const buyCredits = async (credits: number) => {
    if (!user) {
      console.error("[WALLET] No user found for credit purchase");
      addNotification('Error', 'You must be logged in to buy credits.', 'error');
      return;
    }
    const amount = credits * 100;
    console.log(`[WALLET] Initiating purchase: ${credits} credits for ₦${amount} (User: ${user.uid})`);

    try {
      // Optimistic update
      console.log(`[WALLET] Optimistic update: ${creditBalance} -> ${creditBalance + credits}`);
      setCreditBalance(prev => prev + credits);
      
      const batch = writeBatch(db);
      
      // 1. Record Transaction (Global collection)
      const finalOrgId = organizationId || 'organization_v1';
      const txRef = doc(collection(db, 'transactions'));
      const txData = {
        organizationId: finalOrgId,
        userId: user.uid, // Keep track of who bought it
        userEmail: user.email,
        amount: amount,
        credits: credits,
        type: 'Credit',
        status: 'Completed',
        description: `Wallet recharge: +${credits} credits by ${user.email || 'User'}`,
        createdAt: serverTimestamp()
      };
      batch.set(txRef, txData);
      console.log("[WALLET] Queued transaction record:", txData);

      // 2. Add Credits to Shared Organization Settings
      const settingsRef = doc(db, 'organizations', finalOrgId);
      
      // Before setting, check if we need to migrate from legacy settings/organization_v1
      if (finalOrgId === 'organization_v1') {
        const orgSnap = await getDoc(settingsRef);
        if (!orgSnap.exists()) {
          const legacyRef = doc(db, 'settings', 'organization_v1');
          const legacySnap = await getDoc(legacyRef);
          if (legacySnap.exists()) {
            const legacyData = legacySnap.data();
            console.log("[WALLET] Migrating legacy settings to new organizations collection during purchase");
            // Set everything from legacy + the new incremented balance
            batch.set(settingsRef, {
              ...legacyData,
              creditBalance: (legacyData.creditBalance || 0) + credits,
              updatedAt: serverTimestamp(),
              migratedAt: serverTimestamp()
            });
          } else {
            batch.set(settingsRef, {
              creditBalance: increment(credits),
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        } else {
          batch.set(settingsRef, {
            creditBalance: increment(credits),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } else {
        batch.set(settingsRef, {
          creditBalance: increment(credits),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      console.log(`[WALLET] Queued balance increment: +${credits} (Shared Org Wallet)`);

      await batch.commit();
      console.log(`[WALLET] TRANSACTION SUCCESSFUL. Credits added: ${credits}. New Balance expected: ${creditBalance + credits}`);
      
      addNotification('Top-up Successful', `NGN ${(amount).toLocaleString()} added. Wallet balance updated.`, 'success');
    } catch (error) {
      console.error("[WALLET] Purchase failed during writeBatch:", error);
      // Revert optimistic update
      setCreditBalance(prev => Math.max(0, prev - credits));
      handleFirestoreError(error, OperationType.WRITE, 'wallet/topup');
    }
  };

  const giftCredits = async (orgId: string, credits: number) => {
    if (!isAdmin || !user) return;
    try {
      const batch = writeBatch(db);
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        organizationId: orgId,
        userId: user.uid,
        userEmail: user.email,
        amount: 0,
        credits: credits,
        type: 'Credit',
        status: 'Completed',
        description: `Admin Gift: +${credits} credits by ${user.email}`,
        createdAt: serverTimestamp()
      });

      const settingsRef = doc(db, 'organizations', orgId);
      batch.set(settingsRef, {
        creditBalance: increment(credits),
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      addNotification('Gift Successful', `Gifted ${credits} credits to organization ${orgId}.`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'admin/gift');
    }
  };

  const addTeamMember = async (email: string) => {
    if (!user) return;
    try {
      const emailLower = email.toLowerCase().trim();
      if (members.some(m => m.email.toLowerCase() === emailLower)) {
        addNotification('Already Member', `${emailLower} is already in your team.`, 'warning');
        return;
      }
      
      const memberRef = doc(db, 'members', emailLower);
      await setDoc(memberRef, {
        email: emailLower,
        organizationId: organizationId,
        role: 'Member',
        addedAt: serverTimestamp(),
        addedBy: user.uid
      });
      addNotification('Member Added', `${emailLower} has been added to your team.`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'members');
    }
  };

  const removeTeamMember = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'members', id));
      addNotification('Member Removed', 'Team member access revoked.', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'members');
    }
  };

  const completeRegistration = async (data: Omit<ClientRegistration, 'completed'>) => {
    if (!user) return;
    try {
      const regData: ClientRegistration = { ...data, completed: true };
      
      // 1. Generate new Organization ID
      const orgId = `org_${Math.random().toString(36).substr(2, 9)}`;
      
      const batch = writeBatch(db);
      
      // 2. Create the Organization
      const orgRef = doc(db, 'organizations', orgId);
      batch.set(orgRef, {
        name: data.companyName,
        ownerId: user.uid,
        registration: regData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        creditBalance: 100, // Gift
        qualificationRules: `1. High monthly volume potential (${data.monthlyVolume}).\n2. Priority for ${data.industry} specific leads.\n3. Verify ${data.pricingTier} tier alignment.`,
        followUpIntervals: [
          { minScore: 85, maxScore: 100, days: 1, type: 'Call' },
          { minScore: 70, maxScore: 84, days: 3, type: 'WhatsApp' },
          { minScore: 40, maxScore: 69, days: 7, type: 'Email' },
        ]
      });
      
      // 3. Create the Member entry
      const emailLower = user.email?.toLowerCase() || '';
      const memberRef = doc(db, 'members', emailLower);
      batch.set(memberRef, {
        email: emailLower,
        organizationId: orgId,
        role: 'Admin',
        addedAt: serverTimestamp(),
        addedBy: user.uid
      });
      
      await batch.commit();
      
      // Trigger the welcome email using user email address and registration info
      const signupEmail = user.email || data.email || '';
      if (signupEmail) {
        fetchWithAuth('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: signupEmail,
            signupData: data
          })
        }).then(res => res.json())
          .then(resData => console.log('[WELCOME EMAIL SUCCESS]', resData))
          .catch(err => console.error('[WELCOME EMAIL FAILED]', err));
      }
      
      addNotification('Welcome!', "Organization registered. We've gifted you 100 credits (₦10,000 value) to get started!", 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'organizations/registration');
    }
  };

  const isSuperAdmin = user?.email === 'zeerocodes@gmail.com';

  return (
    <AppContext.Provider value={{ 
      user,
      authLoading,
      login,
      signOut: signOutUser,
      isAdmin,
      isSuperAdmin,
      leads, 
      allLeads,
      followUps, 
      tickets,
      allTickets,
      transactions,
      allTransactions,
      allOrganizations,
      giftCredits,
      addTicket,
      updateTicketStatus,
      creditBalance,
      registration,
      settingsLoaded,
      isAuthProcessing,
      addNotification,
      buyCredits,
      completeRegistration,
      addLead, 
      bulkAddLeads, 
      updateLeadStatus, 
      bulkUpdateLeadStatus,
      deleteLead,
      bulkDeleteLeads,
      updateFollowUpStatus,
      addLeadComment,
      scheduleFollowUp,
      bulkScheduleFollowUps,
      followUpIntervals,
      setFollowUpIntervals: updateFollowUpIntervals,
      qualificationRules,
      setQualificationRules: updateQualificationRules,
      isQuotaReached,
      setIsQuotaReached,
      isProcessing,
      processedCount,
      totalToProcess,
      isSimulating,
      setSimulationActive,
      reprocessLeads,
      reprocessSingleLead,
      seedHighIntentLeads,
      clearLeads,
      deduplicateLeads,
      globalSearchQuery,
      setGlobalSearchQuery,
      notifications,
      dismissNotification,
      members,
      addTeamMember,
      removeTeamMember,
      isUserAuthorized,
      organizationId,
      emailSettings,
      updateEmailSettings,
      addClientEmailAccount,
      updateClientEmailAccount,
      deleteClientEmailAccount,
      fetchWithAuth
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
