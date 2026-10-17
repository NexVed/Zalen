cmake_minimum_required(VERSION 3.20)

project(zalen LANGUAGES NONE)

# Zalen's services layer is written in Go and the frontend is a Next.js app
# run by Bun, so this CMakeLists orchestrates native toolchains (go, bun)
# through custom commands instead of compiling sources with a C/C++ compiler.

find_program(GO_EXECUTABLE go REQUIRED)
find_program(BUN_EXECUTABLE bun)

set(SERVER_DIR "${CMAKE_CURRENT_SOURCE_DIR}/server")
set(API_BIN "${SERVER_DIR}/bin/api")

file(GLOB_RECURSE ZALEN_GO_SOURCES CONFIGURE_DEPENDS "${SERVER_DIR}/*.go")

# ---------------------------------------------------------------------------
# Go services API
# ---------------------------------------------------------------------------
add_custom_command(
  OUTPUT "${API_BIN}"
  COMMAND ${CMAKE_COMMAND} -E env CGO_ENABLED=0
          "${GO_EXECUTABLE}" build -trimpath "-ldflags=-s -w"
          -o "${API_BIN}" ./cmd/api
  WORKING_DIRECTORY "${SERVER_DIR}"
  DEPENDS
    ${ZALEN_GO_SOURCES}
    "${SERVER_DIR}/go.mod"
    "${SERVER_DIR}/go.sum"
  COMMENT "Building Go API -> ${API_BIN}"
  VERBATIM
)

# Default target: `cmake --build build` produces the API binary.
add_custom_target(api ALL DEPENDS "${API_BIN}")

add_custom_target(api-run
  COMMAND "${GO_EXECUTABLE}" run ./cmd/api
  WORKING_DIRECTORY "${SERVER_DIR}"
  COMMENT "Running the Go API"
  USES_TERMINAL
  VERBATIM
)

add_custom_target(api-test
  COMMAND "${GO_EXECUTABLE}" test ./... -race -count=1
  WORKING_DIRECTORY "${SERVER_DIR}"
  COMMENT "Running Go tests"
  USES_TERMINAL
  VERBATIM
)

add_custom_target(api-vet
  COMMAND "${GO_EXECUTABLE}" vet ./...
  WORKING_DIRECTORY "${SERVER_DIR}"
  COMMENT "Vetting Go code"
  USES_TERMINAL
  VERBATIM
)

# ---------------------------------------------------------------------------
# Next.js frontend
# ---------------------------------------------------------------------------
if(BUN_EXECUTABLE)
  add_custom_target(web
    COMMAND "${BUN_EXECUTABLE}" run build
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    COMMENT "Building the Next.js frontend"
    USES_TERMINAL
    VERBATIM
  )

  add_custom_target(web-dev
    COMMAND "${BUN_EXECUTABLE}" run dev
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    COMMENT "Running the Next.js dev server"
    USES_TERMINAL
    VERBATIM
  )
else()
  message(STATUS "bun not found - 'web' and 'web-dev' targets disabled")
endif()

message(STATUS "Targets: api (default), api-run, api-test, api-vet, web, web-dev")
