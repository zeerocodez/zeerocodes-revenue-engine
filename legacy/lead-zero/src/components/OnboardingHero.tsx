/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingHeroProps {
  onComplete: (businessName: string, phone: string, email?: string) => void;
  onCloseTour: () => void;
  showTourOnly?: boolean;
}

export default function OnboardingHero({
  onComplete,
  onCloseTour,
  showTourOnly = false
}: OnboardingHeroProps) {
  const [step, setStep] = useState<"register" | "qr" | "tour">(showTourOnly ? "tour" : "register");
  
  // Registration and Switcher state
  const [formMode, setFormMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [bizName, setBizName] = useState("Chioma's Cleaning Services");
  const [phone, setPhone] = useState("+234 803 111 2222");
  const [password, setPassword] = useState("••••••••");
  const [isLoading, setIsLoading] = useState(false);

  // QR state
  const [qrScanned, setQrScanned] = useState(false);
  const [qrProgress, setQrProgress] = useState(0);

  // Tour State
  const [tourStep, setTourStep] = useState(0);

  // Progress scanner
  useEffect(() => {
    let interval: any;
    if (step === "qr" && !qrScanned) {
      interval = setInterval(() => {
        setQrProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setQrScanned(true);
              // auto advance to tour after success after 1s
              setTimeout(() => {
                setStep("tour");
              }, 1500);
            }, 500);
            return 100;
          }
          return prev + 15;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [step, qrScanned]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === "register") {
      if (!bizName || !phone) return;
    } else {
      if (!email) return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("qr");
    }, 800);
  };

  const handleFinishOnboarding = () => {
    onComplete(
      formMode === "login" ? "Zeero Codes Enterprise" : bizName,
      formMode === "login" ? "+234 809 999 0000" : phone,
      formMode === "login" ? email : undefined
    );
  };

  const tourSteps = [
    {
      title: "Step 1: The Unified Inbox",
      description: "All of your client's WhatsApp messages flow here in real-time. Direct thread indexing, unread badge alerts, and internal rep-level handoff notes means no message is ever forgotten.",
      badge: "Inbox Active"
    },
    {
      title: "Step 2: Smart Follow-ups",
      description: "Schedule reminders with 1-click preset intervals (1 hour, 4 hours, 1 day, custom intervals). When due, items escalate inside the queue in red, triggering push alerts.",
      badge: "No More Forgotten Leads"
    },
    {
      title: "Step 3: Revenue Dashboard",
      description: "Directly track Naira sales volume with Won/Lost status marking. Compare trends side-by-side, view rep performance leaderboard tables, and export accounting reports instantaneously.",
      badge: "Turn Chats Into Cash"
    }
  ];

  if (step === "tour") {
    return (
      <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div id="tour-card" className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 md:p-8 text-slate-100 shadow-2xl relative overflow-hidden">
          {/* Decorative glowing gradient */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
          
          {/* Exit Option (Close Icon) */}
          <button 
            onClick={onCloseTour} 
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-slate-810 transition-all z-10"
            title="Exit Tour"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-between items-center mb-6 mr-6">
            <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[10px] tracking-widest font-bold uppercase py-1 px-2.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {tourSteps[tourStep].badge}
            </span>
            <div className="flex gap-1">
              {tourSteps.map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i === tourStep ? "bg-emerald-500" : "bg-slate-800"}`} />
              ))}
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-bold font-sans tracking-tight mb-3">
            {tourSteps[tourStep].title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            {tourSteps[tourStep].description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
            <button
              onClick={onCloseTour}
              className="text-xs text-slate-500 hover:text-slate-350 font-bold cursor-pointer flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Exit Tour
            </button>
            
            <div className="flex gap-2">
              {tourStep > 0 && (
                <button
                  onClick={() => setTourStep(p => p - 1)}
                  className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold cursor-pointer text-slate-300"
                >
                  Back
                </button>
              )}
              {tourStep < tourSteps.length - 1 ? (
                <button
                  onClick={() => setTourStep(p => p + 1)}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg text-xs font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Next Section <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={handleFinishOnboarding}
                  className="px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  Launch LeadZero Workspace
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      {/* Dynamic Background Grid Decorator */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

      <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-4xl w-full z-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        {/* Value Proposition Left Banner */}
        <div className="md:col-span-7 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-5 w-fit">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span className="text-[10px] font-mono tracking-wider text-emerald-300 font-bold uppercase">LeadZero v2 • Live in Africa</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold font-sans tracking-tight text-white mb-4 leading-tight">
            Stop losing WhatsApp sales to chaos.
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
            Centralize your SME’s WhatsApp chats, delegate inquiries across your sales team, track real pricing/sales values in Naira, and never miss an overdue follow-up callback.
          </p>

          <div className="space-y-3.5">
            {[
              "Rule-Based Baileys Web Integration — Connect in 10s",
              "Smart reminder queues with red highlights when overdue",
              "Won/Lost outcome markers & sales dashboard tracker",
              "Paystack NGN local payment & team collaboration lock system"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <Check className="w-3" />
                </div>
                <span className="text-xs text-slate-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Card Form Right */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl relative">
          
          <AnimatePresence mode="wait">
            {step === "register" && (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* Form Mode Tabs */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode("register");
                      setEmail("");
                    }}
                    className={`flex-1 text-center py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      formMode === "register"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Register Business
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode("login");
                      setEmail("zeerocodes@gmail.com");
                    }}
                    className={`flex-1 text-center py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      formMode === "login"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Super Admin Portal
                  </button>
                </div>

                {formMode === "register" ? (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-bold">Register Business</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" /> Phone number is your primary ID. No cards required.
                      </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Business Name</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={bizName}
                            onChange={(e) => setBizName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="e.g. Chioma's Cleaners"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">African Phone Number</label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="+234 803 123 4567"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Set Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Master password"
                            required
                            disabled
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 bg-emerald-500 text-slate-950 py-3 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                      >
                        {isLoading ? "Starting Session..." : "Get Started Instantly"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    <div className="mt-5 text-center bg-slate-850/50 p-2.5 rounded-lg border border-slate-800/40">
                      <p className="text-[10px] text-slate-400 leading-normal">
                        By registering you access our fully configured **Growth tier** (with ₦5,000/mo Paystack billing access, 3 seat assignments, unlimited leads, and follow-ups).
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-bold">Authorized Admin Sign In</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Shield className="w-3.5 h-3.5 text-red-500 font-bold" /> Authenticate your secure administrator email key.
                      </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Administrator Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="zeerocodes@gmail.com"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-semibold">Secure PIN</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="password"
                            value="••••••••"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none cursor-not-allowed opacity-60"
                            disabled
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 bg-emerald-500 text-slate-950 py-3 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                      >
                        {isLoading ? "Validating Admin..." : "Unlock Admin Workspace"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    <div className="mt-5 text-center bg-red-950/20 p-3 rounded-lg border border-red-900/30">
                      <p className="text-[10px] text-red-300 leading-normal font-medium">
                        Enter your specific email <code className="bg-red-950/40 px-1 py-0.5 rounded text-white text-[10.5px]">zeerocodes@gmail.com</code> above to sign-in directly to the Super Admin Dashboard and workspace locks.
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {step === "qr" && (
              <motion.div
                key="qr-sync"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-100">Establish Baileys Sync</h3>
                  <p className="text-xs text-slate-400 mt-1">Scan the QR code within your WhatsApp menu to bind this device instantly.</p>
                </div>

                {/* QR Screen Wrapper */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 inline-block my-3 relative">
                  <div className="relative w-44 h-44 mx-auto bg-white p-3 rounded-lg shadow-xl flex items-center justify-center">
                    <QrCode className="w-full h-full text-slate-950" />
                    
                    {/* Animated Line Scanner overlay */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-bounce"></div>

                    {qrScanned && (
                      <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center text-slate-950 font-bold text-xs rounded-lg p-2 transition-all">
                        <CheckCircle className="w-10 h-10 mb-2 animate-bounce shrink-0" />
                        WhatsApp Connected!
                      </div>
                    )}
                  </div>

                  {/* Simulator action info */}
                  <div className="mt-4 text-[10px] font-mono text-emerald-400 text-center">
                    {!qrScanned ? `Connecting via proxy... ${qrProgress}%` : "Ingesting actual conversations..."}
                  </div>
                </div>

                <div className="space-y-2 text-left bg-slate-850/60 p-3 rounded-lg border border-slate-800 text-xs">
                  <p className="font-semibold text-slate-200">How to Connect:</p>
                  <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11px]">
                    <li>Open WhatsApp on your cellular device.</li>
                    <li>Tap menu options &gt; select Linked Devices.</li>
                    <li>Scan this displayed LeadZero code and wait 5s.</li>
                  </ol>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => {
                      setQrScanned(true);
                      setTimeout(() => {
                        setStep("tour");
                      }, 1000);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white py-2 px-4 rounded text-xs font-bold text-slate-300 cursor-pointer"
                  >
                    Simulate Camera Scan (Connects Instantly)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
