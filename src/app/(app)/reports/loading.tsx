import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda">
      <header className="mb-4 flex min-h-10 items-center">
        <h1 className="text-xl font-semibold">Moliya</h1>
      </header>
      <Skeleton className="mb-4 h-11 w-full" />
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="mb-3 h-96 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}
