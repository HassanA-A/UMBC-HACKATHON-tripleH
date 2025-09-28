import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
console.log("✅ Loaded URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("✅ Loaded Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
