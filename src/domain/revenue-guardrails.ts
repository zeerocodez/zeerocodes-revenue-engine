export interface GuardrailCheckResult {
  isSafe: boolean;
  violationType?: 'prompt_injection' | 'price_boundary_violation' | 'unauthorized_commitment' | 'profanity_abuse';
  riskScore: number; // 0 to 100
  sanitizedInput: string;
  reason?: string;
}

export interface CommercialPolicyBounds {
  minAllowedDealValue: number;
  maxDiscountPercentage: number;
  restrictedKeywords: string[];
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/i,
  /system\s+prompt/i,
  /you\s+are\s+now\s+a/i,
  /act\s+as\s+(an?\s+)?unrestricted/i,
  /jailbreak/i,
  /forget\s+everything/i,
  /give\s+me\s+a\s+free\s+(license|subscription|contract)/i,
  /override\s+pricing\s+to\s+0/i,
];

export function inspectInboundSafety(
  rawInput: string,
  policy?: CommercialPolicyBounds
): GuardrailCheckResult {
  const text = rawInput.trim();

  // 1. Check for Prompt Injection / Override Attempts
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSafe: false,
        violationType: 'prompt_injection',
        riskScore: 95,
        sanitizedInput: '[Redacted injection attempt]',
        reason: 'Input contains forbidden instruction override or system prompt manipulation attempt.',
      };
    }
  }

  // 2. Check for Commercial Policy Restrictions
  if (policy) {
    for (const keyword of policy.restrictedKeywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        return {
          isSafe: false,
          violationType: 'unauthorized_commitment',
          riskScore: 75,
          sanitizedInput: text,
          reason: `Input references restricted commercial term: "${keyword}". Requires human manager approval.`,
        };
      }
    }
  }

  return {
    isSafe: true,
    riskScore: 5,
    sanitizedInput: text,
  };
}

export function validateProposedPrice(
  proposedValue: number,
  policy: CommercialPolicyBounds
): { isValid: boolean; adjustedValue: number; reason?: string } {
  if (proposedValue < policy.minAllowedDealValue) {
    return {
      isValid: false,
      adjustedValue: policy.minAllowedDealValue,
      reason: `Proposed quote ₦${proposedValue.toLocaleString()} is below policy minimum ₦${policy.minAllowedDealValue.toLocaleString()}.`,
    };
  }

  return {
    isValid: true,
    adjustedValue: proposedValue,
  };
}
