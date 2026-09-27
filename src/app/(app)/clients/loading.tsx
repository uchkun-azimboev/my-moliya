import { ListSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Mijozlar" back="/projects">
      <ListSkeleton rows={4} />
    </PageSkeleton>
  )
}
