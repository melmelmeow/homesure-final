// ─────────────────────────────────────────────────────────────────────────────
//  Kasafide – Front-end configuration
//  Load order on every page: supabase-js (CDN) → config.js → session.js → data.js
//
//  The anon key is meant to be public: what a visitor can read or change is decided
//  by Row Level Security in supabase/migrations, not by hiding this key.
//  NEVER put the service-role key (or any Xendit / Google secret) in this file.
// ─────────────────────────────────────────────────────────────────────────────

// The front end is served by the same Next.js server that hosts the API, so API calls are relative
// ("/api/payments/..."). Only set this if you ever host the front end somewhere else.
const API_URL = "";

const SUPABASE_URL = "https://srv1824055.hstgr.cloud";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgzODYyNzgyLCJleHAiOjIwOTkyMjI3ODJ9.VZhJGJ7CG4NJpdcIoSAGLjsWiGrh491UpAhtjem15tw";

// Supabase persists the signed-in session in localStorage and refreshes the token for us.
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
