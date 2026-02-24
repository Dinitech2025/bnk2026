'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { CurrencyProviderWrapper } from '@/components/providers/currency-provider'
import { Toaster } from '@/components/ui/toaster'
import { SonnerToast } from '@/components/ui/toast'

// Import direct des composants admin
import AdminSidebar from '@/components/admin/sidebar'
import AdminHeader from '@/components/admin/header'

interface AdminLayoutStableProps {
  children: ReactNode
}

export function AdminLayoutStable({ children }: AdminLayoutStableProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <CurrencyProviderWrapper>
        <div className="min-h-screen flex bg-gray-50">
          {/* Sidebar */}
          <AdminSidebar />
          
          {/* Contenu principal */}
          <div className="flex-1 flex flex-col lg:ml-0">
            {/* Header */}
            <AdminHeader />
            
            {/* Contenu de la page */}
            <main className="flex-1 p-3 sm:p-6 lg:p-6 pt-12 sm:pt-16 lg:pt-6">
              {children}
            </main>
          </div>
          
          {/* Toasters */}
          <Toaster />
          <SonnerToast />
        </div>
      </CurrencyProviderWrapper>
    </ThemeProvider>
  )
}
