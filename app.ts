// The HTTP server. The suite drives 4 surfaces: git smart HTTP (/{owner}/{repo}.git), REST v3 (/api/v3),
// GraphQL (/api/graphql), MCP (/mcp). One process, one port, own store, no git binary, no outside service.
import http from 'node:http';
import { createGitServer } from './git.ts';
import { createRestServer } from './rest.ts';
export async function createApp(): Promise<http.Server> {
  const gitServer = createGitServer();
  const restServer = createRestServer();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    // Git smart HTTP: /{owner}/{repo}.git
    if (url.pathname.endsWith('.git')) { gitServer.handle(req, res, url); return; }
    // REST v3: /api/v3/*
    if (url.pathname.startsWith('/api/v3/')) { restServer.handle(req, res, url); return; }
    // GraphQL: /api/graphql
    if (url.pathname === '/api/graphql') { restServer.handle(req, res, url); return; }
    // MCP: /mcp
    if (url.pathname === '/mcp') { restServer.handle(req, res, url); return; }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'not_found' }));
  });
  return server;
}
