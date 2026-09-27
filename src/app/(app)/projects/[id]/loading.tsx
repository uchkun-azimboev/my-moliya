import { ListSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton title="Loyiha" back="/projects">
      <Skeleton className="mb-4 h-72 rounded-xl" />
      <ListSkeleton rows={2} />
    </PageSkeleton>
  )
}
