import { supabase } from '../lib/supabase';

const CODE_KEY = 'chaptered-household-code';

// ── Household code — localStorage (sync, no config needed) ───────────────────
export function getHouseholdCodeSync(): string | null {
  return localStorage.getItem(CODE_KEY);
}

export async function getHouseholdCode(): Promise<string | null> {
  return localStorage.getItem(CODE_KEY);
}

export async function saveHouseholdCode(code: string): Promise<void> {
  localStorage.setItem(CODE_KEY, code.toUpperCase().trim());
}

export async function clearHouseholdCode(): Promise<void> {
  localStorage.removeItem(CODE_KEY);
}

// ── Push local state to Supabase ─────────────────────────────────────────────
export async function pushToCloud(code: string, data: object): Promise<boolean> {
  try {
    // JSON round-trip ensures Date objects become ISO strings (not empty {} in JSONB)
    const serialized = JSON.parse(JSON.stringify(data));
    const { error } = await supabase
      .from('household_data')
      .upsert({ household_code: code, data: serialized }, { onConflict: 'household_code' });
    return !error;
  } catch {
    return false;
  }
}

// ── Pull cloud state (returns null if no data for that code yet) ──────────────
export async function pullFromCloud(code: string): Promise<object | null> {
  try {
    const { data, error } = await supabase
      .from('household_data')
      .select('data')
      .eq('household_code', code)
      .single();
    if (error || !data) return null;
    return data.data as object;
  } catch {
    return null;
  }
}

// ── Get last updated timestamp for a code ────────────────────────────────────
export async function getCloudUpdatedAt(code: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('household_data')
      .select('updated_at')
      .eq('household_code', code)
      .single();
    if (error || !data) return null;
    return data.updated_at as string;
  } catch {
    return null;
  }
}

// ── Check if a code already has data (for migration logic) ───────────────────
export async function codeHasData(code: string): Promise<boolean> {
  const remote = await pullFromCloud(code);
  return remote !== null;
}

// ── Validate code format: 4-12 chars, letters/numbers/hyphens ────────────────
export function isValidCode(code: string): boolean {
  return /^[A-Z0-9][A-Z0-9-]{2,11}$/.test(code.toUpperCase().trim());
}
