# Zalen deployment

## Recommended hackathon setup

Use **Vercel for Next.js + Railway for the Go MCP API**, keeping the existing Convex database and Clerk account. Vercel is the simplest fit for the app's Next.js features; Railway can build the API Dockerfile. Railway's current trial includes a one-time $5 credit, so this is a short-demo option rather than unlimited free hosting.

For a strictly free API host, use **Render Free**. Its service sleeps after 15 minutes without traffic; expect a slow first MCP request after an idle period. Open the health endpoint before a live presentation and check that the service is ready.

If you prefer one hosting dashboard, deploy both Docker services on Railway. Each service consumes trial credits.

Current plan references: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Railway trial](https://docs.railway.com/pricing/free-trial), [Render free services](https://render.com/docs/free).

## What runs where

| Service | Deployment |
| --- | --- |
| Web app | Vercel, or root `Dockerfile` on a container host |
| Go API and MCP | Railway/Render, using `server/Dockerfile` |
| Database and functions | Existing Convex production `intent-seahorse-820` |
| Sign-in and sessions | Clerk |
| Local business lookup | Next.js `/api/local-businesses` → Geoapify |

The approved Convex deployment and 120-record fictional demo seed have already been applied. See [DEMO-SEED.md](DEMO-SEED.md). Do not create a second empty database for the public website.

## 1. Deploy the Go API

The live Go API is [https://zalen.onrender.com](https://zalen.onrender.com). Health is [https://zalen.onrender.com/api/v1/health](https://zalen.onrender.com/api/v1/health). MCP is `https://zalen.onrender.com/mcp`.

On Railway, create a service from this repository, set its **root directory to `server`**, and use its `Dockerfile`. On Render, create a Docker Web Service with the same root directory. Set the health check to `/api/v1/health`.

Add these runtime variables in the host's dashboard:

```text
APP_ENV=production
CLERK_JWT_ISSUER_DOMAIN=https://<your-clerk-issuer>
CONVEX_URL=https://intent-seahorse-820.ap-southeast-2.convex.cloud
CONVEX_DEPLOY_KEY=<existing production deploy key>
CORS_ALLOWED_ORIGINS=*
```

The host supplies `PORT`; the container listens on `0.0.0.0:$PORT`. `/mcp` is the MCP endpoint. `CORS_ALLOWED_ORIGINS=*` allows browser calls from the deployed site.

The deploy key belongs only on the API host. Never add it to a `NEXT_PUBLIC_*` variable or to a Docker build argument.

## 2. Deploy the web app on Vercel

Import the repository with these settings:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Framework | Next.js |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Next.js default |

The build script uses webpack and prepares the MapLibre worker. Do not replace it with a bare `next build` command.

Set these variables before building:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your Clerk publishable key>
CLERK_SECRET_KEY=<your Clerk secret key>
NEXT_PUBLIC_CONVEX_URL=https://intent-seahorse-820.ap-southeast-2.convex.cloud
NEXT_PUBLIC_API_URL=https://zalen.onrender.com/api/v1
NEXT_PUBLIC_MCP_URL=https://zalen.onrender.com/mcp
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/overview
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/overview
GEOAPIFY_API_KEY=<your Geoapify key>
```

`NEXT_PUBLIC_*` values are public and baked into the browser bundle. Changing one requires rebuilding the web app. Clerk and Geoapify secret keys stay on the web host at runtime.

Register the website hostname in Clerk, and in Geoapify if your key has origin restrictions. Match the Clerk `convex` JWT template's issuer/audience to `convex/auth.config.ts` and the Convex `CLERK_JWT_ISSUER_DOMAIN` environment variable. Use the matching Clerk instance; do not mix test and live keys.

## 3. Deploy the web Docker image instead

The root Dockerfile produces a standalone Next.js server, runs as a non-root user, includes static/map assets, and has an HTTP health check. Use a separate service for the Go API.

Supply these **build arguments** on your container host:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_CONVEX_URL
NEXT_PUBLIC_MCP_URL
```

Supply `CLERK_SECRET_KEY` and `GEOAPIFY_API_KEY` as **runtime environment variables**. Set `HOSTNAME=0.0.0.0`; the host can override `PORT` (default `3000`). The optional BuildKit secret `clerk_secret_key` is available for build environments that require the Clerk key during prerendering. Never pass the secret as a build argument.

Example using shell environment variables that you have already set:

```bash
docker build -t zalen-web \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --build-arg NEXT_PUBLIC_CONVEX_URL \
  --build-arg NEXT_PUBLIC_MCP_URL \
  --secret id=clerk_secret_key,env=CLERK_SECRET_KEY .
docker run --rm -p 3000:3000 --env-file .env.local zalen-web

docker build -t zalen-api ./server
docker run --rm -p 8080:8080 --env-file server/.env zalen-api
```

The examples are multiline Bash commands; use your host's build-argument UI or PowerShell line continuations on Windows.

`.dockerignore` files exclude environment files, Git metadata, and local dependencies. Keys are not copied into the images.

## 4. Run both containers locally

Create `.env.local` and `server/.env` from their examples, fill the keys, and stop any local processes using ports 3000/8080. With Docker Desktop's Linux engine running:

```bash
docker compose --env-file .env.local up --build -d
docker compose ps
docker compose logs --tail 80
```

Open `http://localhost:3000`. Compose uses `http://localhost:8080/mcp` for the browser and `http://web:3000` for the API's internal business lookup. The local Compose file is for local preview; public hosts need their own HTTPS URLs.

Stop the containers with `docker compose down`. Application data stays in Convex.

## 5. Presentation checks

- The public homepage is `/`. Get started opens `/sign-in`, with registration available on `/sign-up`. Both auth forms continue to `/overview`; profile setup is optional from the dashboard.
- Overview at `/overview` displays the Zalen banner and project shortcuts.
- Bounties and gigs show fictional demo listings, with additional statuses available through filters.
- Forum and community show demo posts and comments.
- Investor/business directories read their seeded examples from Convex.
- Freelancer search shows real places and map markers; directions open Google Maps.
- Sign-in and profile use the connected account. Demo seeding does not fabricate activity for a real account.
- MCP connect is in the header/mobile menu and opens `/profile#agent-connections`. Select your app, create a key, copy its configuration, and test the server.
- The API health endpoint returns `status: ok`, and MCP `initialize` responds.

A localhost MCP URL only works from the same computer. Cloud-hosted assistants need the public HTTPS endpoint. The setup UI makes this distinction explicit.
