import { ListSkeleton, PageSkeleton, TilesSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton title="Tranzaksiyalar">
      <Skeleton className="mb-4 h-11 w-full" />
      <Skeleton className="mb-4 h-11 w-full" />
      <TilesSkeleton />
      <ListSkeleton rows={6} />
    </PageSkeleton>
  )
}
