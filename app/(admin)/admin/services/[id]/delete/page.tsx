import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface DeleteServicePageProps {
  params: {
    id: string
  }
}

async function getService(id: string) {
  return await prisma.service.findUnique({
    where: { id },
    include: {
      images: {
        select: {
          path: true
        }
      }
    }
  })
}

// Récupérer les paramètres de devise depuis la base de données
async function getCurrencySettings() {
  const currencySettings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['currency', 'currencySymbol']
      }
    }
  })
  
  const settings: Record<string, string> = {}
  currencySettings.forEach(setting => {
    settings[setting.key] = setting.value || ''
  })
  
  return {
    currency: settings.currency || 'EUR',
    currencySymbol: settings.currencySymbol || '€'
  }
}

export default async function DeleteServicePage({ params }: DeleteServicePageProps) {
  const service = await getService(params.id)
  const { currency, currencySymbol } = await getCurrencySettings()
  
  // Fonction pour formater les prix avec la devise de l'application
  const formatServicePrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} ${currencySymbol}`
  }

  if (!service) {
    notFound()
  }

  async function onDelete() {
    'use server'
    
    await prisma.service.delete({
      where: { id: params.id }
    })

    revalidatePath('/admin/services')
    redirect('/admin/services')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Supprimer le service</h1>
        <p className="text-sm text-gray-500">
          Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <h2 className="font-medium">Nom du service</h2>
            <p className="text-gray-600">{service.name}</p>
          </div>
          {service.description && (
            <div>
              <h2 className="font-medium">Description</h2>
              <p className="text-gray-600">{service.description}</p>
            </div>
          )}
          <div>
            <h2 className="font-medium">Prix</h2>
            <p className="text-gray-600">
              <PriceWithConversion price={Number(service.price)} />
            </p>
          </div>
          <div>
            <h2 className="font-medium">Durée</h2>
            <p className="text-gray-600">{service.duration} minutes</p>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <form action={onDelete}>
            <Button variant="destructive">
              Supprimer
            </Button>
          </form>
          <Link href="/admin/services">
            <Button variant="outline">
              Annuler
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 