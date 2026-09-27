import { BottomNav } from "@/components/bottom-nav"
import { requireUser } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser()

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
