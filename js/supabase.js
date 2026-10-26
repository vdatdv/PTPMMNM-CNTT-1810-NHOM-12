/**
 * Supabase Client for DesignMark frontend.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://qpdsjaxilorovzboexrq.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Mtwl6FEpvwbftGu-MXivTg_p_MS9xbn';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
