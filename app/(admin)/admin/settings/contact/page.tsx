'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, Mail, Phone, MapPin } from 'lucide-react'

interface ContactSettings {
  contactEmail: string
  contactPhone: string
  address: string
}

export default function ContactSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ContactSettings>()

  // Charger les paramètres existants
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/admin/settings/general')
        if (response.ok) {
          const data = await response.json()
          
          // Remplir le formulaire avec les données existantes
          Object.entries(data).forEach(([key, value]) => {
            if (key in { contactEmail: '', contactPhone: '', address: '' }) {
              setValue(key as keyof ContactSettings, value as string)
            }
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres de contact",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [setValue])

  // Enregistrer les paramètres
  const onSubmit = async (data: ContactSettings) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Les paramètres de contact ont été enregistrés avec succès"
        })
      } else {
        throw new Error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres de contact",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres de contact</h1>
        <p className="text-muted-foreground">
          Configurez les informations de contact de votre entreprise
        </p>
      </div>
      
      <Separator />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de contact</CardTitle>
            <CardDescription>
              Ces informations seront affichées sur votre site et utilisées pour les communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email de contact
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register('contactEmail', { 
                    required: 'L\'email de contact est requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Format d\'email invalide'
                    }
                  })}
                  placeholder="contact@monsite.com"
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-500">{errors.contactEmail.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Email principal pour les demandes de contact
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                <Input
                  id="contactPhone"
                  {...register('contactPhone')}
                  placeholder="+261 34 12 345 67"
                />
                <p className="text-sm text-muted-foreground">
                  Numéro de téléphone principal
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse
              </Label>
              <Textarea
                id="address"
                {...register('address')}
                rows={4}
                placeholder="123 Rue de la Paix&#10;Antananarivo 101&#10;Madagascar"
              />
              <p className="text-sm text-muted-foreground">
                Adresse physique de votre entreprise
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 