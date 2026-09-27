import { FormSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Yangi loyiha" back="/projects">
      <FormSkeleton fields={6} />
    </PageSkeleton>
  )
}
