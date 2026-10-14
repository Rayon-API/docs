package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "time"
)

func main() {
    body, err := os.ReadFile("shape.json")
    if err != nil { panic("Read shape.json before calling the API") }
    req, err := http.NewRequest("POST", "https://api.rayonapi.com/v1/shape", bytes.NewReader(body))
    if err != nil { panic("Unable to build API request") }
    req.Header.Set("Authorization", "Bearer " + os.Getenv("RAYON_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    transport := http.DefaultTransport.(*http.Transport).Clone()
    transport.Proxy = nil
    client := &http.Client{Timeout: 45 * time.Second, Transport: transport,
        CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
    defer client.CloseIdleConnections()
    response, err := client.Do(req)
    if err != nil { panic("API transport failed") }
    defer response.Body.Close()
    if response.StatusCode != http.StatusOK { panic(fmt.Sprintf("Generation failed: HTTP %d", response.StatusCode)) }
    raw, err := io.ReadAll(io.LimitReader(response.Body, 256 * 1024 + 1))
    if err != nil || len(raw) > 256 * 1024 { panic("Invalid API response size") }
    var result struct { RequestID string `json:"request_id"`; Headers map[string]string `json:"headers"` }
    if json.Unmarshal(raw, &result) != nil { panic("Invalid API response") }
    fmt.Println("Generated request:", result.RequestID)
    // Apply result.Headers using your existing target session and exact request.
}
