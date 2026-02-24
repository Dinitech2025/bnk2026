'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const MESSAGE_TYPES = {
  GENERAL: 'Question générale',
  SUPPORT: 'Support technique',
  ORDER: 'Question commande',
  SUBSCRIPTION: 'Abonnement streaming',
  PAYMENT: 'Paiement',
  OTHER: 'Autre',
}

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'GENERAL',
    relatedProduct: '',
    relatedService: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/public/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          content: formData.message,
          clientEmail: formData.email,
          clientName: formData.name,
          type: formData.type,
          relatedProductId: formData.relatedProduct || undefined,
          relatedServiceId: formData.relatedService || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsSubmitted(true)
        toast.success('Message envoyé avec succès !')

        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          type: 'GENERAL',
          relatedProduct: '',
          relatedService: '',
        })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'envoi du message')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Message envoyé !
            </h3>
            <p className="text-green-700 mb-4">
              Votre message a été envoyé avec succès. Notre équipe vous répondra dans les plus brefs délais.
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
            >
              Envoyer un autre message
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Envoyez-nous un message
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nom complet *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Votre nom"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1">
              Type de demande
            </label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MESSAGE_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">
              Sujet *
            </label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Résumez votre demande"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Message *
            </label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Détaillez votre demande..."
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.message.length} caractères
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
                type: 'GENERAL',
                relatedProduct: '',
                relatedService: '',
              })}
            >
              Effacer
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer le message
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
