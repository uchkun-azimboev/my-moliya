import type { SupabaseClient } from "@supabase/supabase-js"
import { CATEGORY_GROUP_LABEL, CATEGORY_KIND_LABEL, GOAL_KIND_LABEL, PROJECT_STATUS_LABEL, WALLET_KIND_LABEL } from "./types"

type Cell = string | number | boolean | null
export type Table = { name: string; header: string[]; rows: Cell[][] }

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v))
const yes = (v: boolean) => (v ? "ha" : "yo'q")

/** Tranzaksiyalar — ID o'rniga nomlar bilan (CSV va Excel uchun umumiy) */
export async function loadTransactions(supabase: SupabaseClient): Promise<Table> {
  const { data } = await supabase
    .from("transactions")
    .select(
      "date, amount, currency, rate_to_uzs, note, created_at, wallet:wallets!transactions_wallet_fkey(name), category:categories!transactions_category_fkey(name, kind, group_type), project:projects!transactions_project_fkey(name), goal:goals!transactions_goal_fkey(name)"
    )
    .order("date")
    .order("created_at")
  type R = {
    date: string
    amount: number
    currency: string
    rate_to_uzs: number
    note: string | null
    created_at: string
    wallet: { name: string } | null
    category: { name: string; kind: "income" | "expense"; group_type: keyof typeof CATEGORY_GROUP_LABEL | null } | null
    project: { name: string } | null
    goal: { name: string } | null
  }
  return {
    name: "Tranzaksiyalar",
    header: ["Sana", "Tur", "Summa", "Valyuta", "Kurs (1 USD)", "Summa, so'm", "Hamyon", "Kategoriya", "Guruh", "Loyiha", "Maqsad", "Izoh"],
    rows: ((data ?? []) as unknown as R[]).map((t) => [
      t.date,
      t.category ? CATEGORY_KIND_LABEL[t.category.kind] : null,
      num(t.amount),
      t.currency,
      num(t.rate_to_uzs),
      Math.round(Number(t.amount) * Number(t.rate_to_uzs) * 100) / 100,
      t.wallet?.name ?? null,
      t.category?.name ?? null,
      t.category?.group_type ? CATEGORY_GROUP_LABEL[t.category.group_type] : null,
      t.project?.name ?? null,
      t.goal?.name ?? null,
      t.note,
    ]),
  }
}

/** Barcha jadvallar — Excel zaxira nusxasi uchun (RLS: faqat o'z ma'lumotlari) */
export async function loadAllTables(supabase: SupabaseClient): Promise<Table[]> {
  const [tx, wallets, categories, transfers, clients, projects, goals, allocations, budgets, rates, settings] = await Promise.all([
    loadTransactions(supabase),
    supabase.from("wallet_balances").select("name, kind, currency, opening_balance, balance, archived").order("created_at"),
    supabase.from("categories").select("name, kind, group_type, icon, archived").order("kind").order("name"),
    supabase
      .from("transfers")
      .select("date, from_amount, to_amount, rate, note, from:wallets!transfers_from_wallet_fkey(name, currency), to:wallets!transfers_to_wallet_fkey(name, currency)")
      .order("date"),
    supabase.from("clients").select("name, note, archived").order("name"),
    supabase
      .from("project_summary")
      .select("client_name, name, total_amount, currency, start_date, end_date, progress, status, received_uzs, earned_uzs, obligation_uzs, client_debt_uzs, expected_uzs, is_retainer, continues, closed, note")
      .order("start_date"),
    supabase
      .from("goal_summary")
      .select("name, kind, target_amount, currency, start_amount, deadline, priority, monthly_plan, done_amount, remaining_amount, progress, reserved_amount, status, note")
      .order("priority"),
    supabase.from("goal_allocations").select("date, amount, note, goal:goals!goal_allocations_goal_fkey(name, currency)").order("date"),
    supabase.from("budgets").select("month, planned_amount, category:categories!budgets_category_fkey(name)").order("month"),
    supabase.from("exchange_rates").select("date, usd_to_uzs").order("date"),
    supabase.from("settings").select("monthly_fixed_expenses").maybeSingle(),
  ])

  type Named = { name: string; currency?: string } | null
  const rows = <T,>(r: { data: unknown }) => (r.data ?? []) as T[]
  const statusLabel = (s: string) => ({ active: "Faol", done: "Bajarildi", closed: "Yopilgan" })[s] ?? s

  return [
    tx,
    {
      name: "Hamyonlar",
      header: ["Nomi", "Turi", "Valyuta", "Boshlang'ich balans", "Joriy balans", "Arxivlangan"],
      rows: rows<{ name: string; kind: "cash" | "card"; currency: string; opening_balance: number; balance: number; archived: boolean }>(wallets).map((w) => [
        w.name, WALLET_KIND_LABEL[w.kind], w.currency, num(w.opening_balance), num(w.balance), yes(w.archived),
      ]),
    },
    {
      name: "Kategoriyalar",
      header: ["Nomi", "Turi", "Guruh", "Belgi", "Arxivlangan"],
      rows: rows<{ name: string; kind: "income" | "expense"; group_type: keyof typeof CATEGORY_GROUP_LABEL | null; icon: string | null; archived: boolean }>(categories).map((c) => [
        c.name, CATEGORY_KIND_LABEL[c.kind], c.group_type ? CATEGORY_GROUP_LABEL[c.group_type] : null, c.icon, yes(c.archived),
      ]),
    },
    {
      name: "O'tkazmalar",
      header: ["Sana", "Qayerdan", "Chiqqan summa", "Qayerga", "Kirgan summa", "Kurs (1 USD)", "Izoh"],
      rows: rows<{ date: string; from_amount: number; to_amount: number; rate: number; note: string | null; from: Named; to: Named }>(transfers).map((t) => [
        t.date, t.from ? `${t.from.name} (${t.from.currency})` : null, num(t.from_amount), t.to ? `${t.to.name} (${t.to.currency})` : null, num(t.to_amount), num(t.rate), t.note,
      ]),
    },
    {
      name: "Mijozlar",
      header: ["Nomi", "Izoh", "Arxivlangan"],
      rows: rows<{ name: string; note: string | null; archived: boolean }>(clients).map((c) => [c.name, c.note, yes(c.archived)]),
    },
    {
      name: "Loyihalar",
      header: ["Mijoz", "Nomi", "Summa", "Valyuta", "Boshlanish", "Tugash", "Bajarilish %", "Holat", "Olingan, so'm", "Bajarilgan ish, so'm", "Majburiyat, so'm", "Mijoz qarzi, so'm", "Kutilayotgan, so'm", "Oylik", "Davom etadi", "Qo'lda yopilgan", "Izoh"],
      rows: rows<Record<string, unknown>>(projects).map((p) => [
        p.client_name as string, p.name as string, num(p.total_amount), p.currency as string, p.start_date as string, (p.end_date as string) ?? null,
        num(p.progress), PROJECT_STATUS_LABEL[p.status as keyof typeof PROJECT_STATUS_LABEL], num(p.received_uzs), num(p.earned_uzs), num(p.obligation_uzs), num(p.client_debt_uzs), num(p.expected_uzs),
        yes(Boolean(p.is_retainer)), yes(Boolean(p.continues)), yes(Boolean(p.closed)), (p.note as string) ?? null,
      ]),
    },
    {
      name: "Maqsadlar",
      header: ["Nomi", "Turi", "Maqsad summasi", "Valyuta", "Boshlang'ich", "Muddat", "Ustuvorlik", "Oylik reja", "Bajarilgan", "Qolgan", "Progress %", "Ajratilgan qoldiq", "Holat", "Izoh"],
      rows: rows<Record<string, unknown>>(goals).map((g) => [
        g.name as string, GOAL_KIND_LABEL[g.kind as keyof typeof GOAL_KIND_LABEL], num(g.target_amount), g.currency as string, num(g.start_amount), (g.deadline as string) ?? null,
        num(g.priority), num(g.monthly_plan), num(g.done_amount), num(g.remaining_amount), num(g.progress), num(g.reserved_amount), statusLabel(g.status as string), (g.note as string) ?? null,
      ]),
    },
    {
      name: "Ajratmalar",
      header: ["Sana", "Maqsad", "Summa", "Valyuta", "Izoh"],
      rows: rows<{ date: string; amount: number; note: string | null; goal: Named }>(allocations).map((a) => [a.date, a.goal?.name ?? null, num(a.amount), a.goal?.currency ?? null, a.note]),
    },
    {
      name: "Budjet",
      header: ["Oy", "Kategoriya", "Reja, so'm"],
      rows: rows<{ month: string; planned_amount: number; category: Named }>(budgets).map((b) => [b.month.slice(0, 7), b.category?.name ?? null, num(b.planned_amount)]),
    },
    {
      name: "Kurslar",
      header: ["Sana", "1 USD, so'm (CBU)"],
      rows: rows<{ date: string; usd_to_uzs: number }>(rates).map((r) => [r.date, num(r.usd_to_uzs)]),
    },
    {
      name: "Sozlamalar",
      header: ["Oylik majburiy xarajat (budjet bo'lmasa), so'm"],
      rows: [[num(settings.data?.monthly_fixed_expenses)]],
    },
  ]
}

/** CSV (RFC 4180): vergul bilan, UTF-8 BOM — Excel o'zbekcha harflarni to'g'ri ochadi */
export function toCsv(table: Table) {
  const esc = (v: Cell) => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return "﻿" + [table.header, ...table.rows].map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n"
}
