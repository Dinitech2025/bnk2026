'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSiteSettings } from '@/lib/hooks/use-site-settings'

interface SettingsContextType {
  settings: any
  isLoading: boolean
  error: string | null
  reloadSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings, isLoading, error, reloadSettings } = useSiteSettings()

  return (
    <SettingsContext.Provider value={{ settings, isLoading, error, reloadSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
} 