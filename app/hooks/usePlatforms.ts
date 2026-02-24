import { useState, useEffect } from 'react'
import { Platform } from '@prisma/client'

interface UsePlatformsReturn {
  platforms: Platform[]
  isLoading: boolean
  error: Error | null
  selectedPlatforms: Platform[]
  togglePlatform: (platform: Platform) => void
  isPlatformSelected: (platformId: string) => boolean
  clearSelectedPlatforms: () => void
}

export function usePlatforms(): UsePlatformsReturn {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await fetch('/api/admin/streaming/platforms')
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des plateformes')
        }
        const data = await response.json()
        setPlatforms(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Une erreur est survenue'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatforms()
  }, [])

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => {
      const isSelected = prev.some(p => p.id === platform.id)
      if (isSelected) {
        return prev.filter(p => p.id !== platform.id)
      }
      return [...prev, platform]
    })
  }

  const isPlatformSelected = (platformId: string) => {
    return selectedPlatforms.some(platform => platform.id === platformId)
  }

  const clearSelectedPlatforms = () => {
    setSelectedPlatforms([])
  }

  return {
    platforms,
    isLoading,
    error,
    selectedPlatforms,
    togglePlatform,
    isPlatformSelected,
    clearSelectedPlatforms
  }
} 