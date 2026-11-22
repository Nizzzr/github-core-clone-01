// Git smart HTTP server: upload-pack v2 + receive-pack v0.
import http from 'node:http';
import net from 'node:net';
export function createGitServer(): http.Server {
  return http.createServer((req, res) => {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'not_implemented' }));
  });
}
