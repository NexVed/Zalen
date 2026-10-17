// Package auth verifies Clerk-issued session JWTs against the Clerk JWKS
// endpoint. Verifying locally (instead of calling Clerk per request) keeps the
// API fast and stateless; only the public keys are fetched and cached.
package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// ErrUnauthorized is returned when a token is missing, malformed, expired, or
// signed by an unknown key.
var ErrUnauthorized = errors.New("unauthorized")

// Claims is the subset of the Clerk session token we care about. Raw exposes
// every claim for handlers that need more.
type Claims struct {
	Subject   string
	SessionID string
	Email     string
	Raw       jwt.MapClaims
}

type jwksResponse struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	N   string `json:"n"`
	E   string `json:"e"`
}

// Verifier fetches and caches Clerk's JWKS.
type Verifier struct {
	issuer  string
	jwksURL string
	client  *http.Client

	mu        sync.RWMutex
	keys      map[string]*rsa.PublicKey
	fetchedAt time.Time
	ttl       time.Duration
}

// NewVerifier creates a verifier for the given Clerk issuer, e.g.
// "https://your-app.clerk.accounts.dev".
func NewVerifier(issuer string) *Verifier {
	issuer = strings.TrimSuffix(issuer, "/")
	return &Verifier{
		issuer:  issuer,
		jwksURL: issuer + "/.well-known/jwks.json",
		client:  &http.Client{Timeout: 10 * time.Second},
		keys:    map[string]*rsa.PublicKey{},
		ttl:     time.Hour,
	}
}

// Verify parses and validates a Clerk session token, returning its claims.
func (v *Verifier) Verify(ctx context.Context, tokenString string) (*Claims, error) {
	if v.issuer == "" {
		return nil, fmt.Errorf("%w: CLERK_JWT_ISSUER_DOMAIN is not configured", ErrUnauthorized)
	}

	claims := jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(tokenString, claims, v.keyFunc,
		jwt.WithIssuer(v.issuer),
		jwt.WithValidMethods([]string{"RS256"}),
	)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrUnauthorized, err)
	}

	subject, _ := claims["sub"].(string)
	if subject == "" {
		return nil, fmt.Errorf("%w: missing sub claim", ErrUnauthorized)
	}

	sessionID, _ := claims["sid"].(string)
	email, _ := claims["email"].(string)

	return &Claims{
		Subject:   subject,
		SessionID: sessionID,
		Email:     email,
		Raw:       claims,
	}, nil
}

func (v *Verifier) keyFunc(token *jwt.Token) (any, error) {
	kid, ok := token.Header["kid"].(string)
	if !ok || kid == "" {
		return nil, fmt.Errorf("%w: token has no kid", ErrUnauthorized)
	}

	if key := v.cachedKey(kid); key != nil && !v.needsRefresh() {
		return key, nil
	}

	if err := v.refreshKeys(context.Background()); err != nil {
		// Serve a rotated-out key from cache if we already have it.
		if key := v.cachedKey(kid); key != nil {
			return key, nil
		}
		return nil, err
	}

	if key := v.cachedKey(kid); key != nil {
		return key, nil
	}

	return nil, fmt.Errorf("%w: signing key %q not found", ErrUnauthorized, kid)
}

func (v *Verifier) needsRefresh() bool {
	v.mu.RLock()
	defer v.mu.RUnlock()
	return time.Since(v.fetchedAt) > v.ttl
}

func (v *Verifier) cachedKey(kid string) *rsa.PublicKey {
	v.mu.RLock()
	defer v.mu.RUnlock()
	return v.keys[kid]
}

func (v *Verifier) refreshKeys(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.jwksURL, nil)
	if err != nil {
		return err
	}

	resp, err := v.client.Do(req)
	if err != nil {
		return fmt.Errorf("fetch Clerk JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("fetch Clerk JWKS: unexpected status %d", resp.StatusCode)
	}

	var jwks jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return fmt.Errorf("decode Clerk JWKS: %w", err)
	}

	keys := make(map[string]*rsa.PublicKey, len(jwks.Keys))
	for _, k := range jwks.Keys {
		if k.Kty != "RSA" || k.Kid == "" {
			continue
		}
		key, err := k.publicKey()
		if err != nil {
			continue
		}
		keys[k.Kid] = key
	}

	v.mu.Lock()
	v.keys = keys
	v.fetchedAt = time.Now()
	v.mu.Unlock()

	return nil
}

func (k jwk) publicKey() (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(k.N)
	if err != nil {
		return nil, err
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(k.E)
	if err != nil {
		return nil, err
	}

	e := 0
	for _, b := range eBytes {
		e = e<<8 + int(b)
	}

	return &rsa.PublicKey{
		N: new(big.Int).SetBytes(nBytes),
		E: e,
	}, nil
}
