import { ListSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Kategoriyalar">
      <ListSkeleton rows={8} />
    </PageSkeleton>
  )
}
