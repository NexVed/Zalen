package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"

	"zalen/server/internal/config"
	"zalen/server/internal/router"
)

func main() {
	// Load a local .env when present (ignored in production/containers).
	_ = godotenv.Load()

	cfg := config.Load()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel(cfg.IsProduction()),
	}))
	slog.SetDefault(logger)

	app := router.New(cfg)

	go func() {
		addr := ":" + cfg.Port
		logger.Info("api listening", "addr", addr, "env", cfg.Env)
		if err := app.Listen(addr); err != nil {
			logger.Error("server stopped", "error", err)
		}
	}()

	// Graceful shutdown on SIGINT/SIGTERM.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := app.ShutdownWithContext(ctx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
		os.Exit(1)
	}

	logger.Info("bye")
}

func logLevel(production bool) slog.Level {
	if production {
		return slog.LevelInfo
	}
	return slog.LevelDebug
}
