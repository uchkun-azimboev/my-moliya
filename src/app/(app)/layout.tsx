import { BottomNav } from "@/components/bottom-nav"

// Auth tekshiruvi bu yerda emas: layout'dagi await butun sahifani (skeletonni ham) to'sib qo'yadi.
// Himoya: proxy (kirmaganni /login ga yuboradi) + har bir sahifa requireUser() ni
// ma'lumot so'rovlari bilan parallel chaqiradi + bazada RLS.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
