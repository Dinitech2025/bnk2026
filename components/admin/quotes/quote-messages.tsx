'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Send, User, Shield, DollarSign, Paperclip, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface Message {
  id: string
  message: string
  attachments: string[]
  proposedPrice: number | null
  createdAt: string
  sender: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

interface QuoteMessagesProps {
  messages: Message[]
  quoteId: string
  currentUserId: string
  onMessageSent: () => void
}

export function QuoteMessages({ messages, quoteId, currentUserId, onMessageSent }: QuoteMessagesProps) {
  const [newMessage, setNewMessage] = useState('')
  const [proposedPrice, setProposedPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !proposedPrice) {
      toast.error('Veuillez saisir un message ou un prix')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
          attachments: []
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'envoi du message')
      }

      toast.success('Message envoyé avec succès')
      setNewMessage('')
      setProposedPrice('')
      onMessageSent()

    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Liste des messages */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">Aucun message pour le moment</p>
            <p className="text-sm">Commencez la conversation avec le client</p>
          </div>
        ) : (
          messages.map((message) => {
            const isAdmin = message.sender.role === 'ADMIN' || message.sender.role === 'STAFF'
            const isCurrentUser = message.sender.id === currentUserId

            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } rounded-lg p-4 shadow-sm`}
                >
                  {/* En-tête du message */}
                  <div className="flex items-center gap-2 mb-2">
                    {isAdmin ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="font-semibold text-sm">
                      {message.sender.name || message.sender.email}
                    </span>
                    <span className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>

                  {/* Contenu du message */}
                  <div className="space-y-2">
                    {message.message && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.message}
                      </p>
                    )}

                    {/* Prix proposé */}
                    {message.proposedPrice && (
                      <div className={`flex items-center gap-2 p-3 rounded-md ${
                        isCurrentUser ? 'bg-blue-700' : 'bg-white'
                      }`}>
                        <DollarSign className="h-5 w-5" />
                        <div>
                          <p className="text-xs opacity-80">Prix proposé</p>
                          <p className="font-bold text-lg">
                            <PriceWithConversion price={message.proposedPrice} />
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pièces jointes */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="space-y-1">
                        {message.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 text-sm hover:underline ${
                              isCurrentUser ? 'text-blue-100' : 'text-blue-600'
                            }`}
                          >
                            <Paperclip className="h-4 w-4" />
                            Pièce jointe {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Formulaire de nouveau message */}
      <Card className="p-4 bg-gray-50 border-2 border-dashed">
        <div className="space-y-4">
          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Votre message
            </Label>
            <Textarea
              id="message"
              placeholder="Écrivez votre message au client..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              className="mt-1 resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="proposedPrice" className="text-sm font-medium">
              Prix proposé (optionnel)
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <Input
                id="proposedPrice"
                type="number"
                placeholder="0"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                className="flex-1"
                disabled={isSubmitting}
                min="0"
                step="0.01"
              />
              <span className="text-sm text-gray-600">Ar</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Si vous proposez un prix, le statut du devis sera automatiquement mis à jour
            </p>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={isSubmitting || (!newMessage.trim() && !proposedPrice)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer le message
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

