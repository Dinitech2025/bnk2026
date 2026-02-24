'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  MessageSquare, 
  DollarSign, 
  User, 
  Clock, 
  Paperclip,
  Send,
  Loader2
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Message {
  id: string
  message: string
  attachments?: string[]
  proposedPrice?: number | null
  createdAt: string | Date
  isAdminReply: boolean
  sender: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

interface UnifiedQuoteMessagesProps {
  messages: Message[]
  quoteId: string
  currentUserId: string
  onMessageSent?: () => void
}

export function UnifiedQuoteMessages({
  messages,
  quoteId,
  currentUserId,
  onMessageSent
}: UnifiedQuoteMessagesProps) {
  const [replyMessage, setReplyMessage] = useState('')
  const [proposedPrice, setProposedPrice] = useState('')
  const [sending, setSending] = useState(false)
  const [showPriceInput, setShowPriceInput] = useState(false)

  const handleSendMessage = async () => {
    if (!replyMessage.trim() && !proposedPrice.trim()) {
      toast.error('Veuillez saisir un message ou un prix')
      return
    }

    setSending(true)

    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
          proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
          attachments: []
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'envoi')
      }

      // Réinitialiser le formulaire
      setReplyMessage('')
      setProposedPrice('')
      setShowPriceInput(false)

      toast.success('Message envoyé avec succès')

      // Callback pour recharger les données
      if (onMessageSent) {
        onMessageSent()
      }

    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Liste des messages */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">Aucun message pour le moment</p>
            <p className="text-sm text-gray-500 mt-1">
              Commencez la conversation en envoyant un message ci-dessous
            </p>
          </Card>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender.id === currentUserId
            const metadata = message as any

            return (
              <Card 
                key={message.id}
                className={`p-4 ${
                  isOwnMessage 
                    ? 'bg-blue-50 border-blue-200 ml-8' 
                    : 'bg-gray-50 border-gray-200 mr-8'
                }`}
              >
                {/* En-tête du message */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${
                      isOwnMessage ? 'bg-blue-100' : 'bg-gray-200'
                    }`}>
                      <User className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {isOwnMessage ? 'Vous' : (message.sender.name || 'Client')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {message.sender.email}
                      </p>
                    </div>
                    {message.isAdminReply && (
                      <Badge variant="outline" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {format(new Date(message.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </div>
                </div>

                {/* Prix proposé */}
                {message.proposedPrice && Number(message.proposedPrice) > 0 && (
                  <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-700" />
                      <div>
                        <p className="text-xs text-green-700 font-medium">Prix proposé</p>
                        <p className="text-lg font-bold text-green-900">
                          {Number(message.proposedPrice).toLocaleString('fr-FR')} Ar
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contenu du message */}
                <div className="text-gray-700 whitespace-pre-wrap">
                  {message.message}
                </div>

                {/* Pièces jointes */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachments.map((file, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs flex items-center gap-1"
                      >
                        <Paperclip className="h-3 w-3" />
                        {file}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Formulaire de réponse */}
      <Card className="p-4 bg-white border-2 border-blue-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Envoyer un message
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPriceInput(!showPriceInput)}
              className="text-xs"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              {showPriceInput ? 'Masquer prix' : 'Proposer un prix'}
            </Button>
          </div>

          {/* Input pour le prix proposé */}
          {showPriceInput && (
            <div className="space-y-2">
              <Label htmlFor="proposedPrice" className="text-sm">
                Prix proposé (Ar)
              </Label>
              <Input
                id="proposedPrice"
                type="number"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder="Ex: 500000"
                className="max-w-xs"
              />
            </div>
          )}

          {/* Zone de texte pour le message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm">
              Message
            </Label>
            <Textarea
              id="message"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Écrivez votre message ici..."
              className="min-h-[100px] resize-none"
              disabled={sending}
            />
          </div>

          {/* Bouton d'envoi */}
          <div className="flex justify-end">
            <Button
              onClick={handleSendMessage}
              disabled={sending || (!replyMessage.trim() && !proposedPrice.trim())}
              className="flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

