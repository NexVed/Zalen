package router

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"

	"zalen/server/internal/auth"
	"zalen/server/internal/config"
	"zalen/server/internal/convex"
	"zalen/server/internal/handlers"
	"zalen/server/internal/mcp"
	"zalen/server/internal/middleware"
)

// New wires middleware, routes, and dependencies into a Fiber app.
func New(cfg config.Config) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "zalen-api",
		ErrorHandler: errorHandler,
	})

	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(cfg.CORSAllowedOrigins, ","),
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
		AllowMethods:     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	verifier := auth.NewVerifier(cfg.ClerkJWTIssuer)
	mcpServer := mcp.New(convex.New(cfg.ConvexURL, cfg.ConvexDeployKey), verifier, cfg.PublicURL, cfg.WebURL)
	app.All("/mcp", handlers.MCP(mcpServer))

	api := app.Group("/api/v1")
	{
		api.Get("/health", handlers.Health)
		api.Get("/ping", handlers.Ping)

		protected := api.Group("", middleware.RequireAuth(verifier))
		protected.Get("/me", handlers.Me)
	}

	// Root convenience handler.
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"service": "zalen-api", "docs": "/api/v1/health"})
	})

	return app
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "internal server error"

	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		code = fiberErr.Code
		message = fiberErr.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error": fiber.Map{
			"status":  code,
			"message": message,
		},
	})
}
