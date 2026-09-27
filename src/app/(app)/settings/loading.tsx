import { FormSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton title="Sozlamalar" back="/">
      <Skeleton className="mb-8 h-20 rounded-xl" />
      <FormSkeleton fields={1} />
    </PageSkeleton>
  )
}
