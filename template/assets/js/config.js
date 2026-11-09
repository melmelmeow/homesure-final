const API_URL = "http://localhost:3000";
const SUPABASE_URL = "https://srv1824055.hstgr.cloud";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgzODYyNzgyLCJleHAiOjIwOTkyMjI3ODJ9.VZhJGJ7CG4NJpdcIoSAGLjsWiGrh491UpAhtjem15tw";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data, error } = await sb.auth.signUp({
  email, password,
  options: { data: { full_name: fullName, phone_number: phone } }
});