import assert from 'node:assert/strict'
import test from 'node:test'
import { getServerSupabaseConfig } from './supabaseConfig'

test('rejects a missing Supabase URL with a useful configuration error', () => {
  assert.throws(
    () => getServerSupabaseConfig({ SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key' }),
    /NEXT_PUBLIC_SUPABASE_URL/,
  )
})

test('rejects malformed Supabase URLs', () => {
  assert.throws(
    () => getServerSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    }),
    /NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL/,
  )
})

test('rejects non-HTTP Supabase URLs', () => {
  assert.throws(
    () => getServerSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'ftp://example.com',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    }),
    /NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL/,
  )
})

test('rejects missing server-side service role key', () => {
  assert.throws(
    () => getServerSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  )
})

test('returns trimmed valid Supabase configuration', () => {
  assert.deepEqual(
    getServerSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: ' https://demo.supabase.co/ ',
      SUPABASE_SERVICE_ROLE_KEY: ' test-service-role-key ',
    }),
    {
      url: 'https://demo.supabase.co/',
      serviceRoleKey: 'test-service-role-key',
    },
  )
})
