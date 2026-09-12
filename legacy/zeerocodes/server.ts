import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import fs from "fs";

dotenv.config();

// Initialize Firebase Admin safely
let firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!firebaseProjectId) {
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      firebaseProjectId = config.projectId;
    }
  } catch (error) {
    console.warn("Could not load firebase-applet-config.json in server.ts:", error);
  }
}

if (!firebaseProjectId) {
  firebaseProjectId = "leadzero-bc475"; // Default fallback
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseProjectId,
  });
}

// Authentication middleware to secure admin and user endpoints
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Missing or invalid Authorization header." });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error: any) {
    console.error("[AUTH ERROR] Token verification failed:", error);
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or expired authentication token." });
  }
};

function renderTemplate(template: string, lead: any): string {
  if (!template) return "";
  let rendered = template;
  const variables = {
    name: lead.name || "N/A",
    score: lead.qualificationScore !== undefined ? String(lead.qualificationScore) : "0",
    industry: lead.industry || "Other",
    budget: lead.budgetRange || lead.budget || "Unsure",
    notes: lead.notes || "No notes provided.",
    phone: lead.phone || "N/A",
    email: lead.email || "N/A",
    aiSummary: lead.aiSummary || "No reasoning summary."
  };
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    rendered = rendered.replace(regex, value);
  }
  return rendered;
}

const app = express();

app.use(express.json());

// In-memory inbox for real-time leads, keyed by organizationId
const webhookInboxes = new Map<string, any[]>();

// In-memory trace log for outgoing emails
const simulatedEmails: any[] = [];

  app.get("/api/email/logs", authenticateUser, (req, res) => {
    res.json({ logs: simulatedEmails });
  });

  app.post("/api/email/notify", authenticateUser, async (req, res) => {
    try {
      const { lead, settings, isTest, testEmail } = req.body;
      if (!lead || !settings) {
        return res.status(400).json({ error: "Lead and email settings are required." });
      }

      let recipients: string[] = [];
      if (isTest && testEmail) {
        recipients = [testEmail];
      } else if (settings.clients && Array.isArray(settings.clients)) {
        recipients = settings.clients.filter((c: any) => c.active).map((c: any) => c.email);
      }

      if (recipients.length === 0) {
        return res.json({ 
          status: "ignored", 
          message: "No active client notification accounts selected." 
        });
      }

      const subject = renderTemplate(settings.templateSubject, lead);
      const body = renderTemplate(settings.templateBody, lead);
      const provider = settings.provider || "Simulated Sandbox";

      if (provider === "SMTP") {
        if (!settings.smtpHost || !settings.smtpUser) {
          return res.status(400).json({ 
            error: "SMTP_CONFIG_INCOMPLETE", 
            message: "SMTP host and user must be configured to send real emails." 
          });
        }
        
        try {
          const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: Number(settings.smtpPort || 587),
            secure: !!settings.smtpSecure,
            auth: {
              user: settings.smtpUser,
              pass: settings.smtpPassword || "",
            },
          });
          
          await transporter.sendMail({
            from: `"${settings.smtpUser || 'Zeerocodes Alerts'}" <${settings.smtpUser}>`,
            to: recipients.join(', '),
            subject,
            text: body,
          });
        } catch (err: any) {
          console.error("[SMTP ERROR] Failed to deliver SMTP email:", err);
          return res.status(400).json({ 
            error: "SMTP_FAILED", 
            message: err.message || "Failed to deliver email through your SMTP gateway." 
          });
        }
      } else if (provider === "Resend") {
        const resendKey = settings.resendApiKey || process.env.RESEND_API_KEY;
        if (!resendKey) {
          return res.status(400).json({ 
            error: "RESEND_CONFIG_INCOMPLETE",
            message: "Resend API key is missing. Configure it in Integrations or add process.env.RESEND_API_KEY." 
          });
        }
        
        const sender = settings.resendSender || "alerts@reachtoleads.com";
        try {
          const apiResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            bg: true,
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: sender,
              to: recipients,
              subject,
              text: body
            })
          } as any);
          
          if (!apiResponse.ok) {
            const errText = await apiResponse.text();
            throw new Error(`Resend API returned status ${apiResponse.status}: ${errText}`);
          }
        } catch (err: any) {
          console.error("[RESEND ERROR] Failed to deliver Resend email:", err);
          return res.status(400).json({ 
            error: "RESEND_FAILED", 
            message: err.message || "Failed to deliver email through your Resend integration." 
          });
        }
      }

      // Add audit log entry (all providers log here for visual confirmation in the Sandbox Terminal)
      const logEntry = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString(),
        subject,
        recipient: recipients.join(', '),
        sender: provider === "SMTP" ? settings.smtpUser : (provider === "Resend" ? (settings.resendSender || "alerts@reachtoleads.com") : 'sandbox@zeerocodes.com'),
        body,
        provider,
        status: 'Delivered'
      };

      simulatedEmails.unshift(logEntry);
      if (simulatedEmails.length > 50) {
        simulatedEmails.pop();
      }

      res.json({ 
        status: "success", 
        message: `Notification successfully dispatched to ${recipients.length} account(s) via ${provider}.`,
        log: logEntry
      });
    } catch (err: any) {
      console.error("[EMAIL ROUTE ERROR]", err);
      res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
    }
  });

  app.post("/api/email/welcome", authenticateUser, async (req, res) => {
    try {
      const { email, signupData } = req.body;
      if (!email || !signupData) {
        return res.status(400).json({ error: "Email and signupData are required." });
      }

      const subject = `Welcome to Zeerocodes AI Sales Engine! 🚀 - ${signupData.companyName || 'Your Org'}`;
      const body = `Hello ${signupData.contactName || 'Valued User'},\n\nWelcome to Zeerocodes AI Sales Engine!\n\nWe have successfully registered and provisioned your organization HQ:\n\n- Company: ${signupData.companyName || 'N/A'}\n- Primary Industry: ${signupData.industry || 'N/A'}\n- Monthly Lead Volume: ${signupData.monthlyVolume || 'N/A'}\n- Contact Phone: ${signupData.phone || 'N/A'}\n- Chosen Tier Plan: ${signupData.pricingTier || 'N/A'}\n\nWe have gifted your balance with 100 free qualification credits to start automating pre-qualifying leads with high precision instantly!\n\nTo view settings, configure email recipient lists, and manage lead routing, visit your Integrations panel at: ${req.headers.origin || 'http://localhost:3000'}/integrations\n\nWarm regards,\nThe Zeerocodes Team`;

      const resendKey = process.env.RESEND_API_KEY;
      let sentStatus = "Delivered via Simulated Sandbox";
      let provider = "Simulated Sandbox";

      if (resendKey) {
        try {
          const apiResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            bg: true,
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'welcome@reachtoleads.com',
              to: [email],
              subject,
              text: body
            })
          } as any);
          
          if (apiResponse.ok) {
            sentStatus = "Delivered via Resend API";
            provider = "Resend";
          } else {
            const errText = await apiResponse.text();
            console.error("Resend delivery failed for welcome email, falling back to Sandbox:", errText);
          }
        } catch (resendErr) {
          console.error("Resend delivery error for welcome email, falling back to Sandbox:", resendErr);
        }
      }

      // Add audit log entry so it's visible in the UI Sandbox Terminal too!
      const logEntry = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString(),
        subject,
        recipient: email,
        sender: provider === 'Resend' ? 'welcome@reachtoleads.com' : 'welcome@zeerocodes.com',
        body,
        provider,
        status: 'Delivered'
      };

      simulatedEmails.unshift(logEntry);
      if (simulatedEmails.length > 50) {
        simulatedEmails.pop();
      }

      res.json({ 
        status: "success", 
        message: `Welcome email successfully sent to ${email} (${sentStatus}).`,
        log: logEntry
      });
    } catch (err: any) {
      console.error("[WELCOME EMAIL ROUTE ERROR]", err);
      res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
    }
  });

  app.get("/api/webhook/inbox", authenticateUser, (req, res) => {
    const orgId = req.query.org as string;
    if (!orgId) {
      return res.json({ leads: [] });
    }
    const leads = webhookInboxes.get(orgId) || [];
    webhookInboxes.set(orgId, []); // Clear after delivery
    res.json({ leads });
  });

  app.post("/api/webhook/lead", (req, res) => {
    const orgId = req.query.org as string;
    const { name, email, phone, company, industry, notes, budget } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Name is required." });
    }

    if (!orgId) {
      return res.status(400).json({ error: "organizationId (org) query parameter is required." });
    }

    const newLead = {
      name,
      email: email || "",
      phone: phone || "",
      company: company || "",
      industry: industry || "Other",
      source: "Website",
      budgetRange: budget || "Unsure",
      notes: notes || "Received via Website Webhook",
      status: "New",
      organizationId: orgId
    };

    const inbox = webhookInboxes.get(orgId) || [];
    inbox.push(newLead);
    webhookInboxes.set(orgId, inbox);

    console.log(`[WEBHOOK] New lead received for org ${orgId}: ${name}`);
    res.json({ status: "success", message: "Lead queued for sync." });
  });

  // Initialize Gemini
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Helper to detect retryable errors (503 and quota)
  const isRetryableError = (error: any) => {
    const msg = String(error.message || '').toLowerCase();
    const status = error.status || (error.error && error.error.code);
    return (
      status === 429 || 
      status === 503 ||
      msg.includes("429") || 
      msg.includes("503") ||
      msg.includes("quota") || 
      msg.includes("exhausted") ||
      msg.includes("limit") ||
      msg.includes("resource_exhausted") ||
      msg.includes("high demand") ||
      msg.includes("unavailable")
    );
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function callAiWithRetry(fn: () => Promise<any>, maxRetries = 3) {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (isRetryableError(error) && i < maxRetries - 1) {
          const waitTime = Math.pow(2, i) * 2000; // 2s, 4s, 8s
          console.warn(`[AI RETRY] Attempt ${i + 1} failed. Retrying in ${waitTime}ms...`, error.message);
          await sleep(waitTime);
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  // Helper to extract JSON from markdown if present
  const extractJSON = (text: string) => {
    try {
      // First try direct parse
      return JSON.parse(text);
    } catch (e) {
      // Look for JSON in code blocks
      const codeBlockMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        try {
          return JSON.parse(codeBlockMatch[1].trim());
        } catch (e2) {}
      }
      
      // Look for anything that looks like an array or object
      const bracketMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
      if (bracketMatch) {
        try {
          return JSON.parse(bracketMatch[0].trim());
        } catch (e2) {}
      }
      
      throw new Error(`Could not parse AI response as JSON. Raw text: ${text.substring(0, 100)}...`);
    }
  };

  // API Routes
  app.post("/api/ai/contact-lead", authenticateUser, async (req, res) => {
    try {
      const { leadName, company, industry, notes, companyName } = req.body;
      const effectiveCompany = companyName || "Zeerocodes";
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
      }

      const prompt = `
        You are a highly efficient AI Sales Assistant for a company named "${effectiveCompany}".
        Your target audience is Nigerian SMEs.
        A new lead has just entered the funnel. Your job is to draft a personalized, professional, and culturally relevant welcome message for them.
        
        Lead Details:
        - Name: ${leadName}
        - Company: ${company || 'Private'}
        - Industry: ${industry}
        - Initial Notes: ${notes}
        
        The message should:
        1. Acknowledge their interest.
        2. Briefly mention how ${effectiveCompany} can help their specific business (based on industry).
        3. Propose a quick WhatsApp follow-up.
        4. Use a tone that is professional yet warm (Nigerian business professional style).
        5. Keep it under 100 words.
        
        Output only the message text.
      `;

      const result = await callAiWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      }));

      res.json({ message: result.text });
    } catch (error: any) {
      console.error("AI Agent Error:", error);
      if (isRetryableError(error)) {
        return res.status(error.status || 503).json({ 
          error: "GEMINI_UNAVAILABLE",
          message: "Zeerocodes AI is currently under high demand. Please try again in a few seconds or add your own GEMINI_API_KEY in Settings > Secrets for faster service." 
        });
      }
      res.status(500).json({ error: String(error.message || error) });
    }
  });

  app.post("/api/ai/qualify-batch", authenticateUser, async (req, res) => {
    try {
      const { leads, rules, companyName } = req.body; 
      const effectiveCompany = companyName || "Zeerocodes";
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
      }

      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ error: "No leads provided." });
      }

      const leadsContext = leads.map((l, i) => `
        LEAD ${i+1}:
        ID: ${l.id}
        Name: ${l.name}
        Industry: ${l.industry}
        Source: ${l.source}
        Declared Budget: ${l.budgetRange || "Not Specified"}
        Notes: ${l.notes}
      `).join('\n');

      const prompt = `
        You are an expert Sales Operations AI for "${effectiveCompany}".
        Your task is to qualify the following batch of ${leads.length} leads by STRICTLY adhering to the USER-DEFINED QUALIFICATION RULES provided below.
        
        USER-DEFINED QUALIFICATION RULES (CRITICAL):
        ${rules || "Score based on overall business potential, contactability, and intent."}

        ANALYSIS FRAMEWORK:
        For each lead, evaluate based on these 4 pillars:
        1. STRATEGIC FIT: Does the industry and company type align with the rules?
        2. INTENT: Strength of the "Notes". Are they ready to buy, just browsing, or asking tech questions?
        3. BUDGET: Look for ₦ symbols, "million", "K", or specific budget numbers. Compare declared vs notes.
        4. CONTACTABILITY: Presence of valid Phone (especially Nigerian format) and Email.

        QUALIFICATION TASK:
        - Provide a Score (0-100) reflecting the likelihood of a successful close based on the rules.
        - Summary: A 1-sentence sales pitch on the lead.
        - Reasoning: A technical breakdown explaining exactly how pillars 1-4 contributed to the final score. 
        - Budget: (Optional) Refine the budget field if more accuracy is found in the notes.

        CONSTRAINTS:
        - Violating a CRITICAL rule (e.g. wrong industry if rules specify one) results in Score < 35.
        - Meeting all critical rules + high intent results in Score > 80.
        
        LEADS CONTEXT:
        ${leadsContext}
        
        DIRECTIONS:
        - You MUST return a VALID JSON ARRAY.
        - EACH object MUST have: id, score, summary, reasoning. 
        - Optional: budget.
        
        Output format example:
        [
          {
            "id": "123", 
            "score": 92, 
            "summary": "High-intent Real Estate lead with clear expansion budget.", 
            "reasoning": "Fits priority industry (Real Estate). Notes mention 'ready to deploy capital' (Pillar 2). Budget in notes (₦10M) exceeds declared minimum (Pillar 3). All contact info present (Pillar 4).",
            "budget": "₦10M+"
          }
        ]
      `;

      const result = await callAiWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      }));

      console.log(`[AI Batch Qualify] Raw Response:`, result.text);

      let data = extractJSON(result.text || "[]");
      if (!Array.isArray(data)) data = [];
      res.json({ results: data });
    } catch (error: any) {
      console.error("Batch Qualification Error:", error);
      if (isRetryableError(error)) {
        return res.status(error.status || 503).json({ 
          error: "GEMINI_UNAVAILABLE",
          message: "The AI model is currently experiencing high demand and could not process your batch. We are retrying automatically, but if it persists, please try again in a minute."
        });
      }
      res.status(500).json({ error: String(error.message || error) });
    }
  });

  app.post("/api/ai/qualify-lead", authenticateUser, async (req, res) => {
    try {
      const { leadName, industry, notes, source, budgetRange, rules, companyName } = req.body;
      const effectiveCompany = companyName || "Zeerocodes";
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
      }

      const prompt = `
        You are an expert Sales Operations AI for "${effectiveCompany}".
        Analyze the lead below and provide a qualification score (0-100), summary, and reasoning.
        YOU MUST FOLLOW THE USER-DEFINED QUALIFICATION RULES STRICTLY.
        
        USER-DEFINED QUALIFICATION RULES (MANDATORY):
        ${rules || "Score based on business potential and intent."}

        ANALYSIS FRAMEWORK:
        1. STRATEGIC FIT: Align with rules?
        2. INTENT: Strength of "Notes" inquiry.
        3. FINANCIALS: Budget detection (search for ₦, M, K).
        4. CONTACTABILITY: Verified phone/email presence.

        DIRECTIONS:
        - Score: 0-100 number.
        - Summary: Max 20 words. Impactful verdict.
        - Reasoning: Detailed technical explanation of HOW you arrived at the score based on the 4 pillars above.
        - Budget: (Optional) Improved budget range if found in notes.
        - Format: Valid JSON.

        Lead Details:
        - Name: ${leadName}
        - Industry: ${industry}
        - Source: ${source}
        - Declared Budget: ${budgetRange || "Not Specified"}
        - Notes: ${notes}
        
        Example: {"score": 88, "summary": "Top tier prospect for tech solutions.", "reasoning": "Fits rules perfectly. Intent is high due to inquiry for automated systems. Budget detected in notes is ₦2M. Contact valid.", "budget": "₦1M - ₦5M"}
      `;

      const result = await callAiWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      }));

      console.log(`[AI Single Qualify] Raw Response:`, result.text);

      const data = extractJSON(result.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Qualification Error:", error);
      if (isRetryableError(error)) {
        return res.status(error.status || 503).json({ 
          error: "GEMINI_UNAVAILABLE",
          message: "AI service is busy or quota reached. Please try again or use your own key for higher priority."
        });
      }
      res.status(500).json({ error: String(error.message || error) });
    }
  });

async function startServer() {
  if (process.env.VERCEL !== "1") {
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
