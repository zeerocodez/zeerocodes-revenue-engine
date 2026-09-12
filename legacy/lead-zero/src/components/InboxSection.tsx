/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Check,
  CheckCheck,
  Tag,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  DollarSign,
  User,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  FileText,
  UserPlus,
  Play,
  Volume2,
  PhoneCall,
  X,
  History,
  TrendingUp,
  Award,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  Users as UsersIcon,
  Lock as LockIcon,
  File as FileIcon,
  Download,
  ArrowLeft,
  PanelRight,
  PanelRightClose
} from "lucide-react";
import {
  Conversation,
  ConversationStatus,
  Message,
  User as UserType,
  Role,
  OutcomeStatus,
  QuickReplyTemplate,
  Contact,
  CustomerSegment
} from "../types";

interface InboxSectionProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelectConv: (id: string) => void;
  currentUser: UserType;
  allUsers: UserType[];
  templates: QuickReplyTemplate[];
  onAssignChat: (chatId: string, userId: string | undefined) => void;
  onUpdateTags: (chatId: string, tags: string[]) => void;
  onUpdateNotes: (chatId: string, notes: string[]) => void;
  onUpdateOutcome: (chatId: string, outcome: OutcomeStatus, amount?: number) => void;
  onSendReply: (
    chatId: string, 
    messageBody: string, 
    type?: "text" | "image" | "video" | "document" | "voice" | "location", 
    mediaUrl?: string
  ) => void;
  onSimulateIncoming: (chatId: string, text: string) => void;
  businessName: string;
  teammateConversations: any[];
  onSendTeammateMessage: (
    partnerId: string, 
    body: string, 
    type?: "text" | "image" | "video" | "document" | "voice" | "location", 
    mediaUrl?: string
  ) => void;
  onGoToLanding?: () => void;
}

export default function InboxSection({
  conversations,
  selectedConvId,
  onSelectConv,
  currentUser,
  allUsers,
  templates,
  onAssignChat,
  onUpdateTags,
  onUpdateNotes,
  onUpdateOutcome,
  onSendReply,
  onSimulateIncoming,
  businessName,
  teammateConversations,
  onSendTeammateMessage,
  onGoToLanding
}: InboxSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "unassigned" | "mine" | "archived" | "won">("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | "all">("all");

  // Active chat state
  const activeChat = conversations.find((c) => c.id === selectedConvId) || null;
  const [inputMessage, setInputMessage] = useState("");
  const [noteInput, setNoteInput] = useState("");

  // Active channel switches: "whatsapp" or "teammate"
  const [activeChannel, setActiveChannel] = useState<"whatsapp" | "teammate">("whatsapp");
  const [selectedTeammateId, setSelectedTeammateId] = useState<string | null>(null);
  const [showBrandMedia, setShowBrandMedia] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showRightDrawerMobile, setShowRightDrawerMobile] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Brand media and collateral for rapid SME answers
  const BRAND_MEDIA_ASSETS = [
    {
      name: "SME Promotion Banner",
      type: "image" as const,
      mediaUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
      description: "Standard design flyer with cleaning services, contact hours and physical location in Nigeria."
    },
    {
      name: "Industrial Cleaning Tools Lineup",
      type: "image" as const,
      mediaUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
      description: "Our heavy-duty vacuum cleaners & carpet washers showcase."
    },
    {
      name: "Operational Cleaning Promo Video",
      type: "video" as const,
      mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-with-glove-cleaning-office-desk-41221-large.mp4",
      description: "Video demonstrator highlighting commercial workstation disinfection."
    },
    {
      name: "Ultimate Services brochure and pricelist",
      type: "document" as const,
      mediaUrl: "services_and_rates_brochure_wat.pdf",
      description: "SME comprehensive service catalogue and pricing guide (₦)."
    }
  ];

  // Set default selected teammate (only on desktop screens to allow listing on mobile)
  useEffect(() => {
    if (window.innerWidth >= 1024 && !selectedTeammateId && allUsers.length > 0) {
      const otherUser = allUsers.find((u) => u.id !== currentUser.id);
      setSelectedTeammateId(otherUser ? otherUser.id : currentUser.id);
    }
  }, [allUsers, currentUser.id, selectedTeammateId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentUser.role === Role.VIEWER) {
      alert("Error: Viewers cannot upload file attachments.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      
      // Determine type
      let detectedType: "image" | "video" | "document" = "document";
      if (file.type.startsWith("image/")) {
        detectedType = "image";
      } else if (file.type.startsWith("video/")) {
        detectedType = "video";
      }

      if (activeChannel === "whatsapp") {
        if (!activeChat) return;
        onSendReply(activeChat.id, `Sent attachment: ${file.name}`, detectedType, dataUrl);
      } else {
        if (!selectedTeammateId) return;
        onSendTeammateMessage(selectedTeammateId, `Sent attachment: ${file.name}`, detectedType, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShareBrandAsset = (asset: typeof BRAND_MEDIA_ASSETS[0]) => {
    if (currentUser.role === Role.VIEWER) {
      alert("Error: Viewers cannot send media assets.");
      return;
    }

    if (activeChannel === "whatsapp") {
      if (!activeChat) return;
      onSendReply(activeChat.id, `Sent brand file: ${asset.name}`, asset.type, asset.mediaUrl);
    } else {
      if (!selectedTeammateId) return;
      onSendTeammateMessage(selectedTeammateId, `Sent brand file: ${asset.name}`, asset.type, asset.mediaUrl);
    }
    setShowBrandMedia(false);
  };

  // Simulated indicators
  const [simulateTyping, setSimulateTyping] = useState(false);
  const [collisionBanner, setCollisionBanner] = useState<string | null>(null);

  // Template variables state
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Outcome pricing variables
  const [dealModal, setDealModal] = useState(false);
  const [dealAmount, setDealAmount] = useState<number>(15000);
  const [dealOutcome, setDealOutcome] = useState<OutcomeStatus>(OutcomeStatus.WON);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Trigger simulate typing when another rep "views" the same conversation
  useEffect(() => {
    let t: any;
    if (activeChat && activeChat.id === "conv1" && currentUser.id === "user1") {
      // Admin is looking at conv1. Simulate Emeka starting to type collision warning
      t = setTimeout(() => {
        setCollisionBanner("Emeka is typing an offer...");
        // soft-lock indicator in chat object
        activeChat.typingIndicator = true;
        activeChat.lockedBy = "Emeka";
      }, 4000);
    } else {
      setCollisionBanner(null);
    }
    return () => clearTimeout(t);
  }, [selectedConvId, currentUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.id, activeChat?.messages.length]);

  // Filters logic
  const filteredConversations = conversations.filter((c) => {
    // text search covers contact name, tag, notes, and message body
    const query = searchQuery.toLowerCase();
    const matchSearch =
      c.contact.name.toLowerCase().includes(query) ||
      c.contact.phone.includes(query) ||
      c.tags.some((t) => t.toLowerCase().includes(query)) ||
      c.messages.some((m) => m.body.toLowerCase().includes(query));

    if (!matchSearch) return false;

    // tags filtering
    if (selectedTagFilter && !c.tags.includes(selectedTagFilter)) {
      return false;
    }

    // segment filtering
    if (selectedSegment !== "all" && c.contact.segment !== selectedSegment) {
      return false;
    }

    // tabs filtering
    switch (filterTab) {
      case "unread":
        return c.status === ConversationStatus.UNREAD;
      case "unassigned":
        return !c.assignedTo;
      case "mine":
        return c.assignedTo?.id === currentUser.id;
      case "archived":
        return c.status === ConversationStatus.ARCHIVED;
      case "won":
        return c.selectedOutcome === OutcomeStatus.WON;
      case "all":
      default:
        return c.status !== ConversationStatus.ARCHIVED;
    }
  });

  // Unique tags for tag-pill filtering
  const allUniqueTags = Array.from(new Set(conversations.flatMap((c) => c.tags)));

  const handleSend = () => {
    if (!inputMessage.trim() || !activeChat) return;
    
    // Viewer cannot send messages!
    if (currentUser.role === Role.VIEWER) {
      alert("Error: Viewers cannot send messages.");
      return;
    }

    onSendReply(activeChat.id, inputMessage);
    setInputMessage("");
  };

  const handleInsertTemplate = (template: QuickReplyTemplate) => {
    if (!activeChat) return;
    
    // Substitute template values
    let body = template.body
      .replace(/{{customer_name}}/g, activeChat.contact.name)
      .replace(/{{business_name}}/g, businessName)
      .replace(/{{price}}/g, "₦" + (activeChat.contact.id === "contact1" ? "120,000" : "25,000"));
    
    setInputMessage(body);
    setShowTemplates(false);
  };

  const handleMarkWonSetup = () => {
    setDealOutcome(OutcomeStatus.WON);
    // Suggest standard amount based on lead info
    if (activeChat?.contact.id === "contact1") {
      setDealAmount(150000);
    } else {
      setDealAmount(25000);
    }
    setDealModal(true);
  };

  const handleSaveOutcome = () => {
    if (!activeChat) return;
    onUpdateOutcome(activeChat.id, dealOutcome, dealOutcome === OutcomeStatus.WON ? dealAmount : undefined);
    setDealModal(false);
  };

  const handleSimulateClientMsg = () => {
    if (!activeChat) return;
    // Set typical user replies based on chat context
    const phrases = [
      "I have sent the address info. Let me know when the driver picks up.",
      "Okay o! I will transfer the balance via Paystack link now.",
      "Is the price negotiable? I am a regular client.",
      "Can we meet at the office by 11:00 AM instead?",
      "Chai, this list looks perfect. How do we make payment?"
    ];
    const randomReply = phrases[Math.floor(Math.random() * phrases.length)];
    onSimulateIncoming(activeChat.id, randomReply);
  };

  // Teammate helper selectors
  const getTeammateLastMessage = (teammateId: string) => {
    const pArray = teammateId === currentUser.id ? [currentUser.id] : [currentUser.id, teammateId].sort();
    const convId = pArray.join("_");
    const conv = teammateConversations.find((c) => c.id === convId);
    if (!conv || conv.messages.length === 0) return "No private messages yet. Click to start.";
    const lastMsg = conv.messages[conv.messages.length - 1];
    return `${lastMsg.senderId === currentUser.id ? "You: " : ""}${lastMsg.body}`;
  };

  const renderMessageContent = (m: any, isOutgoing: boolean) => {
    return (
      <div className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"}`}>
        <span className="text-[9px] text-slate-500 mb-0.5 px-1 font-semibold">{m.senderName}</span>
        
        <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-normal relative overflow-hidden ${
          isOutgoing
            ? "bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700/50"
            : "bg-teal-950/40 text-slate-200 rounded-tl-none border border-teal-900/40"
        }`}>
          {/* Text Message */}
          {(!m.type || m.type === "text" || !m.mediaUrl) && (
            <p className="whitespace-pre-wrap">{m.body}</p>
          )}

          {/* Photo Media Content */}
          {m.type === "image" && m.mediaUrl && (
            <div className="space-y-1">
              <div 
                onClick={() => setZoomedImage(m.mediaUrl || null)}
                className="relative rounded-lg overflow-hidden border border-slate-705/40 bg-slate-900 bg-cover max-w-xs cursor-zoom-in hover:brightness-95 transition-all group/img"
              >
                <img src={m.mediaUrl} alt="media attachment" className="w-full max-h-56 object-cover" referrerPolicy="no-referrer" />
              </div>
              <p className="text-[10px] text-slate-400 italic">{m.body}</p>
            </div>
          )}

          {/* Video Media Content */}
          {m.type === "video" && m.mediaUrl && (
            <div className="space-y-1">
              <div className="rounded-lg overflow-hidden border border-slate-705/4s bg-black max-w-xs">
                <video src={m.mediaUrl} controls className="w-full max-h-52 object-contain" />
              </div>
              <p className="text-[10px] text-slate-400 italic">{m.body}</p>
            </div>
          )}

          {/* Document Content */}
          {m.type === "document" && (
            <div className="space-y-1">
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex items-center gap-2 max-w-sm">
                <div className="p-1 px-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 shrink-0">
                  <FileIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold text-slate-200 truncate">{m.body || "attachment.pdf"}</span>
                  <span className="block text-[8px] text-slate-500 uppercase font-mono">PDF Document • 1.4 MB</span>
                </div>
                {m.mediaUrl && m.mediaUrl.startsWith("http") && (
                  <a 
                    href={m.mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Timestamp details */}
          <div className="flex items-center gap-1 justify-end text-[8px] text-slate-500 font-mono mt-1 select-none font-semibold">
            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            
            {isOutgoing && (
              m.status === "read" ? (
                <CheckCheck className="w-3 text-blue-400" />
              ) : m.status === "delivered" ? (
                <CheckCheck className="w-3 text-slate-500" />
              ) : (
                <Check className="w-3 text-slate-500" />
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const hasActiveSelection = activeChannel === "whatsapp" ? !!activeChat : !!selectedTeammateId;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 h-full w-full relative bg-slate-950 overflow-hidden">
       {/* 1. Chats list column */}
      <div className={`lg:col-span-4 border-r border-slate-800 flex flex-col h-full bg-slate-900/40 ${hasActiveSelection ? "hidden lg:flex" : "flex"}`}>
        
        {/* Search header container */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> LeadZero Live Chat
            </h2>
            <div className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 py-0.5 px-2 rounded-full font-bold">
              {activeChannel === "whatsapp" ? `${filteredConversations.length} Contacts` : `${allUsers.length} Team`}
            </div>
          </div>

          {/* Channel selector segment buttons */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-850/80 rounded-xl">
            <button
              onClick={() => setActiveChannel("whatsapp")}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeChannel === "whatsapp"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/55"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Live
            </button>
            <button
              onClick={() => setActiveChannel("teammate")}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeChannel === "teammate"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/55"
              }`}
            >
              <UsersIcon className="w-3.5 h-3.5" />
              Teammate DMs
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={activeChannel === "whatsapp" ? "Search chats, tags, notes..." : "Search teammates by name/role..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800/80 rounded-lg py-2 pl-9 pr-4 text-xs font-semibold text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {activeChannel === "whatsapp" ? (
          <>
            {/* Tab filters */}
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/20 flex flex-wrap gap-1.5 scrollbar-thin overflow-x-auto text-[11px] font-semibold text-slate-400">
              <button
                onClick={() => { setFilterTab("all"); setSelectedTagFilter(null); }}
                className={`px-2.5 py-1 rounded transition-colors ${filterTab === "all" && !selectedTagFilter ? "bg-slate-805 text-white bg-slate-800" : "hover:text-slate-200"}`}
              >
                All
              </button>
              <button
                onClick={() => { setFilterTab("unread"); setSelectedTagFilter(null); }}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${filterTab === "unread" ? "bg-blue-900/30 text-blue-400 border border-blue-800/30" : "hover:text-slate-200"}`}
              >
                Unread
              </button>
              <button
                onClick={() => { setFilterTab("unassigned"); setSelectedTagFilter(null); }}
                className={`px-2.5 py-1 rounded transition-colors ${filterTab === "unassigned" ? "bg-purple-900/30 text-purple-400 border border-purple-800/30" : "hover:text-slate-200"}`}
              >
                Unassigned
              </button>
              <button
                onClick={() => { setFilterTab("mine"); setSelectedTagFilter(null); }}
                className={`px-2.5 py-1 rounded transition-colors ${filterTab === "mine" ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/30" : "hover:text-slate-200"}`}
              >
                Assigned
              </button>
              <button
                onClick={() => { setFilterTab("won"); setSelectedTagFilter(null); }}
                className={`px-2.5 py-1 rounded transition-colors ${filterTab === "won" ? "bg-yellow-900/30 text-yellow-500 border border-yellow-800/30" : "hover:text-slate-200"}`}
              >
                ₦ Deals
              </button>
            </div>

            {/* Customer Segment filter */}
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/10 flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Segment:</span>
              <select
                aria-label="Filter by Customer Segment"
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value as CustomerSegment | "all")}
                className="bg-slate-800 border border-slate-705/60 text-slate-300 text-[10px] p-1 rounded font-bold outline-none cursor-pointer"
              >
                <option value="all">All Packages</option>
                <option value={CustomerSegment.VIP}>VIP Packages</option>
                <option value={CustomerSegment.REGULAR}>Regular Packages</option>
                <option value={CustomerSegment.ONE_TIME}>One-time Packages</option>
                <option value={CustomerSegment.DORMANT}>Dormant Packages</option>
              </select>
            </div>

            {/* Dynamic Tag Pills list */}
            {allUniqueTags.length > 0 && (
              <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-900/10 flex items-center gap-1 overflow-x-auto scrollbar-none">
                <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="flex gap-1">
                  {allUniqueTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 transition-all ${
                        selectedTagFilter === tag
                          ? "bg-slate-105 text-slate-900 font-bold"
                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Chats chronological list scroll viewport */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
          {activeChannel === "whatsapp" ? (
            filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 h-64">
                <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs font-semibold">No active conversations match filter</p>
                <p className="text-[10px] text-slate-650 mt-1">Try toggling filter headers or clearing your query</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const hasUnread = conv.status === ConversationStatus.UNREAD;
                const formattedTime = new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConv(conv.id)}
                    className={`p-3.5 cursor-pointer flex gap-3 transition-colors ${
                      isSelected ? "bg-slate-800/80 border-l-2 border-emerald-500" : "hover:bg-slate-850/40"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.contact.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"}
                        alt={conv.contact.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-705"
                      />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-slate-900 animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className={`text-xs font-bold font-sans truncate ${isSelected ? "text-emerald-400" : "text-slate-205"}`}>
                          {conv.contact.name}
                        </h4>
                        <span className="text-[9px] font-mono font-medium text-slate-500">{formattedTime}</span>
                      </div>

                      <p className={`text-[11px] truncate leading-tight mb-1.5 ${hasUnread ? "text-slate-100 font-semibold" : "text-slate-400"}`}>
                        {conv.lastMessage.body}
                      </p>

                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex gap-1 overflow-hidden">
                          {conv.tags.slice(0, 2).map((t) => (
                            <span key={t} className="bg-slate-800/85 border border-slate-700/30 text-slate-400 text-[9px] px-1.5 py-0.2 rounded font-medium">
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          {conv.selectedOutcome === OutcomeStatus.WON && (
                            <span className="bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded font-black">
                              ₦{conv.revenueAmount?.toLocaleString()}
                            </span>
                          )}
                          {conv.assignedTo ? (
                            <span className="bg-slate-800 text-slate-300 text-[8px] px-2 py-0.2 rounded-full border border-slate-700">
                              👤 {conv.assignedTo.name.split(" ")[0]}
                            </span>
                          ) : (
                            <span className="bg-gray-800 text-slate-400 text-[8px] px-2 py-0.2 rounded-full">
                              Unclaimed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* Teammates DM View */
            allUsers
              .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.role.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((user) => {
                const isSelected = user.id === selectedTeammateId;
                const isSelf = user.id === currentUser.id;
                const lastMsgPreview = getTeammateLastMessage(user.id);

                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedTeammateId(user.id)}
                    className={`p-3.5 cursor-pointer flex gap-3 transition-colors ${
                      isSelected ? "bg-slate-800/80 border-l-2 border-emerald-500" : "hover:bg-slate-850/40"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-705"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                        user.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className={`text-xs font-bold truncate ${isSelected ? "text-emerald-400" : "text-slate-200"}`}>
                          {user.name} {isSelf && <span className="text-[10px] text-slate-500 italic font-mono">(Personal Space)</span>}
                        </h4>
                        <span className="text-[8px] bg-slate-800 text-slate-450 px-1 rounded border border-slate-700 font-mono uppercase">{user.role}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {lastMsgPreview}
                      </p>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* 2. Chat history thread details */}
      <div className={`lg:col-span-${showRightPanel ? "5" : "8"} flex flex-col h-full bg-slate-950 border-r border-slate-900 ${hasActiveSelection ? "flex" : "hidden lg:flex"}`}>
        {activeChannel === "whatsapp" ? (
          activeChat ? (
            <>
            {/* Thread Active header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                {/* Mobile Back Button */}
                <button
                  onClick={() => onSelectConv(null as any)}
                  className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 cursor-pointer transition-colors"
                  aria-label="Back to Conversations"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <img
                  src={activeChat.contact.avatarUrl}
                  alt={activeChat.contact.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-slate-800"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-xs text-white leading-none">{activeChat.contact.name}</h3>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full">
                      {activeChat.contact.segment}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 leading-none">{activeChat.contact.phone}</p>
                </div>
              </div>

              {/* Assignment selector details */}
              <div className="flex items-center gap-2">
                <label htmlFor="assign-chat-select" className="text-[10px] font-mono text-slate-500">Rep:</label>
                <select
                  id="assign-chat-select"
                  value={activeChat.assignedTo?.id || ""}
                  onChange={(e) => onAssignChat(activeChat.id, e.target.value || undefined)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-semibold rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- Unassigned --</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                
                {/* Mobile Info Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowRightDrawerMobile(!showRightDrawerMobile)}
                  className="lg:hidden p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                  title="Toggle customer details panel"
                  aria-label="Toggle customer details panel"
                >
                  <UsersIcon className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                {/* Desktop Toggle Right Panel Button */}
                <button
                  type="button"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded transition-all cursor-pointer font-sans text-[10px] font-bold uppercase tracking-wider select-none shadow-sm"
                  title={showRightPanel ? "Collapse Right Menu panel" : "Expand Right Menu panel"}
                  aria-label="Toggle right details panel"
                >
                  {showRightPanel ? (
                    <>
                      <PanelRightClose className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hide Info</span>
                    </>
                  ) : (
                    <>
                      <PanelRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>Show Info</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Collision warning bar */}
            {collisionBanner && (
              <div className="bg-amber-950/50 border-b border-amber-800/40 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300 shrink-0">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                  <span className="font-medium">{collisionBanner}</span>
                </div>
                <span className="font-mono text-[9px] bg-amber-900/40 px-1.5 py-0.2 rounded select-none text-amber-300/80">Soft Locked</span>
              </div>
            )}

            {/* In-app Simulator Trigger Banner */}
            <div className="bg-slate-900/40 border-b border-slate-800/50 px-4 py-1.5 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-semibold font-sans">Testing Real-Time Ingestion?</span>
              <button
                onClick={handleSimulateClientMsg}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition-colors"
              >
                Simulate Client WhatsApp Msg
              </button>
            </div>

            {/* Message thread viewport */}
            <div className="flex-1 overflow-y-auto px-4 pt-10 pb-10 space-y-3.5 scrollbar-thin">
              {activeChat.messages.map((m) => {
                const isUser = m.sender === "user";
                return (
                  <div key={m.id}>
                    {renderMessageContent(m, isUser)}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Template Picker Injector overlay */}
            {showTemplates && (
              <div className="bg-slate-900 border-t border-slate-800 p-3 shadow-2xl space-y-2 shrink-0">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Quick Reply Library
                  </div>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1.5 text-[10px] font-sans font-semibold">
                  {["All", "Greeting", "Pricing", "Follow-up", "Closing"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded ${
                        selectedCategory === cat ? "bg-slate-100 text-slate-950" : "bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-850">
                  {templates
                    .filter((t) => selectedCategory === "All" || t.category === selectedCategory)
                    .map((temp) => (
                      <button
                        key={temp.id}
                        onClick={() => handleInsertTemplate(temp)}
                        className="w-full text-left p-2 hover:bg-slate-800/80 rounded transition-colors block text-xs"
                      >
                        <div className="font-bold text-slate-200 mb-0.5">{temp.title}</div>
                        <div className="text-[10px] text-slate-400 truncate leading-relaxed">{temp.body}</div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Outgoing reply editor / sending dock footer */}
            <div className="p-3 border-t border-slate-850 bg-slate-900/40 shrink-0">
              
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-805 border border-slate-700/50 rounded text-[10px] font-bold text-emerald-400 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Quick Templates
                </button>

                <button
                  onClick={() => setShowBrandMedia(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-805 border border-slate-700/50 rounded text-[10px] font-bold text-blue-400 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3 text-blue-400" /> Brand Media
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-805 border border-slate-700/50 rounded text-[10px] font-bold text-purple-400 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3 h-3 text-purple-400" /> Local File
                </button>
                
                <button
                  onClick={handleMarkWonSetup}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-950 border border-emerald-800/30 rounded text-[10px] font-black text-emerald-400 transition-colors cursor-pointer ml-auto"
                >
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> Deal Outcome
                </button>
              </div>

              <div className="flex gap-2 relative">
                <textarea
                  id="chat-reply-textarea"
                  rows={2}
                  placeholder={currentUser.role === Role.VIEWER ? "Viewers cannot compose messages" : "Type a WhatsApp msg..."}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={currentUser.role === Role.VIEWER}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 pr-10 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                
                <button
                  onClick={handleSend}
                  disabled={!inputMessage.trim()}
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer font-bold transition-all group shrink-0"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <MessageSquare className="w-12 h-12 text-slate-800 mb-2 animate-pulse" />
            <h3 className="font-extrabold text-sm text-slate-400 font-sans">No Conversation Selected</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">Select a customer from the left WhatsApp Live list to view message history, manage assignments, and update revenue fields.</p>
          </div>
        )
      ) : (
        /* Active teammate conversation view */
        selectedTeammateId ? (
          (() => {
            const selectedTeammateUser = allUsers.find(u => u.id === selectedTeammateId);
            const pArray = selectedTeammateId === currentUser.id ? [currentUser.id] : [currentUser.id, selectedTeammateId].sort();
            const convId = pArray.join("_");
            const activeTeammateChatObj = teammateConversations.find((c) => c.id === convId) || { id: convId, participants: pArray, messages: [] };

            return (
              <>
                {/* Thread Active header */}
                <div className="p-4 border-b border-slate-850 bg-slate-900/20 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2.5">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setSelectedTeammateId(null)}
                      className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 cursor-pointer transition-colors"
                      aria-label="Back to Teammates"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <img
                      src={selectedTeammateUser?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                      alt={selectedTeammateUser?.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-slate-850"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-sans">
                        <h3 className="font-extrabold text-xs text-white leading-none">
                          {selectedTeammateUser?.name} {selectedTeammateId === currentUser.id && "(Personal Workspace)"}
                        </h3>
                        <span className="text-[8px] bg-emerald-950 border border-emerald-900/30 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                          <LockIcon className="w-2.5 h-2.5" /> Workspace Private
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 mt-1 leading-none uppercase font-semibold">{selectedTeammateUser?.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Desktop Toggle Right Panel Button for teammate chats */}
                    <button
                      type="button"
                      onClick={() => setShowRightPanel(!showRightPanel)}
                      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded transition-all cursor-pointer font-sans text-[10px] font-bold uppercase tracking-wider select-none shadow-sm"
                      title={showRightPanel ? "Collapse Right Menu panel" : "Expand Right Menu panel"}
                      aria-label="Toggle right details panel"
                    >
                      {showRightPanel ? (
                        <>
                          <PanelRightClose className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Hide Info</span>
                        </>
                      ) : (
                        <>
                          <PanelRight className="w-3.5 h-3.5 text-slate-400" />
                          <span>Show Info</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Message thread viewport */}
                <div className="flex-1 overflow-y-auto px-4 pt-10 pb-10 space-y-3.5 scrollbar-thin">
                  {activeTeammateChatObj.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-600 h-56">
                      <LockIcon className="w-8 h-8 text-slate-805 mb-2 animate-pulse" />
                      <h4 className="text-xs font-bold text-slate-400 font-sans">Secure Internal Teammate DM</h4>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                        This conversation represents secure huddles inside LeadZero. Share promotional media items, standard brochures or write personal notes.
                      </p>
                    </div>
                  ) : (
                    activeTeammateChatObj.messages.map((m) => {
                      const isOutgoing = m.senderId === currentUser.id;
                      return (
                        <div key={m.id}>
                          {renderMessageContent(m, isOutgoing)}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Teammate outgoing editor / sending dock footer */}
                <div className="p-3 border-t border-slate-855 bg-slate-900/40 shrink-0">
                  
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <button
                      onClick={() => setShowBrandMedia(true)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-755 border border-slate-700/50 rounded text-[10px] font-bold text-blue-400 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3 text-blue-400" /> Share Brand Flyer
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-755 border border-slate-700/50 rounded text-[10px] font-bold text-purple-400 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3 text-purple-400" /> Local File
                    </button>
                  </div>

                  <div className="flex gap-2 relative">
                    <textarea
                      id="teammate-chat-textarea"
                      rows={2}
                      placeholder="Type a private message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-805 rounded-lg p-2.5 pr-10 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-semibold"
                    />
                    
                    <button
                      onClick={handleSend}
                      disabled={!inputMessage.trim()}
                      className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer font-bold transition-all group shrink-0"
                    >
                      <Send className="w-4 h-4 text-slate-950" />
                    </button>
                  </div>
                </div>
              </>
            );
          })()
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <UsersIcon className="w-12 h-12 text-slate-800 mb-2 animate-pulse" />
            <h3 className="font-extrabold text-sm text-slate-400 font-sans">No Teammate Selected</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">Select a workspace colleague from the sidebar list to discuss privately.</p>
          </div>
        )
      )}
      </div>

      {/* 3. Customer Profile & Team Notes side column drawer */}
      {showRightDrawerMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowRightDrawerMobile(false)}
        />
      )}

      <div className={`lg:col-span-3 border-l border-slate-900 bg-slate-900/10 flex flex-col h-full overflow-y-auto p-4 space-y-5 ${showRightPanel ? "lg:flex" : "lg:hidden"} [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-950/20 [&::-webkit-scrollbar-thumb]:bg-slate-850 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500/80
        ${showRightDrawerMobile ? "fixed inset-y-0 right-0 z-45 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-250" : "hidden"}`}
      >
        {/* Mobile Header indicator with close button */}
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-800">
          <span className="text-[10px] font-black text-emerald-400 tracking-wider uppercase">Contact Stats</span>
          <button
            onClick={() => setShowRightDrawerMobile(false)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-850 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeChat ? (
          <>
            {/* Context Card Profile summary */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
              <h4 className="text-[10px] font-mono tracking-wider font-semibold uppercase text-slate-400 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1"><History className="w-3 h-3 text-emerald-400" /> Customer Context</span>
                {onGoToLanding && (
                  <button
                    onClick={onGoToLanding}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                  >
                    Back to Home
                  </button>
                )}
              </h4>
              <div className="text-center pb-4 border-b border-slate-850/60 mb-3">
                <img
                  src={activeChat.contact.avatarUrl}
                  alt={activeChat.contact.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border border-slate-700"
                />
                <h3 className="font-bold text-xs text-slate-100 leading-none">{activeChat.contact.name}</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold font-mono">{activeChat.contact.segment} SEGMENT</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-950/50 p-2 rounded border border-slate-800/40">
                  <span className="block text-[8px] font-mono text-slate-500 uppercase">Total Spent</span>
                  <span className="font-bold text-yellow-500">₦{activeChat.contact.totalLTV.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950/50 p-2 rounded border border-slate-800/40">
                  <span className="block text-[8px] font-mono text-slate-500 uppercase">Conversations</span>
                  <span className="font-bold text-slate-300">{activeChat.contact.conversationCount} iterations</span>
                </div>
              </div>

              <div className="mt-3.5 space-y-1.5 text-[11px] text-slate-400">
                <p className="flex justify-between">
                  <span className="text-slate-500">First Contact:</span>
                  <span className="font-mono text-[10px] text-slate-300">{new Date(activeChat.contact.firstContactDate).toLocaleDateString()}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Last Active:</span>
                  <span className="font-mono text-[10px] text-slate-300">{new Date(activeChat.contact.lastContactDate).toLocaleDateString()}</span>
                </p>
              </div>

              {onGoToLanding && (
                <button
                  onClick={onGoToLanding}
                  className="mt-4 w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-300 hover:text-white font-bold py-2 px-3 rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase tracking-wider"
                >
                  Return to Home Configurator
                </button>
              )}
            </div>

            {/* Private Internal notes section */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex-1 flex flex-col min-h-[300px]">
              <h4 className="text-[10px] font-mono tracking-wider font-semibold uppercase text-slate-400 mb-3 flex items-center justify-between">
                <span>👤 Teammate Notes ({activeChat.internalNotes.length})</span>
                <span className="text-[8px] text-emerald-400 bg-emerald-950/50 border border-emerald-900/30 px-1.5 py-0.2 rounded font-mono font-bold select-none">Private</span>
              </h4>

              {/* Add Note container input */}
              <div className="flex gap-1.5 mb-3.5">
                <input
                  type="text"
                  placeholder="Record note snippet..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-700 min-w-0"
                />
                <button
                  onClick={() => {
                    if (!noteInput.trim()) return;
                    onUpdateNotes(activeChat.id, [...activeChat.internalNotes, noteInput]);
                    setNoteInput("");
                  }}
                  className="bg-slate-800 border border-slate-700 p-2 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Notes chronological scroll list */}
              <div className="space-y-2 flex-1 overflow-y-auto text-[11px] leading-relaxed max-h-56">
                {activeChat.internalNotes.length === 0 ? (
                  <p className="text-[10px] text-slate-600 text-center py-6">No internal remarks captured for this contact.</p>
                ) : (
                  activeChat.internalNotes.map((note, noteIdx) => (
                    <div key={noteIdx} className="bg-slate-950 border border-slate-850/60 p-2.5 rounded relative group">
                      <p className="text-slate-300 font-medium pr-4">{note}</p>
                      <button
                        onClick={() => {
                          const updated = [...activeChat.internalNotes];
                          updated.splice(noteIdx, 1);
                          onUpdateNotes(activeChat.id, updated);
                        }}
                        className="absolute right-1.5 top-1.5 text-slate-500 hover:text-red-400 focus:outline-none cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-slate-600 bg-slate-900/20 rounded-xl border border-slate-800/40 p-4">
            <User className="w-8 h-8 mx-auto mb-2 text-slate-800" />
            <span className="text-xs font-semibold block text-slate-550">Profile Drawer Empty</span>
            <span className="text-[10px] text-slate-600 inline-block mt-1">Select an active context feed.</span>
            
            {onGoToLanding && (
              <button
                onClick={onGoToLanding}
                className="mt-6 w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-emerald-400 hover:text-emerald-300 font-bold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
              >
                Go to Landing Page →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Outcome updates setup Modal */}
      {dealModal && activeChat && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-slate-100">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Mark Outcome Result
              </h3>
              <button onClick={() => setDealModal(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Update the pipeline status of conversation with **{activeChat.contact.name}**.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="deal-outcome-select" className="block text-[10px] font-mono uppercase text-slate-500 mb-1 font-bold">Outcome Status</label>
                <select
                  id="deal-outcome-select"
                  value={dealOutcome}
                  onChange={(e) => setDealOutcome(e.target.value as OutcomeStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-semibold text-slate-200"
                >
                  <option value={OutcomeStatus.WON}>Won (Invoice Recruited)</option>
                  <option value={OutcomeStatus.LOST}>Lost (Lead Discarded)</option>
                  <option value={OutcomeStatus.PENDING}>Pending (Active negotiations continuer)</option>
                  <option value={OutcomeStatus.NURTURE}>Nurturing (Long-term follow-up suggested)</option>
                </select>
              </div>

              {dealOutcome === OutcomeStatus.WON && (
                <div>
                  <label htmlFor="deal-naira-amount" className="block text-[10px] font-mono uppercase text-slate-500 mb-1 font-bold">Deal size in Nigerian Naira (₦)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₦</span>
                    <input
                      id="deal-naira-amount"
                      type="number"
                      value={dealAmount}
                      onChange={(e) => setDealAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 pl-7 pr-4 py-2 rounded text-xs text-slate-200 font-mono font-bold"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-1">This amount will populate the monthly targets and per-rep charts.</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveOutcome}
              className="w-full bg-emerald-500 text-slate-950 py-2 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              Verify & Log Result
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for attachment uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,application/pdf,.doc,.docx"
      />

      {/* Brand Media Collateral Modal Selection Panel */}
      {showBrandMedia && (
        <div id="brand-media-modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-55 flex items-center justify-center p-4 min-h-screen">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full text-slate-100 flex flex-col max-h-[85vh] shadow-2xl animate-fade-in relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 border-dashed">
              <h3 className="font-extrabold text-xs text-white flex items-center gap-2 uppercase tracking-wider">
                <ImageIcon className="w-4 h-4 text-emerald-400" /> Share Company Brand Media
              </h3>
              <button 
                onClick={() => setShowBrandMedia(false)} 
                className="text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">
              Select an official verified brand asset from the digital repository to attach and send in this channel ({activeChannel === "whatsapp" ? `WhatsApp with ${activeChat?.contact?.name}` : "Internal private team-members room"}).
            </p>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3 scrollbar-none sm:space-y-3.5">
              {BRAND_MEDIA_ASSETS.map((asset, index) => {
                const isImage = asset.type === "image";
                
                return (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row gap-4 p-3 bg-slate-950 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors"
                  >
                    {/* Media representation */}
                    <div className="w-full sm:w-28 h-20 bg-slate-905 rounded-lg flex-shrink-0 overflow-hidden relative border border-slate-800">
                      {isImage ? (
                        <img 
                          src={asset.mediaUrl} 
                          alt={asset.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                          <VideoIcon className="w-6 h-6 text-indigo-400 mb-1" />
                          <span className="text-[8px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-1 py-0.5 rounded">VIDEO</span>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-200">{asset.name}</span>
                          <span className="text-[8px] font-mono font-black uppercase text-slate-405 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                            {asset.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-normal">
                          {asset.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleShareBrandAsset(asset)}
                        className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 self-start cursor-pointer transition-all"
                      >
                        Send Attachment <ArrowRight className="w-3 h-3 text-slate-950" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
