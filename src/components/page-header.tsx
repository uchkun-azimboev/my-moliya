import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export function PageHeader({
  title,
  back,
  action,
}: {
  title: string
  back?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-4 flex min-h-10 items-center gap-2">
      {back && (
        <Link href={back} className="-ml-2 rounded-md p-1.5 hover:bg-accent" aria-label="Orqaga">
          <ChevronLeft className="size-5" />
        </Link>
      )}
      <h1 className="flex-1 text-xl font-semibold">{title}</h1>
      {action}
    </header>
  )
}
