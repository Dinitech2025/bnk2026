import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const data = await request.json()
    
    const pricingRule = await prisma.pricingRule.update({
      where: { id: params.id },
      data: {
        deliveryMethodId: data.deliveryMethodId,
        deliveryZoneId: data.deliveryZoneId,
        weightRanges: data.weightRanges,
        volumeRanges: data.volumeRanges,
        fixedPrice: data.fixedPrice,
        freeShippingThreshold: data.freeShippingThreshold,
        isActive: data.isActive
      },
      include: {
        deliveryMethod: true,
        deliveryZone: true
      }
    })

    return NextResponse.json(pricingRule)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la règle de tarification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la règle de tarification' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    await prisma.pricingRule.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression de la règle de tarification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la règle de tarification' },
      { status: 500 }
    )
  }
}
