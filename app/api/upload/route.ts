import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      console.log('Erreur d\'authentification:', session)
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Récupérer le fichier et le type de média de la requête
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const type = formData.get('type') as string || 'general'

    console.log('Type de média reçu:', type)
    console.log('Nombre de fichiers:', files.length)

    if (!files || files.length === 0) {
      console.log('Aucun fichier fourni')
      return new NextResponse(
        JSON.stringify({ error: 'Aucun fichier fourni' }),
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      console.log('Traitement du fichier:', file.name, 'Taille:', file.size, 'Type:', file.type)

      // Vérifier le type de fichier selon le contexte
      let isValidFile = false
      
      if (type === 'quote' || type === 'general') {
        // Pour les devis, accepter plus de types de fichiers
        const isValidImageType = file.type.startsWith('image/')
        const isValidVideoType = file.type.startsWith('video/')
        const isValidDocumentType = file.type.includes('pdf') || 
                                   file.type.includes('word') || 
                                   file.type.includes('text') ||
                                   !!file.name.toLowerCase().match(/\.(pdf|doc|docx|txt)$/)
        
        isValidFile = isValidImageType || isValidVideoType || isValidDocumentType
      } else {
        // Pour les autres types (admin uniquement)
        if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
          return new NextResponse(
            JSON.stringify({ error: 'Non autorisé pour ce type d\'upload' }),
            { status: 403 }
          )
        }
        
        const isValidImageType = file.type.startsWith('image/') || 
                                file.type === 'image/x-icon' || 
                                file.type === 'image/vnd.microsoft.icon' ||
                                file.name.toLowerCase().endsWith('.ico')
        
        const isValidVideoType = file.type.startsWith('video/') ||
                                !!file.name.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv)$/)
        
        isValidFile = isValidImageType || isValidVideoType
      }
      
      if (!isValidFile) {
        console.log('Type de fichier invalide:', file.type, 'Nom:', file.name)
        return new NextResponse(
          JSON.stringify({ error: `Le fichier ${file.name} n'est pas d'un type autorisé` }),
          { status: 400 }
        )
      }

      // Vérifier la taille du fichier (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return new NextResponse(
          JSON.stringify({ error: `Le fichier ${file.name} est trop volumineux (max 10MB)` }),
          { status: 400 }
        )
      }

      // Convertir le fichier en buffer
      const buffer = Buffer.from(await file.arrayBuffer())
      console.log('Buffer créé, taille:', buffer.length)

      // Déterminer le type de ressource
      const isVideo = file.type.startsWith('video/')
      const isDocument = file.type.includes('pdf') || file.type.includes('word') || file.type.includes('text')
      
      let resourceType = 'auto'
      if (isVideo) resourceType = 'video'
      else if (isDocument) resourceType = 'raw'

      // Configurer les options d'upload selon le type de média
      const uploadOptions: any = {
        resource_type: resourceType,
      }

      switch (type) {
        case 'quote':
          uploadOptions.folder = 'bnk/quotes'
          // Pas de transformation pour les documents de devis
          break
        case 'profile':
          uploadOptions.folder = 'bnk/profiles'
          if (!isVideo) {
            uploadOptions.transformation = [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' }
            ]
          }
          break
        case 'product':
          uploadOptions.folder = 'bnk/products'
          if (isVideo) {
            uploadOptions.eager = [
              { width: 800, height: 800, crop: 'fill', format: 'jpg', resource_type: 'image' }
            ]
          } else {
            uploadOptions.transformation = [
              { width: 800, height: 800, crop: 'fill' }
            ]
          }
          break
        case 'service':
          uploadOptions.folder = 'bnk/services'
          if (isVideo) {
            uploadOptions.eager = [
              { width: 1200, crop: 'scale', format: 'jpg', resource_type: 'image' }
            ]
          } else {
            uploadOptions.transformation = [
              { width: 1200, crop: 'scale' }
            ]
          }
          break
        case 'offer':
          uploadOptions.folder = 'bnk/offers'
          if (isVideo) {
            uploadOptions.eager = [
              { width: 1200, height: 630, crop: 'fill', format: 'jpg', resource_type: 'image' }
            ]
          } else {
            uploadOptions.transformation = [
              { width: 1200, height: 630, crop: 'fill' }
            ]
          }
          break
        case 'logo':
          uploadOptions.folder = 'bnk/logos'
          if (file.name.toLowerCase().endsWith('.ico') || file.type === 'image/x-icon') {
            uploadOptions.resource_type = 'raw'
            uploadOptions.format = 'ico'
          } else {
            uploadOptions.transformation = [
              { width: 500, height: 500, crop: 'fit', background: 'transparent' }
            ]
          }
          break
        case 'favicon':
          uploadOptions.folder = 'bnk/favicons'
          uploadOptions.resource_type = 'raw'
          if (file.name.toLowerCase().endsWith('.ico')) {
            uploadOptions.format = 'ico'
          }
          break
        default:
          uploadOptions.folder = 'bnk/general'
          if (isVideo) {
            uploadOptions.eager = [
              { width: 800, height: 600, crop: 'fill', format: 'jpg', resource_type: 'image' }
            ]
          }
      }

      console.log('Options d\'upload:', uploadOptions)

      // Upload vers Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Erreur Cloudinary:', error)
              reject(error)
            } else {
              console.log('Upload réussi:', result)
              resolve(result)
            }
          }
        )

        uploadStream.end(buffer)
      })

      const cloudinaryResult = result as any
      uploadedFiles.push(cloudinaryResult.secure_url)
    }

    // Préparer la réponse
    const response = {
      success: true,
      urls: uploadedFiles,
      count: uploadedFiles.length
    }

    console.log('Réponse finale:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur détaillée lors du téléchargement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement du fichier' },
      { status: 500 }
    )
  }
} 