export interface ProductAttribute {
  id?: string
  name: string
  value: string
}

export interface ProductImage {
  id?: string
  path: string
  alt?: string
}

export interface ProductVariation {
  id?: string
  sku?: string
  price: number
  inventory: number
  attributes: ProductAttribute[]
  images: ProductImage[]
} 