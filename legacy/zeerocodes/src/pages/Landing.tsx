import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Star, 
  MessageSquare, 
  ArrowRight,
  Database,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Zap,
  Calendar,
  Phone,
  Mail,
  Building2,
  ChevronRight,
  Play,
  X,
  Target,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import Logo from '../components/Logo';

const VideoModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy-950/90 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-5xl aspect-video bg-navy-900 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        
        <iframe 
          className="w-full h-full"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
          title="Zeerocodes CRM Demo Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </motion.div>
    </div>
  );
};

const Landing = () => {
  const { user } = useApp();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = React.useState(false);

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const cleanId = targetId.replace('#', '');
    const element = document.getElementById(cleanId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const stats = [
    { label: 'Active Businesses', value: '500+', icon: Building2 },
    { label: 'Leads Managed', value: '50,000+', icon: Users },
    { label: 'Conversion Increase', value: '35%', icon: TrendingUp },
    { label: 'Customer Rating', value: '4.9/5', icon: Star },
  ];

  const features = [
    {
      title: 'Smart Scheduling',
      description: 'Schedule follow-ups and get reminders so you never miss an opportunity.',
      icon: Calendar
    },
    {
      title: 'Instant Alerts',
      description: 'Get notified when leads need attention or follow-ups are overdue.',
      icon: Zap
    },
    {
      title: 'Data Security',
      description: 'Your customer data is encrypted and secure, always.',
      icon: ShieldCheck
    },
    {
      title: 'Multi-Channel',
      description: 'Follow up via WhatsApp, call, SMS, or email - all from one place.',
      icon: MessageSquare
    },
    {
      title: 'Lead Pipeline',
      description: 'Track every prospect from first contact to conversion with our visual pipeline.',
      icon: Database
    },
    {
      title: 'Analytics',
      description: 'See your conversion rates, best lead sources, and team performance.',
      icon: BarChart3
    }
  ];

  const steps = [
    {
      title: 'Add Your Leads',
      description: 'Import existing contacts via CSV or add new leads as they come in from WhatsApp, calls, or your website.'
    },
    {
      title: 'Schedule Follow-ups',
      description: "Set reminders for calls, messages, and meetings. We'll make sure you never forget."
    },
    {
      title: 'Track & Convert',
      description: 'Move leads through your pipeline, record outcomes, and watch your conversion rate grow.'
    }
  ];

  const testimonials = [
    {
      quote: "Before Zeerocodes CRM, I was losing leads left and right. Now I follow up with every single prospect and my conversion rate has doubled.",
      author: "Chioma Okafor",
      role: "Owner, Sparkle Cleaning Services"
    },
    {
      quote: "The simplicity is what I love. I'm not tech-savvy but I was able to start using it immediately. My team loves the WhatsApp reminders.",
      author: "Emeka Nwosu",
      role: "Director, Prime Realty Lagos"
    },
    {
      quote: "Finally, a CRM that understands Nigerian business. The Naira pricing and local payment options make it perfect for us.",
      author: "Aisha Mohammed",
      role: "Founder, Bright Future Academy"
    }
  ];

  return (
    <div className="bg-navy-950 min-h-screen text-white font-sans selection:bg-coral-500 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
          
          <div className="hidden md:flex items-center gap-6 lg:gap-10">
            {['Features', 'Solutions', 'Resources', 'Pricing'].map(item => {
              const hrefMap: Record<string, string> = {
                'Features': '#features',
                'Solutions': '#features',
                'Resources': '#testimonials',
                'Pricing': '#pricing'
              };
              return (
                <a 
                  key={item} 
                  href={hrefMap[item] || '#'} 
                  onClick={(e) => handleScrollToSection(e, hrefMap[item])}
                  className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  {item}
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {!user ? (
              <>
                <Link to="/login" className="hidden md:block text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="bg-coral-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] px-5 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-lg shadow-coral-500/20 hover:scale-105 transition-all">
                  Try for free
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="hidden md:block text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link to="/dashboard" className="bg-coral-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] px-5 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-lg shadow-coral-500/20 hover:scale-105 transition-all">
                  Go to App
                </Link>
              </>
            )}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
            >
              <Zap className={cn("w-6 h-6", isMenuOpen ? "fill-coral-500 text-coral-500" : "")} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-navy-900 border-b border-white/10 overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                {['Features', 'Solutions', 'Resources', 'Pricing'].map(item => {
                  const hrefMap: Record<string, string> = {
                    'Features': '#features',
                    'Solutions': '#features',
                    'Resources': '#testimonials',
                    'Pricing': '#pricing'
                  };
                  return (
                    <a 
                      key={item} 
                      href={hrefMap[item] || '#'} 
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        handleScrollToSection(e, hrefMap[item]);
                      }}
                      className="text-lg font-black uppercase tracking-widest text-white/60 hover:text-coral-500 transition-colors"
                    >
                      {item}
                    </a>
                  );
                })}
                
                <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
                  {user ? (
                    <>
                      <Link 
                        to="/dashboard" 
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-black uppercase tracking-widest text-white/60 hover:text-coral-500"
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/dashboard" 
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-black uppercase tracking-widest text-coral-500"
                      >
                        Go to App
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-black uppercase tracking-widest text-white/60 hover:text-coral-500"
                      >
                        Sign In
                      </Link>
                      <Link 
                        to="/register" 
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-black uppercase tracking-widest text-coral-500"
                      >
                        Try for free
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2070&auto=format&fit=crop" 
            alt="Nigeria Business Hub" 
            className="w-full h-full object-cover opacity-20 mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-gradient-to-b from-coral-500/10 to-transparent blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-coral-500/10 border border-coral-500/20 px-4 py-2 rounded-full mb-6 sm:mb-8 text-coral-500 transition-transform hover:scale-105 cursor-default"
              >
                <div className="w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-coral-500">Zeerocodes Autonomous CRM & Outbound OS</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-tight sm:leading-[1.05] tracking-tight sm:tracking-tighter mb-6 sm:mb-8"
              >
                AUTONOMOUS SALES. <br />
                <span className="text-coral-500 italic block sm:inline">ZERO LEAKS.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/40 text-sm sm:text-base md:text-lg font-bold max-w-xl mb-8 sm:mb-12 mx-auto lg:mx-0"
              >
                Our AI Agent handles live web inbound qualification, smart prioritization, and real-time client booking 24/7. <span className="text-white">Eliminate mechanical operations.</span> Instantly pipeline your best leads directly to your CRM.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center lg:justify-start">
                  <Link to={user ? "/dashboard" : "/register"} className="w-full sm:w-auto bg-coral-500 text-white font-black uppercase tracking-[0.2em] px-8 sm:px-12 py-4 sm:py-6 rounded-xl sm:rounded-2xl shadow-2xl shadow-coral-500/30 hover:scale-105 active:scale-95 transition-all text-[10px] sm:text-xs flex items-center justify-center gap-3">
                    Claim 100 Free Credits <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => setIsVideoModalOpen(true)}
                    className="w-full sm:w-auto bg-navy-900/50 backdrop-blur-md border border-white/10 text-white font-black uppercase tracking-[0.2em] px-8 sm:px-12 py-4 sm:py-6 rounded-xl sm:rounded-2xl hover:bg-white/10 hover:scale-105 active:scale-95 transition-all text-[10px] sm:text-xs flex items-center justify-center gap-3"
                  >
                    Watch Demo
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">₦10,000 Sign-up Bonus Included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-coral-500" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">No credit card required</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-1 w-full max-w-md lg:max-w-lg relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-coral-500 to-white/20 rounded-[2.5rem] sm:rounded-[4rem] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
              <div className="bg-navy-900 rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-12 border border-white/5 shadow-2xl relative overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop" 
                  alt="Dashboard Preview" 
                  className="absolute inset-0 w-full h-full object-cover opacity-5 mix-blend-soft-light"
                  referrerPolicy="no-referrer"
                />
                <div className="flex justify-between items-center mb-10 sm:mb-12 relative z-10">
                   <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white/80">Today's <span className="text-white italic">Follow-ups</span></h3>
                   <span className="bg-coral-500/10 text-coral-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">3 pending</span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {[
                    { name: 'Adebayo Cleaning', time: '10:00 AM', type: 'WhatsApp', status: 'overdue', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { name: 'Lagos Realty', time: '2:00 PM', type: 'Call', status: 'upcoming', color: 'text-coral-500', bg: 'bg-coral-500/10' },
                    { name: 'Bright Academy', time: '4:30 PM', type: 'Email', status: 'upcoming', color: 'text-coral-500', bg: 'bg-coral-500/10' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 sm:p-6 bg-white/[0.03] rounded-2xl sm:rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors group/item">
                      <div>
                        <div className="font-black uppercase text-xs sm:text-sm tracking-tight text-white mb-1">{item.name}</div>
                        <div className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{item.time} - {item.type}</div>
                      </div>
                      <div className={cn("px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest", item.bg, item.color)}>
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Activity / Transactions Preview */}
                <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-tight text-white/60">Live <span className="text-white italic">Activity</span></h3>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                       <span className="text-[8px] font-black uppercase text-green-500/60 tracking-widest">Real-time</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-coral-500/10 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-coral-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-white uppercase tracking-tight">Lead Qualified: John Doe</p>
                          <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Just now</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-coral-500">- 50 CREDITS</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-white uppercase tracking-tight">WhatsApp Sent</p>
                          <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">2 mins ago</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-blue-500">- 5 CREDITS</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-20 bg-white/2 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-coral-500/10 flex items-center justify-center text-coral-500 group-hover:bg-coral-500 group-hover:text-white transition-all duration-500">
                    <stat.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                </div>
                <div className="text-2xl sm:text-4xl font-black tracking-tighter mb-1 leading-none text-white">{stat.value}</div>
                <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-1/2 bg-coral-500/5 -skew-y-6 -z-10" />
        <div className="max-w-7xl mx-auto text-center mb-16 sm:mb-24">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-[0.2em] text-coral-500 mb-4 sm:mb-6">Capabilities</h2>
          <h3 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tight max-w-3xl mx-auto leading-[0.9] text-white">
            AI that qualifies leads <span className="italic text-coral-500">better</span> than a human.
          </h3>
          <p className="text-white/40 font-bold mt-6 sm:mt-8 max-w-xl mx-auto text-sm sm:text-base">
            Simple, powerful tools designed for busy SME owners who want results without complexity.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {[
            {
              title: "Instant Verification",
              description: "Our AI agent contacts leads within 30 seconds of form submission. Speed to lead is your biggest competitive advantage.",
              icon: Zap,
              image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=2070&auto=format&fit=crop"
            },
            {
              title: "Smart Qualification",
              description: "AI scores leads from 0-100 based on your specific rules. Stop calling people who can't afford your services.",
              icon: ShieldCheck,
              image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
            },
            {
              title: "WhatsApp Automation",
              description: "Automated follow-ups on the platform your customers actually use. High response rates, zero manual effort.",
              icon: MessageSquare,
              image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop"
            },
            {
              title: "Nigerian SME Focused",
              description: "Pre-configured for local industries—Real Estate, Logistics, Home Services, and Education.",
              icon: Target,
              image: "https://images.unsplash.com/photo-1540910419391-709dca9466fd?q=80&w=2070&auto=format&fit=crop"
            },
            {
              title: "Lead Protection",
              description: "Duplicate detection and verification ensures you never pay for the same lead twice. Pure transparency.",
              icon: BarChart3,
              image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop"
            },
            {
              title: "Team Collaboration",
              description: "Scale your sales team effortlessly. Assign leads, track follow-ups, and monitor performance in real-time.",
              icon: Users,
              image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop"
            }
          ].map((f, idx) => (
            <div key={idx} className="bg-navy-900/50 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-white/5 hover:border-coral-500/30 transition-all group relative overflow-hidden">
               <img 
                  src={f.image} 
                  alt={f.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700"
                  referrerPolicy="no-referrer"
                />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[2.5rem] bg-white/5 flex items-center justify-center text-coral-500 mb-6 sm:mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-3 sm:mb-4 text-white">{f.title}</h4>
                <p className="text-white/40 text-xs sm:text-sm font-bold leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Get Up and Running Section */}
      <section id="process" className="py-20 sm:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
            alt="Process Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="max-w-7xl mx-auto text-center mb-16 sm:mb-24 relative z-10">
          <h3 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-white">
            Start Converting Leads <br className="hidden sm:block" />
            <span className="italic text-coral-500">in 3 Simple Steps</span>
          </h3>
          <p className="text-white/40 font-bold mt-8 sm:mt-10 max-w-xl mx-auto text-sm sm:text-base">
            Get up and running in minutes, not hours.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 relative z-10">
          {[
            {
              title: "Connect Form",
              description: "Paste our 1-line webhook URL into your website form or CRM. It's that simple."
            },
            {
              title: "Set Rules",
              description: "Tell the AI what makes a 'Qualified Lead' for you (Location, Budget, Need)."
            },
            {
              title: "AI Takes Over",
              description: "The AI agent qualifies every lead instantly. You only jump in when it's hot."
            }
          ].map((step, idx) => (
            <div key={idx} className="bg-navy-900/80 backdrop-blur-md p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/5 flex flex-col items-start gap-8 group hover:border-coral-500/20 transition-all shadow-2xl">
              <div className="text-5xl sm:text-7xl font-black text-coral-500/10 group-hover:text-coral-500/20 transition-colors leading-none tracking-tighter shrink-0">0{idx + 1}</div>
              <div>
                <h4 className="text-xl sm:text-2xl font-black uppercase mb-4 tracking-tight text-white">{step.title}</h4>
                <p className="text-white/40 text-sm sm:text-base font-bold leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 sm:py-40 px-6 relative overflow-hidden bg-navy-950">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1574621100236-d25b64cfd647?q=80&w=2070&auto=format&fit=crop" 
            alt="Lagos Commercial Context" 
            className="w-full h-full object-cover opacity-30 filter grayscale contrast-125"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/90 to-navy-950" />
        </div>
        
        <div className="max-w-7xl mx-auto text-center mb-16 sm:mb-24 relative z-10">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-[0.2em] text-coral-500 mb-4 sm:mb-6">Success Stories</h2>
          <h3 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-white">
            Trusted by SMEs <br className="hidden sm:block" />
            <span className="text-coral-500 italic">Across the Nation</span>
          </h3>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 relative z-10 px-0 sm:px-4">
          {[
            {
              quote: "Zeerocodes CRM transformed how we handle property inquiries. The AI qualifies them before my agents even pick up the phone.",
              author: "Tunde Enahoro",
              role: "Estate Manager, Lagos",
              image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=1974&auto=format&fit=crop"
            },
            {
              quote: "Finally, a tool that understands the Nigerian market. The pay-per-lead model is a game changer for my logistics company.",
              author: "Nneka Okoro",
              role: "CEO, FastMove Logistics",
              image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"
            },
            {
              quote: "The WhatsApp automation is brilliant. Our conversion rate tripled because we respond instantly now.",
              author: "Chidi Azeez",
              role: "Founder, StudyAbroad Hub",
              image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop"
            },
            {
              quote: "I used to spend all day on the phone. Now, the AI handles the first touch and I only talk to customers who are ready to buy.",
              author: "Funke Adebayo",
              role: "Store Owner, Abuja",
              image: "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?q=80&w=1974&auto=format&fit=crop"
            }
          ].map((t, idx) => (
            <div key={idx} className="bg-navy-900/50 p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border border-white/5 flex flex-col justify-between hover:border-coral-500/20 transition-all group backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-coral-500/10 transition-colors" />
              <div className="relative">
                <div className="text-3xl sm:text-4xl text-coral-500/20 mb-3 font-serif leading-none italic">"</div>
                <p className="text-white/80 leading-relaxed font-bold italic text-xs sm:text-sm mb-6 relative z-10">{t.quote}</p>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <img 
                  src={t.image} 
                  alt={t.author} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-coral-500/20 grayscale group-hover:grayscale-0 transition-all duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="text-white font-black uppercase tracking-tight text-[10px] truncate">{t.author}</div>
                  <div className="text-coral-500/60 text-[8px] font-black uppercase tracking-widest truncate">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-32 px-6 bg-white/2 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light pointer-events-none">
           <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
            alt="Data Grid" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="max-w-7xl mx-auto text-center mb-16 sm:mb-24 relative z-10">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-[0.2em] text-coral-500 mb-4 sm:mb-6">Pricing</h2>
          <h3 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-white">
            Pay for <span className="text-coral-500 italic">Conversations</span>, not Junk
          </h3>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 px-0 sm:px-10 relative z-10">
          <div className="bg-navy-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-white/5 flex flex-col justify-between group hover:border-coral-500/20 transition-all shadow-2xl backdrop-blur-sm">
            <div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-coral-500 mb-4 sm:mb-6">Pure Pay-As-You-Go</div>
              <h4 className="text-2xl sm:text-3xl font-black uppercase mb-1 sm:mb-2 tracking-tight text-white">The Flex Plan</h4>
              <div className="text-4xl sm:text-5xl font-black mb-1 sm:mb-2 tracking-tighter text-coral-500">₦100</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-10">Starting Per Qualified Lead</p>
              <ul className="space-y-4 sm:space-y-6 mb-10 sm:mb-12">
                {['Instant AI Qualification', 'Real-time Lead Scoring', 'WhatsApp Auto-Contact', 'Custom Industry Rules'].map(item => (
                  <li key={item} className="flex items-center gap-3 sm:gap-4 font-bold text-white/60 text-sm sm:text-base leading-tight">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-coral-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link to={user ? "/dashboard" : "/register"} className="w-full py-4 sm:py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-center rounded-xl sm:rounded-2xl hover:bg-white/10 transition-colors text-[10px]">
              Get Started for Free
            </Link>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl shadow-white/5 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-coral-500/10 rounded-full -mr-16 -mt-16 sm:-mr-20 sm:-mt-20 blur-3xl transition-transform group-hover:scale-110 duration-700" />
            <div className="relative z-10">
              <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-coral-500 mb-4 sm:mb-6 flex items-center justify-between pointer-events-none">
                Enterprise Volume <Zap className="w-4 h-4 fill-coral-500 text-coral-500" />
              </div>
              <h4 className="text-2xl sm:text-3xl font-black uppercase mb-1 sm:mb-2 tracking-tight text-navy-950">Scale Plan</h4>
              <div className="text-4xl sm:text-5xl font-black mb-1 sm:mb-2 tracking-tighter text-coral-500">CUSTOM</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-navy-950/40 mb-10">Bulk Discount for 5,000+ Leads</p>
              <ul className="space-y-4 sm:space-y-6 mb-10 sm:mb-12">
                {['Dedicated API Endpoint', 'Priority AI Processing', 'White-label Dashboard', '24/7 Account Support'].map(item => (
                  <li key={item} className="flex items-center gap-3 sm:gap-4 font-bold text-navy-800 text-sm sm:text-base leading-tight">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-coral-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <a 
              href="https://wa.me/2349026365853?text=Hi%20Zeerocodes,%20I'm%20interested%20in%20the%20Scale%20Plan%20for%20my%20business." 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 sm:py-5 bg-coral-500 text-white font-black uppercase tracking-[0.2em] text-center rounded-xl sm:rounded-2xl hover:bg-navy-950 transition-colors text-[10px]"
            >
               Talk to Us
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop" 
            alt="Growth Background" 
            className="w-full h-full object-cover opacity-[0.03] grayscale"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="max-w-5xl mx-auto bg-navy-900 rounded-[3rem] sm:rounded-[5rem] p-8 sm:p-20 text-center relative overflow-hidden border border-white/5 shadow-2xl backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-t from-coral-500/10 to-transparent opacity-30 pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] sm:leading-[0.85] mb-8 sm:mb-10 relative z-10 text-white">
            Ready to <span className="italic text-coral-500">stop losing</span> leads?
          </h2>
          <p className="text-white/40 font-bold mb-10 sm:mb-14 text-base sm:text-lg max-w-xl mx-auto relative z-10 leading-relaxed">
            Join 500+ Nigerian businesses already using Zeerocodes CRM to grow their customer base.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 relative z-10">
            <Link to={user ? "/dashboard" : "/register"} className="w-full sm:w-auto bg-coral-500 text-white font-black uppercase tracking-[0.2em] px-10 sm:px-16 py-5 sm:py-6 rounded-2xl shadow-2xl shadow-coral-500/30 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm">
              Register Free Trial
            </Link>
            <a 
              href="https://wa.me/2349026365853?text=Hi%20Zeerocodes,%20I%20have%20some%20questions%20about%20your%2520lead%2520management%2520engine." 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] px-10 sm:px-16 py-5 sm:py-6 rounded-2xl hover:bg-white/10 transition-all text-xs sm:text-sm flex items-center justify-center gap-3"
            >
              <MessageSquare className="w-4 h-4 text-coral-500" /> Chat with Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-20 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12 sm:mb-20 opacity-40">
           <div className="col-span-2">
             <Link to="/" className="flex items-center gap-2 mb-6">
                <Logo />
             </Link>
             <p className="text-xs sm:text-sm font-bold max-w-xs leading-relaxed text-white">
               Built for Nigerian SMEs to dominate the digital landscape through intelligent lead management.
             </p>
           </div>
            <div>
              <h5 className="font-black uppercase tracking-widest text-[10px] sm:text-xs mb-6 sm:mb-8 text-white">Platform</h5>
              <ul className="space-y-3 sm:space-y-4 text-[10px] sm:text-xs font-bold text-white">
                {['Features', 'Pricing', 'Dashboard'].map(i => (
                  <li key={i}>
                    {i === 'Dashboard' ? (
                      <Link to={user ? "/dashboard" : "/login"} className="hover:text-coral-500 transition-colors">
                        {user ? 'Dashboard' : 'Log in'}
                      </Link>
                    ) : (
                      <a 
                        href={`#${i.toLowerCase()}`} 
                        onClick={(e) => handleScrollToSection(e, `#${i.toLowerCase()}`)}
                        className="hover:text-coral-500 transition-colors"
                      >
                        {i}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-black uppercase tracking-widest text-[10px] sm:text-xs mb-6 sm:mb-8 text-white">Legal</h5>
              <ul className="space-y-3 sm:space-y-4 text-[10px] sm:text-xs font-bold text-white">
                <li><Link to="/login" className="hover:text-coral-500 transition-colors">Privacy</Link></li>
                <li><Link to="/login" className="hover:text-coral-500 transition-colors">Terms</Link></li>
                <li><Link to="/login" className="hover:text-coral-500 transition-colors">Security</Link></li>
                <li><Link to={user ? "/dashboard/billing" : "/login"} className="hover:text-coral-500 transition-colors">Contact</Link></li>
              </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-10 border-t border-white/5 pt-10">
          <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 text-center md:text-left">
            © 2024 Zeerocodes CRM. All rights reserved.
          </div>
          <div className="flex items-center gap-6 sm:gap-8">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all">
              <Twitter className="w-4 h-4 sm:w-5 h-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all">
              <Linkedin className="w-4 h-4 sm:w-5 h-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all">
              <Instagram className="w-4 h-4 sm:w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
      <AnimatePresence>
        {isVideoModalOpen && (
          <VideoModal onClose={() => setIsVideoModalOpen(false)} />
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/2349026365853?text=Hi%2520Zeerocodes,%2520I'm%2520on%2520your%2520website%2520and%2520would%2520like%2520to%2520learn%2520more."
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#25D366]/40 group"
      >
        <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
        <span className="absolute right-full mr-4 bg-navy-900 border border-white/10 px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Questions? Chat with us
        </span>
      </motion.a>
    </div>
  );
};

export default Landing;
