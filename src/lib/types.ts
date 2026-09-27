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
