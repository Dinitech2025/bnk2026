'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'
import { AuthModal } from '@/components/auth/auth-modal'

export default function UnauthorizedPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Veuillez vous connecter avec un compte disposant des droits appropriés.
          </p>
          <div className="flex flex-col space-y-3">
            <Button 
              className="w-full"
              onClick={() => setAuthModalOpen(true)}
            >
              Se connecter avec un autre compte
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">Retour à l'accueil</Button>
            </Link>
          </div>
        </div>
      </div>
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="login"
      />
    </>
  )
} 