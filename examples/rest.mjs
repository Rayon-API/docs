// Managed generation example; use an SDK for complete contract validation.
import { readFile } from 'node:fs/promises'
const apiKey = process.env.RAYON_API_KEY
if (!apiKey) throw new Error('Set RAYON_API_KEY')
const shape = JSON.parse(await readFile('shape.json', 'utf8'))
async function api(method, path, payload, timeoutMs = 45000, idempotencyKey) {
  const response = await fetch('https://api.rayonapi.com' + path, {
    method,
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json',
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}) },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    redirect: 'error', signal: AbortSignal.timeout(Math.max(1, Math.ceil(timeoutMs)))
  })
  if (response.status !== 200 && !(path === '/v1/materials/prepare' && response.status === 202))
    throw Object.assign(new Error(`Rayon API HTTP ${response.status}`), { status: response.status })
  const reader = response.body.getReader(), chunks = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.length
      if (size > 256 * 1024) throw new Error('Invalid API response size')
      chunks.push(value)
    }
  } finally { await reader.cancel() }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))
}
const result = await api('POST', '/v1/shape', shape)
if (result.fallback_reason) console.warn('A fallback was used. Contact support with request ID:', result.request_id)
console.log('Generated request:', result.request_id)
// Apply result.headers using your existing target session and exact request.
