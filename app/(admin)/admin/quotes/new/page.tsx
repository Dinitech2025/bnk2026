'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  User,
  FileText,
  DollarSign,
  Calendar,
  Send,
  Loader2,
  Search,
  Plus,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
}

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  pricingType: string
  requiresQuote: boolean
  minPrice: number | null
  maxPrice: number | null
  duration: number
  category: {
    id: string
    name: string
    slug: string
  } | null
  images: {
    id: string
    path: string
    alt: string | null
  }[]
}

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedServiceId = searchParams.get('serviceId')

  const [users, setUsers] = useState<User[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || '')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')

  // Charger les utilisateurs et services
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, servicesResponse] = await Promise.all([
          fetch('/api/admin/clients'),
          fetch('/api/admin/services')
        ])

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users || [])
        }

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json()
          setServices(servicesData.services || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
        toast.error('Erreur lors du chargement des données')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Si un service est pré-sélectionné, mettre à jour la description
  useEffect(() => {
    if (preselectedServiceId) {
      const service = services.find(s => s.id === preselectedServiceId)
      if (service) {
        setSelectedServiceId(service.id)
        setDescription(`Demande de devis pour: ${service.name}\n\n${service.description || ''}`)
      }
    }
  }, [preselectedServiceId, services])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUserId || !selectedServiceId || !description.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          serviceId: selectedServiceId,
          description: description.trim(),
          budget: budget ? parseFloat(budget) : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Devis créé avec succès !')
        router.push(`/admin/quotes/${data.id}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erreur lors de la création du devis')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création du devis')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === selectedServiceId)
  const selectedUser = users.find(u => u.id === selectedUserId)

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/quotes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux devis
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Devis</h1>
          <p className="text-gray-600">Créez un devis pour un client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
              <CardDescription>
                Sélectionnez le client pour lequel créer le devis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">Client *</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.name || `${user.firstName} ${user.lastName}` || 'Client'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email} {user.phone && `• ${user.phone}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Client sélectionné</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`}
                  </p>
                  <p className="text-xs text-blue-600">{selectedUser.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Service
              </CardTitle>
              <CardDescription>
                Sélectionnez le service à inclure dans le devis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {service.category?.name} • {service.pricingType}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedService && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Service sélectionné</span>
                  </div>
                  <p className="text-sm text-green-800 font-medium">{selectedService.name}</p>
                  <p className="text-xs text-green-600 mb-2">{selectedService.description}</p>

                  <div className="flex items-center gap-2">
                    {selectedService.pricingType === 'QUOTE_REQUIRED' && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                        Devis requis
                      </Badge>
                    )}
                    {selectedService.pricingType === 'NEGOTIABLE' && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                        Négociable
                      </Badge>
                    )}
                    {selectedService.pricingType === 'RANGE' && selectedService.minPrice && selectedService.maxPrice && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                        Fourchette: {selectedService.minPrice.toLocaleString('fr-FR')} - {selectedService.maxPrice.toLocaleString('fr-FR')} Ar
                      </Badge>
                    )}
                  </div>

                  {selectedService.duration && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                      <Clock className="h-3 w-3" />
                      {selectedService.duration < 60
                        ? `${selectedService.duration} minutes`
                        : `${Math.floor(selectedService.duration / 60)}h ${selectedService.duration % 60}min`
                      }
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Détails du devis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Détails du Devis
            </CardTitle>
            <CardDescription>
              Décrivez les besoins du client et proposez un budget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description des besoins *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez en détail les besoins du client, les spécifications, les contraintes, etc."
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget estimé (optionnel)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Montant en Ariary"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide si vous préférez que le client propose un budget
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/admin/quotes">
              Annuler
            </Link>
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline">
              Sauvegarder brouillon
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedUserId || !selectedServiceId || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Créer le devis
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

