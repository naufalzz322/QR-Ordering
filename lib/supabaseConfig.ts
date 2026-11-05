type SupabaseEnvironment = Record<string, string | undefined>

export function getServerSupabaseConfig(env: SupabaseEnvironment = process.env) {
  const urlValue = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!urlValue) {
    throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL')
  }

  let url: URL
  try {
    url = new URL(urlValue)
  } catch {
    throw new Error('Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL')
  }

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new Error('Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL')
  }

  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceRoleKey) {
    throw new Error('Supabase is not configured: set SUPABASE_SERVICE_ROLE_KEY')
  }

  return { url: url.toString(), serviceRoleKey }
}
