// The entry <-> env lifecycle: bind an ephemeral port, tell the env the port, poll until done, exit 0.
import { createApp } from './app.ts';
const ENV_URL = (process.env.MAKEFUN_ENV_URL ?? '').replace(/\/+$/, '');
if (ENV_URL === '') { process.stderr.write('[entry] MAKEFUN_ENV_URL not set\n'); process.exit(1); }
const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_INITIAL_MS = 250;
const RETRY_MAX_MS = 2_000;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
function retryDelay(attempt: number): number { return Math.min(RETRY_MAX_MS, RETRY_INITIAL_MS * 2 ** Math.min(attempt, 8)); }
async function register(port: number): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(`${ENV_URL}/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ port }), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (res.status === 200 || res.status === 409) return;
      if (res.status === 400 || res.status === 405) throw new Error(`register ${res.status}`);
      throw new Error(`register ${res.status}`);
    } catch (e: any) {
      await sleep(retryDelay(attempt));
    }
  }
}
async function main(): Promise<void> {
  const server = await createApp();
  const port = await new Promise<number>((resolve) => { server.listen(0, '127.0.0.1', () => resolve((server.address() as net.AddressInfo).port)); });
  await register(port);
  for (;;) {
    try {
      const res = await fetch(`${ENV_URL}/done`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (res.status === 200) { const body = await res.json(); if (body.done) { server.close(); return; } }
    } catch {}
    await sleep(1000);
  }
}
main().catch((e) => { process.stderr.write(`[entry] ${e}\n`); process.exit(1); });
