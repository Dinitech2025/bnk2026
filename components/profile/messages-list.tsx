'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Eye, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  subject: string
  content: string
  status: string
  sentAt: string
  fromUser: {
    name: string | null
    role: string
  }
  conversationId: string | null
}

interface MessagesListProps {
  userId: string
}

export function MessagesList({ userId }: MessagesListProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [userId])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/public/messages?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/admin/messages/${messageId}/read`, {
        method: 'PATCH',
      })
      fetchMessages()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const unreadCount = messages.filter(m => m.status === 'UNREAD').length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Mes Messages
              {unreadCount > 0 && (
                <Badge className="bg-green-500 text-white">
                  {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/contact')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouveau
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Chargement...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-3">Aucun message</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/contact')}
              >
                Envoyer un message
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.slice(0, 5).map((message) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    message.status === 'UNREAD' ? 'border-l-4 border-l-green-500 bg-green-50' : ''
                  }`}
                  onClick={() => router.push(`/admin/messages/${message.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${message.status === 'UNREAD' ? 'font-bold' : ''}`}>
                          {message.subject}
                        </h4>
                        {message.status === 'UNREAD' && (
                          <Badge className="bg-green-500 text-white text-xs">
                            NOUVEAU
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        De: {message.fromUser.name || 'Support BoutikNaka'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(message.sentAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {message.status === 'UNREAD' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(message.id)
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {messages.length > 5 && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/admin/messages')}
                  >
                    Voir tous les messages ({messages.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
