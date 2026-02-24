import { MainLayout } from '@/components/main-layout'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
} 