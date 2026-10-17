package config

import (
	"os"
	"strings"
	"time"
)

// Config holds all runtime configuration for the API. Values are read from the
// environment so the binary stays 12-factor / container friendly.
type Config struct {
	Env                string
	Port               string
	ClerkJWTIssuer     string
	CORSAllowedOrigins []string
	ReadTimeout        time.Duration
	WriteTimeout       time.Duration
	ShutdownTimeout    time.Duration
}

// Load builds a Config from environment variables, applying sensible defaults.
func Load() Config {
	return Config{
		Env:                getEnv("APP_ENV", "development"),
		Port:               getEnv("PORT", "8080"),
		ClerkJWTIssuer:     getEnv("CLERK_JWT_ISSUER_DOMAIN", ""),
		CORSAllowedOrigins: splitAndTrim(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")),
		ReadTimeout:        10 * time.Second,
		WriteTimeout:       15 * time.Second,
		ShutdownTimeout:    10 * time.Second,
	}
}

// IsProduction reports whether the service is running in production.
func (c Config) IsProduction() bool {
	return c.Env == "production"
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func splitAndTrim(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
