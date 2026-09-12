/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LeadZero v2 — Production-Ready Landing Page
 * Full responsive layout with 12-section copywriting blueprint.
 */

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  CheckCircle,
  Building,
  QrCode,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  Play,
  X,
  Lock,
  Mail,
  Shield,
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  HelpCircle,
  Menu,
  ChevronDown,
  Star,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Database,
  Layers,
  FileText,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LandingPageProps {
  onCompleteOnboarding: (bizName: string, phone: string, email?: string) => void;
  onBypassOnboarding: () => void;
  onLoginAsAdmin?: () => void;
  currentBusinessName?: string;
}

export default function LandingPage({
  onCompleteOnboarding,
  onBypassOnboarding,
  onLoginAsAdmin,
  currentBusinessName
}: LandingPageProps) {
  // Navigation & accordion FAQ states
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<"register" | "login">("register");

  // Onboarding registration states
  const [bizName, setBizName] = useState(currentBusinessName || "Chioma's Premium Cleaning");
  const [phone, setPhone] = useState("+234 803 111 2222");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("••••••••");
  const [onboardingStep, setOnboardingStep] = useState<"form" | "qr" | "tour">("form");
  const [qrProgress, setQrProgress] = useState(0);
  const [qrScanned, setQrScanned] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [formLoading, setFormLoading] = useState(false);

  // Interactive Live Playground Simulator State
  const [simActiveTab, setSimActiveTab] = useState<"unassigned" | "assigned" | "closed">("unassigned");
  const [currSimChatOption, setCurrSimChatOption] = useState<string | null>(null);
  const [simMetrics, setSimMetrics] = useState({
    chatsReplied: 1,
    followupsOverdue: 1,
    totalNairaWon: 145000
  });

  // Simulator preset interactive workflow scripts
  const SIM_OPTIONS = {
    A: {
      id: "A",
      text: "Is the post-construction cleanup still ₦35,000 for standard duplexes?",
      replyDraft: "Yes, that is our discounted flat rate for African customers! Should we log a slot?",
      responseText: "Simulated Response Sent! The customer status shifted to 'Replied' and tagged as 'Hot Prospect'.",
      actionResult: "Replied via standard ₦35,000 Pricing Template",
      metricBonus: { won: 35000, chat: 1 }
    },
    B: {
      id: "B",
      text: "Need urgent disinfection for our model workstation in Yaba today",
      replyDraft: "On it! Assigning our professional crew leader immediately.",
      responseText: "Simulated Follow-up Alert Queued! Set an automated reminder in the Follow-up tab for 1 hour.",
      actionResult: "Assigned to Emeka & Scheduled 1-Hour Follow-Up Tracker",
      metricBonus: { won: 45000, chat: 1 }
    },
    C: {
      id: "C",
      text: "Our building contract payment has been processed, please verify",
      replyDraft: "Payment verification workflow triggered! Standard invoice logged.",
      responseText: "Simulated Deal Marked 'WON'! ₦65,000 registered in the Revenue section and invoice archived.",
      actionResult: "Deal marked WON! ₦65,000 attributed in CRM metrics",
      metricBonus: { won: 65000, chat: 1 }
    }
  };

  const handleSimOptionClick = (optionKey: keyof typeof SIM_OPTIONS) => {
    const option = SIM_OPTIONS[optionKey];
    setCurrSimChatOption(option.id);
    
    // Increment metrics interactively
    setSimMetrics((prev) => ({
      chatsReplied: prev.chatsReplied + option.metricBonus.chat,
      followupsOverdue: option.id === "B" ? prev.followupsOverdue + 1 : prev.followupsOverdue,
      totalNairaWon: prev.totalNairaWon + option.metricBonus.won
    }));
  };

  const handleStartRegisterProcess = () => {
    setAuthMode("register");
    setOnboardingStep("form");
    setShowAuthForm(true);
  };

  useEffect(() => {
    let interval: any;
    if (onboardingStep === "qr" && !qrScanned) {
      interval = setInterval(() => {
        setQrProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setQrScanned(true);
              setTimeout(() => {
                setOnboardingStep("tour");
              }, 1200);
            }, 400);
            return 100;
          }
          return prev + 20;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [onboardingStep, qrScanned]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setTimeout(() => {
      setFormLoading(false);
      setOnboardingStep("qr");
    }, 850);
  };

  const handleFinishOnboarding = () => {
    const nameToDispatch = authMode === "login" ? "Zeero Codes Ltd" : bizName;
    const phoneToDispatch = authMode === "login" ? "+234 809 999 0000" : phone;
    onCompleteOnboarding(nameToDispatch, phoneToDispatch, authMode === "login" ? email : undefined);
  };

  const tourSteps = [
    {
      title: "Step 1: The Unified WhatsApp Inbox",
      description: "Centralize your entire SME team operations. All customer WhatsApp chat histories display in a clean feed, support individual rep-level routing and collaborative notes.",
      badge: "Workspace Unified"
    },
    {
      title: "Step 2: Proactive Snooze Reminders",
      description: "Set automated follow-up milestones in seconds (1 hour, 4 hours, tomorrow). When timers lapse, tickets escalate inside the queue instantly to prevent client leakage.",
      badge: "No Leads Left Behind"
    },
    {
      title: "Step 3: Comprehensive Sales Performance",
      description: "Attribute WON deal parameters to calculate real-world revenue trends. Track local conversion outcomes, rep charts and issue customer payment invoices instantly.",
      badge: "Turn Conversations into Cash"
    }
  ];

  const faqs = [
    {
      q: "Do I need a WhatsApp Business API account?",
      a: "No. LeadZero connects through your regular WhatsApp using our secure client-side pairing. No Meta approval needed, no developer files, and zero API fees. Just scan a QR code and you are ready to go in minutes."
    },
    {
      q: "Will this work on my phone?",
      a: "Absolutely. LeadZero is engineered as a Progressive Web App (PWA). Use it on any adaptive browser or add it to your home screen like a native app. Fully optimized for mobile screens, touch-friendly, and very light on 3G/4G bandwidth."
    },
    {
      q: "What happens to my data if I downgrade to Free?",
      a: "Nothing is deleted. Your customer history and statistics remain safely preserved. You will simply be paused on active caps (100 chats/mo, 7-day conversation history visible). Once you re-upgrade, everything instantly unlocks of your account."
    },
    {
      q: "Is my customer data secure?",
      a: "Yes. LeadZero is fully NDPR compliant. All payload data is encrypted in transit using TLS 1.3 and at rest with military-grade AES-256. Your client record states never leave African cloud architectures and we never sell user data."
    },
    {
      q: "Can I pay with bank transfer or USSD?",
      a: "Yes, fully native. We integrate Paystack payment gateways, allowing seamless card payments, secure local bank transfers, or quick USSD dial codes based on whatever is convenient for your active cashflow."
    },
    {
      q: "How long does setup take?",
      a: "Literally 2 minutes. Enter your business name and number (60 seconds), scan the webhook linking QR code (30 seconds), and execute our quick tour (30 seconds) to sync real-time conversations instantly."
    },
    {
      q: "What if my internet is unreliable?",
      a: "LeadZero incorporates high-performance offline cache structures. Review past chats, browse contacts, and draft follow-up drafts list state. The system queues messages locally and pushes them to WhatsApp automatically when connectivity resumes."
    },
    {
      q: "Do you offer localized representative support?",
      a: "Yes! Responsive support is accessible directly inside the application, backed by SME account managers based in Africa who understand your everyday business realities."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* STICKY GLASS NAVBAR */}
      <nav id="landing-navbar" className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500 text-slate-950 font-black px-2.5 py-1.5 rounded-xl block text-lg shadow-md shadow-emerald-500/10 font-sans">
              LZ
            </div>
            <span className="font-extrabold text-white text-base tracking-tight font-sans">LeadZero</span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#simulator" className="hover:text-white transition-colors font-semibold text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-emerald-500/10" /> Sandbox Demo
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {onLoginAsAdmin && (
              <button
                onClick={onLoginAsAdmin}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:border-emerald-400"
                title="Log in directly as Super Admin (zeerocodes@gmail.com)"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Login</span>
              </button>
            )}
            <button
              onClick={onBypassOnboarding}
              className="text-xs text-slate-300 hover:text-white px-3 py-2 font-bold cursor-pointer transition-colors"
            >
              Skip to Demo
            </button>
            <button
              onClick={handleStartRegisterProcess}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-lg hover:scale-[1.03] cursor-pointer"
            >
              Set Up SME Hub
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-900 flex flex-col gap-3.5 pb-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-slate-300 font-semibold"
            >
              Features
            </a>
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-emerald-400 font-bold flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-emerald-400" /> Live Sandbox Demo
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-slate-300 font-semibold"
            >
              Pricing
            </a>
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
              {onLoginAsAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLoginAsAdmin();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs py-2 rounded-xl font-bold font-mono"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Log in as Super Admin (zeerocodes@gmail.com)</span>
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBypassOnboarding();
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs py-2 rounded-xl font-bold font-mono"
                >
                  Launch Demo
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleStartRegisterProcess();
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs py-2.5 rounded-xl font-black block text-center"
                >
                  Set Up Hub
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* SECTION 1: HERO SECTION */}
      <section id="hero" className="relative px-4 md:px-8 pt-24 md:pt-40 pb-16 md:pb-36 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Ambient neon radial glow lights */}
        <div className="absolute top-[10%] left-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[130px] -z-20 pointer-events-none" />
        <div className="absolute bottom-[10%] right-1/4 w-[300px] h-[300px] rounded-full bg-teal-500/10 blur-[110px] -z-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Turn Your WhatsApp Chats Into Cash
          </h1>
          
          <p className="text-sm md:text-base text-slate-400 mt-6 max-w-3xl mx-auto font-medium leading-relaxed">
            The WhatsApp sales inbox built for African SMEs. Track conversations, automate follow-ups,
            and see exactly how much money your WhatsApp messages make — all in one simple dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full sm:w-auto">
            <button
              onClick={handleStartRegisterProcess}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-xl shadow-emerald-500/10 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Free — No Credit Card Required <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
            <a
              href="#simulator"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold text-sm px-7 py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400" /> Watch 60-Second Demo
            </a>
          </div>

          {/* TRUST BAR */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-12 flex-wrap text-slate-500 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-400"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Free Forever Plan</span>
            <span className="flex items-center gap-1.5 text-slate-400"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Setup in 2 Minutes</span>
            <span className="flex items-center gap-1.5 text-slate-400"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> NDPR Compliant</span>
            <span className="flex items-center gap-1.5 text-slate-400"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Paystack Secured</span>
          </div>

          {/* PRODUCT HERO VISUAL: REVENUE COCKPIT ACCELERATOR */}
          <div className="w-full max-w-5xl mt-14 mx-auto border border-slate-800 rounded-3xl bg-slate-900/10 backdrop-blur-md shadow-[0_0_80px_rgba(16,185,129,0.06)] overflow-hidden flex flex-col select-none text-left relative animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Ambient inner glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[150px] bg-emerald-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

            {/* Browser Header / Navigation Dots */}
            <div className="px-4 py-3.5 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-550 bg-red-550/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-550 bg-yellow-550/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-555 bg-emerald-555/80"></div>
                <span className="text-[10.5px] font-mono font-black text-slate-400 ml-4 tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LEADZERO CRM REVENUE COCKPIT • 2 ACTIVE REPS SYNCED
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3.5">
                <span className="text-[9.5px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-emerald-400" /> Baileys Webhook
                </span>
                <span className="text-[9.5px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Database className="w-3 h-3 text-indigo-400" /> Paystack: Online
                </span>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="p-4 md:p-6 lg:p-7 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-950/70">
              
              {/* PRIMARY DISPLAY CARD: Large counter */}
              <div className="col-span-12 lg:col-span-7 bg-slate-900/60 border border-slate-850 rounded-2xl p-5 md:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="bg-emerald-950/60 border border-emerald-900 text-emerald-450 text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                        Naira Cash Velocity Counter
                      </span>
                      <p className="text-slate-400 text-xs font-mono font-semibold mt-1.5">REAL-TIME WHATSAPP ATTRIBUTION</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-900/70">
                      <TrendingUp className="w-3 h-3" /> +24% today
                    </span>
                  </div>

                  {/* GIANT "₦47,500 tracked today" NUMERICAL HIGHLIGHT */}
                  <div className="mt-8 mb-5 space-y-1">
                    <p className="text-4xl sm:text-5.5xl md:text-6.5xl font-sans font-black tracking-tight text-emerald-400 text-left drop-shadow-[0_0_20px_rgba(16,185,129,0.15)] select-all">
                      ₦47,500
                    </p>
                    <p className="text-sm font-sans font-black text-slate-100 tracking-tight flex items-center gap-1.5">
                      Tracked & Attribution Verified Today 
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    </p>
                    <p className="text-xs text-slate-400 max-w-md">
                      Instantly matched from 4 incoming customer conversations with active invoice receipts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-850/60 text-left">
                  <div>
                    <p className="text-slate-550 text-[9.5px] font-mono font-extrabold uppercase">Monthly Target</p>
                    <p className="text-sm font-sans font-extrabold text-slate-200 mt-0.5">₦450,000</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-555 h-full bg-emerald-500 w-[65%]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-550 text-[9.5px] font-mono font-extrabold uppercase">Close Rate</p>
                    <p className="text-sm font-sans font-extrabold text-slate-200 mt-0.5">82.4%</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-indigo-555 h-full bg-indigo-500 w-[82%]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-550 text-[9.5px] font-mono font-extrabold uppercase">Reminders</p>
                    <p className="text-sm font-sans font-extrabold text-rose-450 mt-0.5">0 Overdue <span className="text-[10px] text-emerald-400">✓</span></p>
                    <div className="w-full bg-emerald-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full w-full" />
                    </div>
                  </div>
                </div>

              </div>

              {/* SECONDARY DISPLAY CARD: Today's Visual Trajectory Bar Chart */}
              <div className="col-span-12 lg:col-span-5 bg-slate-900/60 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[11px] font-black text-slate-250 font-mono tracking-wider uppercase">HOURLY CAPTURE TRAJECTORY</h5>
                    <span className="text-[9px] font-mono text-slate-500">Last synced: 2m ago</span>
                  </div>

                  {/* High Quality CSS/Tailwind bar chart */}
                  <div className="h-28 flex items-end justify-between px-2 pt-4 pb-1 border-b border-slate-850 relative">
                    {/* Background gridlines */}
                    <div className="absolute left-0 right-0 top-1/4 border-t border-slate-850/40 pointer-events-none"></div>
                    <div className="absolute left-0 right-0 top-2/4 border-t border-slate-850/40 pointer-events-none"></div>
                    <div className="absolute left-0 right-0 top-3/4 border-t border-slate-850/40 pointer-events-none"></div>

                    {/* Bar 1 */}
                    <div className="flex flex-col items-center gap-1.5 w-1/4 group/bar z-10">
                      <div className="text-[8px] font-mono text-slate-400 opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -top-1 bg-slate-950 px-1 rounded">₦12,500</div>
                      <div className="w-7 bg-slate-850 hover:bg-slate-750 h-10 rounded-t-md transition-all"></div>
                      <span className="text-[8px] font-mono text-slate-500">9AM</span>
                    </div>
                    {/* Bar 2 */}
                    <div className="flex flex-col items-center gap-1.5 w-1/4 group/bar z-10">
                      <div className="text-[8px] font-mono text-slate-400 opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -top-1 bg-slate-950 px-1 rounded">₦15,000</div>
                      <div className="w-7 bg-slate-850 hover:bg-slate-750 h-[48px] rounded-t-md transition-all"></div>
                      <span className="text-[8px] font-mono text-slate-500">11AM</span>
                    </div>
                    {/* Bar 3 */}
                    <div className="flex flex-col items-center gap-1.5 w-1/4 group/bar relative z-10">
                      <div className="text-[7.5px] font-mono text-emerald-400 bg-emerald-950 px-1 rounded border border-emerald-900 border-b-none absolute top-4 z-20">₦35,000</div>
                      <div className="w-7 bg-emerald-500/50 hover:bg-emerald-400 h-[76px] rounded-t-md shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all"></div>
                      <span className="text-[8px] font-mono text-emerald-450 font-bold">1:30PM</span>
                    </div>
                    {/* Bar 4 */}
                    <div className="flex flex-col items-center gap-1.5 w-1/4 group/bar relative z-10">
                      <div className="text-[7.5px] font-mono text-emerald-400 bg-emerald-950 px-1 rounded border border-emerald-900 border-b-none absolute top-0 z-20">₦47,500</div>
                      <div className="w-7 bg-emerald-400 h-[96px] rounded-t-md shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all"></div>
                      <span className="text-[8px] font-mono text-emerald-400 font-extrabold">2:30PM</span>
                    </div>
                  </div>
                </div>

                {/* Team attribution list */}
                <div className="pt-3.5 space-y-1.5">
                  <p className="text-[9px] font-mono font-extrabold text-slate-500 uppercase">INBOX TEAM CASH ATTRIBUTION</p>
                  
                  {/* Chioma rep row */}
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-900/40">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center">CO</div>
                      <span className="font-semibold text-slate-200 text-[11px]">Chioma O. (Admin)</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-400 font-black">₦35,000 Won Today</span>
                  </div>

                  {/* Adeleke rep row */}
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-900/40">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white font-black text-[9px] flex items-center justify-center">AB</div>
                      <span className="font-semibold text-slate-200 text-[11px]">Adeleke Benson</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-300 font-bold">₦12,500 Invoiced</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM STRIP: REAL-TIME SECURE DEALS FEED */}
              <div className="col-span-12 bg-slate-900/40 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-25 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <h6 className="text-[10.5px] font-mono font-extrabold text-white uppercase tracking-wider">Verified Attributed Revenue Log</h6>
                    <p className="text-[8.5px] text-slate-500">Live Webhook Transactions with SMS status matching</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3 flex-1 justify-end max-w-2xl">
                  {/* Event item A */}
                  <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-850 px-3 py-1.5 rounded-xl text-[10.5px]">
                    <span className="bg-emerald-950 text-emerald-400 text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase">Won</span>
                    <span className="text-slate-300 font-semibold">Chioma O.</span>
                    <span className="text-emerald-400 font-mono font-black">₦35,000</span>
                    <span className="text-slate-500 text-[9px] font-mono ml-1">1h ago</span>
                  </div>

                  {/* Event item B */}
                  <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-850 px-3 py-1.5 rounded-xl text-[10.5px]">
                    <span className="bg-amber-950 text-amber-500 text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase font-black">Issued</span>
                    <span className="text-slate-300 font-medium">Adeleke B.</span>
                    <span className="text-amber-400 font-mono font-black">₦12,500</span>
                    <span className="text-slate-500 text-[9px] font-mono ml-1">2h ago</span>
                  </div>

                  {/* Event item C */}
                  <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-850 px-3 py-1.5 rounded-xl text-[10.5px] opacity-70">
                    <span className="bg-slate-900 text-slate-400 text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase">Logged</span>
                    <span className="text-slate-400">Fatima A.</span>
                    <span className="text-slate-400 font-mono">₦120,500 pending</span>
                    <span className="text-slate-500 text-[9px] font-mono ml-1">4h ago</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: PROBLEM AGITATION (The "Before" State) */}
      <section className="px-4 md:px-8 py-16 max-w-7xl mx-auto border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] text-red-400 font-mono font-black uppercase tracking-widest bg-red-950/20 px-3 py-1 rounded-full border border-red-900/40">
              The Problem
            </span>
            <h2 className="text-2xl md:text-4.5xl font-black text-white tracking-tight leading-none">
              You Lose Sales Every Day to <span className="text-red-500">WhatsApp Chaos</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Let's be honest — managing business on WhatsApp is a mess:
            </p>
            <div className="p-5 bg-slate-900/20 border border-red-900/20 rounded-2xl">
              <p className="text-xl font-black text-red-400">80%</p>
              <p className="text-[11px] text-slate-400 mt-1">
                of growing SMEs lose at least 30% of potential sales simply to forgotten follow-ups.
              </p>
              <p className="text-[9px] text-slate-500 font-mono mt-2">
                (Source: Internal survey, Lagos SME cohort 2026)
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3.5">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 hover:border-red-900/30 transition-all">
              <p className="text-xs font-bold text-red-300 flex items-center gap-2">
                <span>❌</span> The Follow-Up Graveyard
              </p>
              <p className="text-xs text-slate-400 mt-1 pl-6">
                You promised to call back 15 customers. You remembered 3. The other 12? They're now buying from your competitor.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 hover:border-red-900/30 transition-all">
              <p className="text-xs font-bold text-red-300 flex items-center gap-2">
                <span>❌</span> Double-Reply Disasters
              </p>
              <p className="text-xs text-slate-400 mt-1 pl-6">
                Your assistant and you both reply to the same customer with different prices. Now they think you're unprofessional.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 hover:border-red-900/30 transition-all">
              <p className="text-xs font-bold text-red-300 flex items-center gap-2">
                <span>❌</span> The Revenue Black Hole
              </p>
              <p className="text-xs text-slate-400 mt-1 pl-6">
                You know you made sales today, but you can't tell exactly how much came from WhatsApp vs. walk-ins or Instagram. You're guessing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 hover:border-red-900/30 transition-all">
              <p className="text-xs font-bold text-red-300 flex items-center gap-2">
                <span>❌</span> Notebook Amnesia
              </p>
              <p className="text-xs text-slate-400 mt-1 pl-6">
                You wrote customer details in a physical notebook. Now you can't find it. Or the page is torn. Or your pen ran out.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 hover:border-red-900/30 transition-all">
              <p className="text-xs font-bold text-red-300 flex items-center gap-2">
                <span>❌</span> The 2 AM Panic
              </p>
              <p className="text-xs text-slate-400 mt-1 pl-6">
                You wake up remembering you forgot to send that quote. But it's too late. They've already paid someone else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SOLUTION INTRODUCTION (The "After" State) */}
      <section className="px-4 md:px-8 py-16 max-w-7xl mx-auto border-t border-slate-900 bg-slate-900/10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-widest bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-900/40">
            The Solution
          </span>
          <h2 className="text-2xl md:text-4.5xl font-black text-white tracking-tight leading-none">
            Meet LeadZero: <span className="text-emerald-400">Your WhatsApp, But Organized</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
            LeadZero is the first sales inbox built specifically for growing businesses that run on WhatsApp. Not a complicated corporate system, not another app to learn. Just your WhatsApp conversations — organized, tracked, and turned into revenue.
          </p>
        </div>

        {/* 6 core benefits checklist */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-10">
          {[
            "Every WhatsApp chat in one searchable inbox",
            "Smart follow-up reminders so you never forget",
            "Team collaboration with zero double-replies",
            "Revenue tracking to see what WhatsApp makes you",
            "Personalized quick reply templates in seconds",
            "Full client history logs and customer segments"
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-200">{item}</span>
            </div>
          ))}
        </div>

        {/* VALUE PROPOSITION PILLARS (3-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-6xl mx-auto">
          <div className="p-6 bg-slate-900/60 border border-slate-900 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-black text-white">Never Forget a Follow-Up</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart reminders schedule themselves. Overdue callbacks turn red and jump to the top of your inbox queue. Your customers get called back — every single time.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-900 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-black text-white">Know Your Numbers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              See daily, weekly, and monthly revenue earned from WhatsApp. Track key metric conversion rates and view your high-value client segments instantly.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-900 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-black text-white">Stop Team Chaos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assign conversations to specific team members. Monitor agent typing activity to prevent embarrassing dual replies and keep track of who's selling.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURE SHOWCASE (6 Core Features) */}
      <section id="features" className="px-4 md:px-8 py-20 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-widest bg-emerald-950/30 px-3 py-1 rounded-full">
            Product Capability Specs
          </span>
          <h2 className="text-2xl md:text-4.5xl font-sans font-black text-white tracking-tight">
            Features Built Specially for Outbound SME Sales
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Transition instantly from offline chat spreadsheets into an organized sales machine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Feature 1: WHATSAPP UNIFIED INBOX */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-100">1. Unified WhatsApp Inbox</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stop scrolling through chaotic chat lists. LeadZero pulls every business conversational sequence into a single clean filterable pane. Search, prioritize, and click-reply instantly using your desktop PC keyboard.
              </p>
            </div>
            <ul className="text-[10px] space-y-1 text-slate-500 border-t border-slate-800 pt-3 font-mono">
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Real-time sync in 5 seconds</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Priority tag indicators</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Offline payload queue</li>
            </ul>
          </div>

          {/* Feature 2: SMART FOLLOW-UP REMINDERS */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-100">2. Smart Follow-Up Reminders</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Schedule follow-ups with one click: 1 hour, 4 hours, tomorrow, or next week. Reminders automatically trigger alerts in-app or via prompt. Overdue records turn red and move to the top of your inbox list.
              </p>
            </div>
            <ul className="text-[10px] space-y-1 text-slate-500 border-t border-slate-800 pt-3 font-mono">
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> One-click preset intervals</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Overdue red alarms</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Callback completion stats</li>
            </ul>
          </div>

          {/* Feature 3: TEAM COLLABORATION */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-100">3. Team Collaboration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Route conversations to specific agents in your storefront. Active collision prevention notifies you if someone else is currently scripting replies, protecting customer trust and brand credibility.
              </p>
            </div>
            <ul className="text-[10px] space-y-1 text-slate-500 border-t border-slate-800 pt-3 font-mono">
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Direct ticket assigning</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Agent presence indicators</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Internal teammate notes</li>
            </ul>
          </div>

          {/* Feature 4: REVENUE TRACKING */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-100">4. Live Revenue Metrics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Attribute sales volumes to won deals inside specific chats. Watch your cumulative cockpit performance gauges rise in NGN, evaluate conversion funnels, and export clean accounting lists.
              </p>
            </div>
            <ul className="text-[10px] space-y-1 text-slate-500 border-t border-slate-800 pt-3 font-mono">
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> NGN revenue metrics</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Filterable performance charts</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> PDF invoices download</li>
            </ul>
          </div>

          {/* Feature 5: QUICK REPLY TEMPLATES */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-100">5. Quick Reply Templates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Save pricing outlines, directions, or support intros. Insert them with a hotkey trigger. Variables like client name are pre-populated dynamically, keeping outbound communications lightning fast.
              </p>
            </div>
            <ul className="text-[10px] space-y-1 text-slate-500 border-t border-slate-800 pt-3 font-mono">
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> personalization tags</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Categorized canned replies</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Performance usage logs</li>
            </ul>
          </div>

          {/* Feature 6: CUSTOMER HISTORY */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-100">6. Complete Customer History</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Know every contact before you click write. The right context drawer reveals previous client purchases, active deal status, conversation dates, and specific internal notes in one profile sheet.
              </p>
            </div>
            <ul className="text-[10px] space-y-1 text-slate-500 border-t border-slate-800 pt-3 font-mono">
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Segment categorizing</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Client lifetime values</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Combined context records</li>
            </ul>
          </div>

        </div>
      </section>

      {/* DYNAMIC INTERACTIVE PLAYGROUND SIMULATOR (Sandbox Demo) */}
      <section id="simulator" className="px-4 md:px-8 py-16 max-w-7xl mx-auto border-t border-slate-900">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center animate-in fade-in duration-300">
            {/* Intro text col */}
            <div className="lg:col-span-5 space-y-6">
              <span className="bg-indigo-950/50 border border-indigo-900/60 text-indigo-400 text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Interactive Sandbox Demo
              </span>
              <h2 className="text-2xl md:text-3.5xl font-sans font-black text-white tracking-tight leading-none">
                Interactive Playground: Test-Drive LeadZero
              </h2>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Click a customer message on the simulated WhatsApp shell on the right, and see how LeadZero's automated workflow instantly handles tagging, followup scheduling, and Naira calculations!
              </p>

              {/* Live Workspace Metrics simulated widget */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 font-black uppercase tracking-wider">MOCK COCKPIT STATUS</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase">LIVE</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 border border-slate-850 rounded-lg">
                    <p className="text-slate-400 text-[9px] font-mono uppercase">Chats</p>
                    <p className="text-sm font-black text-slate-200 mt-1">{simMetrics.chatsReplied}</p>
                  </div>
                  <div className="p-2 border border-slate-850 rounded-lg">
                    <p className="text-slate-400 text-[9px] font-mono uppercase">Follow-ups</p>
                    <p className="text-sm font-black text-rose-400 mt-1">{simMetrics.followupsOverdue}</p>
                  </div>
                  <div className="p-2 border border-slate-850 rounded-lg">
                    <p className="text-slate-400 text-[9px] font-mono uppercase">Revenue</p>
                    <p className="text-xs font-mono font-black text-emerald-400 mt-1.5">₦{simMetrics.totalNairaWon.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Instructions badge */}
              <div className="flex items-center gap-2 p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-xs text-indigo-300">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Select active option A, B, or C inside the phone to dispatch.</span>
              </div>
            </div>

            {/* Simulated Live Workspace Display Col */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* WhatsApp mobile phone mockup layout */}
              <div className="bg-slate-950 rounded-3xl p-4 border border-slate-800 flex flex-col justify-between min-h-[380px] shadow-lg relative">
                {/* Header phone details */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <div className="w-2h-2 bg-emerald-500 w-2 h-2 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-200">Standard Client SIM</p>
                      <p className="text-[8px] text-slate-500 font-mono">Inbound Webhook Sync</p>
                    </div>
                  </div>
                  <Smartphone className="w-4 h-4 text-slate-600" />
                </div>

                {/* Simulated messages feed */}
                <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[220px] scrollbar-none">
                  <div className="bg-slate-900 border border-slate-800/60 p-2 rounded-xl rounded-tl-none mr-6 text-[10px] text-slate-350">
                    <p className="font-extrabold text-slate-500 text-[8px] font-mono mb-1 tracking-widest uppercase">CUSTOMER INQUIRY PIPELINE</p>
                    Our cleaners or reps are waiting! Click an option template below to respond:
                  </div>

                  {/* Outgoing clickable simulations */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSimOptionClick("A")}
                      className={`w-full text-left p-2.5 rounded-xl text-xs border transition-all cursor-pointer block ${
                        currSimChatOption === "A" 
                          ? "bg-slate-900 border-emerald-500 text-slate-100 shadow-md shadow-emerald-500/5 font-sans" 
                          : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 font-sans"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[8px] text-emerald-400 mb-1 font-black uppercase">
                        <span>OPTION A (PRICING INQUIRY)</span>
                        <span className="bg-emerald-950 px-1 rounded text-[7px]">₦35,000 Plan</span>
                      </div>
                      <p className="line-clamp-2 text-[10px] leading-snug">{SIM_OPTIONS.A.text}</p>
                    </button>

                    <button
                      onClick={() => handleSimOptionClick("B")}
                      className={`w-full text-left p-2.5 rounded-xl text-xs border transition-all cursor-pointer block ${
                        currSimChatOption === "B" 
                          ? "bg-slate-900 border-indigo-500 text-slate-100 shadow-md shadow-indigo-500/5 font-sans" 
                          : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 font-sans"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[8px] text-indigo-400 mb-1 font-black uppercase">
                        <span>OPTION B (URGENT DISINFECTION)</span>
                        <span className="bg-indigo-950 px-1 rounded text-[7px]">Snooze Alert</span>
                      </div>
                      <p className="line-clamp-2 text-[10px] leading-snug">{SIM_OPTIONS.B.text}</p>
                    </button>

                    <button
                      onClick={() => handleSimOptionClick("C")}
                      className={`w-full text-left p-2.5 rounded-xl text-xs border transition-all cursor-pointer block ${
                        currSimChatOption === "C" 
                          ? "bg-slate-900 border-rose-500 text-slate-100 shadow-md shadow-rose-500/5 font-sans" 
                          : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 font-sans"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[8px] text-rose-400 mb-1 font-black uppercase">
                        <span>OPTION C (CONTRACT PROCESS)</span>
                        <span className="bg-rose-950 px-1 rounded text-[7px]">Mark CRM WON</span>
                      </div>
                      <p className="line-clamp-2 text-[10px] leading-snug">{SIM_OPTIONS.C.text}</p>
                    </button>
                  </div>
                </div>

                {/* Send action */}
                <div className="pt-2 border-t border-slate-900 text-center">
                  <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">GATEWAY LINK STATUS: STABLE</span>
                </div>
              </div>

              {/* Interactive Dashboard Feed display */}
              <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 flex flex-col justify-between min-h-[380px] shadow-lg relative">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[10px] text-emerald-400 font-mono tracking-wider">LZ COCKPIT FEED</span>
                  </div>
                  <span className="bg-emerald-950 text-emerald-400 tracking-wider text-[8px] font-mono px-1.5 py-0.5 rounded font-black uppercase">Active Server</span>
                </div>

                <div className="flex-1 py-4 flex flex-col justify-center text-center space-y-4">
                  {currSimChatOption ? (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono uppercase text-slate-500 font-extrabold">PIPELINE SYNCHRONIZED</p>
                        <p className="text-xs font-bold text-slate-200">{SIM_OPTIONS[currSimChatOption as keyof typeof SIM_OPTIONS].actionResult}</p>
                        <p className="text-[10px] text-slate-400 leading-normal px-2.5 py-2 mt-2 bg-slate-950 rounded-lg border border-slate-850 font-sans">
                          {SIM_OPTIONS[currSimChatOption as keyof typeof SIM_OPTIONS].responseText}
                        </p>
                      </div>
                      
                      <div className="pt-2 bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl text-left">
                        <p className="text-[8px] font-mono text-emerald-400 tracking-wider uppercase font-black">Agent Outbound Reply Auto-Drafted:</p>
                        <p className="text-[10px] italic text-slate-300 mt-1 font-sans">"{SIM_OPTIONS[currSimChatOption as keyof typeof SIM_OPTIONS].replyDraft}"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-8">
                      <div className="mx-auto w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                        <Zap className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Standby Sandbox</p>
                      <p className="text-xs text-slate-450 px-4 leading-normal font-sans">
                        Select template Option A, B, or C in the phone mockup on the left to watch LeadZero process live sales workflows.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 text-center flex items-center justify-center gap-1.5">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Workspace Simulation Connected</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: HOW IT WORKS (3-Step Process) */}
      <section className="px-4 md:px-8 py-16 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-widest bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/40">
            How It Works
          </span>
          <h2 className="text-2xl md:text-4.5xl font-sans font-black text-white tracking-tight">
            From Chaos to Cash in 2 Minutes
          </h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            Standard setup takes 120 seconds. No developer or complex API tokens needed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
          
          <div className="p-6 bg-slate-900/45 border border-slate-900 rounded-2xl space-y-4 relative">
            <span className="absolute top-4 right-4 text-3xl font-black text-slate-800/60 font-sans">01</span>
            <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">
              30 Seconds
            </span>
            <h3 className="text-base font-extrabold text-white">1. CONNECT</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              <strong>Scan. Sync. Done.</strong> <br/>
              Register with your phone and store name. Scan our QR link using your native WhatsApp client. Conversations start flowing instantly.
            </p>
          </div>

          <div className="p-6 bg-slate-900/45 border border-slate-900 rounded-2xl space-y-4 relative">
            <span className="absolute top-4 right-4 text-3xl font-black text-slate-800/60 font-sans">02</span>
            <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">
              60 Seconds
            </span>
            <h3 className="text-base font-extrabold text-white">2. ORGANIZE</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              <strong>Tag. Assign. Schedule.</strong> <br/>
              Tag your active threads as 'Hot Lead'. Assign files or tasks to your colleagues. Setup a click-reminder to call back interested prospects.
            </p>
          </div>

          <div className="p-6 bg-slate-900/45 border border-slate-900 rounded-2xl space-y-4 relative">
            <span className="absolute top-4 right-4 text-3xl font-black text-slate-800/60 font-sans">03</span>
            <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">
              Ongoing
            </span>
            <h3 className="text-base font-extrabold text-white">3. CONVERT</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              <strong>Follow Up. Track. Grow.</strong> <br/>
              Get reminded on time. Mark transactions as Won to calculate real revenue trends. Watch your daily progressive sales chart rise securely.
            </p>
          </div>

        </div>

        {/* VISUAL TIMELINE */}
        <div className="max-w-4xl mx-auto bg-slate-950 rounded-2xl border border-slate-905 p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-900 p-2 rounded text-slate-400">00:00</span>
              <span className="text-xxs font-bold text-slate-300">Sign Up Store</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 rotate-90 sm:rotate-0" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-emerald-950/40 border border-emerald-900/30 p-2 rounded text-emerald-400">00:30</span>
              <span className="text-xxs font-bold text-slate-300">Scan QR Link</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 rotate-90 sm:rotate-0" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-900 p-2 rounded text-slate-400">01:00</span>
              <span className="text-xxs font-bold text-slate-300">Tag & Assign Reminders</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 rotate-90 sm:rotate-0" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-emerald-950/40 border border-emerald-900/30 p-2 rounded text-emerald-400">02:00</span>
              <span className="text-xxs font-bold text-emerald-400">First Follow-up Reminder Reminds Rep</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: SOCIAL PROOF & TESTIMONIALS */}
      <section className="px-4 md:px-8 py-16 max-w-7xl mx-auto space-y-12 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-widest bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-900/40">
            SME Validation
          </span>
          <h2 className="text-2xl md:text-3.5xl font-black text-white tracking-tight leading-none mt-3">
            Trusted by SMEs Who Used to Lose Sales
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex gap-1 text-emerald-400">
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "I used to forget 30% of my booking inquiries. Now LeadZero reminds me to call back every single customer. I've doubled my monthly bookings without hiring anyone else."
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-white">— Chioma O.</p>
              <p className="text-[10px] font-mono text-slate-500">Chioma's Cleaning Services, Lagos</p>
            </div>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex gap-1 text-emerald-400">
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "My two assistants used to reply to the same customer with different prices. Now I assign conversations, track who's selling what, and I know my exact daily revenue. No more guessing."
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-white">— Emeka K.</p>
              <p className="text-[10px] font-mono text-slate-500">Oshodi Phone Hub</p>
            </div>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex gap-1 text-emerald-400">
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
                <Star className="w-4 h-4 fill-emerald-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "I used to spend ₦50K on advertisement leads with no idea if registrations increased. Now I tag inquiries by source and track which become paying students. ROI is finally clear."
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-white">— Fatima A.</p>
              <p className="text-[10px] font-mono text-slate-500">Bright Academy, Abuja</p>
            </div>
          </div>

        </div>

        {/* TRUST METRICS BAR */}
        <div className="max-w-4xl mx-auto p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">
            <div>
              <p className="text-emerald-400 text-sm font-sans font-black">₦50M+</p>
              <p className="text-[9px] text-slate-500 mt-1">Sales Tracked</p>
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-sans font-black">200+</p>
              <p className="text-[9px] text-slate-500 mt-1">Active SMEs</p>
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-sans font-black">4.5/5</p>
              <p className="text-[9px] text-slate-500 mt-1">Customer Rating</p>
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-sans font-black">40%</p>
              <p className="text-[9px] text-slate-500 mt-1">Upgrades Rate</p>
            </div>
          </div>
        </div>

        {/* LOGO CLOUD */}
        <div className="pt-4 text-center space-y-3">
          <p className="text-[9px] uppercase font-mono tracking-widest text-slate-600 font-bold">Trusted by Associated Cohorts & Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-slate-500 text-xs font-extrabold uppercase tracking-wider">
            <span className="p-2 border border-slate-900 rounded-lg bg-slate-950">Lagos Realtor Association</span>
            <span className="p-2 border border-slate-900 rounded-lg bg-slate-950">NACCIMA</span>
            <span className="p-2 border border-slate-900 rounded-lg bg-slate-950">SMEDAN</span>
            <span className="p-2 border border-slate-900 rounded-lg bg-slate-950">Lagos Chamber of Commerce</span>
            <span className="p-2 border border-slate-900 rounded-lg bg-slate-950">Abuja SME Cluster</span>
          </div>
        </div>
      </section>

      {/* SECTION 7: PRICING */}
      <section id="pricing" className="px-4 md:px-8 py-16 max-w-7xl mx-auto space-y-12 border-t border-slate-900 bg-slate-905/30">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-widest bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-900/40">
            Secure Native Payments
          </span>
          <h2 className="text-2xl md:text-4.5xl font-sans font-black text-white tracking-tight">
            Simple Pricing. No Credits. No Confusion.
          </h2>
          <p className="text-xs text-slate-400 leading-normal max-w-lg mx-auto">
            Pay what you can afford. Upgrade when ready. Downgrade anytime with zero customer records loss.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Plan 1: FREE */}
          <div className="p-6 md:p-8 bg-slate-900/60 border border-slate-900 rounded-3xl space-y-6 hover:border-slate-800 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-slate-400">PLAN 1: FREE</h3>
                <p className="text-slate-500 text-[10px] mt-1 font-sans">For solo operators testing sandbox features</p>
              </div>
              <div className="pt-2">
                <span className="text-4xl font-sans font-black text-white">₦0</span>
                <span className="text-slate-500 text-xs font-mono font-bold"> / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-850 font-sans">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 1 workspace user support seat</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 100 conversations/month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Basic inbox categorizing & tagging</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 5 personalized quick reply templates</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 7-day conversation buffer access</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Basic follow-up notifications</li>
              </ul>
            </div>
            <button 
              onClick={handleStartRegisterProcess}
              className="mt-6 w-full py-3 rounded-xl bg-slate-950 text-slate-300 font-extrabold text-xs hover:bg-slate-900 transition-colors border border-slate-850 cursor-pointer block text-center uppercase tracking-wide"
            >
              Start Free Forever
            </button>
          </div>

          {/* Plan 2: GROWTH */}
          <div className="p-6 md:p-8 bg-slate-900 border-2 border-emerald-500 rounded-3xl space-y-6 shadow-2xl relative flex flex-col justify-between">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-slate-950 text-[9px] font-mono font-black px-3 py-1 rounded-full uppercase tracking-widest">
              ⭐ MOST POPULAR
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-emerald-400">PLAN 2: GROWTH</h3>
                <p className="text-slate-300 text-[10px] mt-1 font-sans">Perfect for growing SME sales teams</p>
              </div>
              <div className="pt-2">
                <span className="text-4xl font-sans font-black text-white">₦5,000</span>
                <span className="text-slate-400 text-xs font-mono font-bold"> / month</span>
                <p className="text-[10px] font-mono font-bold text-emerald-400 mt-1 uppercase tracking-wider">
                  💡 Annual: ₦50,000/year (2 months free)
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-slate-800 font-sans">
                <li className="flex items-center gap-2 font-bold"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Everything in Free, plus:</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 2 team user representatives</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Unlimited conversation linking</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-505 shrink-0" /> Unlimited Quick Reply templates</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Team assignments & collision locks</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Live Revenue CRM Cockpit & tracking</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 30-day conversational history visible</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Offline CSV/PDF receipt downloading</li>
              </ul>
            </div>
            <button 
              onClick={handleStartRegisterProcess}
              className="mt-6 w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all cursor-pointer block text-center uppercase tracking-wide shadow-lg shadow-emerald-500/10"
            >
              Start 14-Day Free Trial
            </button>
          </div>

          {/* Plan 3: PRO */}
          <div className="p-6 md:p-8 bg-slate-900/60 border border-slate-900 rounded-3xl space-y-6 hover:border-slate-800 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-slate-400">PLAN 3: PRO</h3>
                <p className="text-slate-500 text-[10px] mt-1 font-sans">For multi-employee sales shops ready to scale</p>
              </div>
              <div className="pt-2">
                <span className="text-4xl font-sans font-black text-white">₦15,000</span>
                <span className="text-slate-500 text-xs font-mono font-bold"> / month</span>
                <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">
                  💡 Annual: ₦150,000/year (2 months free)
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-850 font-sans">
                <li className="flex items-center gap-2 font-bold"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Everything in Growth, plus:</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited team member seats</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited conversational logs records</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> AI-guided smart quick reply suggestions</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Smart follow-up timing analytics</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Scheduled automated reports</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Direct API access & webhooks integrations</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Dedicated priority support agent</li>
              </ul>
            </div>
            <button 
              onClick={handleStartRegisterProcess}
              className="mt-6 w-full py-3 rounded-xl bg-slate-950 text-slate-300 font-extrabold text-xs hover:bg-slate-900 transition-colors border border-slate-850 cursor-pointer block text-center uppercase tracking-wide"
            >
              Start 14-Day Free Trial
            </button>
          </div>

        </div>

        {/* PRICING TRUST SIGNALS */}
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 pt-4 text-center text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> Paystack Secured Gateway</span>
          <span>•</span>
          <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-emerald-400" /> Auto invoice PDFs delivered</span>
          <span>•</span>
          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> 3-day failed payment grace buffer</span>
          <span>•</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-450" /> Prorated instant changes</span>
        </div>
      </section>

      {/* SECTION 8: FAQ SECTION */}
      <section id="faqs" className="px-4 md:px-8 py-25 max-w-4xl mx-auto space-y-10 border-t border-slate-900">
        <div className="text-center space-y-3">
          <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-widest bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/40">
            Got Questions?
          </span>
          <h2 className="text-2xl md:text-4xl font-sans font-black text-white tracking-tight">
            Frequently Answered Queries
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = activeAccordion === i;
            return (
              <div key={i} className="bg-slate-900/40 border border-slate-900 hover:border-slate-850 transition-all rounded-2xl overflow-hidden font-sans">
                <button
                  type="button"
                  onClick={() => setActiveAccordion(isOpen ? null : i)}
                  className="w-full text-left p-5 flex items-center justify-between text-xs font-bold text-slate-200 cursor-pointer focus:outline-none"
                >
                  <span>{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-905">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 9: FINAL CTA */}
      <section className="px-4 md:px-8 py-16 text-center max-w-5xl mx-auto">
        <div className="p-8 md:p-14 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-widest bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-950/30 mb-4">
            Start Organizing
          </span>
          <h2 className="text-2xl md:text-4.5xl font-sans font-black text-white leading-tight">
            Stop Losing Sales to WhatsApp Chaos.
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-4 max-w-2xl font-medium leading-relaxed font-sans">
            Join 200+ African SMEs who've turned their WhatsApp into a revenue-tracking sales machine. Free forever. No credit card required. Setup in 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 w-full sm:w-auto">
            <button
              onClick={handleStartRegisterProcess}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-8 py-3.5 rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            >
              Start Free — Get Organized in 2 Minutes
            </button>
            <button
              onClick={onBypassOnboarding}
              className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs px-6 py-3.5 rounded-xl cursor-pointer"
            >
              💬 Chat with Us on WhatsApp
            </button>
          </div>

          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl mt-6">
            <p className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider uppercase">
              ⚡ Urgent Limit: First 50 Growth signups this month get a free onboarding call worth ₦15,000!
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 md:px-8 py-14 text-center text-slate-500 text-[10px] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 text-slate-950 font-black w-5 h-5 rounded flex items-center justify-center text-[10px]">LZ</div>
            <span className="font-extrabold text-slate-400 font-sans text-xs tracking-tight">LeadZero</span>
          </div>
          <div>
            &copy; 2026 LeadZero Technologies. All rights reserved. Registered under local offline CRM protocol rules.
          </div>
          <div className="flex gap-4">
            <button onClick={onBypassOnboarding} className="hover:text-slate-300">Sandbox Console</button>
            <span className="text-slate-800">|</span>
            <button onClick={handleStartRegisterProcess} className="hover:text-slate-300">Register</button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap text-slate-600 text-[9px] uppercase tracking-wider font-mono">
          <span>🔒 NDPR Compliant</span>
          <span>💳 Paystack Secured</span>
          <span>📱 Mobile-First</span>
          <span>⏱️ 99.5% Uptime</span>
        </div>
      </footer>

      {/* AUTHENTICATION / ONBOARDING ENHANCED MODAL POPUP OVERLAY */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden animate-fade-in font-sans">
            {/* Glowing background decor */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
            
            <button
              onClick={() => setShowAuthForm(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 cursor-pointer p-1 rounded-full hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            {onboardingStep === "form" && (
              <div className="space-y-5">
                <div className="text-center">
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                    {authMode === "register" ? "STEP 1: INITIAL REGISTRATION" : "LOGIN PRESETS"}
                  </span>
                  <h3 className="text-lg font-black text-white mt-3">
                    {authMode === "register" ? "Configure Your Business Store" : "Access Registered SME Console"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-sans leading-normal">
                    {authMode === "register" ? "Seed details to bootstrap your sales workspace." : "Enter credentials for standard admin dashboard profile."}
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {authMode === "register" ? (
                    <>
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-mono text-slate-400 font-bold">Business Registered Name</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={bizName}
                            onChange={(e) => setBizName(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs w-full text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                            placeholder="e.g. Alaba Electronics Hub"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-mono text-slate-400 font-bold">Workspace Primary Support WhatsApp Number</label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs w-full text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                            placeholder="e.g. +234 803 000 0000"
                            required
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-mono text-slate-400 font-bold">Employee Account Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs w-full text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                            placeholder="admin@workspace.ng"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-mono text-slate-400 font-bold">Password Credentials</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs w-full text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-lg mt-2 flex items-center justify-center gap-1.5"
                    disabled={formLoading}
                  >
                    {formLoading ? "Attributing..." : (
                      <>
                        Configure Gateway Console <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  {onLoginAsAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthForm(false);
                        onLoginAsAdmin();
                      }}
                      className="w-full bg-slate-950 hover:bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono shadow-sm"
                    >
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>⚡ 1-Click Login as Admin (zeerocodes@gmail.com)</span>
                    </button>
                  )}
                </form>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}
                    className="text-[10px] text-emerald-400 underline font-mono cursor-pointer bg-none border-none font-bold"
                  >
                    {authMode === "register" ? "🔓 Already configured? Use employee login" : "🔒 Register brand new store instead"}
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === "qr" && (
              <div className="space-y-5 text-center py-6">
                <span className="bg-amber-500/20 text-amber-400 text-[9px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                  STEP 2: ENCRYPTED WHATSAPP LINKING
                </span>
                <h3 className="text-lg font-black text-white mt-3">Scan Webhook QR Code Gateway</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Scan this interactive barcode with your WhatsApp Mobile app to sync all customer threads back here instantly.
                </p>

                <div className="mx-auto w-44 h-44 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 relative">
                  {!qrScanned ? (
                    <>
                      <QrCode className="w-28 h-28 text-slate-450 animate-pulse" />
                      <div className="absolute inset-x-8 bottom-4">
                        <div className="w-full bg-slate-900 rounded-full h-1 pl-1 pr-1">
                          <div className="bg-emerald-400 h-1 rounded-full transition-all duration-300" style={{ width: `${qrProgress}%` }}></div>
                        </div>
                        <p className="text-[8px] font-mono text-slate-500 mt-1 uppercase">Link Authorization: {qrProgress}%</p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto transition-transform duration-200">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <p className="text-xxs font-mono text-emerald-400 font-extrabold uppercase mt-1">WEBHOOK DEPLOYED LIVE</p>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  {!qrScanned ? "Do not close this panel. Automatic identification is in progress..." : "Redirecting to standard onboarding systems..."}
                </p>
              </div>
            )}

            {onboardingStep === "tour" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[9px] tracking-widest font-bold uppercase py-1 px-2.5 rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    {tourSteps[tourStep].badge}
                  </span>
                  
                  <div className="flex gap-1.5">
                    {tourSteps.map((_, i) => (
                      <div key={i} className={`h-1 w-4 rounded-full transition-all ${i === tourStep ? "bg-emerald-500" : "bg-slate-800"}`} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    {tourSteps[tourStep].title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {tourSteps[tourStep].description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                  <button
                    onClick={handleFinishOnboarding}
                    className="text-[11px] text-slate-500 hover:text-slate-300 font-bold cursor-pointer font-sans"
                  >
                    Bypass Tour
                  </button>
                  
                  <div className="flex gap-2">
                    {tourStep > 0 && (
                      <button
                        onClick={() => setTourStep(prev => prev - 1)}
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        Back
                      </button>
                    )}
                    
                    {tourStep < tourSteps.length - 1 ? (
                      <button
                        onClick={() => setTourStep(prev => prev + 1)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black px-4.5 py-1.5 rounded-lg cursor-pointer transition-all"
                      >
                        Next Screen
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishOnboarding}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black px-5 py-1.5 rounded-lg cursor-pointer transition-all shadow-md shadow-emerald-500/20"
                      >
                        Enter Workspace 🚀
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
