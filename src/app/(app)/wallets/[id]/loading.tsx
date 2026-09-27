import { FormSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton title="Hamyon" back="/wallets">
      <Skeleton className="mb-6 h-[5.5rem] rounded-xl" />
      <FormSkeleton fields={3} />
    </PageSkeleton>
  )
}
