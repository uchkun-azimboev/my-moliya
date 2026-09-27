import { FormSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Mijoz" back="/clients">
      <FormSkeleton fields={2} />
    </PageSkeleton>
  )
}
