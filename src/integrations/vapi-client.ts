import 'dotenv/config';

const VAPI_API_KEY = process.env.VAPI_API_KEY || '';
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || '3d5fa41a-3da7-4e55-88a3-f1665d04aebb';
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || 'ed733ea6-151f-4488-8d15-4570048080a0';

export interface OutboundVapiCallPayload {
  customerPhoneNumber: string;
  leadName?: string;
  assistantId?: string;
  customPromptVariables?: Record<string, string>;
}

export interface VapiCallResult {
  success: boolean;
  callId?: string;
  status?: string;
  phoneNumber?: string;
  error?: string;
}

/**
 * Initiates an outbound AI Voice screening call via Vapi
 */
export async function dispatchOutboundVapiCall({
  customerPhoneNumber,
  leadName,
  assistantId,
  customPromptVariables,
}: OutboundVapiCallPayload): Promise<VapiCallResult> {
  const targetAssistant = assistantId || VAPI_ASSISTANT_ID;

  if (!VAPI_API_KEY) {
    console.warn('Vapi API Key not configured; call recorded in simulation mode.');
    return {
      success: true,
      callId: `sim_call_${Date.now()}`,
      status: 'simulated_queued',
      phoneNumber: customerPhoneNumber,
    };
  }

  try {
    const res = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${VAPI_API_KEY}`,
      },
      body: JSON.stringify({
        assistantId: targetAssistant,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: customerPhoneNumber,
          name: leadName || 'Valued Prospect',
        },
        assistantOverrides: customPromptVariables
          ? {
              variableValues: customPromptVariables,
            }
          : undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn('Vapi Call Dispatch Error:', data);
      return {
        success: false,
        error: data.message || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      callId: data.id,
      status: data.status || 'queued',
      phoneNumber: customerPhoneNumber,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Vapi call error',
    };
  }
}

/**
 * Fetches available Vapi Voice Assistants
 */
export async function listVapiAssistants(): Promise<any[]> {
  if (!VAPI_API_KEY) return [];
  try {
    const res = await fetch('https://api.vapi.ai/assistant', {
      headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
