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
}

export const PROJECT_SUMMARY_COLUMNS =
  "id, client_id, client_name, name, total_amount, currency, start_date, end_date, progress_mode, progress_percent, units_total, units_done, is_retainer, previous_project_id, closed, note, payments, progress, status, received_uzs, earned_uzs, obligation_uzs, total_uzs, expected_uzs, overdue"

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  obligation: "Majburiyat bor",
  partial: "Qisman bajarildi",
  done: "To'liq bajarildi",
}
