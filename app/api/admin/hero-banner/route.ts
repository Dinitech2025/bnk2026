import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 GET /api/admin/hero-banner - Récupération de la bannière...')
    
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      console.log('❌ Accès refusé - utilisateur non admin')
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await prisma.$connect()
    console.log('✅ Connexion Prisma établie')

    const heroBanner = await prisma.heroBanner.findFirst({
      where: { isActive: true },
      include: {
        backgroundImages: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('📊 Bannière trouvée:', heroBanner?.id || 'Aucune')

    if (!heroBanner) {
      // Créer une bannière par défaut si aucune n'existe
      const defaultBanner = await prisma.heroBanner.create({
        data: {}
      })
      console.log('✅ Bannière par défaut créée:', defaultBanner.id)
      return NextResponse.json(defaultBanner)
    }

    return NextResponse.json(heroBanner)
  } catch (error) {
    console.error('❌ Erreur GET hero-banner:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la bannière' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    console.log('🔄 PUT /api/admin/hero-banner - Mise à jour de la bannière...')
    
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      console.log('❌ Accès refusé - utilisateur non admin')
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    console.log('📝 Données reçues:', {
      title: body.title,
      subtitle: body.subtitle,
      hasImage: !!body.backgroundImage
    })

    await prisma.$connect()

    // Trouver la bannière active ou créer une nouvelle
    let heroBanner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })

    if (heroBanner) {
      // Mettre à jour la bannière existante
      heroBanner = await prisma.heroBanner.update({
        where: { id: heroBanner.id },
        data: {
          title: body.title,
          subtitle: body.subtitle,
          description: body.description,
          backgroundImage: body.backgroundImage,
          primaryButtonText: body.primaryButtonText,
          primaryButtonLink: body.primaryButtonLink,
          secondaryButtonText: body.secondaryButtonText,
          secondaryButtonLink: body.secondaryButtonLink,
          titleColor: body.titleColor,
          subtitleColor: body.subtitleColor,
          descriptionColor: body.descriptionColor,
          primaryButtonColor: body.primaryButtonColor,
          primaryButtonBg: body.primaryButtonBg,
          secondaryButtonColor: body.secondaryButtonColor,
          secondaryButtonBg: body.secondaryButtonBg,
          secondaryButtonBorder: body.secondaryButtonBorder,
          backgroundBlur: body.backgroundBlur,
          backgroundOpacity: body.backgroundOpacity,
        }
      })
      console.log('✅ Bannière mise à jour:', heroBanner.id)
    } else {
      // Créer une nouvelle bannière
      heroBanner = await prisma.heroBanner.create({
        data: {
          title: body.title,
          subtitle: body.subtitle,
          description: body.description,
          backgroundImage: body.backgroundImage,
          primaryButtonText: body.primaryButtonText,
          primaryButtonLink: body.primaryButtonLink,
          secondaryButtonText: body.secondaryButtonText,
          secondaryButtonLink: body.secondaryButtonLink,
          titleColor: body.titleColor,
          subtitleColor: body.subtitleColor,
          descriptionColor: body.descriptionColor,
          primaryButtonColor: body.primaryButtonColor,
          primaryButtonBg: body.primaryButtonBg,
          secondaryButtonColor: body.secondaryButtonColor,
          secondaryButtonBg: body.secondaryButtonBg,
          secondaryButtonBorder: body.secondaryButtonBorder,
          backgroundBlur: body.backgroundBlur,
          backgroundOpacity: body.backgroundOpacity,
        }
      })
      console.log('✅ Nouvelle bannière créée:', heroBanner.id)
    }

    // Gestion des images du diaporama
    if (body.backgroundImages && Array.isArray(body.backgroundImages)) {
      console.log('📋 Mise à jour des images du diaporama:', body.backgroundImages.length)
      
      // Supprimer les anciennes images
      await prisma.heroBannerImage.deleteMany({
        where: { heroBannerId: heroBanner.id }
      })
      
      // Ajouter les nouvelles images
      for (const [index, image] of body.backgroundImages.entries()) {
        if (image.imageUrl && image.imageUrl.trim()) {
          await prisma.heroBannerImage.create({
            data: {
              heroBannerId: heroBanner.id,
              imageUrl: image.imageUrl,
              title: image.title || `Image ${index + 1}`,
              description: image.description || '',
              order: index + 1,
              isActive: true
            }
          })
        }
      }
      console.log('✅ Images du diaporama mises à jour')
    }

    return NextResponse.json(heroBanner)
  } catch (error) {
    console.error('❌ Erreur PUT hero-banner:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la bannière' },
      { status: 500 }
    )
  }
}
