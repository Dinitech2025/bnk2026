import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'

export function ContactInfo() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Informations de contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Téléphone</p>
              <p className="text-muted-foreground">+261 XX XX XXX XX</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground">contact@boutiknaka.com</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Adresse</p>
              <p className="text-muted-foreground">
                Antananarivo, Madagascar
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Heures d'ouverture</p>
              <p className="text-muted-foreground">
                Lundi - Vendredi : 8h00 - 18h00<br />
                Samedi : 9h00 - 16h00<br />
                Dimanche : Fermé
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <MessageCircle className="h-5 w-5" />
            Support en ligne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-3">
            Notre équipe est disponible pour vous aider en temps réel !
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-blue-600">Chat en ligne disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-blue-600">Réponse sous 2h en moyenne</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-blue-600">Support technique spécialisé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">
            💬 Messagerie instantanée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-3">
            Utilisez notre système de messagerie pour une communication directe avec notre équipe.
          </p>
          <div className="text-sm text-green-600 space-y-1">
            <p>• Questions sur les produits</p>
            <p>• Problèmes techniques</p>
            <p>• Suivi de commandes</p>
            <p>• Demandes spéciales</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
