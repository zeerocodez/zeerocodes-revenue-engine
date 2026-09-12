/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Download,
  Shield,
  Coins,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  X,
  Plus,
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { SubscriptionTier, Invoice } from "../types";

interface BillingSectionProps {
  currentTier: SubscriptionTier;
  invoices: Invoice[];
  onUpgradeTier: (tier: SubscriptionTier) => void;
  businessName: string;
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
  onLogout?: () => void;
}

export default function BillingSection({
  currentTier,
  invoices,
  onUpgradeTier,
  businessName,
  theme,
  onThemeChange,
  onLogout
}: BillingSectionProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<SubscriptionTier>(SubscriptionTier.GROWTH);
  const [paymentOption, setPaymentOption] = useState<"card" | "transfer" | "ussd">("card");
  
  // Simulated success
  const [payingState, setPayingState] = useState(false);

  const priceMaps = {
    [SubscriptionTier.FREE]: { price: "₦0", desc: "Test workspace limits!", limit: "100 chats/mo, 1 seat, 5 reply templates" },
    [SubscriptionTier.GROWTH]: { price: "₦5,000", desc: "Best for growing retail and service shops", limit: "Unlimited chats, 2 user seats, unlimited replies" },
    [SubscriptionTier.PRO]: { price: "₦15,000", desc: "Unlocks Llama AI suggestions and premium dashboards", limit: "Unlimited chats, unlimited seats, AI optimal timing suggestions" }
  };

  const handleOpenPayment = (tier: SubscriptionTier) => {
    setCheckoutTier(tier);
    setShowCheckout(true);
    setPayingState(false);
  };

  const executePaystackSimulation = () => {
    setPayingState(true);
    setTimeout(() => {
      onUpgradeTier(checkoutTier);
      setPayingState(false);
      setShowCheckout(false);
    }, 1500);
  };

  // Function to simulate PDF Invoice Download
  const handleDownloadInvoice = (invoice: Invoice) => {
    const text = `
========================================
             LEADZERO RECEIPT
========================================
Invoice Number: ${invoice.invoiceNumber}
Date Generated: ${invoice.date}
Business Name:  ${businessName}
Local Tax Reg:  TAX-77349-LP
Standard VAT:   7.5% Included
----------------------------------------
PLAN DETAILS:
Subscription Level: [${invoice.tier.toUpperCase()}]
Payment Method:     ${invoice.paymentMethod}
Total Charge:       ₦${invoice.amount.toLocaleString()}
Status:             ${invoice.status.toUpperCase()}
----------------------------------------
Thank you for choosing LeadZero!
    `;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `LeadZero_Receipt_${invoice.invoiceNumber}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] md:min-h-screen p-4 md:p-8 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> Subscription billing portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Payments processed securely. Predictable monthly fees with transparent transaction handling.
          </p>
        </div>

        {/* Theme Mode Toggle Selection & Session Actions */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0 animate-fade-in">
          <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 p-2 rounded-xl">
            <span className="text-[10px] font-mono font-black text-slate-400 px-1 uppercase tracking-wider">Theme Profile</span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
              <button
                onClick={() => onThemeChange("dark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-900 text-white border border-slate-755/80 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
              <button
                onClick={() => onThemeChange("light")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light Contrast
              </button>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-950/40 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-950/20"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          )}
        </div>
      </div>

      {/* Subscription cards list */}
      <h3 className="font-extrabold text-xs text-white uppercase tracking-wider mb-4">
        CHOOSE SAAS TIERS FOR VALUE
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.values(SubscriptionTier).map((tier) => {
          const detail = priceMaps[tier];
          const isCurrent = currentTier === tier;

          return (
            <div
              key={tier}
              className={`bg-slate-905 border rounded-2xl p-5 flex flex-col justify-between relative ${
                isCurrent
                  ? "bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-900/5 relative before:absolute before:-top-3 before:right-6 before:bg-emerald-500 before:text-slate-950 before:text-[9px] before:font-black before:px-3 before:py-0.5 before:rounded-full before:content-['ACTIVE_TIER']"
                  : "bg-slate-900/60 border-slate-850 hover:border-slate-800"
              }`}
            >
              <div>
                <span className="text-xs font-mono font-black text-slate-500 uppercase tracking-widest block mb-1">Level {tier}</span>
                <div className="flex items-baseline gap-1 mb-2.5">
                  <span className="text-2xl md:text-3xl font-black text-white font-mono">{detail.price}</span>
                  <span className="text-[10px] text-slate-500">/ month</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-normal mb-4">{detail.desc}</p>
                <div className="border-t border-slate-850/60 pt-3 mb-4 text-[11px] text-slate-300 space-y-1.5">
                  <p className="flex gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{detail.limit}</span>
                  </p>
                </div>
              </div>

              {isCurrent ? (
                <button
                  disabled
                  className="w-full bg-slate-800 text-slate-500 text-xs font-bold py-2 rounded-lg cursor-not-allowed border border-slate-750"
                >
                  Current Active Plan
                </button>
              ) : (
                <button
                  onClick={() => handleOpenPayment(tier)}
                  className="w-full bg-emerald-505 text-white hover:bg-emerald-600 bg-slate-800 border-none py-2 rounded-lg text-xs font-bold transition-all cursor-pointer hover:bg-emerald-500 hover:text-slate-950"
                >
                  Upgrade to {tier} now
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Paystack Invoices billing history table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
          <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-400" /> Paystack Billing History
          </h3>
          <span className="text-[10px] text-slate-500 font-mono font-medium">Automatic VAT invoice downloads</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 text-[10px] font-mono uppercase font-bold">
                <th className="pb-2.5">Invoice Number</th>
                <th className="pb-2.5">Date Paid</th>
                <th className="pb-2.5">Billing Tier</th>
                <th className="pb-2.5">Payment Method</th>
                <th className="pb-2.5">Amount (NGN)</th>
                <th className="pb-2.5 text-right">Receipt Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-semibold text-slate-300">
              {invoices.map((inv) => {
                return (
                  <tr key={inv.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="py-3 font-mono">{inv.invoiceNumber}</td>
                    <td className="py-3 text-slate-400">{inv.date}</td>
                    <td className="py-3">
                      <span className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        {inv.tier}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{inv.paymentMethod}</td>
                    <td className="py-3 font-mono font-bold text-slate-100">₦{inv.amount.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv)}
                        title="Download Receipt"
                        className="p-1.5 hover:text-emerald-400 hover:bg-slate-950 rounded text-slate-500 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paystack Payment Checkout Simulator Form */}
      {showCheckout && (
        <div id="paystack-overlay" className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden space-y-4">
            
            {/* Paystack Header Log */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <div className="flex items-center gap-1.5">
                <div className="bg-teal-500 text-slate-950 text-[10px] font-black p-1.5 rounded uppercase leading-none">Paystack</div>
                <h3 className="font-extrabold text-sm text-slate-100">Secure Payment</h3>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 text-center space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500">Pay to LeadZero Africa</span>
              <p className="text-xl font-mono font-black text-emerald-400">{priceMaps[checkoutTier]?.price}</p>
              <span className="text-[10px] text-slate-400 block font-semibold">Upgrading to {checkoutTier} Plan</span>
            </div>

            {/* Methods options */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { id: "card", label: "MasterCard / Visa" },
                { id: "transfer", label: "Bank Transfer" },
                { id: "ussd", label: "USSD Code" }
              ].map((m) => {
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentOption(m.id as any)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer font-bold text-[10px] ${
                      paymentOption === m.id
                        ? "bg-emerald-950/50 border-emerald-500 text-emerald-400"
                        : "bg-slate-950 border-slate-850/80 text-slate-500"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic payment options displays */}
            {paymentOption === "card" && (
              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor="paystack-card-no" className="block text-[9px] font-mono uppercase text-slate-500 mb-1 font-bold">African Bank Card Number</label>
                  <input
                    id="paystack-card-no"
                    type="text"
                    defaultValue="5399 2424 •••• 9999"
                    className="w-full bg-slate-950 border border-slate-805 rounded p-2 text-xs font-mono font-bold text-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="paystack-card-expiry" className="block text-[9px] font-mono uppercase text-slate-500 mb-1 font-bold">Expiry Date</label>
                    <input
                      id="paystack-card-expiry"
                      type="text"
                      defaultValue="12/29"
                      className="w-full bg-slate-950 border border-slate-805 rounded p-2 text-xs font-mono text-slate-300 text-center"
                    />
                  </div>
                  <div>
                    <label htmlFor="paystack-card-cvv" className="block text-[9px] font-mono uppercase text-slate-505 mb-1 font-bold">CVV Code</label>
                    <input
                      id="paystack-card-cvv"
                      type="text"
                      defaultValue="733"
                      className="w-full bg-slate-950 border border-slate-805 rounded p-2 text-xs font-mono text-slate-300 text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentOption === "transfer" && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 text-xs space-y-1.5 text-center leading-relaxed">
                <p className="font-bold text-slate-300">WEMA Bank (Paystack Account)</p>
                <p className="text-emerald-400 font-mono font-bold text-sm tracking-wider select-all">9024 4242 7339</p>
                <p className="text-[10px] text-slate-500">Transfer expires in 10 minutes. Click pay once sent.</p>
              </div>
            )}

            {paymentOption === "ussd" && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 text-xs text-center space-y-1.5">
                <p className="font-semibold text-slate-400">Dial the code on your linked phone:</p>
                <p className="text-yellow-500 font-mono font-bold tracking-widest text-sm">*737*1*9*4242#</p>
                <p className="text-[10px] text-slate-550">Press call & authenticate your GTBank pin o!</p>
              </div>
            )}

            <button
              onClick={executePaystackSimulation}
              disabled={payingState}
              className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-lg text-xs hover:bg-emerald-400 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              {payingState ? "Capturing Paystack Pin..." : `Confirm Payment: ${priceMaps[checkoutTier]?.price}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
