'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      console.log('❌ AdminGuard: Pas de session, redirection vers login')
      router.push('/')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      console.log('❌ AdminGuard: Rôle insuffisant:', session.user.role)
      router.push('/auth/unauthorized')
      return
    }

    console.log('✅ AdminGuard: Accès autorisé pour', session.user.email, 'Rôle:', session.user.role)
    setIsChecking(false)
  }, [session, status, router])

  // Chargement
  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  // Pas de session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold mb-2">Connexion requise</h1>
          <p className="text-gray-600 mb-4">
            Vous devez être connecté pour accéder à l'administration.
          </p>
          <Button onClick={() => router.push('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  // Rôle insuffisant
  if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold mb-2">Accès non autorisé</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Rôle actuel: {session.user.role}
          </p>
          <Button onClick={() => router.push('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  // Accès autorisé
  return <>{children}</>
}

