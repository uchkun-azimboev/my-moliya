"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { dbErrorMessage, type ActionState } from "@/lib/action-state"
import { requireUser } from "@/lib/supabase/server"

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nomini kiriting").max(40),
  kind: z.enum(["income", "expense"]),
  group_type: z.preprocess((v) => v || null, z.enum(["fixed", "work", "variable"]).nullable()),
  icon: z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(8).nullable()),
})

function revalidate() {
  revalidatePath("/", "layout")
}

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { error } = await supabase.from("categories").insert(parsed.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  redirect("/categories")
}

export async function updateCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(formData.get("id"))
  const parsed = categorySchema.safeParse(Object.fromEntries(formData))
  if (!id.success) return { error: "Kategoriya topilmadi" }
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { error } = await supabase.from("categories").update(parsed.data).eq("id", id.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  redirect("/categories")
}

export async function setCategoryArchived(id: string, archived: boolean): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("categories").update({ archived }).eq("id", id)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  redirect("/categories")
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  redirect("/categories")
}

const DEFAULT_CATEGORIES = [
  { name: "Mijoz to'lovi", kind: "income", group_type: null, icon: "💼" },
  { name: "Boshqa daromad", kind: "income", group_type: null, icon: "💰" },
  { name: "Ijara", kind: "expense", group_type: "fixed", icon: "🏠" },
  { name: "Kommunal", kind: "expense", group_type: "fixed", icon: "💡" },
  { name: "Qarz to'lovi", kind: "expense", group_type: null, icon: "💳" },
  { name: "Aloqa va internet", kind: "expense", group_type: "fixed", icon: "📱" },
  { name: "Obunalar va servislar", kind: "expense", group_type: "work", icon: "🧰" },
  { name: "Reklama va o'qish", kind: "expense", group_type: "work", icon: "📈" },
  { name: "Oziq-ovqat", kind: "expense", group_type: "variable", icon: "🛒" },
  { name: "Kafe", kind: "expense", group_type: "variable", icon: "☕" },
  { name: "Transport", kind: "expense", group_type: "variable", icon: "🚕" },
  { name: "Sog'liq", kind: "expense", group_type: "variable", icon: "💊" },
  { name: "Kiyim", kind: "expense", group_type: "variable", icon: "👕" },
  { name: "Oila va sovg'alar", kind: "expense", group_type: "variable", icon: "🎁" },
  { name: "Boshqa xarajat", kind: "expense", group_type: "variable", icon: "📦" },
] as const

export async function seedDefaultCategories() {
  const { supabase } = await requireUser()
  const { count } = await supabase.from("categories").select("id", { count: "exact", head: true })
  if (count) return
  await supabase.from("categories").insert(DEFAULT_CATEGORIES.map((c) => ({ ...c })))
  revalidate()
}
