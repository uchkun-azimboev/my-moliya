import { FormSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Yangi maqsad" back="/goals">
      <FormSkeleton fields={6} />
    </PageSkeleton>
  )
}
