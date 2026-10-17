.PHONY: dev run build test fmt vet tidy clean

BINARY := bin/api
PKG := ./cmd/api

dev:
	go run $(PKG)

run: build
	./$(BINARY)

build:
	CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o $(BINARY) $(PKG)

test:
	go test ./... -race -count=1

fmt:
	gofmt -w .

vet:
	go vet ./...

tidy:
	go mod tidy

clean:
	rm -rf bin
