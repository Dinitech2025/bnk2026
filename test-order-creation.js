// Script de test pour la création et la récupération des commandes
async function test() {
  try {
    console.log('1. Création d\'une commande de test...');
    
    // Obtenez d'abord un utilisateur valide
    const usersResponse = await fetch('http://localhost:3000/api/admin/users');
    const users = await usersResponse.json();
    
    if (!users || users.length === 0) {
      console.error('Aucun utilisateur trouvé pour tester!');
      return;
    }
    
    const testUser = users[0];
    
    // Créer une commande de test simple
    const orderData = {
      userId: testUser.id,
      status: 'PENDING',
      items: [
        {
          itemType: 'PRODUCT',
          productId: 'clk2vk6m40007ckhnc6g41j5g', // Remplacez par un ID de produit valide si nécessaire
          quantity: 1,
          unitPrice: 29.99,
          totalPrice: 29.99
        }
      ]
    };
    
    const createResponse = await fetch('http://localhost:3000/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('Erreur lors de la création de la commande:', errorData);
      return;
    }
    
    const createdOrder = await createResponse.json();
    console.log('Commande créée avec succès:', createdOrder.id);
    
    // Attendre un moment pour s'assurer que les données sont persistées
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Récupérer les commandes pour vérifier
    console.log('2. Récupération des commandes...');
    const ordersResponse = await fetch('http://localhost:3000/api/admin/orders');
    const orders = await ordersResponse.json();
    
    console.log(`Nombre de commandes trouvées: ${orders.length}`);
    
    // Vérifier si notre commande est présente
    const foundOrder = orders.find(order => order.id === createdOrder.id);
    if (foundOrder) {
      console.log('La commande créée a été trouvée dans la liste!');
    } else {
      console.error('ERREUR: La commande créée n\'a pas été trouvée dans la liste récupérée!');
    }
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

// Exécuter le test
test(); 