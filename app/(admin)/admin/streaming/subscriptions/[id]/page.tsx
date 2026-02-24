import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscriptionActions } from './subscription-actions'
import { formatDuration } from '@/lib/utils'
import { UserPlus, Trash, ShoppingCart, ExternalLink } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const subscription = await prisma.subscription.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: true,
      offer: true,
    },
  })

  if (!subscription) {
    return {
      title: 'Abonnement non trouvé',
    }
  }

  return {
    title: `Abonnement de ${subscription.user.firstName} ${subscription.user.lastName}`,
    description: `Détails de l'abonnement à l'offre ${subscription.offer.name}`,
  }
}

async function getSubscription(id: string) {
  const subscription = await prisma.subscription.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      offer: {
        select: {
          id: true,
          name: true,
          price: true,
          duration: true,
          durationUnit: true,
          maxProfiles: true,
        },
      },
      platformOffer: {
        include: {
          platform: {
            select: {
              id: true,
              name: true,
              logo: true,
              hasProfiles: true,
              maxProfilesPerAccount: true,
            },
          },
        },
      },
      subscriptionAccounts: {
        include: {
          account: {
            include: {
              accountProfiles: true,
              platform: true,
            },
          },
        },
      },
      Profile: {
        include: {
          account: {
            include: {
              platform: true,
            }
          },
        }
      },
      accountProfiles: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          currency: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
    },
  })

  if (!subscription) {
    notFound()
  }

  return subscription
}

export default async function SubscriptionPage({ params }: PageProps) {
  const subscription = await getSubscription(params.id)

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Détails de l'abonnement
          </h1>
          <SubscriptionActions subscription={{
            id: subscription.id,
            status: subscription.status,
            autoRenew: subscription.autoRenew,
            contactNeeded: subscription.contactNeeded,
            endDate: subscription.endDate.toISOString()
          }} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
              <CardDescription>Informations sur le client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="font-medium">Nom</div>
                  <div>{subscription.user.firstName} {subscription.user.lastName}</div>
                </div>
                <div>
                  <div className="font-medium">Email</div>
                  <div>{subscription.user.email}</div>
                </div>
                {subscription.user.phone && (
                  <div>
                    <div className="font-medium">Téléphone</div>
                    <div>{subscription.user.phone}</div>
      </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offre</CardTitle>
              <CardDescription>Détails de l'offre souscrite</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="font-medium">Nom de l'offre</div>
                  <div>{subscription.offer.name}</div>
                </div>
                <div>
                  <div className="font-medium">Prix</div>
                  <div>{Number(subscription.offer.price).toFixed(2)}€</div>
                </div>
                <div>
                  <div className="font-medium">Durée</div>
                  <div>{formatDuration(subscription.offer.duration, subscription.offer.durationUnit || "MONTH")}</div>
                </div>
                <div>
                  <div className="font-medium">Plateforme</div>
                  <div className="flex items-center gap-2">
                    {subscription.platformOffer?.platform.logo && (
                      <img
                        src={subscription.platformOffer.platform.logo}
                        alt={subscription.platformOffer.platform.name}
                        className="h-6 w-6 rounded"
                      />
                    )}
                    <span>{subscription.platformOffer?.platform.name}</span>
                  </div>
                </div>
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>État de l'abonnement</CardTitle>
              <CardDescription>Informations sur l'état actuel</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                <div>
                  <div className="font-medium">Statut</div>
                  <Badge variant={
                    subscription.status === 'ACTIVE' ? 'success' :
                    subscription.status === 'PENDING' ? 'warning' :
                    subscription.status === 'CONTACT_NEEDED' ? 'outline' :
                    subscription.status === 'EXPIRED' ? 'destructive' :
                    'secondary'
                  }>
                    {subscription.status === 'ACTIVE' ? 'Actif' :
                     subscription.status === 'PENDING' ? 'En attente' :
                     subscription.status === 'CONTACT_NEEDED' ? 'Client à contacter' :
                     subscription.status === 'EXPIRED' ? 'Expiré' :
                     subscription.status}
                  </Badge>
                  {subscription.contactNeeded && (
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-yellow-50">Client à rappeler</Badge>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">Date de début</div>
                  <div>{format(subscription.startDate, 'dd MMMM yyyy', { locale: fr })}</div>
                </div>
                <div>
                  <div className="font-medium">Date de fin</div>
                  <div>{format(subscription.endDate, 'dd MMMM yyyy', { locale: fr })}</div>
                </div>
                <div>
                  <div className="font-medium">Renouvellement automatique</div>
                  <div>{subscription.autoRenew ? 'Oui' : 'Non'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commande associée */}
          {subscription.order && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Commande associée
                </CardTitle>
                <CardDescription>Informations sur la commande d'origine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {subscription.order.orderNumber || `#${subscription.order.id.substring(0, 8)}`}
                        </span>
                        <Badge variant={
                          subscription.order.status === 'PAID' ? 'default' :
                          subscription.order.status === 'PENDING' ? 'secondary' :
                          subscription.order.status === 'CANCELLED' ? 'destructive' :
                          'outline'
                        }>
                          {subscription.order.status === 'PAID' ? 'Payée' :
                           subscription.order.status === 'PENDING' ? 'En attente' :
                           subscription.order.status === 'CANCELLED' ? 'Annulée' :
                           subscription.order.status}
                        </Badge>
                        <Badge variant={
                          subscription.order.paymentStatus === 'PAID' ? 'default' :
                          subscription.order.paymentStatus === 'PARTIALLY_PAID' ? 'secondary' :
                          'outline'
                        }>
                          {subscription.order.paymentStatus === 'PAID' ? 'Entièrement payé' :
                           subscription.order.paymentStatus === 'PARTIALLY_PAID' ? 'Partiellement payé' :
                           subscription.order.paymentStatus === 'PENDING' ? 'Paiement en attente' :
                           subscription.order.paymentStatus}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Créée le {format(subscription.order.createdAt, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-semibold">
                          {Number(subscription.order.total).toLocaleString('fr-FR')} {subscription.order.currency || 'Ar'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {subscription.order.user.firstName} {subscription.order.user.lastName}
                        </div>
                      </div>
                      <Link href={`/admin/orders/${subscription.order.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Compte et profils</CardTitle>
                  <CardDescription>Informations sur les comptes et profils assignés</CardDescription>
                </div>
                {subscription.platformOffer?.platform.hasProfiles && (
                  <Link href={`/admin/streaming/subscriptions/${subscription.id}/assign-profiles`}>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Gérer les profils
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {subscription.subscriptionAccounts.map((sa) => (
                  <div key={sa.id} className="space-y-2 border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      {sa.account.platform?.logo && (
                        <img 
                          src={sa.account.platform.logo} 
                          alt={sa.account.platform.name} 
                          className="h-6 w-6 rounded"
                        />
                      )}
                      <div className="font-medium">{sa.account.platform?.name || 'Plateforme'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Compte</div>
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        {sa.account.username || sa.account.email || `ID: ${sa.account.id.slice(0, 8)}`}
                      </div>
                    </div>
                  </div>
                ))}

                {subscription.platformOffer?.platform.hasProfiles && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="font-medium mb-2">Profils utilisés ({subscription.Profile.length}/{subscription.offer.maxProfiles})</div>
                    {subscription.Profile.length > 0 ? (
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                        {subscription.Profile.map((profile) => (
                          <div key={profile.id} className="bg-gray-50 p-3 rounded-md flex items-start justify-between">
                            <div>
                              <div className="font-medium">{profile.name || `Profil ${profile.profileSlot}`}</div>
                              <div className="text-xs text-gray-500">
                                {profile.account.platform.name} - Slot {profile.profileSlot}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 h-8 w-8 p-0"
                              asChild
                            >
                              <Link href={`/api/admin/streaming/subscriptions/${subscription.id}/profiles?profileId=${profile.id}`} prefetch={false}>
                                <Trash className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-yellow-600 bg-yellow-50 p-2 rounded text-sm">
                        Aucun profil n'a encore été assigné à cet abonnement.
                      </div>
                    )}
                    
                    {subscription.Profile.length < subscription.offer.maxProfiles && (
                      <div className="mt-4">
                        <Link href={`/admin/streaming/subscriptions/${subscription.id}/assign-profiles`}>
                          <Button size="sm" variant="outline" className="w-full">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assigner des profils ({subscription.offer.maxProfiles - subscription.Profile.length} disponible(s))
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            </div>
      </div>
    </div>
  )
} 
 
 
 