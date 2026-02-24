import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    
    // Supporter les deux formats: 'file' (singulier) et 'files' (pluriel)
    let files: File[] = []
    const singleFile = formData.get('file') as File
    const multipleFiles = formData.getAll('files') as File[]
    
    if (singleFile) {
      files = [singleFile]
    } else if (multipleFiles && multipleFiles.length > 0) {
      files = multipleFiles
    }
    
    const type = formData.get('type') as string || 'general'

    console.log('📁 FormData reçue:', {
      singleFile: singleFile ? singleFile.name : 'null',
      multipleFiles: multipleFiles.length,
      type,
      finalFilesCount: files.length
    })

    if (!files || files.length === 0) {
      console.error('❌ Aucun fichier fourni dans la requête')
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Import dynamique d'ImageKit
    const ImageKit = (await import('imagekit')).default

    const imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_ww3tp1IR2TWgySCwmbjiclv9auc=',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_KRAJobsgeMLRmi7FJNPVxXEVEvs=',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/q475ish3ih',
    })

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Déterminer le dossier selon le type
      let folder = 'bnk/general'
      switch (type) {
        case 'quote':
          folder = 'bnk/quotes'
          break
        case 'logo':
          folder = 'bnk/logos'
          break
        case 'favicon':
          folder = 'bnk/favicons'
          break
        case 'product':
          folder = 'bnk/products'
          break
        case 'service':
          folder = 'bnk/services'
          break
        default:
          folder = 'bnk/general'
      }

      return new Promise((resolve, reject) => {
        imagekit.upload({
          file: buffer,
          fileName: file.name,
          folder: folder,
          useUniqueFileName: true,
        }, (error, result) => {
          if (error) {
            console.error('Erreur ImageKit:', error)
            reject(error)
          } else {
            resolve(result?.url)
          }
        })
      })
    })

    const urls = await Promise.all(uploadPromises)
    const validUrls = urls.filter(Boolean)

    // Si un seul fichier, retourner l'URL directement (compatibilité avec les composants existants)
    if (files.length === 1 && validUrls.length === 1) {
      return NextResponse.json({ 
        url: validUrls[0],
        urls: validUrls,
        message: 'Fichier uploadé avec succès'
      })
    }

    // Pour plusieurs fichiers, retourner le format habituel
    return NextResponse.json({ 
      urls: validUrls,
      message: `${validUrls.length} fichier(s) uploadé(s) avec succès`
    })

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'upload des fichiers' 
    }, { status: 500 })
  }
}