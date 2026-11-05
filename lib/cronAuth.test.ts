import assert from 'node:assert/strict'
import test from 'node:test'
import { isCronAuthorized } from './cronAuth'

test('rejects cron requests when no secret is configured', () => {
  const request = new Request('https://example.test/api/cron/reseed', {
    headers: { authorization: 'Bearer unit-test-secret' },
  })

  assert.equal(isCronAuthorized(request, undefined), false)
})

test('rejects missing and incorrect cron authorization headers', () => {
  const missingHeader = new Request('https://example.test/api/cron/reseed')
  const incorrectHeader = new Request('https://example.test/api/cron/reseed', {
    headers: { authorization: 'Bearer wrong-secret' },
  })

  assert.equal(isCronAuthorized(missingHeader, 'unit-test-secret'), false)
  assert.equal(isCronAuthorized(incorrectHeader, 'unit-test-secret'), false)
})

test('accepts the configured bearer token', () => {
  const request = new Request('https://example.test/api/cron/reseed', {
    headers: { authorization: 'Bearer unit-test-secret' },
  })

  assert.equal(isCronAuthorized(request, 'unit-test-secret'), true)
})
