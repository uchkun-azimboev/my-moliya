"use client"

import { useRef, useState } from "react"
import { getUsdRateForDate } from "@/app/actions/rates"

export type CbuRate = { rate: number; date: string; stale: boolean } | null

/** Tanlangan sana uchun CBU kursini serverdan oladi; eski (kechikkan) javoblar e'tiborsiz qoldiriladi */
export function useCbuRate(initial: CbuRate) {
  const [info, setInfo] = useState<CbuRate>(initial)
  const [loading, setLoading] = useState(false)
  const lastRequest = useRef(0)

  async function load(date: string): Promise<CbuRate | undefined> {
    const id = ++lastRequest.current
    setLoading(true)
    const result = await getUsdRateForDate(date).catch(() => null)
    if (id !== lastRequest.current) return undefined
    setInfo(result)
    setLoading(false)
    return result
  }

  return { info, loading, load }
}
