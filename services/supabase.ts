// Initialize Supabase client
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://onuomoleheaogfqdcbwt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udW9tb2xlaGVhb2dmcWRjYnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTg3MzAsImV4cCI6MjA2NTAzNDczMH0.goKQcGngcKTiRKm6-F7NdHKnbRSpmmd4bo27zfyfWr4'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
