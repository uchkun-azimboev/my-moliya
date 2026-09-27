import { FormSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Loyihani tahrirlash">
      <FormSkeleton fields={6} />
    </PageSkeleton>
  )
}
