import { PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton title="Loyihalar">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-[4.25rem] rounded-xl" />
        <Skeleton className="h-[4.25rem] rounded-xl" />
      </div>
      <Skeleton className="mb-4 h-11 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </PageSkeleton>
  )
}
