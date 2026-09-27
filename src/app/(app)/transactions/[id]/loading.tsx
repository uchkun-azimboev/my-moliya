import { FormSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Tahrirlash" back="/transactions">
      <FormSkeleton fields={5} />
    </PageSkeleton>
  )
}
