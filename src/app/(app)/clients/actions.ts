"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { dbErrorMessage, type ActionState } from "@/lib/action-state"
import { requireUser } from "@/lib/supabase/server"

const clientSchema = z.object({
  name: z.string().trim().min(1, "Nomini kiriting").max(80),
  note: z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(300).nullable()),
})

function revalidate() {
  revalidatePath("/", "layout")
}

export async function createClientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { error } = await supabase.from("clients").insert(parsed.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  // Loyiha formasidan kelgan bo'lsa — o'sha yerga qaytadi
  const back = formData.get("back")
  redirect(back === "/projects/new" ? "/projects/new" : "/clients")
}

export async function updateClientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(formData.get("id"))
  const parsed = clientSchema.safeParse(Object.fromEntries(formData))
  if (!id.success) return { error: "Mijoz topilmadi" }
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", id.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  redirect("/clients")
}

export async function setClientArchived(id: string, archived: boolean): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("clients").update({ archived }).eq("id", id)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  redirect("/clients")
}

export async function deleteClientAction(id: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) {
    if (error.code === "23503") return { error: "Bu mijozning loyihalari bor — o'chirib bo'lmaydi. Uning o'rniga arxivlang." }
    return { error: dbErrorMessage(error) }
  }
  revalidate()
  redirect("/clients")
}
