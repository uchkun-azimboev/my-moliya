import { PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton title="Maqsadlar">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-[4.25rem] rounded-xl" />
        <Skeleton className="h-[4.25rem] rounded-xl" />
      </div>
      <Skeleton className="mb-4 h-40 rounded-xl" />
      <Skeleton className="mb-4 h-11 w-full" />
      <Skeleton className="h-60 rounded-xl" />
    </PageSkeleton>
  )
}
