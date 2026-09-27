import { ImageResponse } from "next/og"

// Ikonka rasmi kod bilan chiziladi (shrift kerak emas): qora fon, uchta o'suvchi ustun, oxirgisi yashil.
// Ikonka — rasm, UI emas, shuning uchun ranglar shu yerda aniq yoziladi.
const BG = "#0a0a0a"
const FG = "#fafafa"
const ACCENT = "#3fb56b"

/**
 * @param size   — px
 * @param inset  — belgi egallaydigan ulush (maskable uchun kichikroq: Android chetlarini kesadi)
 * @param radius — burchak yumaloqligi (maskable va apple uchun 0: tizim o'zi kesadi)
 */
export function renderAppIcon(size: number, { inset = 0.62, radius = 0.22 } = {}) {
  const box = size * inset
  const bar = box * 0.2
  const gap = box * 0.1
  const heights = [0.42, 0.66, 1]
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: BG,
          borderRadius: size * radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: box, height: box, display: "flex", alignItems: "flex-end", justifyContent: "center", gap }}>
          {heights.map((h, i) => (
            <div
              key={i}
              style={{
                width: bar,
                height: box * h,
                borderRadius: bar * 0.3,
                background: i === heights.length - 1 ? ACCENT : FG,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
