'use client'

import { signOut, useSession } from 'next-auth/react'
import { Bell, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CurrencySelector } from '@/components/ui/currency-selector'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error'
  title: string
  message: string
  action?: {
    text: string
    url: string
  }
  createdAt: string
}

export default function AdminHeaderSimple() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Données utilisateur directement depuis la session (pas de useEffect complexe)
  const userData = {
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    image: session?.user?.image || '',
    role: session?.user?.role || ''
  }
  
  const initials = userData.name
    ? userData.name.split(' ').map((n) => n[0]).join('')
    : userData.email?.charAt(0).toUpperCase()

  // Charger les notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF') {
      fetchNotifications()
      // Actualiser toutes les 5 minutes
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [session])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return '⚠️'
      case 'error':
        return '🚨'
      default:
        return '📢'
    }
  }

  return (
    <header className="h-12 sm:h-16 border-b bg-white flex items-center px-3 sm:px-6">
      <div className="w-full flex items-center justify-between">
        {/* Espace gauche pour équilibrer */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          {/* Vide pour équilibrer */}
        </div>

        {/* Centre - Titre ou recherche */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-8 pr-4 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Droite - Actions utilisateur */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 justify-end">
          <CurrencySelector />
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="p-3 border-b">
                <h4 className="font-semibold">Notifications</h4>
                <p className="text-sm text-gray-600">{unreadCount} nouvelles</p>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucune notification
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem key={notification.id} className="p-0">
                    <div className="w-full p-3 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                            {notification.action && (
                              <Link href={notification.action.url}>
                                <Button variant="ghost" size="sm" className="text-xs h-6">
                                  {notification.action.text}
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              {notifications.length > 10 && (
                <div className="p-3 border-t text-center">
                  <Button variant="ghost" size="sm" className="text-sm">
                    Voir toutes les notifications
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userData.image} alt={userData.name} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userData.image} alt={userData.name} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  {userData.name && (
                    <p className="font-medium text-sm">{userData.name}</p>
                  )}
                  {userData.email && (
                    <p className="w-[200px] truncate text-xs text-gray-600">
                      {userData.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(event) => {
                  event.preventDefault()
                  signOut()
                }}
              >
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}