import React from 'react';
import { Terminal, Shield } from 'lucide-react';

const Logo: React.FC<{ className?: string; textClassName?: string }> = ({ className = "", textClassName = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center w-10 h-10 rounded-[12px] bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white shadow-lg shadow-emerald-500/10">
        <Shield className="w-5 h-5 absolute text-white/90 animate-pulse" />
        <Terminal className="w-3.5 h-3.5 text-emerald-200 ml-1.5 mt-1.5" />
      </div>
      <div className="flex flex-col">
        <span className={`font-sans font-bold text-lg tracking-tight text-white ${textClassName}`}>
          ZEERO<span className="text-emerald-400">CODES</span>
        </span>
        <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-400 font-medium">
          AUTOMATION OS
        </span>
      </div>
    </div>
  );
};

export default Logo;
