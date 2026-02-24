'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Send,
  Eye,
  EyeOff,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Message {
  id: string
  subject: string
  content: string
  type: string
  priority: string
  status: string
  sentAt: string
  readAt: string | null
  fromUser: {
    id: string
    name: string | null
    email: string | null
    role: string
  }
  toUser: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
  }
  replies: {
    id: string
    subject: string
    content: string
    status: string
    createdAt: string
    fromUser: {
      id: string
      name: string | null
      role: string
    }
  }[]
}

const MESSAGE_TYPES = {
  GENERAL: 'Général',
  SUPPORT: 'Support',
  ORDER: 'Commande',
  SUBSCRIPTION: 'Abonnement',
  PAYMENT: 'Paiement',
  CUSTOM: 'Personnalisé',
}

const MESSAGE_PRIORITIES = {
  LOW: { label: 'Basse', color: 'bg-gray-500' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500' },
  HIGH: { label: 'Haute', color: 'bg-orange-500' },
  URGENT: { label: 'Urgente', color: 'bg-red-500' },
}

const MESSAGE_STATUSES = {
  UNREAD: { label: 'Non lu', color: 'bg-red-500' },
  READ: { label: 'Lu', color: 'bg-green-500' },
  REPLIED: { label: 'Répondu', color: 'bg-blue-500' },
  ARCHIVED: { label: 'Archivé', color: 'bg-gray-500' },
  DELETED: { label: 'Supprimé', color: 'bg-gray-500' },
}

export default function MessageDetailPage() {
  const router = useRouter()
  const params = useParams()
  const messageId = params.id as string

  const [message, setMessage] = useState<Message | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    fetchMessage()
  }, [messageId])

  const fetchMessage = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/messages/${messageId}`)
      if (response.ok) {
        const data = await response.json()
        setMessage(data)
      } else {
        toast.error('Message non trouvé')
        router.push('/admin/messages')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement du message')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}/read`, {
        method: 'PATCH',
      })

      if (response.ok) {
        toast.success('Message marqué comme lu')
        fetchMessage()
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const sendReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Veuillez saisir une réponse')
      return
    }

    try {
      setIsReplying(true)
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Re: ${message?.subject}`,
          content: replyContent,
          type: message?.type || 'GENERAL',
          priority: message?.priority || 'NORMAL',
          toUserId: message?.fromUser.id,
          parentMessageId: messageId,
        }),
      })

      if (response.ok) {
        toast.success('Réponse envoyée')
        setReplyContent('')
        fetchMessage()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'envoi de la réponse')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'envoi de la réponse')
    } finally {
      setIsReplying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!message) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Message non trouvé</h2>
          <Button onClick={() => router.push('/admin/messages')}>
            Retour aux messages
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/messages')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{message.subject}</h1>
            <p className="text-muted-foreground">
              Conversation avec {message.fromUser.name || message.fromUser.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {message.status === 'UNREAD' && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAsRead}
            >
              <Eye className="h-4 w-4 mr-2" />
              Marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2">
        <Badge className={MESSAGE_PRIORITIES[message.priority as keyof typeof MESSAGE_PRIORITIES].color}>
          {MESSAGE_PRIORITIES[message.priority as keyof typeof MESSAGE_PRIORITIES].label}
        </Badge>
        <Badge variant="outline">
          {MESSAGE_TYPES[message.type as keyof typeof MESSAGE_TYPES]}
        </Badge>
        <Badge className={MESSAGE_STATUSES[message.status as keyof typeof MESSAGE_STATUSES].color}>
          {MESSAGE_STATUSES[message.status as keyof typeof MESSAGE_STATUSES].label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2 space-y-4">
          {/* Message original */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {message.fromUser.name || message.fromUser.email}
                    {message.fromUser.role === 'ADMIN' && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                    {message.fromUser.role === 'STAFF' && (
                      <Badge variant="secondary">Staff</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(message.sentAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </CardDescription>
                </div>
                <Badge className={MESSAGE_STATUSES[message.status as keyof typeof MESSAGE_STATUSES].color}>
                  {MESSAGE_STATUSES[message.status as keyof typeof MESSAGE_STATUSES].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </CardContent>
          </Card>

          {/* Réponses */}
          {message.replies.map((reply) => (
            <Card key={reply.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {reply.fromUser.name || reply.fromUser.role}
                      {reply.fromUser.role === 'CLIENT' && (
                        <Badge>Client</Badge>
                      )}
                      {reply.fromUser.role === 'ADMIN' && (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                      {reply.fromUser.role === 'STAFF' && (
                        <Badge variant="secondary">Staff</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(reply.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </CardDescription>
                  </div>
                  <Badge className={MESSAGE_STATUSES[reply.status as keyof typeof MESSAGE_STATUSES].color}>
                    {MESSAGE_STATUSES[reply.status as keyof typeof MESSAGE_STATUSES].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`rounded-lg p-4 ${
                  reply.fromUser.role === 'CLIENT'
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'bg-green-50 border-l-4 border-l-green-500'
                }`}>
                  <p className="whitespace-pre-wrap">{reply.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Formulaire de réponse */}
          <Card>
            <CardHeader>
              <CardTitle>Répondre au client</CardTitle>
              <CardDescription>
                Envoyez une réponse à {message.fromUser.name || message.fromUser.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Rédigez votre réponse..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {replyContent.length} caractères
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={sendReply}
                  disabled={isReplying || !replyContent.trim()}
                >
                  {isReplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer la réponse
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations latérales */}
        <div className="space-y-4">
          {/* Informations du client */}
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Nom:</p>
                <p className="text-muted-foreground">
                  {message.toUser.name || `${message.toUser.firstName} ${message.toUser.lastName}`}
                </p>
              </div>
              <div>
                <p className="font-medium">Email:</p>
                <p className="text-muted-foreground">{message.toUser.email}</p>
              </div>
              {message.toUser.phone && (
                <div>
                  <p className="font-medium">Téléphone:</p>
                  <p className="text-muted-foreground">{message.toUser.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations du message */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Type:</p>
                <p className="text-muted-foreground">
                  {MESSAGE_TYPES[message.type as keyof typeof MESSAGE_TYPES]}
                </p>
              </div>
              <div>
                <p className="font-medium">Priorité:</p>
                <Badge className={MESSAGE_PRIORITIES[message.priority as keyof typeof MESSAGE_PRIORITIES].color}>
                  {MESSAGE_PRIORITIES[message.priority as keyof typeof MESSAGE_PRIORITIES].label}
                </Badge>
              </div>
              <div>
                <p className="font-medium">Statut:</p>
                <Badge className={MESSAGE_STATUSES[message.status as keyof typeof MESSAGE_STATUSES].color}>
                  {MESSAGE_STATUSES[message.status as keyof typeof MESSAGE_STATUSES].label}
                </Badge>
              </div>
              <div>
                <p className="font-medium">Envoyé le:</p>
                <p className="text-muted-foreground">
                  {format(new Date(message.sentAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
              {message.readAt && (
                <div>
                  <p className="font-medium">Lu le:</p>
                  <p className="text-muted-foreground">
                    {format(new Date(message.readAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

