'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AuthModal } from '@/components/auth/auth-modal'
import { MessageSquare, User, ShoppingBag, MapPin, LogOut, Settings, Gavel, TrendingUp, Mail } from 'lucide-react'

export function UserMenu() {
  const { data: session } = useSession()
  const [profileData, setProfileData] = useState<any>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  // Récupérer les données complètes du profil utilisateur
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          setProfileData(data)
        })
        .catch(error => {
          console.error('Erreur lors de la récupération du profil:', error)
        })
    }
  }, [session])
  
  const openLoginModal = () => {
    setAuthMode('login')
    setAuthModalOpen(true)
  }

  const openRegisterModal = () => {
    setAuthMode('register')
    setAuthModalOpen(true)
  }

  if (!session) {
    return (
      <>
        <div className="flex items-center space-x-2 md:space-x-3">
          <Button variant="ghost" size="sm" onClick={openLoginModal}>
            Connexion
          </Button>
          <Button variant="danger" size="sm" onClick={openRegisterModal}>
            S'inscrire
          </Button>
        </div>
        
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authMode}
        />
      </>
    )
  }
  
  const initials = session.user.name
    ? session.user.name.split(' ').map((n) => n[0]).join('')
    : session.user.email?.charAt(0).toUpperCase()
  
  // Utiliser l'image du profil si disponible, sinon utiliser celle de la session
  const userImage = profileData?.image || session.user.image || ''
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={userImage} alt={session.user.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userImage} alt={session.user.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5 leading-none">
            {session.user.name && (
              <p className="font-medium">{session.user.name}</p>
            )}
            {session.user.email && (
              <p className="w-[200px] truncate text-sm text-gray-600">
                {session.user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="h-4 w-4 mr-2" />
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/my-bids">
            <Gavel className="h-4 w-4 mr-2" />
            Mes enchères
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/my-proposals">
            <TrendingUp className="h-4 w-4 mr-2" />
            Mes propositions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/my-quotes">
            <MessageSquare className="h-4 w-4 mr-2" />
            Mes devis
          </Link>
        </DropdownMenuItem>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem asChild>
                <Link href="/profile/messages">
                  <Mail className="h-4 w-4 mr-2" />
                  Messages
                </Link>
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Conversations avec l'équipe</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuItem asChild>
          <Link href="/cart">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Mon panier
          </Link>
        </DropdownMenuItem>
        {(session.user.role === 'ADMIN' || session.user.role === 'STAFF') && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Administration</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            event.preventDefault()
            signOut({ callbackUrl: '/' })
          }}
        >
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu