import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Edit, ArrowLeft, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import Link from 'next/link'
import Image from 'next/image'

interface ProductPageProps {
  params: {
    id: string
  }
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      images: true,
      variations: {
        include: {
          attributes: true,
          images: true
        }
      },
      attributes: true
    }
  })

  if (!product) {
    notFound()
  }

  return product
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/products/${product.id}/variations`}>
            <Button variant="outline">
              <Layers className="h-4 w-4 mr-2" />
              Gérer les variations
            </Button>
          </Link>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Images du produit</h2>
          {product.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map(image => (
                <div key={image.id} className="relative aspect-square">
                  <Image
                    src={image.path}
                    alt={image.alt || ''}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune image</p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Informations générales</h2>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Référence (SKU)</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.sku || 'Non défini'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Code-barres</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.barcode || 'Non défini'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Catégorie</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.category?.name || 'Non catégorisé'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.description || 'Aucune description'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Prix et stock</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Prix de vente</dt>
              <dd className="mt-1 text-sm text-gray-900"><PriceWithConversion price={Number(product.price)} /></dd>
            </div>
            {product.compareAtPrice && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Prix barré</dt>
                <dd className="mt-1 text-sm text-gray-900"><PriceWithConversion price={Number(product.compareAtPrice)} /></dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Stock</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.inventory > 10 
                    ? 'bg-green-100 text-green-800'
                    : product.inventory > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {product.inventory} en stock
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Statut</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.published
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.published ? 'Publié' : 'Non publié'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Attributs du produit</h2>
          {product.attributes.length > 0 ? (
            <dl className="grid grid-cols-2 gap-4">
              {product.attributes.map(attr => (
                <div key={attr.id}>
                  <dt className="text-sm font-medium text-gray-500">{attr.name}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{attr.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Aucun attribut défini</p>
          )}
        </div>

        {product.variations.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Variations du produit</h2>
            <div className="space-y-4">
              {product.variations.map(variation => (
                <div key={variation.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">SKU</dt>
                      <dd className="mt-1 text-sm text-gray-900">{variation.sku || 'Non défini'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Prix</dt>
                      <dd className="mt-1 text-sm text-gray-900"><PriceWithConversion price={Number(variation.price)} /></dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Stock</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          variation.inventory > 10 
                            ? 'bg-green-100 text-green-800'
                            : variation.inventory > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {variation.inventory} en stock
                        </span>
                      </dd>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Attributs</h3>
                    <dl className="grid grid-cols-2 gap-2">
                      {variation.attributes.map(attr => (
                        <div key={attr.id}>
                          <dt className="text-sm font-medium text-gray-500">{attr.name}</dt>
                          <dd className="mt-1 text-sm text-gray-900">{attr.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {variation.images.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Images</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {variation.images.map(image => (
                          <div key={image.id} className="relative aspect-square">
                            <Image
                              src={image.path}
                              alt={image.alt || ''}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 