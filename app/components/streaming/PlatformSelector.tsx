import { Platform } from '@prisma/client'
import { useEffect } from 'react'
import { usePlatforms } from '@/app/hooks/usePlatforms'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

interface PlatformSelectorProps {
  onSelectionChange?: (platforms: Platform[]) => void
  className?: string
}

export function PlatformSelector({ onSelectionChange, className = '' }: PlatformSelectorProps) {
  const {
    platforms,
    isLoading,
    error,
    selectedPlatforms,
    togglePlatform,
    isPlatformSelected
  } = usePlatforms()

  // Notifier le parent des changements de sélection
  useEffect(() => {
    onSelectionChange?.(selectedPlatforms)
  }, [selectedPlatforms, onSelectionChange])

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        Erreur: {error.message}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {platforms.map((platform) => (
        <Card
          key={platform.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            isPlatformSelected(platform.id)
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => togglePlatform(platform)}
        >
          <div className="flex flex-col items-center space-y-3">
            {platform.logo && (
              <div className="relative w-16 h-16">
                <Image
                  src={platform.logo}
                  alt={platform.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="text-center">
              <h3 className="font-medium">{platform.name}</h3>
              <Badge variant={isPlatformSelected(platform.id) ? 'default' : 'outline'}>
                {platform.type}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 