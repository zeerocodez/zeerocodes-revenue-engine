/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Trash,
  Tag,
  MessageSquare,
  BarChart,
  HelpCircle,
  X,
  PlusCircle,
  AlertOctagon,
  TrendingUp,
  Coins
} from "lucide-react";
import { QuickReplyTemplate, TemplateCategory, SubscriptionTier } from "../types";

interface TemplateSectionProps {
  templates: QuickReplyTemplate[];
  activeTier: SubscriptionTier;
  onAddTemplate: (temp: Omit<QuickReplyTemplate, "id" | "usageCount">) => void;
  onDeleteTemplate: (id: string) => void;
}

export default function TemplateSection({
  templates,
  activeTier,
  onAddTemplate,
  onDeleteTemplate
}: TemplateSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"All" | TemplateCategory>("All");

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TemplateCategory>(TemplateCategory.GREETING);
  const [body, setBody] = useState("");

  const limitReached = activeTier === SubscriptionTier.FREE && templates.length >= 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    if (limitReached) {
      alert("Template limit of 5 created templates reached on the Free Tier! Please upgrade under Billings to generate unlimited ones.");
      return;
    }

    onAddTemplate({ title, category, body });
    
    // reset
    setTitle("");
    setCategory(TemplateCategory.GREETING);
    setBody("");
    setShowAddForm(false);
  };

  const filteredTemplates = templates.filter((t) => {
    if (filterCategory === "All") return true;
    return t.category === filterCategory;
  });

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] md:min-h-screen p-4 md:p-8 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      {/* Upper Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" /> Quick Reply Library
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-written templates for instant WhatsApp dispatches. High-tier variables replace placeholders dynamically.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center gap-1.5 self-start cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      {/* Constraints tracker banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-12 bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-200">Plan Tier Limit Tracker: <span className="text-emerald-400 uppercase font-bold">{activeTier}</span></p>
              <p className="text-slate-500 font-medium">Allows {activeTier === SubscriptionTier.FREE ? "5 templates total (Limit Active)" : "Unlimited templates (Growth/Pro active)"}.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold font-mono">Current count:</span>
            <span className="text-sm bg-slate-950 px-3 py-1 rounded border border-slate-800 text-white font-mono font-bold">
              {templates.length} / {activeTier === SubscriptionTier.FREE ? "5" : "∞"}
            </span>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-4 text-xs font-semibold text-slate-400 border-b border-slate-900/80 mb-6">
        <button
          onClick={() => setFilterCategory("All")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterCategory === "All" ? "bg-slate-800 text-white font-bold" : "hover:text-slate-200"
          }`}
        >
          All Categories
        </button>
        {Object.values(TemplateCategory).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterCategory === cat ? "bg-slate-800 text-white font-bold" : "hover:text-slate-200"
            }`}
          >
            {cat}s
          </button>
        ))}
      </div>

      {/* Grid of Templates cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 max-w-sm mx-auto bg-slate-900/10 rounded-xl border border-slate-850">
            <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="font-bold text-slate-400">Library Section Empty</p>
            <p className="text-xs text-slate-500 mt-1">There are no quick templates registered in this selected Category.</p>
          </div>
        ) : (
          filteredTemplates.map((temp) => (
            <div
              key={temp.id}
              className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-750 transition-colors"
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <span className="text-[10px] bg-slate-950 text-slate-400 font-mono font-bold px-2 py-0.5 rounded border border-slate-850 uppercase">
                    {temp.category}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold font-mono">
                    <BarChart className="w-3.5 h-3.5" /> Used {temp.usageCount} times
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-200 mb-2">{temp.title}</h3>
                
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850/40 text-xs text-slate-400 leading-relaxed font-mono select-all">
                  {temp.body}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-850/60 flex justify-between items-center text-[10px] text-slate-500">
                <span className="font-semibold">Parses: customer_name, business_name</span>
                <button
                  onClick={() => onDeleteTemplate(temp.id)}
                  title="Remove template"
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-850 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Template creation overlays */}
      {showAddForm && (
        <div id="create-template-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Construct Message Template
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {limitReached && (
              <div className="bg-red-950/40 border border-red-900/30 p-3 rounded-lg text-xs flex items-start gap-2 text-red-400">
                <AlertOctagon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Subscription Limit Reached (Free Tier)</p>
                  <p className="text-red-405/80 text-[11px] mt-0.5">Free plans are locked to 5 templates maximum under local rules. Upgrade via settings first.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="template-title" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">Template Title</label>
                <input
                  id="template-title"
                  type="text"
                  placeholder="e.g. Lekki Price List Quote"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-100 placeholder-slate-705 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="template-category" className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">Category</label>
                <select
                  id="template-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-200 focus:outline-none"
                >
                  {Object.values(TemplateCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} Status
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label htmlFor="template-body" className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Message Content</label>
                  <span className="text-[9px] text-slate-500 font-mono">Dynamic injection variables allowed</span>
                </div>
                <textarea
                  id="template-body"
                  rows={4}
                  placeholder="Hello {{customer_name}}, thank you for contact! Our deep home dusting costs {{price}}..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-100 placeholder-slate-705 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              {/* Dynamic injector indicators */}
              <div className="bg-slate-950 p-2 rounded border border-slate-850/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="font-bold">Placeholder Help:</span>
                <span className="text-slate-400 border border-slate-800 bg-slate-900 px-1 py-0.2 rounded select-all cursor-copy">{"{{customer_name}}"}</span>
                <span className="text-slate-400 border border-slate-800 bg-slate-900 px-1 py-0.2 rounded select-all cursor-copy">{"{{business_name}}"}</span>
                <span className="text-slate-400 border border-slate-800 bg-slate-900 px-1 py-0.2 rounded select-all cursor-copy">{"{{price}}"}</span>
              </div>

              <button
                type="submit"
                disabled={limitReached}
                className="w-full bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs hover:bg-emerald-400 disabled:opacity-40 transition-colors cursor-pointer block text-center"
              >
                Assemble & Publish Template
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
