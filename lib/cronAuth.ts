import { timingSafeEqual } from 'node:crypto'

export function isCronAuthorized(request: Request, cronSecret = process.env.CRON_SECRET): boolean {
  if (!cronSecret) return false

  const actual = request.headers.get('authorization')
  const expected = `Bearer ${cronSecret}`
  if (!actual) return false

  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return false

  return timingSafeEqual(actualBuffer, expectedBuffer)
}
