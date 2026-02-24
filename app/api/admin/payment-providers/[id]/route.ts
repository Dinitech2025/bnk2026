import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    console.log('🔄 Mise à jour provider PayPal:', {
      providerId: id,
      settings: body.settings,
      apiEndpoint: body.apiEndpoint
    });

    // Mettre à jour le provider
    const updatedProvider = await prisma.paymentProvider.update({
      where: { id },
      data: {
        settings: body.settings,
        apiEndpoint: body.apiEndpoint,
        updatedAt: new Date()
      },
      include: {
        paymentMethod: true
      }
    });

    console.log('✅ Provider PayPal mis à jour:', updatedProvider.id);

    return NextResponse.json({
      success: true,
      provider: updatedProvider
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour provider:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du provider' },
      { status: 500 }
    );
  }
}