'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Mail, Home, ShoppingBag, Copy, User, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'

interface LastOrder {
  orderNumber: string
  orderId: string
  customerEmail?: string
  accountCreated?: boolean
  userLoggedIn?: boolean
}

export default function OrderSuccessPage() {
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null)

  useEffect(() => {
    // Déclencher l'événement de mise à jour du panier pour vider le compteur
    window.dispatchEvent(new Event('cartUpdated'))
    
    // Récupérer les informations de la dernière commande
    const savedOrder = localStorage.getItem('lastOrder')
    if (savedOrder) {
      setLastOrder(JSON.parse(savedOrder))
      // Nettoyer après récupération
      localStorage.removeItem('lastOrder')
    }
  }, [])

  const copyOrderNumber = () => {
    if (lastOrder?.orderNumber) {
      navigator.clipboard.writeText(lastOrder.orderNumber)
      toast({
        title: "Copié !",
        description: "Le numéro de commande a été copié dans le presse-papiers",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Icône de succès */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Message de succès */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-green-600">Commande confirmée !</h1>
          <p className="text-gray-600 text-lg">
            Merci pour votre commande. Nous avons bien reçu votre demande et nous la traitons actuellement.
          </p>
          
          {/* Numéro de commande */}
          {lastOrder && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-2">Votre numéro de commande :</p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl font-bold text-green-800">{lastOrder.orderNumber}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyOrderNumber}
                  className="text-green-600 hover:text-green-800"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Conservez ce numéro pour le suivi de votre commande
              </p>
              
              {/* Email de confirmation */}
              {lastOrder.customerEmail && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-xs text-green-600">
                    Confirmation envoyée à : <span className="font-medium">{lastOrder.customerEmail}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Information de création de compte */}
        {lastOrder?.accountCreated && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-blue-900">Compte client créé !</p>
                  <p className="text-sm text-blue-700">
                    Un compte a été automatiquement créé avec votre email ({lastOrder.customerEmail}). 
                    Vous pouvez maintenant suivre vos commandes et gérer vos informations.
                  </p>
                  <div className="mt-2">
                    <Link href="/auth/login">
                      <Button variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                        <User className="w-4 h-4 mr-2" />
                        Se connecter à mon compte
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Mail className="w-5 h-5 mr-2" />
              Prochaines étapes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium">Confirmation par email</p>
                  <p className="text-sm text-gray-600">
                    Vous recevrez un email de confirmation avec les détails de votre commande dans les prochaines minutes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium">Traitement de la commande</p>
                  <p className="text-sm text-gray-600">
                    Notre équipe traite votre commande et prépare vos produits/abonnements.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium">Livraison des accès</p>
                  <p className="text-sm text-gray-600">
                    Pour les abonnements : vous recevrez les détails de connexion par email après validation du paiement.
                  </p>
                </div>
              </div>
              
              {lastOrder?.accountCreated && (
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <p className="font-medium">Accès à votre compte</p>
                    <p className="text-sm text-gray-600">
                      Connectez-vous à votre nouveau compte pour suivre vos commandes et gérer vos informations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Note importante pour les abonnements */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-amber-900">Abonnements streaming</p>
                <p className="text-sm text-amber-700">
                  Vos profils sont réservés et seront activés dès la confirmation du paiement. 
                  Vous recevrez toutes les informations de connexion par email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          {lastOrder?.accountCreated ? (
            <Link href="/profile">
              <Button className="w-full sm:w-auto">
                <User className="w-4 h-4 mr-2" />
                Mon compte
              </Button>
            </Link>
          ) : (
            <Link href="/products">
              <Button className="w-full sm:w-auto">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continuer mes achats
              </Button>
            </Link>
          )}
        </div>

        {/* Contact */}
        <div className="text-sm text-gray-500 space-y-2">
          <p>Une question sur votre commande ?</p>
          <div className="flex justify-center space-x-4">
            <Link href="/contact" className="text-blue-600 hover:text-blue-800">
              Nous contacter
            </Link>
            <span>•</span>
            <Link href="mailto:support@boutiknaka.com" className="text-blue-600 hover:text-blue-800">
              support@boutiknaka.com
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 