import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY 환경 변수가 누락되었습니다.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
