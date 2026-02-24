'use client'

import { Service, ServiceCategory } from '@prisma/client'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/ui/image-upload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, DollarSign, Image as ImageIcon, Tag, FileText, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().optional(),
  price: z.string().min(1, 'Le prix est requis').refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Le prix doit être un nombre positif'),
  duration: z.string().min(1, 'La durée est requise').refine((val) => {
    const num = parseInt(val)
    return !isNaN(num) && num > 0
  }, 'La durée doit être un nombre positif'),
  categoryId: z.string().optional(),
  published: z.boolean().default(false),
  images: z.array(z.object({ path: z.string() })).optional(),
})

type ServiceFormValues = z.infer<typeof formSchema>

interface ServiceFormProps {
  initialData?: Service & {
    images: { path: string }[]
  } | null
  categories: Pick<ServiceCategory, 'id' | 'name' | 'slug' | 'description' | 'parentId' | 'image'>[]
  onSubmit: (data: ServiceFormValues) => Promise<void>
  isLoading?: boolean
}

export function EnhancedServiceForm({
  initialData,
  categories,
  onSubmit,
  isLoading = false,
}: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price ? String(initialData.price) : '',
      duration: initialData?.duration ? String(initialData.duration) : '',
      categoryId: initialData?.categoryId || undefined,
      published: initialData?.published || false,
      images: initialData?.images || [],
    },
  })

  const handleSubmit = async (data: ServiceFormValues) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      toast.success(initialData ? 'Service mis à jour avec succès' : 'Service créé avec succès')
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast.error('Une erreur est survenue lors de la sauvegarde')
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchedValues = form.watch()
  const selectedCategory = categories.find(cat => cat.id === watchedValues.categoryId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {initialData ? 'Modifier le service' : 'Créer un nouveau service'}
          </h2>
          <p className="text-muted-foreground">
            {initialData ? 'Modifiez les informations du service' : 'Remplissez les informations pour créer un nouveau service'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? 'Éditer' : 'Aperçu'}
          </Button>
        </div>
      </div>

      {previewMode ? (
        /* Mode Aperçu */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Aperçu du service
            </CardTitle>
            <CardDescription>
              Voici comment votre service apparaîtra sur le site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {watchedValues.images && watchedValues.images.length > 0 && (
              <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={watchedValues.images[0].path}
                  alt={watchedValues.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold">{watchedValues.name || 'Nom du service'}</h3>
              {selectedCategory && (
                <Badge variant="secondary" className="mt-1">
                  {selectedCategory.name}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {watchedValues.description || 'Aucune description'}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">
                  {watchedValues.price ? `${watchedValues.price} Ar` : 'Prix non défini'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {watchedValues.duration ? `${watchedValues.duration} min` : 'Durée non définie'}
                </span>
              </div>
            </div>
            <Badge variant={watchedValues.published ? 'default' : 'secondary'}>
              {watchedValues.published ? 'Publié' : 'Brouillon'}
            </Badge>
          </CardContent>
        </Card>
      ) : (
        /* Mode Édition */
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Images du service
                </CardTitle>
                <CardDescription>
                  Ajoutez des images pour illustrer votre service (optionnel)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          value={field.value?.map((image) => image.path) || []}
                          onChange={(paths: string[]) => field.onChange(paths.map((path) => ({ path })))}
                          multiple={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations de base
                </CardTitle>
                <CardDescription>
                  Définissez les informations principales de votre service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du service *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Massage relaxant, Coupe de cheveux..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Le nom qui apparaîtra sur votre site
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Aide à organiser vos services
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre service en détail..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Une description détaillée aide vos clients à comprendre votre service
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Tarification et durée */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tarification et durée
                </CardTitle>
                <CardDescription>
                  Définissez le prix et la durée de votre service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix (Ar) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Prix en Ariary (Ar)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée (minutes) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="60" {...field} />
                        </FormControl>
                        <FormDescription>
                          Durée estimée en minutes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Paramètres de publication */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de publication</CardTitle>
                <CardDescription>
                  Contrôlez la visibilité de votre service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Service publié</FormLabel>
                        <FormDescription>
                          Activez pour rendre ce service visible sur votre site
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoading}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  initialData ? 'Mettre à jour' : 'Créer le service'
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
