import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket as TicketIcon, 
  CreditCard, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  FileText,
  Filter,
  Search,
  ChevronRight,
  MoreVertical,
  X
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Ticket, Transaction, TicketStatus, TicketType, TicketPriority } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { usePaystackPayment } from 'react-paystack';

const Ticketing = () => {
  const { tickets, transactions, addTicket, updateTicketStatus, user, creditBalance, buyCredits, addNotification } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tickets' | 'billing'>('billing');
  const [isAddTicketOpen, setIsAddTicketOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPack, setSelectedPack] = useState<{cr: number, price: number} | null>(null);
  const [customCredits, setCustomCredits] = useState<string>('');

  // Use a ref to store the credits count to avoid closure issues with state
  const pendingCreditsRef = React.useRef<number | null>(null);

  const [paystackReference, setPaystackReference] = useState<string>('');

  // Paystack config memoized
  const paystackConfig = React.useMemo(() => ({
    reference: paystackReference,
    email: user?.email || '',
    amount: (selectedPack?.price || 0) * 100, // in kobo
    publicKey: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
  }), [user?.email, selectedPack?.price, paystackReference]);

  // @ts-ignore
  const initializePayment = usePaystackPayment(paystackConfig);

  // Persistence for pending transactions to handle redirects/reloads
  React.useEffect(() => {
    const checkPending = async () => {
      const stored = localStorage.getItem('pending_tx');
      if (stored && user) {
        try {
          const { credits, timestamp, processed } = JSON.parse(stored);
          const now = Date.now();
          // If it's less than 30 mins old and not processed
          if (!processed && (now - timestamp < 30 * 60 * 1000)) {
            console.log(`[PAYSTACK] Found pending transaction in storage: ${credits} credits`);
            addNotification('System', 'Recovering pending transaction...', 'info');
            await buyCredits(credits);
            localStorage.setItem('pending_tx', JSON.stringify({ credits, timestamp, processed: true }));
            console.log('[PAYSTACK] Recovery successful');
          } else if (processed || (now - timestamp >= 30 * 60 * 1000)) {
            localStorage.removeItem('pending_tx');
          }
        } catch (e) {
          console.error('[PAYSTACK] Storage recovery failed:', e);
          localStorage.removeItem('pending_tx');
        }
      }
    };
    checkPending();
  }, [user, buyCredits, addNotification]);

  const handlePaystackSuccess = React.useCallback(async (reference: any) => {
    console.log('[PAYSTACK] SUCCESS EVENT:', reference);
    const creditsToBuy = pendingCreditsRef.current || JSON.parse(localStorage.getItem('pending_tx') || '{}').credits;
    console.log('[PAYSTACK] UID at success:', user?.uid);
    console.log('[PAYSTACK] Credits found:', creditsToBuy);
    
    if (creditsToBuy) {
      // Mark as processed in storage immediately to avoid double calls
      const stored = localStorage.getItem('pending_tx');
      if (stored) {
        const data = JSON.parse(stored);
        localStorage.setItem('pending_tx', JSON.stringify({ ...data, processed: true }));
      }

      try {
        console.log(`[PAYSTACK] Calling buyCredits(${creditsToBuy})`);
        await buyCredits(creditsToBuy);
        console.log('[PAYSTACK] buyCredits call returned success');
        setIsBuyCreditsOpen(false);
      } catch (error) {
        console.error("[PAYSTACK] buyCredits call failed:", error);
        addNotification('System Error', 'Payment confirmed but wallet update failed. Please contact support.', 'error');
      } finally {
        pendingCreditsRef.current = null;
        setSelectedPack(null);
        localStorage.removeItem('pending_tx');
      }
    } else {
      console.error("[PAYSTACK] Success callback reached but credits count is missing. Selection:", selectedPack);
      // fallback
      if (selectedPack?.cr) {
        try {
          await buyCredits(selectedPack.cr);
          setIsBuyCreditsOpen(false);
        } catch (e) {
          console.error("[PAYSTACK] Fallback buyCredits failed:", e);
        }
        setSelectedPack(null);
      } else {
        addNotification('Processing Error', 'Payment successful but couldn\'t determine credit amount. Please contact support.', 'error');
      }
    }
  }, [user, buyCredits, selectedPack, addNotification]);

  const handlePaystackClose = React.useCallback(() => {
    console.log('[PAYSTACK] Payment closed/cancelled');
    // We keep the ref for a bit in case Success triggers right after Close (unlikely but can happen in webviews)
    setTimeout(() => {
      if (!isBuyCreditsOpen) { // Only if they already closed the modal too
        setSelectedPack(null);
        pendingCreditsRef.current = null;
      }
    }, 2000);
  }, [isBuyCreditsOpen]);

  const startPayment = (pkg: {cr: number, price: number}) => {
    const ref = `TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log(`[PAYSTACK] Starting payment for ${pkg.cr} credits (₦${pkg.price}) - Ref: ${ref}`);
    setPaystackReference(ref);
    pendingCreditsRef.current = pkg.cr;
    localStorage.setItem('pending_tx', JSON.stringify({ 
      credits: pkg.cr, 
      timestamp: Date.now(), 
      processed: false 
    }));
    setSelectedPack(pkg);
    // The initializePayment will be called by useEffect when selectedPack changes
  };

  React.useEffect(() => {
    if (selectedPack && pendingCreditsRef.current === selectedPack.cr && paystackReference) {
      console.log('[PAYSTACK] Triggering initializePayment hook with Ref:', paystackReference);
      // @ts-ignore
      initializePayment(handlePaystackSuccess, handlePaystackClose);
    }
  }, [selectedPack, initializePayment, paystackReference]);

  // New Ticket Form State
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    type: 'Dispute' as TicketType,
    priority: 'Medium' as TicketPriority
  });

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTicket(newTicket);
    setIsAddTicketOpen(false);
    setNewTicket({ subject: '', description: '', type: 'Dispute', priority: 'Medium' });
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'Open': return <AlertCircle className="w-4 h-4 text-coral-500" />;
      case 'Pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Resolved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Closed': return <CheckCircle2 className="w-4 h-4 text-white/20" />;
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'Low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'High': return 'bg-coral-500/10 text-coral-500 border-coral-500/20';
      case 'Critical': return 'bg-red-500 text-white border-red-500';
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpent = transactions
    .filter(t => t.type === 'Charge' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase sm:text-4xl">
            Support & Billing<span className="text-coral-500">.</span>
          </h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Automated Pay-Per-Lead Engine & Ticket Management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddTicketOpen(true)}
            className="flex items-center gap-2 bg-coral-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-coral-500/20"
          >
            <Plus className="w-4 h-4" />
            Open Ticket
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Tickets', value: tickets.filter(t => t.status === 'Open').length, icon: TicketIcon, color: 'text-coral-500' },
          { label: 'Wallet Balance', value: `${creditBalance} Credits`, icon: ZapIcon, color: 'text-coral-500' },
          { label: 'Total Charges', value: `NGN ${totalSpent.toLocaleString()}`, icon: CreditCard, color: 'text-emerald-500' },
          { label: 'System Rate', value: '100 NGN/Cr', icon: FileText, color: 'text-blue-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-navy-900/50 backdrop-blur-md border border-white/5 p-6 rounded-[2rem]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white italic tracking-tighter mb-1">{stat.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/20">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-navy-900/50 backdrop-blur-md border border-white/5 rounded-[3rem] overflow-hidden">
        <div className="border-b border-white/5 p-4 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex p-1 bg-white/5 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'tickets' ? 'bg-white text-navy-950 shadow-lg' : 'text-white/40 hover:text-white'
                }`}
              >
                Support Tickets
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'billing' ? 'bg-white text-navy-950 shadow-lg' : 'text-white/40 hover:text-white'
                }`}
              >
                Wallet & Billing
              </button>
            </div>
            {activeTab === 'billing' && (
              <button 
                onClick={() => setIsBuyCreditsOpen(true)}
                className="px-6 py-2 rounded-xl bg-coral-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-coral-500/20 hover:scale-105 transition-all"
              >
                Buy Credits
              </button>
            )}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-coral-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 text-white pl-12 pr-6 py-3 rounded-2xl text-[10px] font-bold tracking-widest w-full lg:w-64 focus:outline-none focus:border-coral-500/50 transition-all"
            />
          </div>
        </div>

        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'tickets' ? (
              <motion.div
                key="tickets"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {filteredTickets.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="inline-flex p-6 rounded-full bg-white/5 mb-4">
                      <HelpCircle className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">No tickets found</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div 
                      key={ticket.id}
                      className="group bg-white/5 hover:bg-white/10 border border-white/5 p-6 rounded-[2rem] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl shadow-lg ${getPriorityColor(ticket.priority)}`}>
                          <TicketIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-white tracking-tight">{ticket.subject}</h3>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">#{ticket.id.slice(0, 5)}</span>
                          </div>
                          <p className="text-white/40 text-xs line-clamp-1 mb-2">{ticket.description}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/20">
                              {getStatusIcon(ticket.status)}
                              {ticket.status}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{ticket.type}</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">
                              {format(new Date(ticket.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {ticket.status === 'Open' && (
                          <button 
                            onClick={() => updateTicketStatus(ticket.id, 'Resolved')}
                            className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                          >
                            Mark Resolved
                          </button>
                        )}
                        <button className="p-3 text-white/10 hover:text-white transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="billing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="overflow-x-auto"
              >
                <div className="min-w-[800px]">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/5">
                      <tr>
                        <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 pl-4">Transaction Details</th>
                        <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Date</th>
                        <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Credits</th>
                        <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 text-right">Amount</th>
                        <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 text-right pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">No transaction history</p>
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                            <td className="py-6 pl-4">
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${tx.type === 'Charge' ? 'bg-coral-500/10 text-coral-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                  {tx.type === 'Charge' ? <CreditCard className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm tracking-tight">{tx.description || 'Transaction'}</div>
                                  <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">TXN: #{tx.id.slice(0, 8)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-6 font-medium text-white/40 text-xs">
                              {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                            </td>
                            <td className="py-6">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${tx.type === 'Charge' ? 'text-coral-500' : 'text-emerald-500'}`}>
                                {tx.type === 'Charge' ? '-' : '+'}{tx.credits || 0} CR
                              </span>
                            </td>
                            <td className="py-6 text-right font-black text-white italic tracking-tighter">
                              {tx.type === 'Charge' ? '-' : '+'}NGN {tx.amount.toLocaleString()}
                            </td>
                            <td className="py-6 text-right pr-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                tx.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Ticket Modal */}
      <AnimatePresence>
        {isBuyCreditsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] sm:rounded-[3rem] p-8 lg:p-12 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setIsBuyCreditsOpen(false)}
                className="absolute top-6 right-6 p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8 shrink-0">
                <div className="inline-flex p-4 rounded-3xl bg-coral-500/10 text-coral-500 mb-4">
                  <ZapIcon className="w-8 h-8 fill-current" />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase italic">RECHARGE <span className="text-coral-500">WALLET.</span></h2>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">1 Credit = ₦100 • Credits Never Expire</p>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar pb-2">
                {/* Custom Amount Section */}
                <div className="mb-6 p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-3 ml-2">Custom Amount</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <input 
                        type="number"
                        placeholder="Enter credits..."
                        value={customCredits}
                        onChange={e => setCustomCredits(e.target.value)}
                        className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none focus:border-coral-500 transition-all pr-12"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/20 uppercase tracking-widest pointer-events-none">CR</div>
                    </div>
                    <button
                      disabled={!customCredits || parseInt(customCredits) <= 0}
                      onClick={() => {
                        const cr = parseInt(customCredits);
                        startPayment({ cr, price: cr * 100 });
                      }}
                      className="px-6 py-4 bg-white text-navy-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-white/5 whitespace-nowrap"
                    >
                      Pay ₦{(parseInt(customCredits || '0') * 100).toLocaleString()}
                    </button>
                  </div>
                </div>
 
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { cr: 10, price: 1000, label: 'Starter Pack' },
                    { cr: 50, price: 5000, label: 'Growth Pack' },
                    { cr: 200, price: 20000, label: 'Pro Pack', popular: true },
                    { cr: 1000, price: 100000, label: 'Enterprise' },
                  ].map((pkg) => (
                    <button
                      key={pkg.cr}
                      onClick={() => startPayment(pkg)}
                      className={cn(
                        "p-6 rounded-2xl border text-left transition-all hover:scale-105 active:scale-95 group relative overflow-hidden",
                        pkg.popular ? "bg-coral-500 border-coral-500 shadow-xl shadow-coral-500/20" : "bg-white/2 border-white/5 hover:bg-white/5"
                      )}
                    >
                      {pkg.popular && (
                        <div className="absolute top-0 right-0 bg-white text-navy-950 text-[6px] font-black px-2 py-1 uppercase tracking-widest rounded-bl-lg">POPULAR</div>
                      )}
                      <div className={cn("text-xs font-black uppercase tracking-widest mb-1", pkg.popular ? "text-navy-950" : "text-white/20 group-hover:text-white")}>{pkg.label}</div>
                      <div className={cn("text-2xl font-black tracking-tighter", pkg.popular ? "text-white" : "text-white")}>{pkg.cr} <span className="text-[10px]">CR</span></div>
                      <div className={cn("text-[10px] font-bold mt-2", pkg.popular ? "text-navy-900/60" : "text-white/40")}>₦{pkg.price.toLocaleString()}</div>
                    </button>
                  ))}
                </div>

                <p className="text-[8px] font-bold text-center text-white/10 uppercase tracking-widest leading-loose">
                  Transactions are processed securely via Paystack.<br/>By recharging, you agree to our variable credit billing model.
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {isAddTicketOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-900 border border-white/10 w-full max-w-xl rounded-[2.5rem] sm:rounded-[3rem] p-8 lg:p-12 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setIsAddTicketOpen(false)}
                className="absolute top-6 right-6 p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 shrink-0">
                <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase italic">OPEN TICKET<span className="text-coral-500">.</span></h2>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">Dispute a charge or report a bug</p>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar pb-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-2">Subject</label>
                  <input 
                    type="text"
                    required
                    value={newTicket.subject}
                    onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                    placeholder="Brief summary of the issue..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-coral-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-2">Type</label>
                    <select 
                      value={newTicket.type}
                      onChange={e => setNewTicket({...newTicket, type: e.target.value as TicketType})}
                      className="w-full bg-navy-950 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-coral-500 transition-all"
                    >
                      <option value="Dispute">Dispute</option>
                      <option value="Billing">Billing Issue</option>
                      <option value="Technical">Technical Bug</option>
                      <option value="Feedback">Feedback</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-2">Priority</label>
                    <select 
                      value={newTicket.priority}
                      onChange={e => setNewTicket({...newTicket, priority: e.target.value as TicketPriority})}
                      className="w-full bg-navy-950 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-coral-500 transition-all"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-2">Description</label>
                  <textarea 
                    required
                    rows={4}
                    value={newTicket.description}
                    onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                    placeholder="Provide details about your request..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-coral-500 transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-coral-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-coral-500/20"
                >
                  Submit Ticket
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ZapIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export default Ticketing;
