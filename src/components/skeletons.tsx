import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"

/** Ro'yxat karkasi: sarlavha darhol, qatorlar ma'lumot kelguncha kulrang */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

export function TilesSkeleton() {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <Skeleton className="h-[4.5rem] rounded-xl" />
      <Skeleton className="h-[4.5rem] rounded-xl" />
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

export function PageSkeleton({ title, back, children }: { title: string; back?: string; children: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda">
      <PageHeader title={title} back={back} />
      {children}
    </div>
  )
}
