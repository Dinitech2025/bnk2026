'use client'

import { useState, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel: () => void
  aspectRatio?: number
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropper({ imageUrl, onCropComplete, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCircular] = useState(aspectRatio === 1)

  useEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current
      setCrop(centerAspectCrop(width, height, aspectRatio))
    }
  }, [imgRef, aspectRatio])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspectRatio))
  }

  const getCroppedImg = () => {
    setIsLoading(true)
    
    const image = imgRef.current
    const canvas = previewCanvasRef.current
    
    if (!image || !canvas || !completedCrop) {
      setIsLoading(false)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsLoading(false)
      return
    }

    // Définir les dimensions du canvas avec une taille standard pour les avatars
    const size = Math.max(completedCrop.width, completedCrop.height, 300)
    canvas.width = size
    canvas.height = size

    // Utiliser une qualité d'image supérieure
    ctx.imageSmoothingQuality = 'high'
    ctx.imageSmoothingEnabled = true

    // Remplir le canvas avec un fond transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculer les facteurs d'échelle pour redimensionnement
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Dessiner l'image rognée sur le canvas avec mise à l'échelle
    const sourceWidth = completedCrop.width * scaleX
    const sourceHeight = completedCrop.height * scaleY
    const sourceX = completedCrop.x * scaleX
    const sourceY = completedCrop.y * scaleY

    // Centrer l'image dans le canvas
    const destX = (canvas.width - size) / 2
    const destY = (canvas.height - size) / 2

    if (isCircular) {
      // Si c'est un avatar, faire un rognage circulaire
      ctx.save()
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, size / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = 'white'
      ctx.fill()
    }

    // Dessiner l'image dans le canvas (avec le clip circulaire si nécessaire)
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destX,
      destY,
      size,
      size
    )

    if (isCircular) {
      ctx.restore()
    }

    // Convertir le canvas en URL de données avec une qualité supérieure
    try {
      const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.95)
      onCropComplete(croppedImageUrl)
    } catch (e) {
      console.error('Erreur lors de la création de l\'image rognée:', e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full">
        <h2 className="text-xl font-semibold mb-4">Rogner votre photo de profil</h2>
        
        <div className="flex flex-col items-center">
          <div className="mb-4 text-sm text-gray-600 text-center">
            {isCircular 
              ? "Ajustez la zone pour créer une photo de profil circulaire" 
              : "Ajustez la zone de l'image pour créer la meilleure vue"
            }
          </div>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            circularCrop={isCircular}
            className="max-h-[60vh] mx-auto border border-gray-300 rounded-md"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Image à rogner"
              onLoad={onImageLoad}
              className="max-h-[60vh] max-w-full"
            />
          </ReactCrop>
          
          {/* Canvas caché pour le rognage */}
          <canvas
            ref={previewCanvasRef}
            className="hidden"
          />
          
          <div className="flex space-x-4 mt-6">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={getCroppedImg}
              disabled={!completedCrop || isLoading}
            >
              {isLoading ? 'Traitement...' : 'Appliquer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 