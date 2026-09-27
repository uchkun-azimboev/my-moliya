import { PageHeader } from "@/components/page-header"
import { WalletForm } from "../wallet-form"

export default function NewWalletPage() {
  return (
    <>
      <PageHeader title="Yangi hamyon" back="/wallets" />
      <WalletForm />
    </>
  )
}
