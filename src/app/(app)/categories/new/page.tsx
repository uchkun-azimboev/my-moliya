import { PageHeader } from "@/components/page-header"
import { CategoryForm } from "../category-form"

export default function NewCategoryPage() {
  return (
    <>
      <PageHeader title="Yangi kategoriya" back="/categories" />
      <CategoryForm />
    </>
  )
}
