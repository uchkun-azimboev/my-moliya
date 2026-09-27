import { FormSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Kategoriya" back="/categories">
      <FormSkeleton fields={3} />
    </PageSkeleton>
  )
}
