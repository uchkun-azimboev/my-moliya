"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { AmountInput } from "@/components/amount-input"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { useFormAction } from "@/hooks/use-form-action"
import { useCbuRate, type CbuRate } from "@/hooks/use-cbu-rate"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate, formatMoney } from "@/lib/format"
import { formatAmountInput, normalizeAmount } from "@/lib/money"
import type { ActionState } from "@/lib/action-state"
import type { Category, CategoryKind, WalletBalance } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createTransaction, deleteTransaction, updateTransaction } from "./actions"

export type EditableTransaction = {
  id: string
  date: string
  amount: number
  rate_to_uzs: number
  wallet_id: string
  category_id: string
  note: string | null
}

type Props = {
  categories: Category[]
  wallets: WalletBalance[]
  today: string
  /** Oxirgi ishlatilgan hamyon — yangi yozuv uchun standart */
  defaultWalletId?: string
  /** Bugungi CBU kursi — USD hamyon tanlanganda standart */
  cbuRate?: CbuRate
  transaction?: EditableTransaction
}

export function TransactionForm({ categories, wallets, today, defaultWalletId, cbuRate = null, transaction }: Props) {
  const initialCategory = categories.find((c) => c.id === transaction?.category_id)
  const [kind, setKind] = useState<CategoryKind>(initialCategory?.kind ?? "expense")
  const [amount, setAmount] = useState(transaction ? formatAmountInput(String(transaction.amount)) : "")
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "")
  const [walletId, setWalletId] = useState(
    transaction?.wallet_id ??
      (wallets.some((w) => w.id === defaultWalletId) ? defaultWalletId! : (wallets[0]?.id ?? ""))
  )
  const [rate, setRate] = useState(
    transaction && transaction.rate_to_uzs !== 1
      ? formatAmountInput(String(transaction.rate_to_uzs), 4)
      : cbuRate
        ? formatAmountInput(String(cbuRate.rate), 4)
        : ""
  )
  const [date, setDate] = useState(transaction?.date ?? today)
  const cbu = useCbuRate(transaction ? null : cbuRate)

  // Sana o'zgarsa yoki USD hamyon tanlansa — shu sananing CBU kursi yoziladi (qo'lda o'zgartirish mumkin)
  async function refreshRate(forDate: string) {
    const result = await cbu.load(forDate)
    if (result) setRate(formatAmountInput(String(result.rate), 4))
  }
  const [note, setNote] = useState(transaction?.note ?? "")

  const [state, action, pending] = useFormAction(async (prev: ActionState, fd: FormData) => {
    const result = await (transaction ? updateTransaction : createTransaction)(prev, fd)
    if (result.ok) {
      // Keyingi yozuv uchun: tur, hamyon, sana va kurs qoladi
      setAmount("")
      setCategoryId("")
      setNote("")
    }
    return result
  }, {})

  const wallet = wallets.find((w) => w.id === walletId)
  const visibleCategories = categories.filter((c) => c.kind === kind)

  if (wallets.length === 0 || categories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Tranzaksiya kiritish uchun avval{" "}
        {wallets.length === 0 && <Link href="/wallets/new" className="underline">hamyon</Link>}
        {wallets.length === 0 && categories.length === 0 && " va "}
        {categories.length === 0 && <Link href="/categories" className="underline">kategoriyalar</Link>} qo&apos;shing.
      </div>
    )
  }

  return (
    <form onSubmit={action} className="space-y-4">
      {transaction && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="wallet_id" value={walletId} />

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k)
              setCategoryId("")
            }}
            className={cn(
              "h-9 rounded-md text-sm font-medium",
              kind === k ? "bg-background shadow-sm" : "text-muted-foreground",
              kind === k && (k === "expense" ? "text-expense" : "text-income")
            )}
          >
            {k === "expense" ? "Xarajat" : "Daromad"}
          </button>
        ))}
      </div>

      {/* 1. Summa */}
      <div className="relative">
        <AmountInput
          name="amount"
          aria-label="Summa"
          value={amount}
          onChange={setAmount}
          placeholder="0"
          required
          className="h-14 pr-16 text-2xl font-semibold"
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">
          {wallet?.currency === "USD" ? "USD" : "so'm"}
        </span>
      </div>

      {/* 2. Kategoriya */}
      <div className="space-y-2">
        <Label>Kategoriya</Label>
        {visibleCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {kind === "income" ? "Daromad" : "Xarajat"} kategoriyasi yo&apos;q.{" "}
            <Link href="/categories/new" className="underline">Qo&apos;shish</Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((c) => (
              <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                {c.icon && <span>{c.icon}</span>}
                {c.name}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* 3. Hamyon */}
      <div className="space-y-2">
        <Label>Hamyon</Label>
        <div className="flex flex-wrap gap-2">
          {wallets.map((w) => (
            <Chip
              key={w.id}
              active={walletId === w.id}
              onClick={() => {
                setWalletId(w.id)
                if (w.currency === "USD" && wallet?.currency !== "USD" && (!cbu.info || cbu.info.date !== date))
                  refreshRate(date)
              }}
            >
              {w.name}
              <span className="text-xs opacity-60">{formatMoney(w.balance, w.currency)}</span>
            </Chip>
          ))}
        </div>
      </div>

      {wallet?.currency === "USD" && (
        <div className="space-y-2">
          <Label htmlFor="rate_to_uzs">Kurs: 1 USD = ? so&apos;m</Label>
          <AmountInput id="rate_to_uzs" name="rate_to_uzs" value={rate} onChange={setRate} maxDecimals={4} required placeholder="12 650" />
          <RateHint rate={rate} cbu={cbu.info} loading={cbu.loading} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="date">Sana</Label>
          <Input id="date" name="date" type="date" value={date} onChange={(e) => {
              setDate(e.target.value)
              if (wallet?.currency === "USD" && e.target.value) refreshRate(e.target.value)
            }}
            required className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Izoh</Label>
          <Input id="note" name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="h-11 text-base" />
        </div>
      </div>

      <FormError message={state.error} />
      {state.ok && !pending && <p className="text-sm text-income">Saqlandi ✓</p>}
      <Button type="submit" className="h-12 w-full text-base" disabled={pending || !categoryId || !walletId}>
        {pending ? "Saqlanmoqda..." : transaction ? "Saqlash" : "Qo'shish"}
      </Button>
    </form>
  )
}

function RateHint({ rate, cbu, loading }: { rate: string; cbu: CbuRate; loading: boolean }) {
  let text: string
  if (loading) text = "CBU kursi olinmoqda..."
  else if (!cbu) text = "CBU kursini olib bo'lmadi — qo'lda kiriting."
  else if (Number(normalizeAmount(rate)) !== cbu.rate) text = `Qo'lda o'zgartirilgan · CBU: ${formatMoney(cbu.rate, "UZS")}`
  else text = `CBU kursi, ${formatDate(cbu.date)}${cbu.stale ? " (shu kungi kurs olinmadi)" : ""}`
  return <p className="text-xs text-muted-foreground">{text}</p>
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card active:bg-accent"
      )}
    >
      {children}
    </button>
  )
}

export function DeleteTransactionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  return (
    <div className="mt-8 border-t pt-6">
      <FormError message={error} />
      <Button
        variant="ghost"
        className="h-11 w-full text-destructive"
        disabled={pending}
        onClick={() => {
          if (confirm("Tranzaksiyani o'chirasizmi?"))
            startTransition(async () => setError((await deleteTransaction(id)).error))
        }}
      >
        O&apos;chirish
      </Button>
    </div>
  )
}
