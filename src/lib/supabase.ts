import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xowhddmmmbilbwlkoxkk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvd2hkZG1tbWJpbGJ3bGtveGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjQ3ODIsImV4cCI6MjA5MDcwMDc4Mn0.F3Jjy3akowiMXq6Y3VPVFfLwg7LopgkSuaZyrPqwVVg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
