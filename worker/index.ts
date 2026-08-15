/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  BUCKET: R2Bucket;
  EDIT_CODE?: string;
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

const TRIP_ID = "ruta-luna-2026";

function validTripPayload(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const payload = value as { tripDays?: unknown; done?: unknown; budget?: unknown; expenses?: unknown; stays?: unknown; excursions?: unknown; memories?: unknown };
  return Array.isArray(payload.tripDays) && Array.isArray(payload.done) && typeof payload.budget === "string" && Array.isArray(payload.expenses) && Array.isArray(payload.stays) && Array.isArray(payload.excursions);
}

function canEdit(request: Request, env: Env) {
  return Boolean(env.EDIT_CODE) && request.headers.get("x-edit-code") === env.EDIT_CODE;
}

async function handleTripApi(request: Request, env: Env) {
  if (request.method === "GET") {
    const row = await env.DB.prepare("SELECT payload, updated_by, updated_at FROM trip_state WHERE id = ?")
      .bind(TRIP_ID)
      .first<{ payload: string; updated_by: string; updated_at: string }>();
    if (!row) return Response.json({ state: null });
    return Response.json({ state: JSON.parse(row.payload), updatedBy: row.updated_by, updatedAt: row.updated_at });
  }

  if (request.method === "PUT") {
    if (!canEdit(request, env)) return Response.json({ error: "Clave de edición requerida" }, { status: 401 });
    const payload = await request.json();
    if (!validTripPayload(payload)) return Response.json({ error: "Datos del viaje inválidos" }, { status: 400 });
    const email = request.headers.get("oai-authenticated-user-email") || "Viajero";
    await env.DB.prepare(`INSERT INTO trip_state (id, payload, updated_by, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP`)
      .bind(TRIP_ID, JSON.stringify(payload), email)
      .run();
    return Response.json({ ok: true, updatedBy: email, updatedAt: new Date().toISOString() });
  }

  return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, PUT" } });
}

async function handlePhotoApi(request: Request, env: Env, pathname: string) {
  if (request.method === "POST" && pathname === "/api/photos") {
    if (!canEdit(request, env)) return Response.json({ error: "Clave de edición requerida" }, { status: 401 });
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File) || !photo.type.startsWith("image/")) return Response.json({error:"Imagen inválida"},{status:400});
    if (photo.size > 12 * 1024 * 1024) return Response.json({error:"La imagen supera 12 MB"},{status:413});
    const safeType = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const key = `bitacora/${Date.now()}-${crypto.randomUUID()}.${safeType}`;
    await env.BUCKET.put(key, photo.stream(), { httpMetadata: { contentType: photo.type, cacheControl: "public, max-age=31536000, immutable" } });
    return Response.json({url:`/api/photos/${encodeURIComponent(key)}`});
  }
  if (request.method === "GET" && pathname.startsWith("/api/photos/")) {
    const key = decodeURIComponent(pathname.slice("/api/photos/".length));
    if (!key.startsWith("bitacora/")) return new Response("Not found",{status:404});
    const object = await env.BUCKET.get(key);
    if (!object) return new Response("Not found",{status:404});
    const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag",object.httpEtag);
    return new Response(object.body,{headers});
  }
  return new Response("Method not allowed",{status:405});
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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

    if (url.pathname === "/api/trip") {
      return handleTripApi(request, env);
    }

    if (url.pathname === "/api/unlock" && request.method === "POST") {
      return canEdit(request, env) ? Response.json({ok:true}) : Response.json({error:"Clave incorrecta"},{status:401});
    }

    if (url.pathname === "/api/photos" || url.pathname.startsWith("/api/photos/")) {
      return handlePhotoApi(request, env, url.pathname);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
