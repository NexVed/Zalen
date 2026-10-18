package mcp

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/google/uuid"

	"zalen/server/internal/auth"
	"zalen/server/internal/convex"
)

const protocolVersion = "2025-03-26"

// Server is a stateless MCP endpoint. Each request reads Convex at that moment.
type Server struct {
	convex    *convex.Client
	verifier  *auth.Verifier
	publicURL string
	webURL    string
}

func New(data *convex.Client, verifier *auth.Verifier, publicURL, webURL string) *Server {
	return &Server{convex: data, verifier: verifier, publicURL: strings.TrimRight(publicURL, "/"), webURL: strings.TrimRight(webURL, "/")}
}

type rpcRequest struct {
	JSONRPC string           `json:"jsonrpc"`
	ID      *json.RawMessage `json:"id"`
	Method  string           `json:"method"`
	Params  json.RawMessage  `json:"params"`
}

type rpcResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Result  any             `json:"result,omitempty"`
	Error   *rpcError       `json:"error,omitempty"`
}

type rpcError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type callResult struct {
	Content []map[string]string `json:"content"`
	IsError bool                `json:"isError,omitempty"`
}

// Handle runs one JSON-RPC message. A nil response means the message was a notification.
func (s *Server) Handle(ctx context.Context, body []byte, authorization string) (*rpcResponse, string, error) {
	var req rpcRequest
	if err := json.Unmarshal(body, &req); err != nil {
		raw := json.RawMessage("null")
		return &rpcResponse{JSONRPC: "2.0", ID: raw, Error: &rpcError{Code: -32700, Message: "parse error"}}, "", nil
	}
	session := uuid.NewString()
	if req.isNotification() {
		return nil, session, nil
	}
	result, rpcErr := s.dispatch(ctx, req, authorization)
	id := json.RawMessage("null")
	if req.ID != nil {
		id = *req.ID
	}
	resp := &rpcResponse{JSONRPC: "2.0", ID: id, Result: result}
	if rpcErr != nil {
		resp.Error = rpcErr
		resp.Result = nil
	}
	return resp, session, nil
}

func (r rpcRequest) isNotification() bool {
	return r.ID == nil || string(*r.ID) == "null"
}

func (s *Server) dispatch(ctx context.Context, req rpcRequest, authorization string) (any, *rpcError) {
	switch req.Method {
	case "initialize":
		version := protocolVersion
		var params struct {
			ProtocolVersion string `json:"protocolVersion"`
		}
		_ = json.Unmarshal(req.Params, &params)
		if params.ProtocolVersion == "2024-11-05" || params.ProtocolVersion == "2025-06-18" {
			version = params.ProtocolVersion
		}
		return map[string]any{
			"protocolVersion": version,
			"capabilities": map[string]any{
				"tools":     map[string]any{"listChanged": false},
				"resources": map[string]any{"subscribe": false, "listChanged": false},
			},
			"serverInfo": map[string]string{"name": "zalen", "version": "0.1.0"},
			"instructions": "Zalen MCP covers every page: Overview, Opportunities, Bounties, Freelancers, Forum, Investors, B2B, Gigs, Community, and Profile. " +
				"Call zalen_snapshot for the live platform, or zalen_page with a page name for one section. " +
				"Send Authorization: Bearer with a Zalen MCP key to include the member profile and to publish, apply, comment, vote, or update a profile.",
		}, nil
	case "ping":
		return map[string]any{}, nil
	case "tools/list":
		return map[string]any{"tools": toolDefs()}, nil
	case "tools/call":
		return s.callTool(ctx, req.Params, authorization)
	case "resources/list":
		return map[string]any{"resources": resourceDefs()}, nil
	case "resources/read":
		return s.readResource(ctx, req.Params, authorization)
	case "resources/templates/list", "prompts/list":
		return map[string]any{"resourceTemplates": []any{}, "prompts": []any{}}, nil
	default:
		return nil, &rpcError{Code: -32601, Message: "method not found: " + req.Method}
	}
}

func (s *Server) callTool(ctx context.Context, params json.RawMessage, authorization string) (any, *rpcError) {
	var in struct {
		Name      string         `json:"name"`
		Arguments map[string]any `json:"arguments"`
	}
	if err := json.Unmarshal(params, &in); err != nil {
		return textResult(err.Error(), true), nil
	}
	clerkID, authErr := s.clerkID(ctx, authorization)
	switch in.Name {
	case "zalen_snapshot":
		return s.snapshot(ctx, clerkID, "")
	case "zalen_page":
		return s.snapshot(ctx, clerkID, str(in.Arguments, "page"))
	case "zalen_whoami":
		if authErr != nil {
			return textResult(authErr.Error(), true), nil
		}
		return s.rawQuery(ctx, "mcp:myWorkspace", map[string]any{"clerkUserId": clerkID})
	case "zalen_find_businesses":
		return s.businesses(ctx, str(in.Arguments, "location"), str(in.Arguments, "category"))
	case "zalen_community_comments":
		return s.rawQuery(ctx, "community:listComments", map[string]any{"postId": str(in.Arguments, "postId")})
	case "zalen_forum_comments":
		return s.rawQuery(ctx, "forum:listComments", map[string]any{"postId": str(in.Arguments, "postId")})
	case "zalen_bounty":
		return s.rawQuery(ctx, "bounties:getBounty", map[string]any{"bountyId": str(in.Arguments, "bountyId")})
	case "zalen_bounty_applications":
		return s.rawQuery(ctx, "bounties:listApplications", map[string]any{"bountyId": str(in.Arguments, "bountyId")})
	case "zalen_gig":
		return s.rawQuery(ctx, "gigs:getGig", map[string]any{"gigId": str(in.Arguments, "gigId")})
	case "zalen_gig_proposals":
		return s.rawQuery(ctx, "gigs:listProposals", map[string]any{"gigId": str(in.Arguments, "gigId")})
	case "zalen_create_community_post":
		return s.write(ctx, authErr, clerkID, "mcp:createCommunityPost", map[string]any{"body": str(in.Arguments, "body")})
	case "zalen_comment_community_post":
		return s.write(ctx, authErr, clerkID, "mcp:addCommunityComment", map[string]any{"postId": str(in.Arguments, "postId"), "body": str(in.Arguments, "body")})
	case "zalen_like_community_post":
		return s.write(ctx, authErr, clerkID, "mcp:toggleCommunityLike", map[string]any{"postId": str(in.Arguments, "postId")})
	case "zalen_create_forum_post":
		return s.write(ctx, authErr, clerkID, "mcp:createForumPost", map[string]any{"title": str(in.Arguments, "title"), "body": str(in.Arguments, "body"), "category": str(in.Arguments, "category")})
	case "zalen_comment_forum_post":
		return s.write(ctx, authErr, clerkID, "mcp:addForumComment", map[string]any{"postId": str(in.Arguments, "postId"), "body": str(in.Arguments, "body")})
	case "zalen_vote_forum_post":
		return s.write(ctx, authErr, clerkID, "mcp:voteForumPost", map[string]any{"postId": str(in.Arguments, "postId"), "direction": num(in.Arguments, "direction")})
	case "zalen_create_bounty":
		return s.write(ctx, authErr, clerkID, "mcp:createBounty", map[string]any{"title": str(in.Arguments, "title"), "description": str(in.Arguments, "description"), "type": str(in.Arguments, "type"), "reward": str(in.Arguments, "reward")})
	case "zalen_apply_bounty":
		return s.write(ctx, authErr, clerkID, "mcp:applyToBounty", map[string]any{"bountyId": str(in.Arguments, "bountyId"), "proposal": str(in.Arguments, "proposal")})
	case "zalen_create_gig":
		return s.write(ctx, authErr, clerkID, "mcp:createGig", map[string]any{"title": str(in.Arguments, "title"), "description": str(in.Arguments, "description"), "category": str(in.Arguments, "category"), "budget": str(in.Arguments, "budget")})
	case "zalen_propose_gig":
		return s.write(ctx, authErr, clerkID, "mcp:submitGigProposal", map[string]any{"gigId": str(in.Arguments, "gigId"), "coverLetter": str(in.Arguments, "coverLetter"), "proposedRate": str(in.Arguments, "proposedRate")})
	case "zalen_save_profile":
		return s.write(ctx, authErr, clerkID, "mcp:saveProfile", map[string]any{"bio": str(in.Arguments, "bio"), "location": str(in.Arguments, "location"), "phone": str(in.Arguments, "phone")})
	case "zalen_save_skills":
		return s.write(ctx, authErr, clerkID, "mcp:saveSkills", map[string]any{"skills": in.Arguments["skills"]})
	case "zalen_add_portfolio_project":
		return s.write(ctx, authErr, clerkID, "mcp:savePortfolioProject", map[string]any{"title": str(in.Arguments, "title"), "summary": str(in.Arguments, "summary"), "liveUrl": str(in.Arguments, "liveUrl"), "repoUrl": str(in.Arguments, "repoUrl")})
	default:
		return nil, &rpcError{Code: -32602, Message: "unknown tool " + in.Name}
	}
}

func (s *Server) snapshot(ctx context.Context, clerkID, page string) (any, *rpcError) {
	community, err := s.convex.Query(ctx, "community:listPosts", map[string]any{})
	if err != nil {
		return textResult(err.Error(), true), nil
	}
	bounties, err := s.convex.Query(ctx, "bounties:listBounties", map[string]any{})
	if err != nil {
		return textResult(err.Error(), true), nil
	}
	gigs, err := s.convex.Query(ctx, "gigs:listGigs", map[string]any{})
	if err != nil {
		return textResult(err.Error(), true), nil
	}
	forum, err := s.convex.Query(ctx, "forum:listPosts", map[string]any{})
	if err != nil {
		return textResult(err.Error(), true), nil
	}
	catalog, catalogErr := s.getJSON(ctx, s.webURL+"/api/platform-catalog")
	var me json.RawMessage
	if clerkID != "" {
		me, err = s.convex.Query(ctx, "mcp:myWorkspace", map[string]any{"clerkUserId": clerkID})
		if err != nil {
			return textResult(err.Error(), true), nil
		}
	}
	pages := map[string]any{
		"overview":      map[string]any{"profile": me, "liveCounts": map[string]int{"community": countJSON(community), "bounties": countJSON(bounties), "gigs": countJSON(gigs), "forum": countJSON(forum)}},
		"opportunities": pick(catalog, "opportunities", "cities"),
		"bounties":      json.RawMessage(bounties),
		"freelancers":   map[string]any{"talent": pick(catalog, "talent"), "businessSearch": "Call zalen_find_businesses with a city. Listings come from Geoapify. Categories: Food & drink, Shops, Services."},
		"forum":         map[string]any{"live": json.RawMessage(forum), "sampleDiscussions": pick(catalog, "discussions")},
		"investors":     pick(catalog, "investors"),
		"b2b":           pick(catalog, "businesses"),
		"gigs":          json.RawMessage(gigs),
		"community":     json.RawMessage(community),
		"profile":       me,
	}
	if catalogErr != nil {
		pages["catalogError"] = catalogErr.Error()
	}
	payload := map[string]any{"pages": pages}
	if page != "" {
		section, ok := pages[strings.ToLower(page)]
		if !ok {
			return textResult("unknown page "+page+". Use overview, opportunities, bounties, freelancers, forum, investors, b2b, gigs, community, or profile.", true), nil
		}
		payload = map[string]any{"page": strings.ToLower(page), "data": section}
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return textResult(err.Error(), true), nil
	}
	return textResult(string(raw), false), nil
}

func (s *Server) businesses(ctx context.Context, location, category string) (any, *rpcError) {
	if strings.TrimSpace(location) == "" {
		return textResult("location is required", true), nil
	}
	query := url.Values{"location": {location}}
	if category != "" {
		query.Set("category", category)
	}
	body, err := s.getJSON(ctx, s.webURL+"/api/local-businesses?"+query.Encode())
	if err != nil {
		return textResult(err.Error(), true), nil
	}
	return textResult(string(body), false), nil
}

func (s *Server) getJSON(ctx context.Context, rawURL string) (json.RawMessage, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("web %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	return json.RawMessage(body), nil
}

func (s *Server) rawQuery(ctx context.Context, path string, args map[string]any) (any, *rpcError) {
	value, err := s.convex.Query(ctx, path, args)
	if err != nil {
		return textResult(err.Error(), true), nil
	}
	return textResult(string(value), false), nil
}

func (s *Server) write(ctx context.Context, authErr error, clerkID, path string, args map[string]any) (any, *rpcError) {
	if authErr != nil || clerkID == "" {
		if authErr == nil {
			authErr = errString("create a Zalen MCP key while signed in, then send it as Authorization: Bearer")
		}
		return textResult(authErr.Error(), true), nil
	}
	args["clerkUserId"] = clerkID
	value, err := s.convex.Mutation(ctx, path, args)
	if err != nil {
		return textResult(err.Error(), true), nil
	}
	return textResult(string(value), false), nil
}

func (s *Server) readResource(ctx context.Context, params json.RawMessage, authorization string) (any, *rpcError) {
	var in struct {
		URI string `json:"uri"`
	}
	_ = json.Unmarshal(params, &in)
	clerkID, _ := s.clerkID(ctx, authorization)
	arguments := map[string]any{}
	name := "zalen_snapshot"
	switch {
	case in.URI == "zalen://me" || in.URI == "zalen://pages/profile":
		name = "zalen_whoami"
	case strings.HasPrefix(in.URI, "zalen://pages/"):
		name = "zalen_page"
		arguments["page"] = strings.TrimPrefix(in.URI, "zalen://pages/")
	case in.URI != "zalen://snapshot" && in.URI != "":
		return nil, &rpcError{Code: -32002, Message: "unknown resource " + in.URI}
	}
	encoded, _ := json.Marshal(map[string]any{"name": name, "arguments": arguments})
	result, rpcErr := s.callTool(ctx, encoded, bearer(clerkID, authorization))
	if rpcErr != nil {
		return nil, rpcErr
	}
	text := ""
	if call, ok := result.(callResult); ok && len(call.Content) > 0 {
		text = call.Content[0]["text"]
	}
	return map[string]any{
		"contents": []map[string]string{{
			"uri":      in.URI,
			"mimeType": "application/json",
			"text":     text,
		}},
	}, nil
}

func (s *Server) clerkID(ctx context.Context, authorization string) (string, error) {
	token := bearerToken(authorization)
	if token == "" {
		return "", errString("missing bearer token")
	}
	if strings.HasPrefix(token, "zalen_") {
		if !s.convex.Enabled() {
			return "", errString("convex is not configured on the API server")
		}
		sum := sha256.Sum256([]byte(token))
		value, err := s.convex.Mutation(ctx, "mcp:authenticateKey", map[string]any{"tokenHash": hex.EncodeToString(sum[:])})
		if err != nil {
			return "", err
		}
		var key struct {
			ClerkUserID string `json:"clerkUserId"`
		}
		if err := json.Unmarshal(value, &key); err != nil || key.ClerkUserID == "" {
			return "", errString("unknown MCP key")
		}
		return key.ClerkUserID, nil
	}
	claims, err := s.verifier.Verify(ctx, token)
	if err != nil {
		return "", errString("invalid or expired token")
	}
	return claims.Subject, nil
}

func bearerToken(header string) string {
	header = strings.TrimSpace(header)
	if len(header) < 8 || !strings.EqualFold(header[:7], "bearer ") {
		return ""
	}
	return strings.TrimSpace(header[7:])
}

func bearer(clerkID, original string) string {
	if clerkID == "" {
		return ""
	}
	return original
}

func num(args map[string]any, key string) float64 {
	if args == nil {
		return 0
	}
	value, _ := args[key].(float64)
	return value
}

func countJSON(raw json.RawMessage) int {
	var list []json.RawMessage
	if json.Unmarshal(raw, &list) != nil {
		return 0
	}
	return len(list)
}

func pick(raw json.RawMessage, keys ...string) any {
	var doc map[string]json.RawMessage
	if len(raw) == 0 || json.Unmarshal(raw, &doc) != nil {
		return nil
	}
	if len(keys) == 1 {
		return doc[keys[0]]
	}
	out := map[string]json.RawMessage{}
	for _, key := range keys {
		out[key] = doc[key]
	}
	return out
}

func str(args map[string]any, key string) string {
	if args == nil {
		return ""
	}
	value, _ := args[key].(string)
	return value
}

func textResult(text string, isError bool) callResult {
	return callResult{Content: []map[string]string{{"type": "text", "text": text}}, IsError: isError}
}

type strErr string

func (e strErr) Error() string { return string(e) }

func errString(message string) error { return strErr(message) }

func toolDefs() []map[string]any {
	page := map[string]any{"page": prop("string", "overview, opportunities, bounties, freelancers, forum, investors, b2b, gigs, community, or profile.")}
	return []map[string]any{
		tool("zalen_snapshot", "Read every Zalen page at this moment: overview, opportunities, bounties, freelancers, forum, investors, B2B, gigs, community, and profile.", nil),
		tool("zalen_page", "Read one live page.", page, "page"),
		tool("zalen_whoami", "Read the signed-in member's profile, skills, portfolio, and their community posts.", nil),
		tool("zalen_find_businesses", "Freelancers page: list nearby businesses from Geoapify for a city or area.", map[string]any{
			"location": prop("string", "City or area, for example Bengaluru."),
			"category": prop("string", "Optional: Food & drink, Shops, or Services."),
		}, "location"),
		tool("zalen_bounty", "Read one bounty.", map[string]any{"bountyId": prop("string", "Bounty id.")}, "bountyId"),
		tool("zalen_bounty_applications", "Read applications on a bounty.", map[string]any{"bountyId": prop("string", "Bounty id.")}, "bountyId"),
		tool("zalen_gig", "Read one gig.", map[string]any{"gigId": prop("string", "Gig id.")}, "gigId"),
		tool("zalen_gig_proposals", "Read proposals on a gig.", map[string]any{"gigId": prop("string", "Gig id.")}, "gigId"),
		tool("zalen_forum_comments", "Read comments on a forum post.", map[string]any{"postId": prop("string", "Forum post id.")}, "postId"),
		tool("zalen_community_comments", "Read comments on a community post.", map[string]any{"postId": prop("string", "Community post id.")}, "postId"),
		tool("zalen_create_community_post", "Publish a community post so the work is visible on the feed.", map[string]any{
			"body": prop("string", "Post text, 1 to 4000 characters."),
		}, "body"),
		tool("zalen_comment_community_post", "Comment on a community post.", map[string]any{
			"postId": prop("string", "Community post id."),
			"body":   prop("string", "Comment text."),
		}, "postId", "body"),
		tool("zalen_like_community_post", "Like or unlike a community post.", map[string]any{
			"postId": prop("string", "Community post id."),
		}, "postId"),
		tool("zalen_create_forum_post", "Start a forum thread.", map[string]any{
			"title":    prop("string", "Thread title."),
			"body":     prop("string", "Thread body."),
			"category": prop("string", "Questions, Feedback, Build logs, or Resources."),
		}, "title", "body", "category"),
		tool("zalen_create_bounty", "Post a bounty.", map[string]any{
			"title":       prop("string", "Bounty title."),
			"description": prop("string", "What needs to be done."),
			"type":        prop("string", "bug, feature, code_review, design, docs, research, or other."),
			"reward":      prop("string", "Optional reward text."),
		}, "title", "description", "type"),
		tool("zalen_create_gig", "Post a freelance gig.", map[string]any{
			"title":       prop("string", "Gig title."),
			"description": prop("string", "The work."),
			"category":    prop("string", "development, design, writing, marketing, video, data, consulting, or other."),
			"budget":      prop("string", "Optional budget text."),
		}, "title", "description", "category"),
		tool("zalen_comment_forum_post", "Comment on a forum thread.", map[string]any{"postId": prop("string", "Forum post id."), "body": prop("string", "Comment.")}, "postId", "body"),
		tool("zalen_vote_forum_post", "Upvote or downvote a forum thread. direction 1 or -1.", map[string]any{"postId": prop("string", "Forum post id."), "direction": prop("number", "1 or -1.")}, "postId", "direction"),
		tool("zalen_apply_bounty", "Apply to a bounty.", map[string]any{"bountyId": prop("string", "Bounty id."), "proposal": prop("string", "Proposal.")}, "bountyId", "proposal"),
		tool("zalen_propose_gig", "Submit a gig proposal.", map[string]any{"gigId": prop("string", "Gig id."), "coverLetter": prop("string", "Cover letter."), "proposedRate": prop("string", "Optional rate.")}, "gigId", "coverLetter"),
		tool("zalen_save_profile", "Update the signed-in profile bio, location, and phone.", map[string]any{"bio": prop("string", "Bio."), "location": prop("string", "City."), "phone": prop("string", "Phone.")}),
		tool("zalen_save_skills", "Replace the signed-in member's skills.", map[string]any{"skills": map[string]string{"type": "array", "description": "Objects with name, and optional category and proficiency."}}, "skills"),
		tool("zalen_add_portfolio_project", "Add a portfolio project on the profile.", map[string]any{"title": prop("string", "Project title."), "summary": prop("string", "Short summary."), "liveUrl": prop("string", "Live URL."), "repoUrl": prop("string", "Repository URL.")}, "title"),
	}
}

func tool(name, description string, properties map[string]any, required ...string) map[string]any {
	if properties == nil {
		properties = map[string]any{}
	}
	if required == nil {
		required = []string{}
	}
	return map[string]any{
		"name":        name,
		"description": description,
		"inputSchema": map[string]any{
			"type":       "object",
			"properties": properties,
			"required":   required,
		},
	}
}

func prop(kind, description string) map[string]string {
	return map[string]string{"type": kind, "description": description}
}

func resourceDefs() []map[string]string {
	names := []string{"overview", "opportunities", "bounties", "freelancers", "forum", "investors", "b2b", "gigs", "community", "profile"}
	resources := []map[string]string{{"uri": "zalen://snapshot", "name": "Every page", "mimeType": "application/json"}}
	for _, name := range names {
		resources = append(resources, map[string]string{"uri": "zalen://pages/" + name, "name": name, "mimeType": "application/json"})
	}
	return resources
}

// Info is the connection card shown to people setting up Claude or Codex.
func (s *Server) Info() map[string]any {
	url := s.publicURL + "/mcp"
	return map[string]any{
		"url":       url,
		"transport": "streamable-http",
		"auth":      "Authorization: Bearer <zalen MCP key or Clerk session token>",
		"claude": map[string]any{
			"mcpServers": map[string]any{
				"zalen": map[string]any{"url": url},
			},
		},
		"codex": map[string]string{
			"toml": "[mcp_servers.zalen]\nurl = \"" + url + "\"",
		},
	}
}
