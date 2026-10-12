const key = process.env.RAYON_API_KEY
if (!key) throw new Error('Set RAYON_API_KEY')

const response = await fetch('https://api.rayonapi.com/solve', {
  method: 'POST',
  redirect: 'error',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ target_url: 'https://example.com/start' }),
  signal: AbortSignal.timeout(150_000),
})
if (!response.ok) throw new Error(`RayonAPI HTTP ${response.status}`)

const result = await response.json()
if (result.status !== 'accepted') {
  throw new Error(`Capture status: ${result.status}`)
}
console.log('Capture accepted')
// Replay requires a separate, scoped target client.
