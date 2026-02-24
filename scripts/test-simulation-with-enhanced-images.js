const { PrismaClient } = require('@prisma/client')

console.log('🧪 Test du simulateur avec système d\'images amélioré...')
console.log('=' .repeat(60))

async function testSimulationWithEnhancedImages() {
  const prisma = new PrismaClient()
  
  try {
    // Données de test avec l'URL problématique
    const testData = {
      productInfo: {
        name: 'Unitec 76329 Klaxon pneumatique',
        url: 'https://www.amazon.fr/Unitec-76329-Klaxon-pneumatique/dp/B002VPHW58/ref=sr_1_4?crid=2VPCYYP8L9ZLN&dib=eyJ2IjoiMSJ9.VDLRnkc5DmIKNHc05NYn6dgWMyJ8K2q40moLaE9AV3dAi1uj_mt0tpiVJcnrYAFwAwkl6p3XXEP8Ol0_aNu62dfQOFxyAKJN-9T_g4DVaBu9WQ06fNjw3RDCutjuFOnQlt5A3YnsWIt_4wAsR7GqD64mdmodEUehA_zWoy1CWvt9xovaCLMuKhAfdsj_aRxCv3XG5t0rr0cvxUUK0WTUU11gNkti9MOYtorZkB-sw71dvKyOaXlP4uvQr-jvVnBo0n2Kkv759KuqS7Etm6COo4sIclEaytUGbWKPzOld14k.eS2Wd4LJLYTzcJ8j0X_-Zenur8PrmWsTbq_Ew1sbgos&dib_tag=se&keywords=klaxon&qid=1748337800&s=automotive&sprefix=kl%2Cautomotive%2C451&sr=1-4',
        specifications: 'Klaxon pneumatique 12V pour véhicules automobiles',
        weight: 0.5,
        mode: 'air',
        warehouse: 'France'
      },
      costs: {
        supplierPrice: { 
          amount: 25, 
          currency: 'EUR', 
          amountInMGA: 127500 
        },
        transport: { 
          amount: 15, 
          currency: 'EUR', 
          amountInMGA: 76500, 
          details: '0.5kg × 30 EUR/kg' 
        },
        commission: { 
          amount: 10, 
          currency: 'EUR', 
          amountInMGA: 51000, 
          rate: 20, 
          details: '20%' 
        },
        fees: {
          processing: { 
            amount: 2, 
            currency: 'EUR', 
            amountInMGA: 10200 
          },
          tax: { 
            amount: 10.4, 
            currency: 'EUR', 
            amountInMGA: 53040, 
            rate: 20 
          }
        },
        total: 318240
      },
      calculationMethod: 'hybrid',
      transitTime: '3-5 jours'
    }
    
    console.log('📦 Données de test:')
    console.log(`   Produit: ${testData.productInfo.name}`)
    console.log(`   URL: ${testData.productInfo.url}`)
    console.log(`   Prix total: ${testData.costs.total.toLocaleString('fr-FR')} Ar`)
    
    // Test de l'API de création
    console.log('\n🌐 Test de l\'API de création...')
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/products/create-from-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })
      
      console.log(`   Status: ${response.status}`)
      
      if (response.status === 401) {
        console.log('   ⚠️ Session requise - connectez-vous en tant qu\'admin')
        return
      }
      
      if (response.status === 200) {
        const result = await response.json()
        console.log('   ✅ Produit créé avec succès!')
        console.log(`   ID: ${result.product?.id}`)
        console.log(`   SKU: ${result.product?.sku}`)
        console.log(`   Prix: ${result.product?.price?.toLocaleString('fr-FR')} Ar`)
        
        if (result.images) {
          console.log(`   Images ajoutées: ${result.images.added}`)
          console.log(`   Source: ${result.images.source}`)
          console.log(`   Succès: ${result.images.success}`)
        }
        
        // Vérifier le produit dans la base
        if (result.product?.id) {
          console.log('\n🔍 Vérification dans la base de données...')
          
          const product = await prisma.product.findUnique({
            where: { id: result.product.id },
            include: {
              attributes: true,
              images: true,
              category: true
            }
          })
          
          if (product) {
            console.log(`   ✅ Produit trouvé: ${product.name}`)
            console.log(`   Catégorie: ${product.category?.name}`)
            console.log(`   Images: ${product.images.length}`)
            console.log(`   Attributs: ${product.attributes.length}`)
            
            // Vérifier les attributs spécifiques
            const asin = product.attributes.find(attr => attr.name === 'asin')
            const supplierUrl = product.attributes.find(attr => attr.name === 'supplier_url')
            
            if (asin) {
              console.log(`   ASIN: ${asin.value}`)
            }
            
            if (supplierUrl) {
              console.log(`   URL fournisseur: ${supplierUrl.value}`)
            }
            
            if (product.images.length > 0) {
              console.log(`   Images trouvées:`)
              product.images.forEach((image, index) => {
                console.log(`     ${index + 1}. ${image.name}`)
                console.log(`        URL: ${image.path}`)
              })
            }
          }
        }
        
      } else {
        const result = await response.json()
        console.log(`   ❌ Erreur: ${result.error}`)
      }
      
    } catch (error) {
      console.log('   ⚠️ Serveur non accessible:', error.message)
      console.log('   💡 Assurez-vous que le serveur est démarré: npm run dev')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    
  } finally {
    await prisma.$disconnect()
  }
}

async function checkExistingProducts() {
  const prisma = new PrismaClient()
  
  try {
    console.log('\n📊 État actuel de la base de données...')
    
    const stats = {
      totalProducts: await prisma.product.count(),
      importedProducts: await prisma.product.count({
        where: {
          category: {
            name: 'Produits importés'
          }
        }
      }),
      productsWithImages: await prisma.product.count({
        where: {
          images: {
            some: {}
          }
        }
      }),
      productsWithASIN: await prisma.product.count({
        where: {
          attributes: {
            some: {
              name: 'asin'
            }
          }
        }
      })
    }
    
    console.log(`   Total produits: ${stats.totalProducts}`)
    console.log(`   Produits importés: ${stats.importedProducts}`)
    console.log(`   Produits avec images: ${stats.productsWithImages}`)
    console.log(`   Produits avec ASIN: ${stats.productsWithASIN}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    
  } finally {
    await prisma.$disconnect()
  }
}

async function runAllTests() {
  await checkExistingProducts()
  await testSimulationWithEnhancedImages()
  
  console.log('\n📝 Instructions pour tester manuellement:')
  console.log('1. Ouvrez: http://localhost:3000/admin/products/imported/simulation')
  console.log('2. Connectez-vous en tant qu\'administrateur')
  console.log('3. Utilisez ces données de test:')
  console.log('   - Nom: "Unitec 76329 Klaxon pneumatique"')
  console.log('   - URL: "https://www.amazon.fr/dp/B002VPHW58"')
  console.log('   - Prix: 25 EUR')
  console.log('   - Poids: 0.5 kg')
  console.log('   - Entrepôt: France')
  console.log('4. Le système amélioré devrait:')
  console.log('   - Extraire l\'ASIN: B002VPHW58')
  console.log('   - Nettoyer l\'URL pour éviter le CAPTCHA')
  console.log('   - Essayer les URLs d\'images directes')
  console.log('   - Faire du scraping si nécessaire')
  console.log('   - Uploader les images sur Cloudinary')
  
  console.log('\n🎉 Test terminé!')
}

runAllTests().catch(console.error) 

console.log('🧪 Test du simulateur avec système d\'images amélioré...')
console.log('=' .repeat(60))

async function testSimulationWithEnhancedImages() {
  const prisma = new PrismaClient()
  
  try {
    // Données de test avec l'URL problématique
    const testData = {
      productInfo: {
        name: 'Unitec 76329 Klaxon pneumatique',
        url: 'https://www.amazon.fr/Unitec-76329-Klaxon-pneumatique/dp/B002VPHW58/ref=sr_1_4?crid=2VPCYYP8L9ZLN&dib=eyJ2IjoiMSJ9.VDLRnkc5DmIKNHc05NYn6dgWMyJ8K2q40moLaE9AV3dAi1uj_mt0tpiVJcnrYAFwAwkl6p3XXEP8Ol0_aNu62dfQOFxyAKJN-9T_g4DVaBu9WQ06fNjw3RDCutjuFOnQlt5A3YnsWIt_4wAsR7GqD64mdmodEUehA_zWoy1CWvt9xovaCLMuKhAfdsj_aRxCv3XG5t0rr0cvxUUK0WTUU11gNkti9MOYtorZkB-sw71dvKyOaXlP4uvQr-jvVnBo0n2Kkv759KuqS7Etm6COo4sIclEaytUGbWKPzOld14k.eS2Wd4LJLYTzcJ8j0X_-Zenur8PrmWsTbq_Ew1sbgos&dib_tag=se&keywords=klaxon&qid=1748337800&s=automotive&sprefix=kl%2Cautomotive%2C451&sr=1-4',
        specifications: 'Klaxon pneumatique 12V pour véhicules automobiles',
        weight: 0.5,
        mode: 'air',
        warehouse: 'France'
      },
      costs: {
        supplierPrice: { 
          amount: 25, 
          currency: 'EUR', 
          amountInMGA: 127500 
        },
        transport: { 
          amount: 15, 
          currency: 'EUR', 
          amountInMGA: 76500, 
          details: '0.5kg × 30 EUR/kg' 
        },
        commission: { 
          amount: 10, 
          currency: 'EUR', 
          amountInMGA: 51000, 
          rate: 20, 
          details: '20%' 
        },
        fees: {
          processing: { 
            amount: 2, 
            currency: 'EUR', 
            amountInMGA: 10200 
          },
          tax: { 
            amount: 10.4, 
            currency: 'EUR', 
            amountInMGA: 53040, 
            rate: 20 
          }
        },
        total: 318240
      },
      calculationMethod: 'hybrid',
      transitTime: '3-5 jours'
    }
    
    console.log('📦 Données de test:')
    console.log(`   Produit: ${testData.productInfo.name}`)
    console.log(`   URL: ${testData.productInfo.url}`)
    console.log(`   Prix total: ${testData.costs.total.toLocaleString('fr-FR')} Ar`)
    
    // Test de l'API de création
    console.log('\n🌐 Test de l\'API de création...')
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/products/create-from-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })
      
      console.log(`   Status: ${response.status}`)
      
      if (response.status === 401) {
        console.log('   ⚠️ Session requise - connectez-vous en tant qu\'admin')
        return
      }
      
      if (response.status === 200) {
        const result = await response.json()
        console.log('   ✅ Produit créé avec succès!')
        console.log(`   ID: ${result.product?.id}`)
        console.log(`   SKU: ${result.product?.sku}`)
        console.log(`   Prix: ${result.product?.price?.toLocaleString('fr-FR')} Ar`)
        
        if (result.images) {
          console.log(`   Images ajoutées: ${result.images.added}`)
          console.log(`   Source: ${result.images.source}`)
          console.log(`   Succès: ${result.images.success}`)
        }
        
        // Vérifier le produit dans la base
        if (result.product?.id) {
          console.log('\n🔍 Vérification dans la base de données...')
          
          const product = await prisma.product.findUnique({
            where: { id: result.product.id },
            include: {
              attributes: true,
              images: true,
              category: true
            }
          })
          
          if (product) {
            console.log(`   ✅ Produit trouvé: ${product.name}`)
            console.log(`   Catégorie: ${product.category?.name}`)
            console.log(`   Images: ${product.images.length}`)
            console.log(`   Attributs: ${product.attributes.length}`)
            
            // Vérifier les attributs spécifiques
            const asin = product.attributes.find(attr => attr.name === 'asin')
            const supplierUrl = product.attributes.find(attr => attr.name === 'supplier_url')
            
            if (asin) {
              console.log(`   ASIN: ${asin.value}`)
            }
            
            if (supplierUrl) {
              console.log(`   URL fournisseur: ${supplierUrl.value}`)
            }
            
            if (product.images.length > 0) {
              console.log(`   Images trouvées:`)
              product.images.forEach((image, index) => {
                console.log(`     ${index + 1}. ${image.name}`)
                console.log(`        URL: ${image.path}`)
              })
            }
          }
        }
        
      } else {
        const result = await response.json()
        console.log(`   ❌ Erreur: ${result.error}`)
      }
      
    } catch (error) {
      console.log('   ⚠️ Serveur non accessible:', error.message)
      console.log('   💡 Assurez-vous que le serveur est démarré: npm run dev')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    
  } finally {
    await prisma.$disconnect()
  }
}

async function checkExistingProducts() {
  const prisma = new PrismaClient()
  
  try {
    console.log('\n📊 État actuel de la base de données...')
    
    const stats = {
      totalProducts: await prisma.product.count(),
      importedProducts: await prisma.product.count({
        where: {
          category: {
            name: 'Produits importés'
          }
        }
      }),
      productsWithImages: await prisma.product.count({
        where: {
          images: {
            some: {}
          }
        }
      }),
      productsWithASIN: await prisma.product.count({
        where: {
          attributes: {
            some: {
              name: 'asin'
            }
          }
        }
      })
    }
    
    console.log(`   Total produits: ${stats.totalProducts}`)
    console.log(`   Produits importés: ${stats.importedProducts}`)
    console.log(`   Produits avec images: ${stats.productsWithImages}`)
    console.log(`   Produits avec ASIN: ${stats.productsWithASIN}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    
  } finally {
    await prisma.$disconnect()
  }
}

async function runAllTests() {
  await checkExistingProducts()
  await testSimulationWithEnhancedImages()
  
  console.log('\n📝 Instructions pour tester manuellement:')
  console.log('1. Ouvrez: http://localhost:3000/admin/products/imported/simulation')
  console.log('2. Connectez-vous en tant qu\'administrateur')
  console.log('3. Utilisez ces données de test:')
  console.log('   - Nom: "Unitec 76329 Klaxon pneumatique"')
  console.log('   - URL: "https://www.amazon.fr/dp/B002VPHW58"')
  console.log('   - Prix: 25 EUR')
  console.log('   - Poids: 0.5 kg')
  console.log('   - Entrepôt: France')
  console.log('4. Le système amélioré devrait:')
  console.log('   - Extraire l\'ASIN: B002VPHW58')
  console.log('   - Nettoyer l\'URL pour éviter le CAPTCHA')
  console.log('   - Essayer les URLs d\'images directes')
  console.log('   - Faire du scraping si nécessaire')
  console.log('   - Uploader les images sur Cloudinary')
  
  console.log('\n🎉 Test terminé!')
}

runAllTests().catch(console.error) 