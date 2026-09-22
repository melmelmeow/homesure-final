import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // MUST have the 'return' keyword here!
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
