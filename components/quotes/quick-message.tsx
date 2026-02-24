'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Send, MessageSquare, X } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useSession } from 'next-auth/react'

interface QuickMessageProps {
  quoteId: string
  onMessageSent?: () => void
  onClose?: () => void
}

export function QuickMessage({ quoteId, onMessageSent, onClose }: QuickMessageProps) {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      return
    }

    setSending(true)

    try {
      const response = await fetch(`/api/quotes/${quoteId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message')
      }

      setMessage('')
      setIsOpen(false)
      onMessageSent?.()
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      })
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Répondre
      </Button>
    )
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Envoyer un message
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={sendMessage} className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="min-h-[80px] resize-none"
            disabled={sending}
          />
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={sending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={sending || !message.trim()}
              className="flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        </form>
      </CardContent>
    </Card>
  )
} 