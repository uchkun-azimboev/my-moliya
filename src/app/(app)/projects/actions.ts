"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { dbErrorMessage, type ActionState } from "@/lib/action-state"
import { nextPeriod } from "@/lib/format"
import { amountSchema, normalizeAmount } from "@/lib/money"
import { requireUser } from "@/lib/supabase/server"

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

const percentSchema = z
  .preprocess((v) => normalizeAmount(v) || "0", z.string())
  .refine((s) => /^\d{1,3}(\.\d{1,2})?$/.test(s) && Number(s) <= 100, "Foiz 0 dan 100 gacha bo'lsin")

const projectSchema = z
  .object({
    client_id: z.uuid("Mijozni tanlang"),
    name: z.string().trim().min(1, "Nomini kiriting").max(100),
    total_amount: amountSchema,
    currency: z.enum(["UZS", "USD"]),
    start_date: z.iso.date("Boshlanish sanasini tanlang"),
    end_date: z.preprocess(emptyToNull, z.iso.date().nullable()),
    progress_mode: z.enum(["percent", "units"]),
    progress_percent: percentSchema,
    units_total: z.preprocess(emptyToNull, z.coerce.number().int().positive("Jami birlik 0 dan katta bo'lsin").nullable()),
    units_done: z.preprocess(emptyToNull, z.coerce.number().int().min(0).nullable()),
    is_retainer: z.preprocess((v) => v === "on", z.boolean()),
    note: z.preprocess(emptyToNull, z.string().max(300).nullable()),
  })
  .refine((p) => !p.end_date || p.end_date >= p.start_date, "Tugash sanasi boshlanishidan oldin bo'lmasin")
  .refine((p) => p.progress_mode !== "units" || (p.units_total !== null && p.units_done !== null), "Jami va tayyor birliklarni kiriting")
  .refine((p) => p.progress_mode !== "units" || (p.units_done ?? 0) <= (p.units_total ?? 0), "Tayyor birlik jamidan oshmasin")
  .transform((p) =>
    // Tanlanmagan usulning maydonlari tozalanadi
    p.progress_mode === "units" ? { ...p, progress_percent: "0" } : { ...p, units_total: null, units_done: null }
  )

function revalidate() {
  revalidatePath("/", "layout")
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = projectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { data, error } = await supabase.from("projects").insert(parsed.data).select("id").single()
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  redirect(`/projects/${data.id}`)
}

export async function updateProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(formData.get("id"))
  if (!id.success) return { error: "Loyiha topilmadi" }
  const parsed = projectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { error } = await supabase.from("projects").update(parsed.data).eq("id", id.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  redirect(`/projects/${id.data}`)
}

/** Tezkor yangilash: foiz rejimida — foiz, birlik rejimida — tayyor birliklar soni */
export async function updateProgress(id: string, value: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { data: p } = await supabase.from("projects").select("progress_mode, units_total").eq("id", id).maybeSingle()
  if (!p) return { error: "Loyiha topilmadi" }

  let patch: Record<string, number | string>
  if (p.progress_mode === "units") {
    const done = Number(value)
    if (!Number.isInteger(done) || done < 0 || done > p.units_total) {
      return { error: `Tayyor birlik 0 dan ${p.units_total} gacha bo'lsin` }
    }
    patch = { units_done: done }
  } else {
    const parsed = percentSchema.safeParse(value)
    if (!parsed.success) return { error: parsed.error.issues[0].message }
    patch = { progress_percent: parsed.data }
  }

  const { error } = await supabase.from("projects").update(patch).eq("id", id)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  return { ok: true }
}

export async function setProjectClosed(id: string, closed: boolean): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("projects").update({ closed }).eq("id", id)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  return { ok: true }
}

/** Retainer: shu mijoz, nom, summa bilan keyingi oyni ochadi; xohlansa oldingi davrni yopadi */
export async function openNextPeriod(id: string, closePrevious: boolean): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { data: p } = await supabase
    .from("projects")
    .select("client_id, name, total_amount, currency, start_date, end_date, progress_mode, units_total, is_retainer, note")
    .eq("id", id)
    .maybeSingle()
  if (!p) return { error: "Loyiha topilmadi" }
  if (!p.is_retainer) return { error: "Bu loyiha oylik (retainer) emas" }

  const period = nextPeriod(p.start_date, p.end_date)
  const { data: created, error } = await supabase
    .from("projects")
    .insert({
      client_id: p.client_id,
      name: p.name,
      total_amount: p.total_amount,
      currency: p.currency,
      start_date: period.start,
      end_date: period.end,
      progress_mode: p.progress_mode,
      progress_percent: 0,
      units_total: p.units_total,
      units_done: p.progress_mode === "units" ? 0 : null,
      is_retainer: true,
      previous_project_id: id,
      note: p.note,
    })
    .select("id")
    .single()
  if (error) return { error: dbErrorMessage(error) }

  if (closePrevious) {
    const { error: closeError } = await supabase.from("projects").update({ closed: true }).eq("id", id)
    if (closeError) return { error: dbErrorMessage(closeError) }
  }

  revalidate()
  redirect(`/projects/${created.id}`)
}

export async function deleteProject(id: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) {
    if (error.code === "23503") return { error: "Loyihaga to'lovlar bog'langan — o'chirib bo'lmaydi. Uning o'rniga yoping." }
    return { error: dbErrorMessage(error) }
  }
  revalidate()
  redirect("/projects")
}
