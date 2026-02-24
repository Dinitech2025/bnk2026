const fetch = require('node-fetch')

async function testBannerSave() {
  try {
    console.log('🧪 Test de sauvegarde de bannière avec couleur overlay...')
    
    // Attendre que le serveur démarre
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    const testData = {
      title: 'Test Bannière',
      subtitle: 'Avec Overlay Coloré',
      description: 'Test de la nouvelle fonctionnalité',
      backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      primaryButtonText: 'Bouton Test',
      primaryButtonLink: '/test',
      secondaryButtonText: 'Secondaire',
      secondaryButtonLink: '/test2',
      titleColor: '#ff0000',
      subtitleColor: '#00ff00',
      descriptionColor: '#0000ff',
      primaryButtonColor: '#ffffff',
      primaryButtonBg: '#ff6600',
      secondaryButtonColor: '#000000',
      secondaryButtonBg: '#ffff00',
      secondaryButtonBorder: '#ff00ff',
      backgroundBlur: 5,
      backgroundOpacity: 80,
      backgroundOverlayColor: '#ff0066' // Rose vif pour test
    }
    
    const response = await fetch('http://localhost:3000/api/admin/hero-banner', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Bannière sauvegardée avec succès!')
      console.log('🎨 Couleur overlay:', result.backgroundOverlayColor)
      console.log('📊 ID:', result.id)
    } else {
      const error = await response.text()
      console.log('❌ Erreur lors de la sauvegarde:', response.status)
      console.log('📝 Détails:', error)
    }
    
  } catch (error) {
    console.error('❌ Erreur de test:', error.message)
  }
}

testBannerSave()
