import { ListSkeleton, PageSkeleton, TilesSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="Hamyonlar">
      <TilesSkeleton />
      <ListSkeleton rows={3} />
    </PageSkeleton>
  )
}
