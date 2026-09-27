import { ListSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton title="Maqsad" back="/goals">
      <Skeleton className="mb-4 h-72 rounded-xl" />
      <ListSkeleton rows={3} />
    </PageSkeleton>
  )
}
