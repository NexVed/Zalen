package convex

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client calls the Convex HTTP API with a deploy key. That key stays on the
// server; MCP clients never see it.
type Client struct {
	baseURL string
	key     string
	http    *http.Client
}

func New(baseURL, deployKey string) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		key:     deployKey,
		http:    &http.Client{Timeout: 20 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c != nil && c.baseURL != "" && c.key != ""
}

func (c *Client) Query(ctx context.Context, path string, args any) (json.RawMessage, error) {
	return c.call(ctx, "/api/query", path, args)
}

func (c *Client) Mutation(ctx context.Context, path string, args any) (json.RawMessage, error) {
	return c.call(ctx, "/api/mutation", path, args)
}

func (c *Client) call(ctx context.Context, endpoint, path string, args any) (json.RawMessage, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("convex is not configured: set CONVEX_URL and CONVEX_DEPLOY_KEY on the API server")
	}
	if args == nil {
		args = map[string]any{}
	}
	body, err := json.Marshal(map[string]any{
		"path":   path,
		"args":   args,
		"format": "json",
	})
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Convex "+c.key)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	payload, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("convex %s: %s", resp.Status, truncate(payload))
	}
	var decoded struct {
		Status       string          `json:"status"`
		Value        json.RawMessage `json:"value"`
		ErrorMessage string          `json:"errorMessage"`
	}
	if err := json.Unmarshal(payload, &decoded); err != nil {
		return nil, fmt.Errorf("convex response: %w", err)
	}
	if decoded.Status != "success" {
		if decoded.ErrorMessage == "" {
			decoded.ErrorMessage = truncate(payload)
		}
		return nil, fmt.Errorf("%s", decoded.ErrorMessage)
	}
	if len(decoded.Value) == 0 {
		return json.RawMessage("null"), nil
	}
	return decoded.Value, nil
}

func truncate(b []byte) string {
	text := strings.TrimSpace(string(b))
	if len(text) > 300 {
		return text[:300]
	}
	return text
}
