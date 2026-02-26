import { supabase } from "./lib/supabase";

const supabaseUrl = "https://msuwhkjwdbanwulbfdri.supabase.co"
const supabaseAnonKey = "sb_publishable_nlNT4ELwfwJkLqVsD2DWJQ_VYgTwKVM"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)