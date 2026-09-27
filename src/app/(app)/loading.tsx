import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda">
      <header className="mb-4 flex min-h-10 items-center">
        <h1 className="text-xl font-semibold">Moliya</h1>
      </header>
      <Skeleton className="mb-3 h-[11.5rem] rounded-2xl" />
      <Skeleton className="my-4 h-12 w-full" />
      <Skeleton className="mb-3 h-36 rounded-xl" />
      <Skeleton className="mb-3 h-36 rounded-xl" />
    </div>
  )
}
