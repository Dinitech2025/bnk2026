import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

type UploadType = 'product' | 'service' | 'profile' | 'offer'

export async function uploadImage(file: File, type: UploadType = 'product'): Promise<string> {
  try {
    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Configurer les options d'upload selon le type
    const uploadOptions: any = {
      resource_type: 'auto',
    }

    switch (type) {
      case 'product':
        uploadOptions.folder = 'bnk/products'
        uploadOptions.transformation = [
          { width: 800, height: 800, crop: 'fill' }
        ]
        break
      case 'service':
        uploadOptions.folder = 'bnk/services'
        uploadOptions.transformation = [
          { width: 1200, crop: 'scale' }
        ]
        break
      case 'profile':
        uploadOptions.folder = 'bnk/profiles'
        uploadOptions.transformation = [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ]
        break
      case 'offer':
        uploadOptions.folder = 'bnk/offers'
        uploadOptions.transformation = [
          { width: 1200, height: 630, crop: 'fill' }
        ]
        break
    }

    // Upload vers Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      uploadStream.end(buffer)
    })

    return (result as any).secure_url
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
} 