import os

from curl_cffi import requests

key = os.environ["RAYON_API_KEY"]
response = requests.post(
    "https://api.rayonapi.com/solve",
    headers={"Authorization": f"Bearer {key}"},
    json={"target_url": "https://example.com/start"},
    impersonate="chrome",
    timeout=150,
    allow_redirects=False,
)
response.raise_for_status()
result = response.json()
if result["status"] != "accepted":
    raise RuntimeError(f"Capture status: {result['status']}")

print("Capture accepted")
# Replay requires a separate, scoped target client.
