'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft } from 'lucide-react'
import ClientForm, { ClientFormData } from '@/components/admin/clients/client-form'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: ClientFormData) => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const client = await response.json()
        toast({
          title: "Client créé",
          description: "Le client a été créé avec succès"
        })
        router.push('/admin/clients')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création')
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le client",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/clients')
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
          <h1 className="text-3xl font-bold text-gray-900">Nouveau client</h1>
          <p className="text-gray-600">Créez un nouveau client dans le système</p>
        </div>
      </div>

      <ClientForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
        isEditing={false}
      />
    </div>
  )
} 