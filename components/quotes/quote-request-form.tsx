'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  DollarSign, 
  AlertCircle, 
  Paperclip,
  X,
  FileText,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface Service {
  id: string
  name: string
  description?: string
  price?: number
  pricingType?: string
  images?: { path: string; alt?: string }[] | { url: string; type: string; alt?: string }[] | any[]
}

interface QuoteRequestFormProps {
  service: Service
  onSuccess?: (quoteId: string) => void
  onCancel?: () => void
}

export function QuoteRequestForm({ 
  service, 
  onSuccess, 
  onCancel 
}: QuoteRequestFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    budget: ''
  })
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Upload files first if any
      let attachments: string[] = []
      if (files.length > 0) {
        const formData = new FormData()
        files.forEach(file => {
          formData.append('files', file)
        })
        formData.append('type', 'quote')

        const uploadResponse = await fetch('/api/upload-imagekit', {
          method: 'POST',
          body: formData
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          attachments = uploadResult.urls || []
        }
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          description: formData.description,
          budget: formData.budget || null,
          attachments
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du devis')
      }

      const quote = await response.json()
      
      toast({
        title: "Demande envoyée !",
        description: "Vous recevrez une réponse sous 24h.",
      })
      
      if (onSuccess) {
        onSuccess(quote.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre demande. Veuillez réessayer.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* En-tête service */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{service.name}</CardTitle>
          {service.description && (
            <p className="text-sm text-gray-600">{service.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Description de vos besoins <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Décrivez votre projet, vos besoins, objectifs..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            required
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label htmlFor="budget">Budget approximatif (optionnel)</Label>
          <div className="relative">
            <Input
              id="budget"
              type="number"
              placeholder="Ex: 500000"
              value={formData.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              min="0"
              step="10000"
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              Ar
            </span>
          </div>
        </div>

        {/* Upload de fichiers - CONTEXTE BUSINESS SÉCURISÉ */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            🏢 Fichiers pour votre devis professionnel (optionnel)
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">✅ Sécurisé</span>
          </Label>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-blue-800 font-medium">📋 Documents business acceptés :</p>
            <p className="text-xs text-blue-600 mt-1">
              Cahier des charges, plans, spécifications techniques pour votre projet professionnel
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Joindre documents projet
              </Button>
              <span className="text-xs text-gray-500">
                PDF, DOC, images business (max 10MB)
              </span>
            </div>
            
            {files.length > 0 && (
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file)}
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.description.trim()}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Envoyer
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 