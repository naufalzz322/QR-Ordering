import { createClient } from '@supabase/supabase-js'
import { getServerSupabaseConfig } from './supabaseConfig'

// Create the server client only when an upload/delete request needs it. Keeping
// this lazy prevents a malformed deployment variable from crashing `next build`
// while still returning a clear configuration error at runtime.
export const createServerSupabaseClient = () => {
  const { url, serviceRoleKey } = getServerSupabaseConfig()

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
