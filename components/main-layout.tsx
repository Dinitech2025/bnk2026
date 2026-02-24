'use client'

import { ReactNode } from 'react'
import { CurrencyProvider } from '@/lib/hooks/use-currency'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ChatWidget } from '@/components/chat/chat-widget'

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          {children}
        </main>
        <SiteFooter />

        {/* Widget de chat */}
        <ChatWidget />
      </div>
    </CurrencyProvider>
  )
} 
 