import { FormSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Maqsadni tahrirlash">
      <FormSkeleton fields={6} />
    </PageSkeleton>
  )
}
