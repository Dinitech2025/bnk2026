// Script pour tester l'authentification
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Vérification des utilisateurs admin...');
    
    // Chercher les utilisateurs admin
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'STAFF']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    });
    
    console.log('👥 Utilisateurs admin/staff trouvés:', adminUsers.length);
    
    if (adminUsers.length === 0) {
      console.log('❌ Aucun utilisateur admin trouvé !');
      console.log('🔧 Création d\'un utilisateur admin...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@boutiknaka.com',
          name: 'Administrateur',
          firstName: 'Admin',
          lastName: 'BoutikNaka',
          role: 'ADMIN',
          password: hashedPassword,
          customerType: 'EMPLOYEE'
        }
      });
      
      console.log('✅ Utilisateur admin créé:', adminUser.email);
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.name || 'Sans nom'}`);
      });
      
      // Tester le mot de passe du premier admin
      const firstAdmin = adminUsers[0];
      if (firstAdmin.password) {
        const isValidPassword = await bcrypt.compare('admin123', firstAdmin.password);
        console.log(`🔑 Mot de passe 'admin123' valide pour ${firstAdmin.email}:`, isValidPassword);
        
        if (!isValidPassword) {
          console.log('🔧 Mise à jour du mot de passe...');
          const hashedPassword = await bcrypt.hash('admin123', 10);
          await prisma.user.update({
            where: { id: firstAdmin.id },
            data: { password: hashedPassword }
          });
          console.log('✅ Mot de passe mis à jour');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth(); 