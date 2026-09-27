// Service worker skripti. Build vaqtida bir marta yaratiladi — har bir deploy'da VERSION yangi,
// shuning uchun brauzer yangi SW'ni o'rnatadi, eski kesh o'chiriladi va sahifa yangi versiyaga o'tadi.
export const dynamic = "force-static"

const VERSION =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? String(Date.now())

const script = `// Moliya service worker — versiya: ${VERSION}
const CACHE = "moliya-${VERSION}";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/192", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Yangi versiya faollashganda eski keshlar o'chiriladi va ochiq sahifalar darhol shu SW'ga o'tadi
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("moliya-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Faqat versiyalangan statik fayllar va ikonkalar keshlanadi (cache-first).
  // Sahifalar va ma'lumotlar (moliyaviy raqamlar) KESHLANMAYDI.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Sahifaga o'tish: internet bo'lmasa — "Internet yo'q" sahifasi
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
  }
});
`

export function GET() {
  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // brauzer har safar yangilanishni tekshirsin
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}
