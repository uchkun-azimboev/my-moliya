import { PageHeader } from "@/components/page-header"
import { requireUser } from "@/lib/supabase/server"
import { WalletForm } from "../wallet-form"

export default async function NewWalletPage() {
  await requireUser()

  return (
    <>
      <PageHeader title="Yangi hamyon" back="/wallets" />
      <WalletForm />
    </>
  )
}
