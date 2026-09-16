export interface AuditRequestInput {
  name: string;
  business: string;
  email: string;
  phone: string;
  website?: string;
  monthlyLeadVolume: string;
  currentCrm?: string;
  biggestSalesBottleneck: string;
  averageDealValue?: number;
  whereLeadsAreLost?: string;
}

export interface AuditRequest extends AuditRequestInput {
  id: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  createdAt: string;
}

export function validateAuditRequest(input: AuditRequestInput): void {
  const required: Array<[keyof AuditRequestInput, string]> = [
    ['name', 'name'],
    ['business', 'business'],
    ['email', 'email'],
    ['phone', 'phone'],
    ['monthlyLeadVolume', 'monthly lead volume'],
    ['biggestSalesBottleneck', 'biggest sales bottleneck'],
  ];
  for (const [key, label] of required) {
    const value = input[key];
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`);
  }
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) throw new Error('valid email is required');
  if (input.averageDealValue !== undefined && (!Number.isFinite(input.averageDealValue) || input.averageDealValue < 0)) {
    throw new Error('average deal value must be a non-negative number');
  }
}

export function createAuditRequest(input: AuditRequestInput, id: string, now = new Date().toISOString()): AuditRequest {
  validateAuditRequest(input);
  return {
    ...input,
    id,
    name: input.name.trim(),
    business: input.business.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    createdAt: now,
    status: 'new',
  };
}
