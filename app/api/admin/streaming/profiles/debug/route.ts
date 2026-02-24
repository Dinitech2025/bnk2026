import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Vérifiez le nombre total de profils dans la base de données
    const totalCount = await prisma.accountProfile.count();
    
    // 2. Récupérez les 50 premiers profils uniquement avec leurs ID, slotId et accountId
    const rawProfiles = await prisma.accountProfile.findMany({
      take: 50,
      select: {
        id: true,
        profileSlot: true,
        accountId: true,
        name: true
      }
    });
    
    // 3. Récupérez tous les comptes pour savoir combien il y en a
    const accountCount = await prisma.account.count();
    
    // 4. Vérifiez si les relations sont correctes en comptant les profils par compte
    const profilesPerAccountRaw = await prisma.$queryRaw`
      SELECT "accountId", COUNT(*) as "profileCount"
      FROM "AccountProfile"
      GROUP BY "accountId"
    `;
    
    // Convertir les BigInt en numbers pour éviter l'erreur de sérialisation JSON
    const profilesPerAccount = (profilesPerAccountRaw as any[]).map(item => ({
      accountId: item.accountId,
      profileCount: Number(item.profileCount) // Convertir BigInt en number
    }));
    
    // 5. Renvoyez toutes les informations de débogage
    return NextResponse.json({
      success: true,
      debug: {
        totalAccountProfiles: totalCount,
        totalAccounts: accountCount,
        sampleProfiles: rawProfiles,
        profilesPerAccount: profilesPerAccount
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données de débogage:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des données de débogage',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 