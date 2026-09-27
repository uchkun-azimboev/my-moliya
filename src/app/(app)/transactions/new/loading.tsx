import { FormSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton title="Yangi tranzaksiya" back="/transactions">
      <Skeleton className="mb-4 h-11 w-full" />
      <Skeleton className="mb-4 h-14 w-full" />
      <FormSkeleton fields={3} />
    </PageSkeleton>
  )
}
