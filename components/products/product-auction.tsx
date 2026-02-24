'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Clock, Hammer, TrendingUp, Users, AlertCircle, Trophy, Zap, LogIn } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ProductAuctionProps {
  product: {
    id: string
    name: string
    currentHighestBid?: number
    minimumBid?: number
    auctionEndDate?: Date | string
  }
  onPlaceBid: (amount: number, message?: string) => Promise<void>
  loading?: boolean
}

export function ProductAuction({ product, onPlaceBid, loading = false }: ProductAuctionProps) {
  const { toast } = useToast()
  const { data: session, status } = useSession()
  
  // Calculer le montant minimum requis
  const getMinimumBid = () => {
    if (product.currentHighestBid && product.currentHighestBid > 0) {
      return product.currentHighestBid + 1000 // +1000 Ar au-dessus de l'offre actuelle
    }
    if (product.minimumBid && product.minimumBid > 0) {
      return product.minimumBid // Utiliser le minimum défini
    }
    return 1000 // Valeur par défaut si aucun minimum n'est défini
  }
  
  const [bidAmount, setBidAmount] = useState(getMinimumBid())
  const [message, setMessage] = useState('')
  const [timeRemaining, setTimeRemaining] = useState('')
  const [isEnded, setIsEnded] = useState(false)
  const [showBidModal, setShowBidModal] = useState(false)
  const [showLoginAlert, setShowLoginAlert] = useState(false)

  // Calculer le temps restant
  useEffect(() => {
    if (!product.auctionEndDate) return

    const calculateTimeRemaining = () => {
      const end = new Date(product.auctionEndDate!).getTime()
      const now = new Date().getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeRemaining('Enchère terminée')
        setIsEnded(true)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days}j ${hours}h ${minutes}min`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}min`)
      } else {
        setTimeRemaining(`${minutes}min`)
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [product.auctionEndDate])

  const handleBidClick = () => {
    // Vérifier si l'utilisateur est connecté
    if (status === 'loading') return // Attendre le chargement
    
    if (!session) {
      setShowLoginAlert(true)
      return
    }
    
    // Utilisateur connecté, ouvrir le modal d'enchère
    setShowBidModal(true)
  }

  const handlePlaceBid = async () => {
    if (!session) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour enchérir",
        variant: "destructive"
      })
      return
    }

    const minimumRequired = getMinimumBid()
    if (bidAmount < minimumRequired) {
      toast({
        title: "Offre invalide",
        description: `Votre offre doit être d'au moins ${minimumRequired.toLocaleString()} Ar`,
        variant: "destructive"
      })
      return
    }

    try {
      await onPlaceBid(bidAmount, message)
      setMessage('')
      setBidAmount(getMinimumBid())
      setShowBidModal(false)
      toast({
        title: "Offre placée !",
        description: `Votre offre de ${bidAmount.toLocaleString()} Ar a été enregistrée`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de placer votre offre",
        variant: "destructive"
      })
    }
  }

  const minimumRequired = getMinimumBid()
  const suggestedBids = [
    minimumRequired,
    minimumRequired + 5000,
    minimumRequired + 10000,
    minimumRequired + 20000
  ]

  return (
    <div className="space-y-4">
      {/* Version compacte */}
      <div className="border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Hammer className="h-4 w-4 text-orange-600" />
            <span className="font-semibold text-orange-700">Enchère en cours</span>
          </div>
          <Badge 
            className={cn(
              "text-xs",
              isEnded 
                ? "bg-gray-100 text-gray-600 border-gray-300" 
                : "animate-pulse bg-orange-100 text-orange-800 border-orange-300"
            )}
          >
            <Clock className="h-3 w-3 mr-1" />
            {timeRemaining}
          </Badge>
        </div>

        {/* Informations compactes */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-md p-2 border border-orange-200">
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-gray-600">Offre actuelle</span>
            </div>
            <div className="text-sm font-bold text-orange-600">
              {product.currentHighestBid 
                ? `${product.currentHighestBid.toLocaleString()} Ar`
                : 'Aucune offre'
              }
            </div>
          </div>

          <div className="bg-white rounded-md p-2 border border-orange-200">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-gray-600">
                {product.minimumBid ? 'Mise minimum' : 'Offre minimum'}
              </span>
            </div>
            <div className="text-sm font-bold text-blue-600">
              {minimumRequired.toLocaleString()} Ar
            </div>
          </div>
        </div>

        {/* Bouton pour ouvrir le modal */}
        {!isEnded ? (
          <Button
            onClick={handleBidClick}
            disabled={status === 'loading'}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {!session ? (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Se connecter pour enchérir
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Enchérir maintenant
              </>
            )}
          </Button>
        ) : (
          <Alert className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Cette enchère est terminée.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Modal d'enchère */}
      <Dialog open={showBidModal} onOpenChange={setShowBidModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hammer className="h-5 w-5 text-orange-600" />
              Placer une offre
            </DialogTitle>
            <DialogDescription>
              {product.name} - Enchère se termine dans {timeRemaining}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informations actuelles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Offre actuelle</div>
                <div className="text-lg font-bold text-orange-600">
                  {product.currentHighestBid 
                    ? `${product.currentHighestBid.toLocaleString()} Ar`
                    : 'Aucune'
                  }
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Minimum requis</div>
                <div className="text-lg font-bold text-blue-600">
                  {minimumRequired.toLocaleString()} Ar
                </div>
              </div>
            </div>

            {/* Formulaire d'offre */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="bidAmount" className="text-sm font-medium">
                  Votre montant (Ar)
                </Label>
                <Input
                  id="bidAmount"
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  min={minimumRequired}
                  step="1000"
                  className="text-lg font-semibold"
                  disabled={loading}
                />
              </div>

              {/* Boutons d'offre rapide */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBidAmount(minimumRequired + 5000)}
                  disabled={loading}
                  className="flex-1"
                >
                  +5k
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBidAmount(minimumRequired + 10000)}
                  disabled={loading}
                  className="flex-1"
                >
                  +10k
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBidAmount(minimumRequired + 20000)}
                  disabled={loading}
                  className="flex-1"
                >
                  +20k
                </Button>
              </div>

              <div>
                <Label htmlFor="bidMessage" className="text-sm font-medium">
                  Message (optionnel)
                </Label>
                <Textarea
                  id="bidMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ajoutez un message..."
                  rows={2}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBidModal(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handlePlaceBid}
              disabled={loading || bidAmount < minimumRequired}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {loading ? (
                "Placement..."
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Placer {bidAmount.toLocaleString()} Ar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert de connexion requise */}
      <Dialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-blue-600" />
              Connexion requise
            </DialogTitle>
            <DialogDescription>
              Vous devez être connecté pour participer aux enchères.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Seuls les clients connectés peuvent placer des offres. 
                Cela nous permet de vérifier votre identité et de sécuriser les transactions.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLoginAlert(false)}
            >
              Annuler
            </Button>
            <Link href="/auth/signin">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <LogIn className="h-4 w-4 mr-2" />
                Se connecter
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}