'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Send,
  User,
  Loader2,
  Search,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

interface Subscription {
  id: string
  status: string
  offer: {
    name: string
  }
  user: {
    id: string
    name: string | null
    email: string | null
  }
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
  LOW: 'Basse',
  NORMAL: 'Normal',
  HIGH: 'Haute',
  URGENT: 'Urgente',
}

export default function NewMessagePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const [clients, setClients] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])

  const [selectedClient, setSelectedClient] = useState<User | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)

  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    type: 'GENERAL',
    priority: 'NORMAL',
    toUserId: '',
  })

  const [clientSearch, setClientSearch] = useState('')

  useEffect(() => {
    // Récupérer la liste des clients
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/admin/clients?limit=100')
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error)
      }
    }

    fetchClients()
  }, [])

  // Filtrer les clients selon la recherche
  const filteredClients = clients.filter(client => {
    if (!clientSearch) return true
    const searchLower = clientSearch.toLowerCase()
    return (
      (client.name && client.name.toLowerCase().includes(searchLower)) ||
      (client.firstName && client.firstName.toLowerCase().includes(searchLower)) ||
      (client.lastName && client.lastName.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.phone && client.phone.includes(clientSearch))
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subject || !formData.content || !formData.toUserId) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          relatedOrderId: selectedOrder?.id,
          relatedSubscriptionId: selectedSubscription?.id,
        }),
      })

      if (response.ok) {
        toast.success('Message envoyé avec succès')
        router.push('/admin/messages')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'envoi du message')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold">Nouveau Message</h1>
          <p className="text-muted-foreground">
            Envoyez un message à un client
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulaire principal */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Destinataire</CardTitle>
                <CardDescription>
                  Sélectionnez le client qui recevra le message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un client..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {clientSearch && (
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Aucun client trouvé
                      </div>
                    ) : (
                      filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                            selectedClient?.id === client.id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                          onClick={() => {
                            setSelectedClient(client)
                            setFormData({ ...formData, toUserId: client.id })
                            setClientSearch('')
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <User className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {client.name || `${client.firstName} ${client.lastName}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {client.email}
                              </p>
                              {client.phone && (
                                <p className="text-sm text-muted-foreground">
                                  {client.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedClient && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">
                          Destinataire sélectionné
                        </p>
                        <p className="text-sm text-green-600">
                          {selectedClient.name || `${selectedClient.firstName} ${selectedClient.lastName}`} ({selectedClient.email})
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations du message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="type">Type de message</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MESSAGE_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MESSAGE_PRIORITIES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Sujet *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Entrez le sujet du message..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="content">Message *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Rédigez votre message..."
                    rows={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.content.length} caractères
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations liées (optionnel) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lier à une commande (optionnel)</CardTitle>
                <CardDescription>
                  Associez ce message à une commande spécifique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Fonctionnalité à venir</p>
                  <p className="text-sm">Recherche de commandes par client</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lier à un abonnement (optionnel)</CardTitle>
                <CardDescription>
                  Associez ce message à un abonnement spécifique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Fonctionnalité à venir</p>
                  <p className="text-sm">Recherche d'abonnements par client</p>
                </div>
              </CardContent>
            </Card>

            {/* Aperçu */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Type:</p>
                  <p className="text-sm text-muted-foreground">
                    {MESSAGE_TYPES[formData.type as keyof typeof MESSAGE_TYPES]}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Priorité:</p>
                  <p className="text-sm text-muted-foreground">
                    {MESSAGE_PRIORITIES[formData.priority as keyof typeof MESSAGE_PRIORITIES]}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Destinataire:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient
                      ? `${selectedClient.name || `${selectedClient.firstName} ${selectedClient.lastName}`} (${selectedClient.email})`
                      : 'Non sélectionné'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Longueur:</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.content.length} caractères
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/messages')}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.subject || !formData.content || !formData.toUserId}
          >
            {isLoading ? (
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
    </div>
  )
}

