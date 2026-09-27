import { FormSkeleton, PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton title="O'tkazma" back="/wallets">
      <FormSkeleton fields={4} />
    </PageSkeleton>
  )
}
