import { renderAppIcon } from "@/lib/app-icon"

// Manifest ikonkalari: /icons/192, /icons/512, /icons/maskable (build vaqtida bir marta yaratiladi)
export const dynamic = "force-static"

const KINDS = {
  "192": () => renderAppIcon(192),
  "512": () => renderAppIcon(512),
  // Android ikonkani doira/kvadrat shaklida kesadi — belgi xavfsiz zonada (markaziy 80%), fon chetgacha
  maskable: () => renderAppIcon(512, { inset: 0.46, radius: 0 }),
} as const

export function generateStaticParams() {
  return Object.keys(KINDS).map((kind) => ({ kind }))
}

export async function GET(_req: Request, ctx: RouteContext<"/icons/[kind]">) {
  const { kind } = await ctx.params
  const render = KINDS[kind as keyof typeof KINDS]
  if (!render) return new Response("Not found", { status: 404 })
  return render()
}
