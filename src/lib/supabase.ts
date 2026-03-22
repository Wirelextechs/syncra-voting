import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvpapjdflprmkrqxkzkl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGFwamRmbHBybWtycXhremtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjIwNjEsImV4cCI6MjA4MTIzODA2MX0.Ps5MdzORDDZCeC1OlTZ0kpj0x_TOINn6x3JfEi0-vFc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
