"use client"

import { Input } from "@/components/ui/input"
import { formatAmountInput } from "@/lib/money"
import { cn } from "@/lib/utils"

/** Summa maydoni: yozayotganda "1 250 000" ko'rinishida guruhlanadi, telefonda raqamli klaviatura */
export function AmountInput({
  value,
  onChange,
  maxDecimals = 2,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  value: string
  onChange: (value: string) => void
  maxDecimals?: number
}) {
  return (
    <Input
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(formatAmountInput(e.target.value, maxDecimals))}
      className={cn("h-11 text-base tabular-nums", className)}
      {...props}
    />
  )
}
