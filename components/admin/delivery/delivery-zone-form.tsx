'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface DeliveryZone {
  id?: string
  name: string
  description: string
  type: 'country' | 'region' | 'city' | 'postal'
  areas: string[]
  isActive: boolean
  createdAt?: string
}

interface DeliveryZoneFormProps {
  zone?: DeliveryZone | null
  onSave: (zone: DeliveryZone) => void
  onCancel: () => void
}

export function DeliveryZoneForm({ zone, onSave, onCancel }: DeliveryZoneFormProps) {
  const [formData, setFormData] = useState<DeliveryZone>({
    name: '',
    description: '',
    type: 'city',
    areas: [],
    isActive: true
  })
  const [newArea, setNewArea] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (zone) {
      setFormData(zone)
    }
  }, [zone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.areas.length === 0) {
        toast.error('Veuillez ajouter au moins une zone')
        return
      }

      const url = zone?.id 
        ? `/api/admin/delivery-zones/${zone.id}`
        : '/api/admin/delivery-zones'
      
      const response = await fetch(url, {
        method: zone?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const savedZone = await response.json()
        onSave(savedZone)
        toast.success(`Zone de livraison ${zone ? 'modifiée' : 'créée'} avec succès !`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof DeliveryZone, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addArea = () => {
    if (newArea.trim() && !formData.areas.includes(newArea.trim())) {
      setFormData(prev => ({
        ...prev,
        areas: [...prev.areas, newArea.trim()]
      }))
      setNewArea('')
    }
  }

  const removeArea = (areaToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.filter(area => area !== areaToRemove)
    }))
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'country': return 'Pays'
      case 'region': return 'Région'
      case 'city': return 'Ville'
      case 'postal': return 'Code postal'
      default: return type
    }
  }

  const getTypePlaceholder = (type: string) => {
    switch (type) {
      case 'country': return 'Ex: Madagascar, France'
      case 'region': return 'Ex: Analamanga, Île-de-France'
      case 'city': return 'Ex: Antananarivo, Paris'
      case 'postal': return 'Ex: 101, 75001'
      default: return 'Entrez une zone'
    }
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {zone ? 'Modifier la zone de livraison' : 'Nouvelle zone de livraison'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la zone *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Antananarivo Centre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type de zone *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'country' | 'region' | 'city' | 'postal') => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="country">Pays</SelectItem>
                      <SelectItem value="region">Région</SelectItem>
                      <SelectItem value="city">Ville</SelectItem>
                      <SelectItem value="postal">Code postal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description de la zone de livraison"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Zone active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {getTypeLabel(formData.type)}s couverts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder={getTypePlaceholder(formData.type)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addArea()
                    }
                  }}
                />
                <Button type="button" onClick={addArea} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.areas.length > 0 && (
                <div className="space-y-2">
                  <Label>Zones ajoutées ({formData.areas.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.areas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {area}
                        <button
                          type="button"
                          onClick={() => removeArea(area)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.areas.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune zone ajoutée</p>
                  <p className="text-sm">Ajoutez au moins une zone pour continuer</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || formData.areas.length === 0}>
              {loading ? 'Sauvegarde...' : (zone ? 'Sauvegarder' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
  const zoneTypes = [
    { value: 'country', label: 'Pays', example: 'Madagascar, France, États-Unis...' },
    { value: 'region', label: 'Région/Province', example: 'Analamanga, Île-de-France...' },
    { value: 'city', label: 'Ville', example: 'Antananarivo, Paris, New York...' },
    { value: 'postal', label: 'Code postal', example: '101, 75001, 10001...' }
  ]

  const getPlaceholder = () => {
    switch (formData.type) {
      case 'country':
        return 'Ex: Madagascar'
      case 'region':
        return 'Ex: Analamanga'
      case 'city':
        return 'Ex: Antananarivo'
      case 'postal':
        return 'Ex: 101'
      default:
        return 'Ajouter une zone...'
    }
  }
