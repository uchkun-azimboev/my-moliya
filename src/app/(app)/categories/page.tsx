import Link from "next/link"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/supabase/server"
import { CATEGORY_GROUP_LABEL, type Category, type CategoryKind } from "@/lib/types"
import { seedDefaultCategories } from "./actions"

export default async function CategoriesPage() {
  const { supabase } = await requireUser()
  const { data } = await supabase
    .from("categories")
    .select("id, name, kind, group_type, icon, archived")
    .order("name")
  const categories = (data ?? []) as Category[]
  const active = categories.filter((c) => !c.archived)
  const archived = categories.filter((c) => c.archived)

  return (
    <>
      <PageHeader
        title="Kategoriyalar"
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/categories/new">
              <Plus /> Qo&apos;shish
            </Link>
          </Button>
        }
      />

      {categories.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Hali kategoriya yo&apos;q. Tayyor ro&apos;yxatdan boshlang — keyin xohlagancha o&apos;zgartirasiz.
          </p>
          <form action={seedDefaultCategories}>
            <Button type="submit">Standart kategoriyalarni qo&apos;shish</Button>
          </form>
        </div>
      )}

      {(["expense", "income"] as CategoryKind[]).map((kind) => {
        const items = active.filter((c) => c.kind === kind)
        if (items.length === 0) return null
        return (
          <section key={kind} className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              {kind === "expense" ? "Xarajatlar" : "Daromadlar"}
            </h2>
            <CategoryList items={items} />
          </section>
        )
      })}

      {archived.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground">Arxivlangan ({archived.length})</summary>
          <div className="mt-3 opacity-70">
            <CategoryList items={archived} />
          </div>
        </details>
      )}
    </>
  )
}

function CategoryList({ items }: { items: Category[] }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={`/categories/${c.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-accent">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-lg">{c.icon ?? "•"}</span>
            <span className="flex-1 font-medium">{c.name}</span>
            {c.group_type && (
              <span className="text-xs text-muted-foreground">{CATEGORY_GROUP_LABEL[c.group_type]}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
