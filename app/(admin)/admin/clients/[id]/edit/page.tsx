'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'
import ClientForm, { ClientFormData } from '@/components/admin/clients/client-form'

interface EditClientPageProps {
  params: {
    id: string
  }
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [initialData, setInitialData] = useState<Partial<ClientFormData>>({})

  useEffect(() => {
    fetchClient()
  }, [])

  const fetchClient = async () => {
    try {
      setFetchLoading(true)
      const response = await fetch(`/api/admin/clients/${params.id}`)
      if (response.ok) {
        const client = await response.json()
        setInitialData({
          email: client.email || '',
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          phone: client.phone || '',
          customerType: client.customerType || 'INDIVIDUAL',
          companyName: client.companyName || '',
          vatNumber: client.vatNumber || '',
          notes: client.notes || '',
          image: client.image || '',
          birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split('T')[0] : '',
          gender: client.gender || '',
          preferredLanguage: client.preferredLanguage || 'fr',
          newsletter: client.newsletter || false,
          communicationMethod: client.communicationMethod || 'EMAIL'
        })
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les informations du client",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement du client:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du client",
        variant: "destructive"
      })
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (formData: ClientFormData) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/clients/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Client mis à jour",
          description: "Les informations du client ont été mises à jour avec succès"
        })
        router.push('/admin/clients')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour le client",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/clients')
  }

  if (fetchLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Chargement des informations du client...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier le client</h1>
          <p className="text-gray-600">Modifiez les informations du client</p>
        </div>
      </div>

      <ClientForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
        isEditing={true}
      />
    </div>
  )
} 