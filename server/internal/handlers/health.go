package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

var startedAt = time.Now()

// Health is a liveness/readiness probe.
func Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
		"uptime": time.Since(startedAt).Seconds(),
	})
}

// Ping is a public example endpoint.
func Ping(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "pong"})
}
