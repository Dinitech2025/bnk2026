import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://100.70.249.11:9000',
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.MINIO_SECRET_KEY || '',
  },
  forcePathStyle: true,
})

const BUCKET = process.env.MINIO_BUCKET || 'bnk2026'
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://100.70.249.11:9000'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    
    let files: File[] = []
    const singleFile = formData.get('file') as File
    const multipleFiles = formData.getAll('files') as File[]
    
    if (singleFile) {
      files = [singleFile]
    } else if (multipleFiles && multipleFiles.length > 0) {
      files = multipleFiles
    }
    
    const type = formData.get('type') as string || 'general'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer()
      let buffer = Buffer.from(bytes)

      // Optimiser les images avec sharp
      if (file.type.startsWith('image/')) {
        buffer = await sharp(buffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer()
      }

      // Déterminer le dossier selon le type
      let folder = 'general'
      switch (type) {
        case 'quote': folder = 'quotes'; break
        case 'logo': folder = 'logos'; break
        case 'favicon': folder = 'favicons'; break
        case 'product': folder = 'products'; break
        case 'service': folder = 'services'; break
        default: folder = 'general'
      }

      const ext = file.name.split('.').pop() || 'webp'
      const key = `${folder}/${uuidv4()}.${ext}`

      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type.startsWith('image/') ? 'image/webp' : file.type,
      }))

      return `${PUBLIC_URL}/${BUCKET}/${key}`
    })

    const urls = await Promise.all(uploadPromises)

    if (files.length === 1 && urls.length === 1) {
      return NextResponse.json({ 
        url: urls[0],
        urls: urls,
        message: 'Fichier uploadé avec succès'
      })
    }

    return NextResponse.json({ 
      urls: urls,
      message: `${urls.length} fichier(s) uploadé(s) avec succès`
    })

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'upload des fichiers' 
    }, { status: 500 })
  }
}