import { supabase } from '../lib/supabase';
import localforage from 'localforage';

const CODE_KEY = 'chaptered-household-code';

// ── Household code storage ────────────────────────────────────────────────────
export async function getHouseholdCode(): Promise<string | null> {
  return localforage.getItem<string>(CODE_KEY);
}

export async function saveHouseholdCode(code: string): Promise<void> {
  await localforage.setItem(CODE_KEY, code.toUpperCase().trim());
}

export async function clearHouseholdCode(): Promise<void> {
  await localforage.removeItem(CODE_KEY);
}

// ── Push local state to Supabase ─────────────────────────────────────────────
export async function pushToCloud(code: string, data: object): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('household_data')
      .upsert({ household_code: code, data }, { onConflict: 'household_code' });
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
