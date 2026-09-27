import { renderAppIcon } from "@/lib/app-icon"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// iPhone burchaklarni o'zi yumaloqlaydi — radius 0
export default function AppleIcon() {
  return renderAppIcon(180, { radius: 0 })
}
