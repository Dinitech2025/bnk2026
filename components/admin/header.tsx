'use client'

import { signOut, useSession } from 'next-auth/react'
import { Bell, Search, CheckSquare, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CurrencySelector } from '@/components/ui/currency-selector'

export default function AdminHeader() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    image: '',
    role: ''
  })
  const [pendingTasksCount, setPendingTasksCount] = useState(0)
  const [notificationsCount, setNotificationsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [isMessagesOpen, setIsMessagesOpen] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])
  const [isTasksOpen, setIsTasksOpen] = useState(false)

  // Mettre à jour userData quand la session change
  useEffect(() => {
    if (session?.user) {
      setUserData({
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || '',
        role: session.user.role || ''
      })
    }
  }, [session])
  
  // Récupérer les données à jour de l'utilisateur (simplifié pour éviter les boucles)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!session?.user?.email) return
        
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setUserData(prev => ({
            ...prev,
            name: data.name || session.user.name || '',
            image: data.image || session.user.image || ''
          }))
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error)
      }
    }
    
    if (session?.user?.email) {
      fetchUserData()
    }
  }, [session?.user?.email]) // Dépendances minimales

  // Récupérer les compteurs optimisés (tâches, notifications, messages)
  useEffect(() => {
    if (!session?.user?.role || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return
    }

    const fetchCounts = async () => {
      try {
        // Récupérer les notifications qui incluent déjà les tâches et messages
        const notificationsResponse = await fetch('/api/admin/notifications')

        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotificationsCount(notificationsData.unreadCount || 0)
          setNotifications(notificationsData.notifications || [])

          // Extraire les compteurs spécifiques depuis les notifications
          const taskNotifications = notificationsData.notifications?.filter((n: any) =>
            n.id?.startsWith('task-') && n.type !== 'info'
          ) || []
          const messageNotifications = notificationsData.notifications?.filter((n: any) =>
            n.id?.startsWith('message-')
          ) || []

          setPendingTasksCount(taskNotifications.length)
          setUnreadMessagesCount(messageNotifications.length)
        }

        // Récupérer les messages récents
        const messagesResponse = await fetch('/api/admin/messages?status=UNREAD&limit=5')
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          setMessages(messagesData.messages || [])
        }

        // Récupérer les tâches en attente
        const tasksResponse = await fetch('/api/admin/tasks?status=PENDING&limit=5')
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData.tasks || [])
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des compteurs:', error)
      }
    }

    fetchCounts()
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [session?.user?.role])
  
  const initials = userData.name
    ? userData.name.split(' ').map((n) => n[0]).join('')
    : userData.email?.charAt(0).toUpperCase()

  return (
    <header className="h-12 sm:h-16 border-b bg-white flex items-center px-3 sm:px-6">
      <div className="w-full flex items-center justify-between">
        {/* Espace gauche pour équilibrer */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          {/* Vide pour équilibrer */}
        </div>
        
        {/* Logo/Titre centré */}
        <div className="flex items-center justify-center">
          <h1 className="text-lg sm:text-xl font-bold text-blue-600">
            DINITECH
          </h1>
        </div>
        
        {/* Actions droite */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 justify-end">
          {/* Icône Messages avec Dropdown */}
          <Popover open={isMessagesOpen} onOpenChange={setIsMessagesOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-7 w-7 sm:h-8 sm:w-8"
                title="Messages clients"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-green-500 text-[8px] sm:text-[10px] font-medium text-white flex items-center justify-center">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={5}>
              <div className="max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun message non lu</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {messages.slice(0, 5).map((message, index) => (
                      <div
                        key={message.id || index}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          router.push(`/admin/messages/${message.id}`)
                          setIsMessagesOpen(false)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate">
                                {message.subject}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                Client
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1 truncate">
                              De: {message.clientName || message.clientEmail || 'Client'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(message.sentAt), 'dd/MM à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {messages.length > 5 && (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Et {messages.length - 5} autres messages...
                      </div>
                    )}
                  </div>
                )}
              </div>
              {messages.length > 0 && (
                <div className="p-2 border-t bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      router.push('/admin/messages')
                      setIsMessagesOpen(false)
                    }}
                  >
                    Voir tous les messages
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Icône Tâches avec Dropdown */}
          <Popover open={isTasksOpen} onOpenChange={setIsTasksOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-7 w-7 sm:h-8 sm:w-8"
                title="Tâches à faire"
              >
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                {pendingTasksCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-orange-500 text-[8px] sm:text-[10px] font-medium text-white flex items-center justify-center">
                    {pendingTasksCount > 99 ? '99+' : pendingTasksCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={5}>
              <div className="max-h-96 overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune tâche en attente</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {tasks.slice(0, 5).map((task, index) => (
                      <div
                        key={task.id || index}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          router.push(`/admin/tasks/${task.id}`)
                          setIsTasksOpen(false)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            task.priority === 'URGENT' ? 'bg-red-500' :
                            task.priority === 'HIGH' ? 'bg-orange-500' :
                            task.priority === 'MEDIUM' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate">
                                {task.title}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {task.type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1 truncate">
                              {task.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(task.createdAt), 'dd/MM à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {tasks.length > 5 && (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Et {tasks.length - 5} autres tâches...
                      </div>
                    )}
                  </div>
                )}
              </div>
              {tasks.length > 0 && (
                <div className="p-2 border-t bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      router.push('/admin/tasks')
                      setIsTasksOpen(false)
                    }}
                  >
                    Voir toutes les tâches
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Icône Notifications avec Dropdown */}
          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-7 w-7 sm:h-8 sm:w-8" title="Notifications">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-primary text-[8px] sm:text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {notificationsCount > 99 ? '99+' : notificationsCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={5}>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.slice(0, 10).map((notification, index) => (
                      <div
                        key={notification.id || index}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (notification.action?.url) {
                            router.push(notification.action.url)
                            setIsNotificationsOpen(false)
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'error' ? 'bg-red-500' :
                            notification.type === 'warning' ? 'bg-orange-500' :
                            notification.type === 'info' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(notification.createdAt), 'dd/MM à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.length > 10 && (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Et {notifications.length - 10} autres notifications...
                      </div>
                    )}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      // TODO: Marquer toutes comme lues
                      setIsNotificationsOpen(false)
                    }}
                  >
                    Tout marquer comme lu
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          
          <CurrencySelector className="w-16 sm:w-20 text-xs sm:text-sm" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full">
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                  <AvatarImage src={userData.image || ''} alt={userData.name || ''} />
                  <AvatarFallback className="text-xs sm:text-sm">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-0.5 leading-none">
                  {userData.name && (
                    <p className="font-medium">{userData.name}</p>
                  )}
                  {userData.email && (
                    <p className="w-[200px] truncate text-sm text-gray-600">
                      {userData.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {userData.role === 'ADMIN' ? 'Administrateur' : 'Staff'}
                  </p>
                </div>
              </div>
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
        </div>
      </div>
    </header>
  )
}
