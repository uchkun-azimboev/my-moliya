"use client"

import { Button } from "@/components/ui/button"

export function RetryButton() {
  return (
    <Button className="h-11 w-full" onClick={() => location.reload()}>
      Qayta urinish
    </Button>
  )
}
