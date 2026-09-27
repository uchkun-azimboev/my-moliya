export type ActionState = { error?: string; ok?: boolean }

/** Supabase xatosini foydalanuvchiga tushunarli matnga aylantiradi */
export function dbErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "23503") return "Bu yozuvga boshqa yozuvlar bog'langan — o'chirib bo'lmaydi. Uning o'rniga arxivlang."
  if (error.code === "23514") return "Kiritilgan qiymat noto'g'ri"
  if (error.code === "P0001") return error.message
  return "Xatolik yuz berdi: " + error.message
}
