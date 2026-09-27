import { ListSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton title="Tranzaksiyalar">
      <Skeleton className="mb-4 h-11 w-full" />
      <Skeleton className="mb-4 h-9 w-full" />
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <ListSkeleton rows={5} />
    </PageSkeleton>
  )
}
