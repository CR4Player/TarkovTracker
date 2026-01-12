import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../index';
import type { Env } from '../types';
const makeLimiter = () =>
  ({
    idFromName: (name: string) => name,
    get: () => ({
      fetch: async () =>
        new Response(
          JSON.stringify({
            allowed: true,
            remaining: 10,
            resetAt: Date.now() + 60000,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        ),
    }),
  }) as unknown as DurableObjectNamespace;
const BASE_ENV: Env = {
  API_GATEWAY_LIMITER: makeLimiter(),
  SUPABASE_URL: 'https://supabase.example',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  ALLOWED_ORIGIN: '*',
};
const buildRequest = (path: string, init?: RequestInit) =>
  new Request(`https://api.tarkovtracker.org${path}`, init);
const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('Unmocked fetch: missing test handler', { status: 500 }))
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});
describe('api-gateway', () => {
  it('serves health without auth', async () => {
    const res = await worker.fetch(buildRequest('/health'), BASE_ENV);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { service: string } };
    expect(body.success).toBe(true);
    expect(body.data.service).toBe('tarkovtracker-api');
  });
  it('serves OpenAPI spec on api host', async () => {
    const res = await worker.fetch(buildRequest('/openapi.json'), BASE_ENV);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { openapi: string; info?: { title?: string } };
    expect(body.openapi).toBe('3.1.0');
    expect(body.info?.title).toBe('TarkovTracker API Gateway');
  });
  it('serves Scalar docs at api root', async () => {
    const res = await worker.fetch(buildRequest('/'), BASE_ENV);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Scalar.createApiReference');
    expect(res.headers.get('content-type')).toContain('text/html');
  });
  it('rejects missing bearer token', async () => {
    const res = await worker.fetch(buildRequest('/token', { method: 'GET' }), BASE_ENV);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });
  it('returns token info for valid token', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/rest/v1/api_tokens')) {
        return jsonResponse([
          {
            token_id: 'token-1',
            user_id: 'user-1',
            token_hash: 'hash',
            permissions: ['GP'],
            game_mode: 'pvp',
            note: 'test',
            is_active: true,
            usage_count: 0,
            expires_at: null,
          },
        ]);
      }
      if (url.includes('/rest/v1/rpc/increment_token_usage')) {
        return jsonResponse({ ok: true });
      }
      return new Response('Not Found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await worker.fetch(
      buildRequest('/token', {
        method: 'GET',
        headers: { Authorization: 'Bearer PVP_abc123' },
      }),
      BASE_ENV
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; token: string; owner: string };
    expect(body.success).toBe(true);
    expect(body.token).toBe('PVP_abc123');
    expect(body.owner).toBe('user-1');
  });
  it('returns progress for valid token', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/rest/v1/api_tokens')) {
        return jsonResponse([
          {
            token_id: 'token-1',
            user_id: 'user-1',
            token_hash: 'hash',
            permissions: ['GP'],
            game_mode: 'pvp',
            note: 'test',
            is_active: true,
            usage_count: 0,
            expires_at: null,
          },
        ]);
      }
      if (url.includes('/rest/v1/rpc/increment_token_usage')) {
        return jsonResponse({ ok: true });
      }
      if (url.includes('/rest/v1/user_progress')) {
        return jsonResponse([
          {
            user_id: 'user-1',
            current_game_mode: 'pvp',
            game_edition: 1,
            pvp_data: {
              level: 10,
              pmcFaction: 'USEC',
              displayName: 'Tester',
              xpOffset: 0,
              taskObjectives: { 'obj-1': { complete: true, count: 2, timestamp: 1 } },
              taskCompletions: { 'task-1': { complete: true, failed: false, timestamp: 1 } },
              hideoutParts: {},
              hideoutModules: {},
              traders: {},
              skills: {},
              prestigeLevel: 0,
              skillOffsets: {},
            },
            pve_data: null,
          },
        ]);
      }
      if (url === 'https://api.tarkov.dev/graphql') {
        const data = {
          tasks: [
            {
              id: 'task-1',
              name: 'Task One',
              factionName: 'Any',
              alternatives: [],
              objectives: [{ id: 'obj-1', type: 'find', count: 2 }],
              taskRequirements: [],
            },
          ],
          hideoutStations: [],
        };
        return jsonResponse({ data });
      }
      return new Response('Not Found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await worker.fetch(
      buildRequest('/progress', {
        method: 'GET',
        headers: { Authorization: 'Bearer PVP_abc123' },
      }),
      BASE_ENV
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { userId: string } };
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('user-1');
  });
});
