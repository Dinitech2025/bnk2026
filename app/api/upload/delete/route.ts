import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Récupérer l'URL ou l'ID public de l'image à supprimer
    const { imageUrl } = await request.json()
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de l\'image manquante' },
        { status: 400 }
      )
    }

    // Extraire l'ID public de l'URL Cloudinary
    let publicId = null
    try {
      // Format attendu: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[id].[ext]
      const urlParts = imageUrl.split('/')
      // Extraire la partie après 'upload/'
      const uploadIndex = urlParts.findIndex((part: string) => part === 'upload')
      if (uploadIndex !== -1) {
        // Récupérer toutes les parties après 'upload', en excluant la version (v1234...)
        const relevantParts = urlParts.slice(uploadIndex + 2)
        // Retirer l'extension du dernier élément (.jpg, .png, etc.)
        const lastPart = relevantParts[relevantParts.length - 1]
        relevantParts[relevantParts.length - 1] = lastPart.split('.')[0]
        // Joindre les parties pour former l'ID public
        publicId = relevantParts.join('/')
      }
    } catch (error) {
      console.error('Erreur lors de l\'extraction de l\'ID public:', error)
    }

    if (!publicId) {
      return NextResponse.json(
        { error: 'Impossible d\'extraire l\'ID public de l\'image' },
        { status: 400 }
      )
    }

    // Supprimer l'image de Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            console.error('Erreur Cloudinary:', error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      )
    })

    // Vérifier le résultat
    if (result.result !== 'ok') {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'image', details: result },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Image supprimée avec succès',
      publicId
    })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'image' },
      { status: 500 }
    )
  }
} 