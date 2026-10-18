# syntax=docker/dockerfile:1
FROM golang:1.27.2-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM alpine:3.22 AS runner
RUN apk add --no-cache ca-certificates && addgroup -S zalen && adduser -S -G zalen zalen
WORKDIR /app
COPY --from=builder --chown=zalen:zalen /out/api /app/api
ENV APP_ENV=production PORT=8080
USER zalen
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/api/v1/health" || exit 1
ENTRYPOINT ["/app/api"]
