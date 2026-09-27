import { ListSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda">
      <header className="mb-6 flex min-h-10 items-center">
        <h1 className="text-xl font-semibold">Moliya</h1>
      </header>
      <Skeleton className="mb-6 h-12 w-full" />
      <Skeleton className="mb-2 h-4 w-24" />
      <ListSkeleton rows={3} />
    </div>
  )
}
