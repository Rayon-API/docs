import json
import os
from pathlib import Path
import httpx

shape = json.loads(Path("shape-request.json").read_text())
with httpx.Client(timeout=45, trust_env=False, follow_redirects=False) as client:
    response = client.post(
        "https://api.rayonapi.com/v1/shape",
        headers={"Authorization": f"Bearer {os.environ['RAYON_API_KEY']}"},
        json=shape,
    )
    response.raise_for_status()
    result = response.json()
print("Generated request:", result["request_id"])
# Apply result["headers"] using your existing target session and exact request.
