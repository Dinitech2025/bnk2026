import { AdminLayoutStable } from './layout-stable'

// Configuration pour le groupe admin
export const metadata = {
  title: 'Administration - BoutikNaka',
  description: 'Interface d\'administration BoutikNaka'
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminLayoutStable>
      {children}
    </AdminLayoutStable>
  )
} 