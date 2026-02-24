'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface SimpleAdminGuardProps {
  children: React.ReactNode
}

export function SimpleAdminGuard({ children }: SimpleAdminGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (status === 'loading') return

    // Rediriger si pas de session (mais seulement une fois)
    if (status === 'unauthenticated') {
      console.log('❌ SimpleAdminGuard: Non authentifié, redirection')
      router.replace('/')
      return
    }

    // Vérifier les permissions (mais seulement une fois)
    if (session && session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      console.log('❌ SimpleAdminGuard: Permissions insuffisantes:', session.user.role)
      router.replace('/auth/unauthorized')
      return
    }

    // Si tout est OK, ne rien faire (pas de setIsChecking qui cause des re-renders)
    if (session && (session.user.role === 'ADMIN' || session.user.role === 'STAFF')) {
      console.log('✅ SimpleAdminGuard: Accès autorisé')
    }
  }, [status, session?.user?.role, router]) // Dépendances minimales

  // Pendant le chargement, afficher un loader simple
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si pas de session, ne rien afficher (redirection en cours)
  if (!session) {
    return null
  }

  // Si permissions insuffisantes, ne rien afficher (redirection en cours)
  if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
    return null
  }

  // Tout est OK, afficher le contenu
  return <>{children}</>
}

