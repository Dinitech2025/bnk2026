'use client'

import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { SonnerToast } from '@/components/ui/toast'
import { ThemeProvider } from 'next-themes'
import { CurrencyProviderWrapper } from '@/components/providers/currency-provider'
// Imports normaux au lieu de dynamiques pour éviter les problèmes de chargement
import AdminSidebar from '@/components/admin/sidebar'
import AdminHeader from '@/components/admin/header'

const inter = Inter({ subsets: ['latin'] })

interface AdminLayoutClientProps {
  children: React.ReactNode
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <CurrencyProviderWrapper>
        <div className="min-h-screen flex bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 flex flex-col lg:ml-0">
            <AdminHeader />
            <main className="flex-1 p-3 sm:p-6 lg:p-6 pt-12 sm:pt-16 lg:pt-6">
              {children}
            </main>
          </div>
          <Toaster />
          <SonnerToast />
        </div>
      </CurrencyProviderWrapper>
    </ThemeProvider>
  )
}
