import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
// import { getServerSession } from 'next-auth/next'
// import { authOptions } from '@/lib/auth'
import { AuthProvider } from '@/lib/auth-provider'
import { generateMetadata } from './metadata'
import { Toaster } from '@/components/ui/toaster'
import { SonnerToast } from '@/components/ui/toast'
import { CurrencyProviderWrapper } from '@/components/providers/currency-provider'
import { SettingsProvider } from '@/lib/contexts/settings-context'
import { DynamicFavicon } from '@/components/dynamic-favicon'
import '@/lib/currency-initializer' // Initialise la synchronisation automatique

const inter = Inter({ subsets: ['latin'] })

// Utiliser la fonction pour générer les métadonnées
export { generateMetadata }

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Temporairement désactivé à cause du conflit de versions next-auth
  // let session = null
  // try {
  //   session = await getServerSession(authOptions)
  // } catch (error) {
  //   console.warn('Erreur lors de la récupération de la session:', error)
  // }

  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <DynamicFavicon />
            <CurrencyProviderWrapper>
              {children}
              <Toaster />
              <SonnerToast />
            </CurrencyProviderWrapper>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 
 
 