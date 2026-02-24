// @ts-nocheck
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash, MapPin, ShoppingBag, Mail, Phone, Calendar, User, Briefcase, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface ClientPageProps {
  params: {
    id: string
  }
}

export default async function ClientPage({ params }: ClientPageProps) {
  // Vérifier que l'utilisateur est admin ou staff
  await requireStaff()

  // Récupérer les paramètres de devise
  const currencySettings = await db.setting.findMany({
    where: {
      key: {
        in: ['currency', 'currencySymbol']
      }
    }
  })
  
  const currency = currencySettings.find(s => s.key === 'currency')?.value || 'MGA'
  const currencySymbol = currencySettings.find(s => s.key === 'currencySymbol')?.value || 'Ar'

  // Récupérer le client par ID
  const client = await db.user.findUnique({
    where: {
      id: params.id,
      role: 'CLIENT'
    },
    include: {
      addresses: true,
      orders: {
        include: {
          items: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      subscriptions: {
            include: {
              offer: true
        }
      }
    }
  }) as any

  if (!client) {
    notFound()
  }

  // Calculer le montant total des commandes
  const totalSpent = client.orders
    .filter(order => order.status !== 'CANCELLED')
    .reduce((sum, order) => {
      // Convertir le Decimal en nombre (les montants sont déjà en Ariary)
      const orderTotal = order.total ? parseFloat(order.total.toString()) : 0
      return sum + orderTotal
    }, 0)

  // Formater les dates
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Non renseigné'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  // Déterminer le type de client
  const getCustomerTypeLabel = (type: string | null | undefined) => {
    if (!type) return 'Non défini'
    return type === 'INDIVIDUAL' ? 'Particulier' : 'Entreprise'
  }

  // Déterminer le genre
  const getGenderLabel = (gender: string | null | undefined) => {
    if (!gender) return 'Non renseigné'
    switch (gender) {
      case 'MALE': return 'Homme'
      case 'FEMALE': return 'Femme'
      case 'OTHER': return 'Autre'
      default: return 'Non renseigné'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/admin/clients" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Détails du client</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/admin/clients/${client.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
          <Link href={`/admin/clients/${client.id}/delete`}>
            <Button variant="destructive" size="sm">
              <Trash className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Informations principales du client */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-6">
          <h2 className="text-lg font-semibold mb-4">Informations du client</h2>
          <div className="flex items-center mb-6">
            {client.image ? (
              <img
                src={client.image}
                alt={client.name || ''}
                className="h-20 w-20 rounded-full mr-4"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
                {client.name?.charAt(0) || client.email?.charAt(0)?.toUpperCase() || client.phone?.charAt(0) || 'C'}
              </div>
            )}
            <div>
              <h3 className="text-xl font-medium">{client.name || 'Sans nom'}</h3>
              <p className="text-gray-600">{client.email || client.phone || 'Pas d\'email'}</p>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  client.customerType === 'BUSINESS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {getCustomerTypeLabel(client.customerType)}
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques du client */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Commandes</p>
              <p className="text-xl font-semibold">{client.orders.length}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Total dépensé</p>
                              <p className="text-xl font-semibold"><PriceWithConversion price={totalSpent} /></p>
            </div>
          </div>
          
          {/* Détails personnels */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Informations personnelles</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{client.firstName || 'Prénom'} {client.lastName || 'Nom'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">Né(e) le: {formatDate(client.birthDate)}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">Genre: {getGenderLabel(client.gender)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
              <div className="space-y-2">
                {client.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{client.email}</span>
                </div>
                )}
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{client.phone || 'Non renseigné'}</span>
                </div>
                  {(client as any).communicationMethod && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 mr-2">Moyen préféré:</span>
                      <span className="text-sm">
                        {(client as any).communicationMethod === 'EMAIL' && '📧 Email'}
                        {(client as any).communicationMethod === 'WHATSAPP' && `💬 WhatsApp${(client as any).whatsappNumber ? ` (${(client as any).whatsappNumber})` : ''}`}
                        {(client as any).communicationMethod === 'SMS' && '📱 SMS'}
                        {(client as any).communicationMethod === 'FACEBOOK' && `📘 Facebook${(client as any).facebookPage ? ` (${(client as any).facebookPage.replace(/_/g, ' ')})` : ''}`}
                        {(client as any).communicationMethod === 'TELEGRAM' && `📨 Telegram${(client as any).telegramUsername ? ` (${(client as any).telegramUsername})` : ''}`}
                      </span>
                    </div>
                  )}
              </div>
            </div>
            
            {client.customerType === 'BUSINESS' && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Informations professionnelles</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">Entreprise: {client.companyName || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">N° TVA: {client.vatNumber || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Préférences</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm">Langue: {client.preferredLanguage === 'fr' ? 'Français' : 'Anglais'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">Newsletter: {client.newsletter ? 'Inscrit' : 'Non inscrit'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Dates</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm">Inscription: {formatDate(client.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm">Dernière mise à jour: {formatDate(client.updatedAt)}</span>
                </div>
              </div>
            </div>
            
            {client.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Adresses */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Adresses</h2>
            <Link href={`/admin/clients/${client.id}/edit`}>
              <Button size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Gérer les adresses
              </Button>
            </Link>
          </div>
          {client.addresses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {client.addresses.map((address) => (
                <div key={address.id} className="border rounded-md p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">{address.type}</p>
                        <p className="text-sm text-gray-600">{address.street}</p>
                        <p className="text-sm text-gray-600">
                          {address.zipCode} {address.city}, {address.country}
                        </p>
                        {(address as any).phoneNumber && (
                          <p className="text-sm text-gray-600 mt-1">
                            Tél: {(address as any).phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    {address.isDefault && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Par défaut
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucune adresse enregistrée</p>
          )}
        </div>

        {/* Commandes récentes */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Commandes récentes</h2>
            <Link href={`/admin/orders?userId=${client.id}`}>
              <Button variant="outline" size="sm">
                Voir toutes les commandes
              </Button>
            </Link>
          </div>
          {client.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Numéro</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Articles</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {client.orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm"><PriceWithConversion price={parseFloat(order.total.toString())} /></td>
                      <td className="px-4 py-3 text-sm">{order.items.length}</td>
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Aucune commande</p>
          )}
        </div>

        {/* Abonnements */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-12">
          <h2 className="text-lg font-semibold mb-4">Abonnements</h2>
          {client.subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Offre</th>
                    <th className="px-4 py-3">Début</th>
                    <th className="px-4 py-3">Fin</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Renouvellement auto</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {client.subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {subscription.offer.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            subscription.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : subscription.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : subscription.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {subscription.autoRenew ? 'Oui' : 'Non'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/admin/streaming/subscriptions/${subscription.id}`} className="text-primary hover:underline">
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Aucun abonnement</p>
          )}
        </div>
      </div>
    </div>
  )
} 