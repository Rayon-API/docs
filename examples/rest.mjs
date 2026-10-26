// Preparation API example; use an SDK for complete contract validation.
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
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
// One explicit POST with a stable key for this invocation; no automatic POST retry.
let job = await api('POST', '/v1/materials/prepare', shape, 45000, randomUUID())
const id = job.preparation_id
if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(id) || id.includes(apiKey))
  throw new Error('Invalid preparation ID')
const deadline = performance.now() + 60000
while (true) {
  if (job.preparation_id !== id || job.status_url !== `/v1/materials/preparations/${id}`)
    throw new Error('Invalid preparation response')
  if (job.state === 'ready') {
    if (job.execution_backend !== 'rust' || !job.ready_until ||
        typeof job.material_ref !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(job.material_ref))
      throw new Error('Invalid readiness metadata')
    break
  }
  if (['failed', 'expired'].includes(job.state)) throw new Error(`Preparation ${job.state}; preparation ID: ${id}`)
  if (!['queued', 'learning', 'validating', 'publishing'].includes(job.state)) throw new Error('Invalid preparation state')
  const remaining = deadline - performance.now()
  if (remaining <= 0) throw new Error(`Preparation wait timed out; resume preparation ID: ${id}`)
  try {
    job = await api('GET', `/v1/materials/preparations/${id}?wait=${Math.min(10, Math.floor(remaining / 1000))}`, undefined, remaining)
  } catch (error) {
    if (![408, 429, 500, 502, 503, 504].includes(error.status)) throw error
    await new Promise(resolve => setTimeout(resolve, Math.min(50 + Math.random() * 100, Math.max(0, deadline - performance.now()))))
  }
  await new Promise(resolve => setTimeout(resolve, Math.min(10, Math.max(0, deadline - performance.now()))))
}
const { scripts, ...current } = shape
const result = await api('POST', '/v1/shape', { ...current, material_ref: job.material_ref })
console.log('Generated request:', result.request_id)
// Apply result.headers using your existing target session and exact request.
