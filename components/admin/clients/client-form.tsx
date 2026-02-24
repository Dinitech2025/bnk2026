'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { Upload, User, Phone, Mail, Building, Camera, X, Save, Loader2 } from 'lucide-react'
import ImageCropper from '@/components/ImageCropper'

export interface ClientFormData {
  email: string
  password?: string
  firstName: string
  lastName: string
  phone: string
  customerType: 'INDIVIDUAL' | 'BUSINESS'
  companyName: string
  vatNumber: string
  notes: string
  image: string
  birthDate: string
  gender: string
  preferredLanguage: 'fr' | 'en' | 'mg'
  newsletter: boolean
  communicationMethod: 'EMAIL' | 'PHONE' | 'SMS' | 'WHATSAPP'
}

interface ClientFormProps {
  initialData?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  isEditing?: boolean
  submitLabel?: string
}

export default function ClientForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
  submitLabel
}: ClientFormProps) {
  const [imageToEdit, setImageToEdit] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClientFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    customerType: 'INDIVIDUAL',
    companyName: '',
    vatNumber: '',
    notes: '',
    image: '',
    birthDate: '',
    gender: '',
    preferredLanguage: 'fr',
    newsletter: false,
    communicationMethod: 'EMAIL',
    ...initialData
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: keyof ClientFormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setImageToEdit(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (croppedImageUrl: string) => {
    try {
      // Convertir l'image en blob
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      
      // Créer un FormData pour l'upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', blob, 'profile.jpg')
      uploadFormData.append('type', 'profile')

      // Uploader l'image
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (uploadResponse.ok) {
        const data = await uploadResponse.json()
        setFormData(prev => ({ ...prev, image: data.url }))
        setImageToEdit(null)
        toast({
          title: "Photo uploadée",
          description: "La photo de profil a été uploadée avec succès"
        })
      } else {
        throw new Error('Erreur lors de l\'upload')
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'uploader la photo",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation - au moins un email ou un téléphone
    if (!formData.email && !formData.phone) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez fournir au moins un email ou un numéro de téléphone",
        variant: "destructive"
      })
      return
    }

    // Validation du mot de passe pour les nouveaux clients sans email
    if (!isEditing && !formData.email && !formData.password) {
      toast({
        title: "Erreur de validation",
        description: "Un mot de passe temporaire est requis si aucun email n'est fourni",
        variant: "destructive"
      })
      return
    }

    await onSubmit(formData)
  }

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`
    }
    if (formData.firstName) return formData.firstName.charAt(0)
    if (formData.lastName) return formData.lastName.charAt(0)
    if (formData.email) return formData.email.charAt(0).toUpperCase()
    if (formData.phone) return formData.phone.charAt(0)
    return 'C'
  }

  const defaultSubmitLabel = isEditing ? 'Enregistrer' : 'Créer le client'

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo de profil - Pleine largeur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo de profil
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Modifiez la photo de profil du client' : 'Ajoutez une photo de profil pour le client (optionnel)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.image} />
                <AvatarFallback className="text-xl font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {formData.image && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
                {formData.image ? 'Changer la photo' : 'Ajouter une photo'}
              </Button>
              <p className="text-sm text-gray-500">
                Formats acceptés : JPG, PNG. Taille recommandée : 400x400px
              </p>
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </CardContent>
        </Card>

        {/* Layout en deux colonnes sur desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche */}
          <div className="space-y-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Informations de base du client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="Jean"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="Dupont"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birthDate">Date de naissance</Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="mt-1"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Genre</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleSelectChange('gender', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner le genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Homme</SelectItem>
                        <SelectItem value="FEMALE">Femme</SelectItem>
                        <SelectItem value="OTHER">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Type de client */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Type de client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="customerType">Type de client</Label>
                  <Select
                    value={formData.customerType}
                    onValueChange={(value) => handleSelectChange('customerType', value as any)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Particulier
                        </div>
                      </SelectItem>
                      <SelectItem value="BUSINESS">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Entreprise
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.customerType === 'BUSINESS' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="companyName">Nom de l'entreprise</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="Nom de l'entreprise"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vatNumber">Numéro de TVA</Label>
                      <Input
                        id="vatNumber"
                        name="vatNumber"
                        value={formData.vatNumber}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="FR12345678901"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>
                  Informations supplémentaires sur le client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="min-h-[100px]"
                  placeholder="Notes sur le client..."
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Informations de contact
                </CardTitle>
                <CardDescription>
                  Au moins un moyen de contact est requis (email ou téléphone)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="jean.dupont@email.com"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="+261 34 12 345 67"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="communicationMethod">Méthode de communication préférée</Label>
                  <Select
                    value={formData.communicationMethod}
                    onValueChange={(value) => handleSelectChange('communicationMethod', value as any)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="PHONE">Téléphone</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!isEditing && !formData.email && (
                  <div>
                    <Label htmlFor="password">Mot de passe temporaire *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="Mot de passe temporaire"
                      disabled={isLoading}
                      required={!formData.email}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Requis uniquement si aucun email n'est fourni
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Préférences */}
            <Card>
              <CardHeader>
                <CardTitle>Préférences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="preferredLanguage">Langue préférée</Label>
                  <Select
                    value={formData.preferredLanguage}
                    onValueChange={(value) => handleSelectChange('preferredLanguage', value as any)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                      <SelectItem value="mg">Malagasy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newsletter">Newsletter</Label>
                    <p className="text-sm text-gray-500">
                      Recevoir les actualités et promotions
                    </p>
                  </div>
                  <Switch
                    id="newsletter"
                    checked={formData.newsletter}
                    onCheckedChange={(checked) => handleSwitchChange('newsletter', checked)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isEditing ? 'Enregistrement...' : 'Création...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {submitLabel || defaultSubmitLabel}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Image Cropper Modal */}
      {imageToEdit && (
        <ImageCropper
          imageUrl={imageToEdit}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToEdit(null)}
          aspectRatio={1}
        />
      )}
    </div>
  )
} 