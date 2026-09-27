"use client"

import { startTransition, useActionState } from "react"

/**
 * useActionState + <form onSubmit>. React `<form action>` yuborilgandan keyin formani
 * avtomatik tozalaydi — xato bo'lsa kiritilgan ma'lumot yo'qoladi, tanlovlar esa
 * holatdan ajralib qoladi. Bu hook formani tozalamaydi; kerakli maydonlarni kod o'zi tozalaydi.
 */
export function useFormAction<S>(
  fn: (prev: Awaited<S>, formData: FormData) => S | Promise<S>,
  initial: Awaited<S>
) {
  const [state, dispatch, pending] = useActionState(fn, initial)
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => dispatch(formData))
  }
  return [state, onSubmit, pending] as const
}
