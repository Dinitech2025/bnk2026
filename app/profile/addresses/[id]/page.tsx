'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { CheckedState } from "@radix-ui/react-checkbox"

// Schéma de validation pour le formulaire d'adresse
const addressFormSchema = z.object({
  type: z.string(),
  street: z.string().min(1, { message: 'La rue est requise' }),
  city: z.string().min(1, { message: 'La ville est requise' }),
  state: z.string().optional(),
  zipCode: z.string().min(1, { message: 'Le code postal est requis' }),
  country: z.string().min(1, { message: 'Le pays est requis' }),
  phoneNumber: z.string().optional(),
  isDefault: z.boolean().default(false)
})

type AddressFormValues = z.infer<typeof addressFormSchema>

interface EditAddressPageProps {
  params: {
    id: string
  }
}

export default function EditAddressPage({ params }: EditAddressPageProps) {
  const { id } = params
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Initialiser le formulaire
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      type: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phoneNumber: '',
      isDefault: false
    }
  })

  // Rediriger si non authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile/addresses/' + id)
    }
  }, [status, router, id])

  // Charger les données de l'adresse
  useEffect(() => {
    const fetchAddressData = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          const response = await fetch(`/api/profile/addresses/${id}`)
          if (!response.ok) throw new Error('Erreur lors du chargement de l\'adresse')
          
          const addressData = await response.json()
          
          // Mettre à jour les valeurs du formulaire
          form.reset({
            type: addressData.type,
            street: addressData.street,
            city: addressData.city,
            state: addressData.state || '',
            zipCode: addressData.zipCode,
            country: addressData.country,
            phoneNumber: addressData.phoneNumber || '',
            isDefault: addressData.isDefault,
          })
        } catch (error) {
          console.error('Erreur:', error)
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les informations de l\'adresse',
            variant: 'destructive',
          })
          router.push('/profile')
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (status === 'authenticated') {
      fetchAddressData()
    }
  }, [status, session, id, form, router])

  // Gérer la soumission du formulaire
  async function onSubmit(data: AddressFormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/profile/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'adresse')
      }

      toast({
        title: 'Adresse mise à jour',
        description: 'Votre adresse a été modifiée avec succès',
      })
      
      router.push('/profile')
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'adresse',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Gérer la suppression de l'adresse
  async function handleDeleteAddress() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/profile/addresses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'adresse')
      }

      toast({
        title: 'Adresse supprimée',
        description: 'Votre adresse a été supprimée avec succès',
      })
      
      router.push('/profile')
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'adresse',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/profile" className="text-gray-500 hover:text-gray-700 mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Modifier l'adresse</h1>
          </div>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action ne peut pas être annulée. Cette adresse sera définitivement supprimée de votre profil.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAddress}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Modifier l'adresse</CardTitle>
            <CardDescription>
              Modifiez les informations de votre adresse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'adresse</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type d'adresse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HOME">Domicile</SelectItem>
                          <SelectItem value="WORK">Travail</SelectItem>
                          <SelectItem value="BILLING">Facturation</SelectItem>
                          <SelectItem value="SHIPPING">Livraison</SelectItem>
                          <SelectItem value="OTHER">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rue</FormLabel>
                      <FormControl>
                        <Input placeholder="123 rue de la Paix" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>État/Région (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Île-de-France" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input placeholder="75000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <Input placeholder="France" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="+33 6 12 34 56 78" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked: CheckedState) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Définir comme adresse par défaut</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push('/profile')}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 