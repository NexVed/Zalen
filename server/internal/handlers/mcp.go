package handlers

import (
	"encoding/json"
	"strings"

	"github.com/gofiber/fiber/v2"

	"zalen/server/internal/mcp"
)

// MCP serves the streamable HTTP transport used by Claude, Codex, and other agents.
func MCP(server *mcp.Server) fiber.Handler {
	return func(c *fiber.Ctx) error {
		switch c.Method() {
		case fiber.MethodGet:
			if strings.Contains(c.Get("Accept"), "text/event-stream") {
				return c.Status(fiber.StatusMethodNotAllowed).SendString("stateless MCP server does not hold a stream")
			}
			return c.JSON(server.Info())
		case fiber.MethodDelete:
			return c.SendStatus(fiber.StatusNoContent)
		case fiber.MethodPost:
			response, session, err := server.Handle(c.Context(), c.Body(), c.Get(fiber.HeaderAuthorization))
			if err != nil {
				return fiber.NewError(fiber.StatusBadRequest, err.Error())
			}
			c.Set("Mcp-Session-Id", session)
			if response == nil {
				return c.SendStatus(fiber.StatusAccepted)
			}
			encoded, err := json.Marshal(response)
			if err != nil {
				return err
			}
			if strings.Contains(c.Get("Accept"), "text/event-stream") {
				c.Set(fiber.HeaderContentType, "text/event-stream")
				c.Set("Cache-Control", "no-cache")
				return c.SendString("event: message\ndata: " + string(encoded) + "\n\n")
			}
			c.Set(fiber.HeaderContentType, "application/json")
			return c.Send(encoded)
		default:
			return fiber.NewError(fiber.StatusMethodNotAllowed, "use POST /mcp")
		}
	}
}
