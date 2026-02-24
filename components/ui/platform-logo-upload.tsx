'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, X } from 'lucide-react'
import Image from 'next/image'

interface PlatformLogoUploadProps {
  value?: string
  onChange: (url: string) => void
  onUpload?: (file: File) => Promise<string>
  disabled?: boolean
  className?: string
}

export function PlatformLogoUpload({
  value,
  onChange,
  onUpload,
  disabled,
  className = ''
}: PlatformLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const containerStyles = 'w-full max-w-[150px] h-[150px] rounded-lg'

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true)
      setError(null)
      
      if (onUpload) {
        const url = await onUpload(file)
        onChange(url)
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      setError('Une erreur est survenue lors du téléchargement')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-start w-full">
        {value ? (
          <div className={`relative overflow-hidden ${containerStyles}`}>
            <Image
              src={value}
              alt="Logo de plateforme"
              fill
              className="object-contain"
            />
            <Button
              type="button"
              onClick={() => onChange('')}
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => document.getElementById('platform-logo-upload')?.click()}
            className={`border-dashed ${containerStyles}`}
          >
            <ImagePlus className="h-6 w-6 mr-2" />
            {isUploading ? "Téléchargement..." : "Ajouter un logo"}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <input
        id="platform-logo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />
      <p className="text-sm text-muted-foreground">
        Formats recommandés : PNG ou SVG avec fond transparent.
      </p>
    </div>
  )
} 