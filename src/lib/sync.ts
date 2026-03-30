import { supabase } from './supabase';
import { useStore } from '../store/useStore';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function getDataSnapshot() {
  const s = useStore.getState();
  return {
    salary: s.salary,
    family: s.family,
    expenses: s.expenses,
    emi: s.emi,
    prepayment: s.prepayment,
    otherIncome: s.otherIncome,
    darkMode: s.darkMode,
  };
}

export async function saveToSupabase() {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const payload = getDataSnapshot();
  await supabase.from('user_data').upsert({
    user_id: user.id,
    data: payload,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export function debouncedSave() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => saveToSupabase(), 1500);
}

export async function loadFromSupabase() {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', user.id)
    .single();

  if (error || !data?.data) return false;

  const d = data.data as ReturnType<typeof getDataSnapshot>;
  const { setSalary, setFamily, setExpenses, setEmi, setPrepayment, setOtherIncome } = useStore.getState();

  if (d.salary)      setSalary(d.salary);
  if (d.family)      setFamily(d.family);
  if (d.expenses)    setExpenses(d.expenses);
  if (d.emi)         setEmi(d.emi);
  if (d.prepayment)  setPrepayment(d.prepayment);
  if (d.otherIncome) setOtherIncome(d.otherIncome);
  if (typeof d.darkMode === 'boolean') {
    const current = useStore.getState().darkMode;
    if (current !== d.darkMode) useStore.getState().toggleDarkMode();
  }

  return true;
}

export function subscribeToStoreChanges() {
  return useStore.subscribe(() => debouncedSave());
}
