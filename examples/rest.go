// Preparation API example; use an SDK for complete contract validation.
package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
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
	var token [24]byte
	if _, err = rand.Read(token[:]); err != nil {
		panic("Unable to create preparation key")
	}
	// One explicit POST. Reuse this key if implementing a deliberate POST retry.
	job, status := api(context.Background(), "POST", "/v1/materials/prepare", shape, hex.EncodeToString(token[:]))
	if status != 200 && status != 202 {
		panic(fmt.Sprintf("Preparation HTTP %d", status))
	}
	id, _ := job["preparation_id"].(string)
	validID := regexp.MustCompile(`^[A-Za-z0-9_-]{16,128}$`)
	if !validID.MatchString(id) || strings.Contains(id, apiKey) {
		panic("Invalid preparation ID")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	for {
		if job["preparation_id"] != id || job["status_url"] != "/v1/materials/preparations/"+id {
			panic("Invalid preparation response")
		}
		state, _ := job["state"].(string)
		if state == "ready" {
			ref, _ := job["material_ref"].(string)
			if job["execution_backend"] != "rust" || job["ready_until"] == nil || !validID.MatchString(ref) || strings.Contains(ref, apiKey) {
				panic("Invalid readiness metadata")
			}
			break
		}
		if state == "failed" || state == "expired" {
			panic("Preparation " + state + "; preparation ID: " + id)
		}
		if state != "queued" && state != "learning" && state != "validating" && state != "publishing" {
			panic("Invalid preparation state")
		}
		deadline, _ := ctx.Deadline()
		remaining := time.Until(deadline)
		if remaining <= 0 {
			panic("Preparation wait timed out; resume preparation ID: " + id)
		}
		wait := int(remaining.Seconds())
		if wait > 10 {
			wait = 10
		}
		next, httpStatus := api(ctx, "GET", "/v1/materials/preparations/"+id+"?wait="+strconv.Itoa(wait), nil, "")
		if httpStatus != 200 {
			switch httpStatus {
			case 408, 429, 500, 502, 503, 504:
				var jitter [1]byte
				_, _ = rand.Read(jitter[:])
				timer := time.NewTimer(time.Duration(50+int(jitter[0])%100) * time.Millisecond)
				select {
				case <-ctx.Done():
					timer.Stop()
					panic("Preparation wait timed out; resume preparation ID: " + id)
				case <-timer.C:
				}
				continue
			default:
				panic(fmt.Sprintf("Preparation status HTTP %d", httpStatus))
			}
		}
		job = next
		timer := time.NewTimer(10 * time.Millisecond)
		select {
		case <-ctx.Done():
			timer.Stop()
			panic("Preparation wait timed out; resume preparation ID: " + id)
		case <-timer.C:
		}
	}
	delete(shape, "scripts")
	shape["material_ref"] = job["material_ref"]
	result, status := api(context.Background(), "POST", "/v1/shape", shape, "")
	if status != 200 {
		panic(fmt.Sprintf("Generation HTTP %d", status))
	}
	fmt.Println("Generated request:", result["request_id"])
	// Apply result["headers"] using your existing target session and exact request.
}
