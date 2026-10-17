package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"zalen/server/internal/auth"
)

const (
	claimsLocalKey = "clerk_claims"
	userIDLocalKey = "clerk_user_id"
)

// RequireAuth rejects requests without a valid Clerk bearer token.
func RequireAuth(verifier *auth.Verifier) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get(fiber.HeaderAuthorization)
		if !strings.HasPrefix(header, "Bearer ") {
			return fiber.NewError(fiber.StatusUnauthorized, "missing bearer token")
		}

		token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		claims, err := verifier.Verify(c.Context(), token)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid or expired token")
		}

		c.Locals(claimsLocalKey, claims)
		c.Locals(userIDLocalKey, claims.Subject)
		return c.Next()
	}
}

// OptionalAuth attaches claims when a valid token is present but never fails
// the request. Useful for endpoints that enrich their response when signed in.
func OptionalAuth(verifier *auth.Verifier) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get(fiber.HeaderAuthorization)
		if strings.HasPrefix(header, "Bearer ") {
			token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
			if claims, err := verifier.Verify(c.Context(), token); err == nil {
				c.Locals(claimsLocalKey, claims)
				c.Locals(userIDLocalKey, claims.Subject)
			}
		}
		return c.Next()
	}
}

// Claims returns the authenticated claims stored on the request, if any.
func Claims(c *fiber.Ctx) (*auth.Claims, bool) {
	claims, ok := c.Locals(claimsLocalKey).(*auth.Claims)
	return claims, ok
}

// UserID returns the authenticated Clerk user ID, if any.
func UserID(c *fiber.Ctx) (string, bool) {
	id, ok := c.Locals(userIDLocalKey).(string)
	return id, ok
}
