import { PageHeader } from "@/components/page-header"
import { requireUser } from "@/lib/supabase/server"
import { CategoryForm } from "../category-form"

export default async function NewCategoryPage() {
  await requireUser()

  return (
    <>
      <PageHeader title="Yangi kategoriya" back="/categories" />
      <CategoryForm />
    </>
  )
}
