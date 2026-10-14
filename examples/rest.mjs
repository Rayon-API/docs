import { readFile } from 'node:fs/promises'
const body = await readFile('shape.json', 'utf8')
const response = await fetch('https://api.rayonapi.com/v1/shape', {
  method: 'POST',
  headers: { authorization: `Bearer ${process.env.RAYON_API_KEY}`, 'content-type': 'application/json' },
  body,
  redirect: 'error',
  signal: AbortSignal.timeout(45000)
})
if (!response.ok) throw new Error(`Generation failed: HTTP ${response.status}`)
const result = await response.json()
console.log('Generated request:', result.request_id)
// Apply result.headers using your existing target session and exact request.
