package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type SolveResult struct {
	Status string `json:"status"`
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	key := os.Getenv("RAYON_API_KEY")
	if key == "" {
		return fmt.Errorf("set RAYON_API_KEY")
	}
	body, err := json.Marshal(map[string]string{
		"target_url": "https://example.com/start",
	})
	if err != nil {
		return err
	}
	req, err := http.NewRequest("POST", "https://api.rayonapi.com/solve", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{
		Timeout: 150 * time.Second,
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("RayonAPI request failed")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("RayonAPI HTTP %d", resp.StatusCode)
	}
	var result SolveResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("invalid RayonAPI response")
	}
	if result.Status != "accepted" {
		return fmt.Errorf("capture status: %s", result.Status)
	}
	fmt.Println("Capture accepted")
	return nil
}
