import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { requireUser } from "@/lib/supabase/server"
import type { Category } from "@/lib/types"
import { CategoryForm } from "../category-form"

export default async function EditCategoryPage({ params }: PageProps<"/categories/[id]">) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data } = await supabase
    .from("categories")
    .select("id, name, kind, group_type, icon, archived")
    .eq("id", id)
    .maybeSingle()
  if (!data) notFound()

  return (
    <>
      <PageHeader title="Kategoriya" back="/categories" />
      <CategoryForm category={data as Category} />
    </>
  )
}
