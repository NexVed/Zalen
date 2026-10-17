# Zalen

Full-stack boilerplate: a **Next.js 16** front end (App Router, Cache Components),
**StyleX** for styling, **Clerk** for auth, **Convex** for the data layer, and a
**Go + Fiber** service API for backend business logic.

```
zalen/
├── app/                      Next.js App Router (front end)
│   ├── providers.tsx         ClerkProvider + ConvexProviderWithClerk
│   ├── sign-in/  sign-up/    Clerk catch-all routes
│   ├── layout.tsx  page.tsx  globals.css (@stylex directive)
├── components/
│   ├── AuthButtons.tsx       Client-side Clerk UI (keeps `/` static)
│   ├── SyncUser.tsx          Upserts the Clerk user into Convex on sign-in
│   └── ui/Button.tsx         StyleX component example
├── styles/tokens.stylex.ts   StyleX design tokens (colors, radius, space)
├── lib/convex.ts             Convex client
├── convex/                   Convex backend (schema, auth, functions)
├── server/                   Go + Fiber API (FastAPI-style service layer)
├── proxy.ts                  Clerk middleware (Next 16 renamed middleware → proxy)
├── CMakeLists.txt            Orchestrates the Go API + web build
├── babel.config.js           StyleX babel plugin
└── postcss.config.js         StyleX + Tailwind PostCSS plugins
```

## Responsibilities

| Layer | Owns |
| --- | --- |
| **Convex** | Database, realtime subscriptions, schema, auth-scoped queries/mutations |
| **Clerk** | Authentication + session JWTs (shared by Convex and the Go API) |
| **Go Fiber** | Service layer / business logic, external integrations, REST API |
| **Next.js + StyleX** | UI, routing, server components, styling |

Convex and the Go API both verify the **same Clerk session token**, so a signed-in
user is authenticated everywhere.

## Authentication model

Authentication is resolved **before** any route renders and **auth never blocks
the route tree**:

- `proxy.ts` runs `clerkMiddleware()` so the session is resolved once, up front,
  for every request. It does **not** path-match and block routes
  (`createRouteMatcher` is deprecated in Clerk Core 3).
- Auth checks are **resource-based**: a page, layout, API route, or Server
  Function that needs protection calls `await auth()` itself
  (`@clerk/nextjs/server`). Public routes render immediately.
- Interactive auth UI (sign-in/up buttons, user button) lives in the **client**
  component `components/AuthButtons.tsx`, so `/` stays a fully static route with
  no server-side `auth()` read — which also keeps Next's Instant Navigation
  validation happy.

## Prerequisites

- Node.js 20.9+ and [Bun](https://bun.sh)
- [Go 1.24+](https://go.dev/dl/) (installed via `mise` in this repo)
- [CMake 3.20+](https://cmake.org) (optional — for the `CMakeLists.txt` build)
- A [Clerk](https://clerk.com) application
- A [Convex](https://convex.dev) account

## Setup

### 1. Install dependencies

```bash
bun install
cd server && go mod download
```

### 2. Environment

```bash
cp .env.example .env.local          # front end
cp server/.env.example server/.env  # Go API
```

Fill in your Clerk keys. Create a Clerk **JWT template** named `convex`
(Dashboard → JWT Templates) and copy its issuer URL into
`CLERK_JWT_ISSUER_DOMAIN`.

### 3. Convex

```bash
bunx convex dev
```

This logs you in, creates a deployment, writes `NEXT_PUBLIC_CONVEX_URL`, and
regenerates `convex/_generated`. Make the Clerk issuer available to Convex:

```bash
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
```

### 4. Run everything

```bash
bun run dev:all   # web + convex + api
```

Or individually:

```bash
bun run dev          # Next.js only            → http://localhost:3000
bun run dev:convex   # Convex dev watcher
bun run dev:api      # Go Fiber API           → http://localhost:8080
```

## Go API

```bash
cd server
make dev     # go run ./cmd/api
make build   # static binary → bin/api
make test    # go test ./... -race
make lint    # go vet ./...
```

Routes (`server/internal/router/router.go`):

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | public | Liveness / uptime |
| GET | `/api/v1/ping` | public | Example public endpoint |
| GET | `/api/v1/me` | Bearer (Clerk) | Authenticated caller identity |

Clerk tokens are verified locally against Clerk's JWKS
(`server/internal/auth/clerk.go`), with cached keys and key rotation — no
per-request round trip to Clerk.

Add a protected route:

```go
protected := api.Group("", middleware.RequireAuth(verifier))
protected.Get("/me", handlers.Me)
```

## CMake (optional build orchestration)

`CMakeLists.txt` wraps the Go toolchain and Bun so both layers can be built and
run through CMake. It does not compile C/C++; it drives `go` and `bun`.

```bash
cmake -S . -B build                      # configure (locates go + bun)
cmake --build build                      # default target "api" → server/bin/api

cmake --build build --target web         # bun run build (Next.js)
cmake --build build --target web-dev     # bun run dev
cmake --build build --target api-run     # go run ./cmd/api
cmake --build build --target api-test    # go test ./... -race
cmake --build build --target api-vet     # go vet ./...
```

CMake is not bundled with the repo; install it via your package manager or
`mise use -g cmake`.

## Styling with StyleX

Define styles with `stylex.create` and apply them with `stylex.props`:

```tsx
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  root: { display: "flex", gap: 8 },
});

export function Row() {
  return <div {...stylex.props(styles.root)} />;
}
```

Reuse the design tokens in `styles/tokens.stylex.ts`. Add any new source
directory that contains StyleX styles to the `include` array in
`postcss.config.js`.

> Tailwind is also wired up (via `@tailwindcss/postcss`) if you prefer utility
> classes. Remove it from `postcss.config.js` and `app/globals.css` to drop it.

## Commands reference

### Install & environment

```bash
bun install                          # JS dependencies
cd server && go mod download         # Go dependencies

cp .env.example .env.local           # front end env
cp server/.env.example server/.env   # Go API env
```

### Run (development)

```bash
bun run dev:all                      # all three: web + convex + api

bun run dev                          # Next.js only            → http://localhost:3000
bun run dev:convex                   # Convex dev watcher (regenerates codegen)
bun run dev:api                      # Go Fiber API            → http://localhost:8080
```

### Convex

```bash
bunx convex dev                                              # dev deployment + codegen watcher
bunx convex deploy                                           # deploy to production
bunx convex codegen                                          # regenerate convex/_generated
bunx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer-url>     # Clerk issuer for token validation
bunx convex env list                                         # list deployment env vars
bunx convex dashboard                                        # open the Convex dashboard
```

### Front end (Next.js)

```bash
bun run build                         # production build
bun run start                         # serve the production build
bun run lint                          # ESLint
bun run typecheck                     # tsc --noEmit
```

### Go API (`server/`)

```bash
cd server
make dev                              # go run ./cmd/api
make run                              # build then run ./bin/api
make build                            # static binary → bin/api
make test                             # go test ./... -race
make fmt                              # gofmt -w .
make vet                              # go vet ./...
make tidy                             # go mod tidy
make clean                            # remove bin/

# without make:
go run ./cmd/api
go build -o bin/api ./cmd/api
go test ./... -race
go vet ./...
```

### Verify

```bash
bun run typecheck && bun run lint && bun run build   # front end
cd server && go vet ./... && go test ./... -race     # Go API
```
