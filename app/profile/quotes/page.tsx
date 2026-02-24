import { Metadata } from 'next'
import { QuotesList } from '@/components/quotes/quotes-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Plus, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mes demandes de devis | BNK',
  description: 'Gérez vos demandes de devis et suivez leur progression',
}

export default function QuotesPage() {
  return (
    <div className="min-h-screen">
      {/* Section du haut avec container */}
      <div className="container mx-auto px-4 py-3">
        <div className="space-y-3">
          {/* En-tête avec actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white p-4 rounded-lg shadow-sm">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mes demandes de devis</h1>
              <p className="text-gray-600 text-sm mt-1">
                Gérez vos demandes de devis et suivez leur progression
              </p>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/services">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau devis
              </Link>
            </Button>
          </div>

          {/* Guide rapide pour les nouveaux utilisateurs */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
                <AlertCircle className="h-4 w-4" />
                Comment ça marche ?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">1</div>
                  <div>
                    <p className="font-medium text-blue-900 text-xs">Demandez un devis</p>
                    <p className="text-blue-700 text-xs">Choisissez un service et décrivez vos besoins</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">2</div>
                  <div>
                    <p className="font-medium text-blue-900 text-xs">Nous étudions</p>
                    <p className="text-blue-700 text-xs">Notre équipe analyse votre demande sous 24h</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">3</div>
                  <div>
                    <p className="font-medium text-blue-900 text-xs">Négociez</p>
                    <p className="text-blue-700 text-xs">Discutez et ajustez le prix selon vos besoins</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">4</div>
                  <div>
                    <p className="font-medium text-blue-900 text-xs">Confirmez</p>
                    <p className="text-blue-700 text-xs">Acceptez et ajoutez au panier</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des devis - Avec container aussi */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <QuotesList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 