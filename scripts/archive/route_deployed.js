"use strict";
(() => {
  var e = {};
  ((e.id = 9516),
    (e.ids = [9516]),
    (e.modules = {
      20399: (e) => {
        e.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
      },
      30517: (e) => {
        e.exports = require("next/dist/compiled/next-server/app-route.runtime.prod.js");
      },
      80665: (e) => {
        e.exports = require("dns");
      },
      32891: (e, t, o) => {
        (o.r(t),
          o.d(t, {
            originalPathname: () => w,
            patchFetch: () => y,
            requestAsyncStorage: () => h,
            routeModule: () => g,
            serverHooks: () => x,
            staticGenerationAsyncStorage: () => f,
          }));
        var r = {};
        (o.r(r), o.d(r, { GET: () => d }));
        var a = o(49303),
          i = o(88716),
          s = o(60670),
          n = o(87070);
        let c = [
            "wordpress.com",
            "wp.com",
            "wix.com",
            "wixstatic.com",
            "shopify.com",
            "cdn.shopify.com",
            "myshopify.com",
            "cloudinary.com",
            "res.cloudinary.com",
            "imgur.com",
            "i.imgur.com",
            "amazonaws.com",
            "s3.amazonaws.com",
            "storage.googleapis.com",
            "firebaseapp.com",
            "firebasestorage.googleapis.com",
            "facebook.com",
            "fbcdn.net",
            "instagram.com",
            "twimg.com",
            "twitter.com",
            "x.com",
            "pinterest.com",
            "pinimg.com",
            "tiktok.com",
            "bytegoofs.com",
            "wilkiedevs.com",
            "minio.wilkiedevs.com",
            "vkdooutklowctuudjnkl.supabase.co",
            "supabase.co",
          ],
          l = new Map();
        async function m(e) {
          let t = Date.now(),
            o = l.get(e);
          if (o && o.expires > t) return o.authorized;
          if (c.some((t) => e === t || e.endsWith(`.${t}`)))
            return (l.set(e, { authorized: !0, expires: t + 6e5 }), !0);
          try {
            let o = "https://vkdooutklowctuudjnkl.supabase.co",
              r =
                process.env.SUPABASE_SERVICE_KEY ||
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM";
            if (!o || !r)
              return (
                console.error(
                  "[Img Proxy] Credenciales de Supabase no encontradas para validaci\xf3n din\xe1mica",
                ),
                !1
              );
            let a = new URL(`${o}/rest/v1/brands`);
            a.searchParams.set("select", "id");
            let i = [
              `website.ilike.*${e}*`,
              `custom_domain.eq.${e}`,
              `social_links->>website.ilike.*${e}*`,
              `social_links->>woo_plugin_store_domain.eq.${e}`,
              `social_links->>allowed_origins.ilike.*${e}*`,
            ];
            a.searchParams.set("or", `(${i.join(",")})`);
            let s = await fetch(a.toString(), {
              headers: { apikey: r, Authorization: `Bearer ${r}` },
              signal: AbortSignal.timeout(5e3),
            });
            if (!s.ok)
              return (
                console.warn(
                  `[Img Proxy] Supabase query fall\xf3: ${s.status}`,
                ),
                !1
              );
            let n = await s.json(),
              c = Array.isArray(n) && n.length > 0;
            return (
              l.set(e, { authorized: c, expires: t + 6e5 }),
              c
                ? console.log(
                    `[Img Proxy] Dominio autorizado din\xe1micamente via DB: ${e}`,
                  )
                : console.warn(
                    `[Img Proxy] Intento de acceso desde dominio no autorizado: ${e}`,
                  ),
              c
            );
          } catch (t) {
            return (
              console.error(
                `[Img Proxy] Error en validaci\xf3n din\xe1mica para ${e}:`,
                t.message,
              ),
              !1
            );
          }
        }
        function u(e) {
          if (
            "127.0.0.1" === e ||
            e.startsWith("127.") ||
            "::1" === e ||
            "::ffff:127.0.0.1" === e ||
            e.startsWith("10.") ||
            e.startsWith("192.168.")
          )
            return !0;
          if (e.startsWith("172.")) {
            let t = parseInt(e.split(".")[1], 10);
            if (t >= 16 && t <= 31) return !0;
          }
          return (
            !!e.startsWith("169.254.") ||
            "169.254.169.254" === e ||
            "localhost" === e ||
            "0.0.0.0" === e
          );
        }
        async function p(e) {
          try {
            let t = await Promise.resolve()
                .then(o.t.bind(o, 80665, 23))
                .then((e) => e.promises),
              r = (await t.resolve4(e.hostname))[0];
            return { ip: r, safe: !u(r) };
          } catch {
            if (u(e.hostname)) return { ip: e.hostname, safe: !1 };
            return { ip: e.hostname, safe: !0 };
          }
        }
        async function d(e) {
          let t;
          let o = e.nextUrl.searchParams.get("url");
          if (!o) return new n.NextResponse("Missing url", { status: 400 });
          try {
            if (((t = new URL(o)), !["http:", "https:"].includes(t.protocol)))
              return new n.NextResponse("Invalid URL protocol", {
                status: 400,
              });
          } catch {
            return new n.NextResponse("Invalid URL", { status: 400 });
          }
          let r = t.hostname.toLowerCase();
          if (!(await m(r)))
            return new n.NextResponse(
              "Dominio no permitido. Registra tu sitio en el perfil de Lookitry.",
              { status: 403 },
            );
          let { safe: a } = await p(t);
          if (!a)
            return (
              console.warn(
                `[Img Proxy] Intento de acceso a IP interna bloqueado: ${t.hostname}`,
              ),
              new n.NextResponse("Acceso denegado", { status: 403 })
            );
          for (let e of [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
          ])
            try {
              let o = await fetch(t.toString(), {
                headers: {
                  "User-Agent": e,
                  Accept:
                    "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                  "Accept-Language": "es,en;q=0.9",
                  "Cache-Control": "no-cache",
                },
                redirect: "follow",
                signal: AbortSignal.timeout(12e3),
              });
              if (!o.ok) {
                console.warn(`[Img Proxy] Fall\xf3 con UA: ${o.status}`);
                continue;
              }
              let r = o.headers.get("content-type") || "image/jpeg";
              if (!r.startsWith("image/")) {
                console.warn(`[Img Proxy] URL no retorn\xf3 imagen: ${r}`);
                break;
              }
              let a = await o.arrayBuffer();
              return new n.NextResponse(a, {
                headers: {
                  "Content-Type": r,
                  "Cache-Control":
                    "public, max-age=86400, stale-while-revalidate=3600",
                  "Access-Control-Allow-Origin": "*",
                  "X-Proxy-Origin": t.hostname,
                },
              });
            } catch (e) {
              console.warn("[Img Proxy] Error:", e.message);
              continue;
            }
          return (
            console.log(
              `[Img Proxy] Fallback final: Redirect a ${t.toString()}`,
            ),
            n.NextResponse.redirect(t.toString(), { status: 302 })
          );
        }
        let g = new a.AppRouteRouteModule({
            definition: {
              kind: i.x.APP_ROUTE,
              page: "/api/img-proxy/route",
              pathname: "/api/img-proxy",
              filename: "route",
              bundlePath: "app/api/img-proxy/route",
            },
            resolvedPagePath: "/app/src/app/api/img-proxy/route.ts",
            nextConfigOutput: "standalone",
            userland: r,
          }),
          {
            requestAsyncStorage: h,
            staticGenerationAsyncStorage: f,
            serverHooks: x,
          } = g,
          w = "/api/img-proxy/route";
        function y() {
          return (0, s.patchFetch)({
            serverHooks: x,
            staticGenerationAsyncStorage: f,
          });
        }
      },
    }));
  var t = require("../../../webpack-runtime.js");
  t.C(e);
  var o = (e) => t((t.s = e)),
    r = t.X(0, [8948, 5972], () => o(32891));
  module.exports = r;
})();
