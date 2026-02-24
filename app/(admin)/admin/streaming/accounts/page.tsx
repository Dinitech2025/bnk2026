import { Suspense } from 'react'
import { AccountsList } from './accounts-list'
import { requireStaff } from '@/lib/auth'

export default async function AccountsPage() {
  // Vérifier que l'utilisateur est admin ou staff
  await requireStaff()

  return (
    <Suspense fallback={<AccountsLoading />}>
      <AccountsList />
    </Suspense>
  )
}