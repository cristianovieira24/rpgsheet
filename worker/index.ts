/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const CHARACTER_TABLE = `CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  player TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  level INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;

async function ensureCharacterTable(db: D1Database) {
  await db.prepare(CHARACTER_TABLE).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS characters_updated_at_idx ON characters(updated_at DESC)").run();
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function handleCharactersApi(request: Request, env: Env, url: URL) {
  await ensureCharacterTable(env.DB);
  const match = url.pathname.match(/^\/api\/characters\/([^/]+)$/);
  const id = match ? decodeURIComponent(match[1]) : null;

  if (request.method === "GET" && id) {
    const row = await env.DB.prepare("SELECT id, name, player, summary, level, data, created_at AS createdAt, updated_at AS updatedAt FROM characters WHERE id = ?")
      .bind(id).first();
    return row ? json(row) : json({ error: "Ficha não encontrada." }, { status: 404 });
  }

  if (request.method === "GET") {
    const result = await env.DB.prepare("SELECT id, name, player, summary, level, created_at AS createdAt, updated_at AS updatedAt FROM characters ORDER BY updated_at DESC").all();
    return json({ characters: result.results ?? [] });
  }

  if (request.method === "POST") {
    const body = await request.json() as { id?: string; name?: string; player?: string; summary?: string; level?: number; data?: unknown };
    if (!body.id || !body.data) return json({ error: "Ficha incompleta." }, { status: 400 });
    const now = Date.now();
    const data = typeof body.data === "string" ? body.data : JSON.stringify(body.data);
    await env.DB.prepare(`INSERT INTO characters (id, name, player, summary, level, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, player = excluded.player, summary = excluded.summary, level = excluded.level, data = excluded.data, updated_at = excluded.updated_at`)
      .bind(body.id, body.name || "Sem nome", body.player || "", body.summary || "", Math.max(1, Math.min(20, Number(body.level) || 1)), data, now, now).run();
    return json({ ok: true, id: body.id, updatedAt: now });
  }

  if (request.method === "DELETE" && id) {
    await env.DB.prepare("DELETE FROM characters WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Método não permitido." }, { status: 405 });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/characters" || url.pathname.startsWith("/api/characters/")) {
      try {
        return await handleCharactersApi(request, env, url);
      } catch (error) {
        console.error("characters_api_error", error);
        return json({ error: "Não foi possível acessar o banco de fichas." }, { status: 500 });
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
