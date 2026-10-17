package handlers

import (
	"github.com/gofiber/fiber/v2"

	"zalen/server/internal/middleware"
)

// Me returns the identity of the authenticated caller. This is the spot where
// your Fiber service layer would enrich the Clerk identity with data from
// Convex or another datastore.
func Me(c *fiber.Ctx) error {
	claims, ok := middleware.Claims(c)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "not authenticated")
	}

	return c.JSON(fiber.Map{
		"id":        claims.Subject,
		"sessionId": claims.SessionID,
		"email":     claims.Email,
		"claims":    claims.Raw,
	})
}
