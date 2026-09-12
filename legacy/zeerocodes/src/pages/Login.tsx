import React from 'react';
import { motion } from 'motion/react';
import { Zap, LogIn, ArrowRight } from 'lucide-react';
import { useApp } from '../AppContext';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const Login = () => {
  const { login, isAuthProcessing } = useApp();

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-coral-500/10 blur-[150px] rounded-full -mr-96 -mt-96 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -ml-48 -mb-48" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-navy-900 border border-white/10 rounded-[3rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <Zap className="w-12 h-12 text-coral-500/20" />
          </div>

          <div className="mb-10 flex justify-between items-center bg-white/5 border border-white/5 rounded-2xl p-3 pr-4">
            <Link to="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/45 hover:text-white transition-all group bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/10 rounded-xl">
              <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase text-coral-500">Secure Portal</div>
          </div>

          <div className="mb-12 relative">
            <div className="mb-6">
              <Logo />
            </div>
            <p className="text-white/40 text-sm font-bold leading-relaxed">
              Sign in to manage your high-intent leads and sales pipeline.
            </p>
          </div>

          <div className="space-y-4">
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
              <span className="text-[9px] font-black text-coral-500 uppercase tracking-widest leading-none">Get 100 Free Credits on signup</span>
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-white/5">
            <div className="flex items-center gap-4 text-white/20">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-navy-900 bg-white/10" />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                Joined by 500+ agents
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            Enterprise Grade Security • EU-West-2 Region
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
