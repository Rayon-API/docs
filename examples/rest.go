// Managed generation example; use an SDK for complete contract validation.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

func main() {
	raw, err := os.ReadFile("shape.json")
	if err != nil {
		panic("Read shape.json before calling the API")
	}
	var shape map[string]any
	if json.Unmarshal(raw, &shape) != nil {
		panic("Invalid shape.json")
	}
	apiKey := os.Getenv("RAYON_API_KEY")
	if apiKey == "" {
		panic("Set RAYON_API_KEY")
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	client := &http.Client{Timeout: 45 * time.Second, Transport: transport, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
	defer client.CloseIdleConnections()
	api := func(ctx context.Context, method, path string, body map[string]any, key string) (map[string]any, int) {
		var rd io.Reader
		if body != nil {
			b, e := json.Marshal(body)
			if e != nil {
				panic("Invalid API input")
			}
			rd = bytes.NewReader(b)
		}
		req, e := http.NewRequestWithContext(ctx, method, "https://api.rayonapi.com"+path, rd)
		if e != nil {
			panic("Unable to build API request")
		}
		req.Header.Set("Authorization", "Bearer "+apiKey)
		req.Header.Set("Content-Type", "application/json")
		if key != "" {
			req.Header.Set("Idempotency-Key", key)
		}
		resp, e := client.Do(req)
		if e != nil {
			panic("API transport failed")
		}
		defer resp.Body.Close()
		if resp.StatusCode != 200 && !(path == "/v1/materials/prepare" && resp.StatusCode == 202) {
			return nil, resp.StatusCode
		}
		b, e := io.ReadAll(io.LimitReader(resp.Body, 256*1024+1))
		if e != nil || len(b) > 256*1024 {
			panic("Invalid API response size")
		}
		var value map[string]any
		if json.Unmarshal(b, &value) != nil {
			panic("Invalid API response")
		}
		return value, resp.StatusCode
	}
	result, status := api(context.Background(), "POST", "/v1/shape", shape, "")
	if status != 200 {
		panic(fmt.Sprintf("Generation HTTP %d", status))
	}
	if result["fallback_reason"] != nil {
		fmt.Println("A fallback was used. Contact support with request ID:", result["request_id"])
	}
	fmt.Println("Generated request:", result["request_id"])
	// Apply result["headers"] using your existing target session and exact request.
}
