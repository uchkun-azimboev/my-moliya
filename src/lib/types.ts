export type Currency = "UZS" | "USD"
export type WalletKind = "cash" | "card"
export type CategoryKind = "income" | "expense"
export type CategoryGroup = "fixed" | "work" | "variable"

export type WalletBalance = {
  id: string
  name: string
  currency: Currency
  kind: WalletKind
  archived: boolean
  opening_balance: number
  balance: number
}

export type Category = {
  id: string
  name: string
  kind: CategoryKind
  group_type: CategoryGroup | null
  icon: string | null
  archived: boolean
}

export const WALLET_KIND_LABEL: Record<WalletKind, string> = {
  cash: "Naqd",
  card: "Karta",
}

export const CATEGORY_KIND_LABEL: Record<CategoryKind, string> = {
  income: "Daromad",
  expense: "Xarajat",
}

export const CATEGORY_GROUP_LABEL: Record<CategoryGroup, string> = {
  fixed: "Majburiy doimiy",
  work: "Ish uchun",
  variable: "O'zgaruvchan",
}

export type Client = {
  id: string
  name: string
  note: string | null
  archived: boolean
}

export type ProjectStatus = "obligation" | "partial" | "done"
export type ProgressMode = "percent" | "units"

/** project_summary view qatori — barcha pul qiymatlari so'mda */
export type ProjectSummary = {
  id: string
  client_id: string
  client_name: string
  name: string
  total_amount: number
  currency: Currency
  start_date: string
  end_date: string | null
  progress_mode: ProgressMode
  progress_percent: number
  units_total: number | null
  units_done: number | null
  is_retainer: boolean
  previous_project_id: string | null
  closed: boolean
  note: string | null
  payments: number
  progress: number
  status: ProjectStatus
  received_uzs: number
  earned_uzs: number
  obligation_uzs: number
  total_uzs: number | null
  expected_uzs: number | null
  overdue: boolean
  /** loyiha valyutasida (0014) */
  received_amount: number
  expected_amount: number
}

export const PROJECT_SUMMARY_COLUMNS =
  "id, client_id, client_name, name, total_amount, currency, start_date, end_date, progress_mode, progress_percent, units_total, units_done, is_retainer, previous_project_id, closed, note, payments, progress, status, received_uzs, earned_uzs, obligation_uzs, total_uzs, expected_uzs, overdue, received_amount, expected_amount"

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  obligation: "Majburiyat bor",
  partial: "Qisman bajarildi",
  done: "To'liq bajarildi",
}

export type GoalKind = "saving" | "debt"
export type GoalStatus = "active" | "done" | "closed"

/** goal_summary view qatori — *_amount maqsad valyutasida, *_uzs so'mda */
export type GoalSummary = {
  id: string
  name: string
  kind: GoalKind
  target_amount: number
  currency: Currency
  start_amount: number
  deadline: string | null
  priority: number
  monthly_plan: number | null
  closed: boolean
  note: string | null
  status: GoalStatus
  done_amount: number
  remaining_amount: number
  progress: number
  reserved_amount: number
  reserved_uzs: number
  months_left: number | null
  monthly_needed: number | null
  plan_amount: number
  month_contrib: number
  month_left_amount: number
  month_left_uzs: number
  avg_3m: number
  real_date: string | null
  late: boolean
  extra_needed: number | null
  remaining_uzs: number
}

export const GOAL_SUMMARY_COLUMNS =
  "id, name, kind, target_amount, currency, start_amount, deadline, priority, monthly_plan, closed, note, status, done_amount, remaining_amount, progress, reserved_amount, reserved_uzs, months_left, monthly_needed, plan_amount, month_contrib, month_left_amount, month_left_uzs, avg_3m, real_date, late, extra_needed, remaining_uzs"

export const GOAL_KIND_LABEL: Record<GoalKind, string> = {
  saving: "Jamg'arma",
  debt: "Qarz",
}

/** Qarz to'lovi kategoriyasi nomi — qarz maqsadi yaratilganda bo'lmasa qo'shiladi */
export const DEBT_CATEGORY_NAME = "Qarz to'lovi"
