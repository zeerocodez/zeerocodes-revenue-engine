import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  BarChart3, 
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Rocket,
  LogIn
} from 'lucide-react';
import { useApp } from '../AppContext';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const INDUTRIES = [
  'Real Estate',
  'Home Services',
  'Education',
  'Beauty',
  'Healthcare',
  'SaaS / Tech',
  'E-commerce',
  'Other'
];

const Register = () => {
  const { completeRegistration, user, login, isAuthProcessing } = useApp();
  const [isDeploying, setIsDeploying] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    industry: 'Real Estate',
    monthlyVolume: '10-50',
    pricingTier: 'Starter' as 'Starter' | 'Pro' | 'Enterprise'
  });

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: prev.contactName || user.displayName || '',
        email: user.email || prev.email || ''
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setIsDeploying(true);
    try {
      await completeRegistration(formData);
    } catch (error) {
      console.error("Deployment failed:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-coral-500/5 blur-[150px] rounded-full -mr-96 -mt-96" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full -ml-48 -mb-48" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="mb-8 flex justify-between items-center bg-white/5 border border-white/5 rounded-2xl p-3 pr-4">
          <Link to="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/45 hover:text-white transition-all group bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/10 rounded-xl">
            <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-coral-500 fill-current" />
            <span className="text-[9px] font-black uppercase text-coral-500 tracking-tighter">Bonus: 100 Credits Locked</span>
          </div>
        </div>

        <div className="bg-navy-900 border border-white/10 rounded-[3rem] p-8 lg:p-14 shadow-2xl relative overflow-hidden">
          {!user ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="mb-10 text-center flex flex-col items-center">
                <div className="mb-6">
                  <Logo />
                </div>
                <h1 className="text-3xl lg:text-4xl font-black italic tracking-tighter text-white uppercase mb-4 leading-none">
                  START YOUR <span className="text-coral-500">FREE TRIAL.</span>
                </h1>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
                  Sign in with Google first to authenticate your identity, then proceed to configure your trial settings.
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <button 
                  onClick={login}
                  disabled={isAuthProcessing}
                  className="w-full group relative flex items-center justify-center gap-4 bg-white text-navy-950 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/10 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {isAuthProcessing ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full"
                      />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Continue with Google
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 py-3 bg-coral-500/10 border border-coral-500/20 rounded-2xl">
                  <Zap className="w-3 h-3 text-coral-500 fill-current" />
                  <span className="text-[9px] font-black text-coral-500 uppercase tracking-widest leading-none">100 FREE CREDITS APPLIED IMMEDIATELY</span>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-white/5">
                <div className="flex items-center justify-center gap-4 text-white/20">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-navy-900 bg-white/10" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                    Joined by 500+ business owners
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="flex gap-2 mb-12">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-500",
                      s <= step ? "bg-coral-500" : "bg-white/5"
                    )}
                  />
                ))}
              </div>

              <div className="mb-10 text-center flex flex-col items-center">
                <div className="mb-6">
                  <Logo />
                </div>
                <h1 className="text-3xl lg:text-4xl font-black italic tracking-tighter text-white uppercase mb-2">
                  SETUP YOUR <span className="text-coral-500">HEADQUARTERS.</span>
                </h1>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Step {step}: {step === 1 ? 'Business Identity' : step === 2 ? 'Operational Scope' : 'Review & Deploy'}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {step === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-2">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        required
                        type="text" 
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-coral-500/50 transition-colors font-bold text-sm"
                        placeholder="e.g. Legacy Ventures"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-2">Contact Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        required
                        type="text" 
                        value={formData.contactName}
                        onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-coral-500/50 transition-colors font-bold text-sm"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-2">Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white opacity-60 focus:outline-none font-bold text-sm"
                        readOnly
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        required
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-coral-500/50 transition-colors font-bold text-sm"
                        placeholder="+234..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 ml-2">Primary Industry</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {INDUTRIES.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setFormData({...formData, industry: ind})}
                        className={cn(
                          "px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.industry === ind 
                            ? "bg-coral-500 border-coral-500 text-white shadow-lg shadow-coral-500/20" 
                            : "bg-white/2 border-white/5 text-white/40 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 ml-2">Monthly Lead Volume</label>
                    <select 
                      value={formData.monthlyVolume}
                      onChange={(e) => setFormData({...formData, monthlyVolume: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-coral-500/50 transition-colors font-bold text-sm appearance-none"
                    >
                      <option value="1-10" className="bg-navy-900">1-10 leads / mo</option>
                      <option value="10-50" className="bg-navy-900">10-50 leads / mo</option>
                      <option value="50-200" className="bg-navy-900">50-200 leads / mo</option>
                      <option value="200+" className="bg-navy-900">200+ leads / mo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 ml-2">Preferred Tier</label>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                      {['Starter', 'Pro', 'Enterprise'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({...formData, pricingTier: t as any})}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            formData.pricingTier === t 
                              ? "bg-white text-navy-950 shadow-lg" 
                              : "text-white/20 hover:text-white"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-white/2 border border-white/5 rounded-[2rem] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-coral-500/10 flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-coral-500" />
                      </div>
                      <div>
                        <h3 className="text-white font-black uppercase tracking-tight">{formData.companyName}</h3>
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">{formData.industry} • {formData.pricingTier} Plan</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-white/20 mb-1">Contact</p>
                      <p className="text-xs font-bold text-white">{formData.contactName}</p>
                    </div>
                    <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-white/20 mb-1">Volume</p>
                      <p className="text-xs font-bold text-white">{formData.monthlyVolume} / mo</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-green-500/5 border border-green-500/10 rounded-2xl">
                  <ShieldCheck className="w-6 h-6 text-green-500 shrink-0" />
                  <p className="text-[10px] font-bold text-green-500/80 leading-relaxed uppercase tracking-wider">
                    CLAIM YOUR 100 FREE CREDITS (₦10,000 VALUE) UPON DEPLOYMENT. ENJOY UNINTERRUPTED LEAD FLOW.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex items-center gap-4 pt-4">
              {step > 1 && (
                <button 
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-8 py-5 rounded-[2rem] border border-white/10 text-white/40 font-black uppercase tracking-widest text-[10px] hover:text-white hover:border-white/20 transition-all"
                >
                  Back
                </button>
              )}
              <button 
                type="submit"
                disabled={isDeploying}
                className={cn(
                  "flex-1 group flex items-center justify-center gap-3 bg-white text-navy-950 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5",
                  isDeploying && "opacity-50 cursor-not-allowed"
                )}
              >
                {isDeploying ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full"
                    />
                    Deploying HQ...
                  </>
                ) : (
                  <>
                    {step === 3 ? 'Deploy HQ' : 'Continue'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
          </>)}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Zap className="w-4 h-4 text-coral-500" />
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">SpeedCall Africa Deployment Protocol</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
