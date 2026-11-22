// REST v3 API server.
import http from 'node:http';
export function createRestServer(): http.Server {
  return http.createServer((req, res) => {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'not_implemented' }));
  });
}
