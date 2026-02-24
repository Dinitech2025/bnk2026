const { PrismaClient } = require('@prisma/client')

console.log('🧪 Test du scraping Amazon amélioré...')
console.log('=' .repeat(60))

// Fonction simple pour extraire l'ASIN
function extractASIN(url) {
  if (!url) return null
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
  return asinMatch ? asinMatch[1] : null
}

// Fonction pour nettoyer une URL Amazon
function cleanAmazonUrl(url) {
  const asin = extractASIN(url)
  if (!asin) return url
  
  const domain = url.includes('amazon.fr') ? 'amazon.fr' : 
                 url.includes('amazon.com') ? 'amazon.com' :
                 url.includes('amazon.co.uk') ? 'amazon.co.uk' :
                 url.includes('amazon.de') ? 'amazon.de' : 'amazon.com'
  
  return `https://www.${domain}/dp/${asin}`
}

// Fonction pour générer des URLs d'images Amazon
function generateAmazonImageUrls(asin) {
  return [
    `https://images-amazon.com/images/P/${asin}.01.L.jpg`,
    `https://images-amazon.com/images/P/${asin}.02.L.jpg`,
    `https://images-amazon.com/images/P/${asin}.03.L.jpg`,
    `https://m.media-amazon.com/images/I/${asin}.jpg`,
    `https://m.media-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
    `https://m.media-amazon.com/images/I/${asin}._AC_SX679_.jpg`
  ]
}

// Fonction pour vérifier si une URL d'image est accessible
async function checkImageUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    const isImage = response.headers.get('content-type')?.startsWith('image/') ?? false
    return response.ok && isImage
  } catch {
    return false
  }
}

async function testEnhancedAmazonScraping() {
  console.log('🔍 Test avec l\'URL problématique...')
  
  // URL qui a causé le problème
  const problemUrl = 'https://www.amazon.fr/Unitec-76329-Klaxon-pneumatique/dp/B002VPHW58/ref=sr_1_4?crid=2VPCYYP8L9ZLN&dib=eyJ2IjoiMSJ9.VDLRnkc5DmIKNHc05NYn6dgWMyJ8K2q40moLaE9AV3dAi1uj_mt0tpiVJcnrYAFwAwkl6p3XXEP8Ol0_aNu62dfQOFxyAKJN-9T_g4DVaBu9WQ06fNjw3RDCutjuFOnQlt5A3YnsWIt_4wAsR7GqD64mdmodEUehA_zWoy1CWvt9xovaCLMuKhAfdsj_aRxCv3XG5t0rr0cvxUUK0WTUU11gNkti9MOYtorZkB-sw71dvKyOaXlP4uvQr-jvVnBo0n2Kkv759KuqS7Etm6COo4sIclEaytUGbWKPzOld14k.eS2Wd4LJLYTzcJ8j0X_-Zenur8PrmWsTbq_Ew1sbgos&dib_tag=se&keywords=klaxon&qid=1748337800&s=automotive&sprefix=kl%2Cautomotive%2C451&sr=1-4'
  
  console.log(`📍 URL originale: ${problemUrl}`)
  
  // Étape 1: Extraire l'ASIN
  const asin = extractASIN(problemUrl)
  console.log(`📋 ASIN extrait: ${asin}`)
  
  if (!asin) {
    console.log('❌ Impossible d\'extraire l\'ASIN')
    return
  }
  
  // Étape 2: Nettoyer l'URL
  const cleanUrl = cleanAmazonUrl(problemUrl)
  console.log(`🔗 URL nettoyée: ${cleanUrl}`)
  
  // Étape 3: Générer les URLs d'images directes
  console.log('\n🎯 Test des URLs d\'images directes...')
  const directImageUrls = generateAmazonImageUrls(asin)
  const validImages = []
  
  for (let i = 0; i < directImageUrls.length; i++) {
    const imageUrl = directImageUrls[i]
    console.log(`🔍 Test ${i + 1}: ${imageUrl}`)
    
    const isValid = await checkImageUrl(imageUrl)
    if (isValid) {
      validImages.push(imageUrl)
      console.log(`✅ Image valide trouvée!`)
    } else {
      console.log(`❌ Image non accessible`)
    }
  }
  
  console.log(`\n📊 Résultats:`)
  console.log(`   ASIN: ${asin}`)
  console.log(`   Images directes trouvées: ${validImages.length}`)
  
  if (validImages.length > 0) {
    console.log(`\n✅ Images valides:`)
    validImages.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`)
    })
  } else {
    console.log(`\n⚠️ Aucune image directe trouvée`)
    console.log(`💡 Le système essaierait ensuite le scraping de la page`)
  }
  
  // Étape 4: Test de la page nettoyée (simulation)
  console.log(`\n🌐 Test d'accès à la page nettoyée...`)
  
  try {
    const response = await fetch(cleanUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    console.log(`   Status: ${response.status}`)
    
    if (response.ok) {
      console.log(`✅ Page accessible avec URL nettoyée`)
    } else {
      console.log(`❌ Page non accessible: ${response.statusText}`)
    }
    
  } catch (error) {
    console.log(`❌ Erreur d'accès: ${error.message}`)
  }
}

async function testOtherASINs() {
  console.log('\n🧪 Test avec d\'autres ASINs connus...')
  
  const testASINs = [
    'B0CHX1W1XY', // iPhone 15 Pro
    'B08N5WRWNW', // Echo Dot
    'B07XJ8C8F5', // Fire TV Stick
    'B0DMVB5XFF'  // Produit de test précédent
  ]
  
  for (const asin of testASINs) {
    console.log(`\n📋 Test ASIN: ${asin}`)
    
    const directImageUrls = generateAmazonImageUrls(asin)
    let validCount = 0
    
    for (const imageUrl of directImageUrls) {
      const isValid = await checkImageUrl(imageUrl)
      if (isValid) {
        validCount++
      }
    }
    
    console.log(`   Images trouvées: ${validCount}/${directImageUrls.length}`)
    
    if (validCount > 0) {
      console.log(`   ✅ ASIN avec images disponibles`)
    } else {
      console.log(`   ⚠️ Aucune image directe pour cet ASIN`)
    }
  }
}

async function runAllTests() {
  await testEnhancedAmazonScraping()
  await testOtherASINs()
  
  console.log('\n📝 Conclusions:')
  console.log('1. Le système amélioré utilise 2 stratégies:')
  console.log('   - URLs d\'images directes basées sur l\'ASIN')
  console.log('   - Scraping de page avec URL nettoyée')
  console.log('2. Même si une URL déclenche un CAPTCHA, l\'ASIN peut')
  console.log('   permettre de récupérer les images directement')
  console.log('3. Les URLs nettoyées ont moins de chance de déclencher')
  console.log('   les protections anti-bot d\'Amazon')
  
  console.log('\n🎉 Test terminé!')
}

runAllTests().catch(console.error) 

console.log('🧪 Test du scraping Amazon amélioré...')
console.log('=' .repeat(60))

// Fonction simple pour extraire l'ASIN
function extractASIN(url) {
  if (!url) return null
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
  return asinMatch ? asinMatch[1] : null
}

// Fonction pour nettoyer une URL Amazon
function cleanAmazonUrl(url) {
  const asin = extractASIN(url)
  if (!asin) return url
  
  const domain = url.includes('amazon.fr') ? 'amazon.fr' : 
                 url.includes('amazon.com') ? 'amazon.com' :
                 url.includes('amazon.co.uk') ? 'amazon.co.uk' :
                 url.includes('amazon.de') ? 'amazon.de' : 'amazon.com'
  
  return `https://www.${domain}/dp/${asin}`
}

// Fonction pour générer des URLs d'images Amazon
function generateAmazonImageUrls(asin) {
  return [
    `https://images-amazon.com/images/P/${asin}.01.L.jpg`,
    `https://images-amazon.com/images/P/${asin}.02.L.jpg`,
    `https://images-amazon.com/images/P/${asin}.03.L.jpg`,
    `https://m.media-amazon.com/images/I/${asin}.jpg`,
    `https://m.media-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
    `https://m.media-amazon.com/images/I/${asin}._AC_SX679_.jpg`
  ]
}

// Fonction pour vérifier si une URL d'image est accessible
async function checkImageUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    const isImage = response.headers.get('content-type')?.startsWith('image/') ?? false
    return response.ok && isImage
  } catch {
    return false
  }
}

async function testEnhancedAmazonScraping() {
  console.log('🔍 Test avec l\'URL problématique...')
  
  // URL qui a causé le problème
  const problemUrl = 'https://www.amazon.fr/Unitec-76329-Klaxon-pneumatique/dp/B002VPHW58/ref=sr_1_4?crid=2VPCYYP8L9ZLN&dib=eyJ2IjoiMSJ9.VDLRnkc5DmIKNHc05NYn6dgWMyJ8K2q40moLaE9AV3dAi1uj_mt0tpiVJcnrYAFwAwkl6p3XXEP8Ol0_aNu62dfQOFxyAKJN-9T_g4DVaBu9WQ06fNjw3RDCutjuFOnQlt5A3YnsWIt_4wAsR7GqD64mdmodEUehA_zWoy1CWvt9xovaCLMuKhAfdsj_aRxCv3XG5t0rr0cvxUUK0WTUU11gNkti9MOYtorZkB-sw71dvKyOaXlP4uvQr-jvVnBo0n2Kkv759KuqS7Etm6COo4sIclEaytUGbWKPzOld14k.eS2Wd4LJLYTzcJ8j0X_-Zenur8PrmWsTbq_Ew1sbgos&dib_tag=se&keywords=klaxon&qid=1748337800&s=automotive&sprefix=kl%2Cautomotive%2C451&sr=1-4'
  
  console.log(`📍 URL originale: ${problemUrl}`)
  
  // Étape 1: Extraire l'ASIN
  const asin = extractASIN(problemUrl)
  console.log(`📋 ASIN extrait: ${asin}`)
  
  if (!asin) {
    console.log('❌ Impossible d\'extraire l\'ASIN')
    return
  }
  
  // Étape 2: Nettoyer l'URL
  const cleanUrl = cleanAmazonUrl(problemUrl)
  console.log(`🔗 URL nettoyée: ${cleanUrl}`)
  
  // Étape 3: Générer les URLs d'images directes
  console.log('\n🎯 Test des URLs d\'images directes...')
  const directImageUrls = generateAmazonImageUrls(asin)
  const validImages = []
  
  for (let i = 0; i < directImageUrls.length; i++) {
    const imageUrl = directImageUrls[i]
    console.log(`🔍 Test ${i + 1}: ${imageUrl}`)
    
    const isValid = await checkImageUrl(imageUrl)
    if (isValid) {
      validImages.push(imageUrl)
      console.log(`✅ Image valide trouvée!`)
    } else {
      console.log(`❌ Image non accessible`)
    }
  }
  
  console.log(`\n📊 Résultats:`)
  console.log(`   ASIN: ${asin}`)
  console.log(`   Images directes trouvées: ${validImages.length}`)
  
  if (validImages.length > 0) {
    console.log(`\n✅ Images valides:`)
    validImages.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`)
    })
  } else {
    console.log(`\n⚠️ Aucune image directe trouvée`)
    console.log(`💡 Le système essaierait ensuite le scraping de la page`)
  }
  
  // Étape 4: Test de la page nettoyée (simulation)
  console.log(`\n🌐 Test d'accès à la page nettoyée...`)
  
  try {
    const response = await fetch(cleanUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    console.log(`   Status: ${response.status}`)
    
    if (response.ok) {
      console.log(`✅ Page accessible avec URL nettoyée`)
    } else {
      console.log(`❌ Page non accessible: ${response.statusText}`)
    }
    
  } catch (error) {
    console.log(`❌ Erreur d'accès: ${error.message}`)
  }
}

async function testOtherASINs() {
  console.log('\n🧪 Test avec d\'autres ASINs connus...')
  
  const testASINs = [
    'B0CHX1W1XY', // iPhone 15 Pro
    'B08N5WRWNW', // Echo Dot
    'B07XJ8C8F5', // Fire TV Stick
    'B0DMVB5XFF'  // Produit de test précédent
  ]
  
  for (const asin of testASINs) {
    console.log(`\n📋 Test ASIN: ${asin}`)
    
    const directImageUrls = generateAmazonImageUrls(asin)
    let validCount = 0
    
    for (const imageUrl of directImageUrls) {
      const isValid = await checkImageUrl(imageUrl)
      if (isValid) {
        validCount++
      }
    }
    
    console.log(`   Images trouvées: ${validCount}/${directImageUrls.length}`)
    
    if (validCount > 0) {
      console.log(`   ✅ ASIN avec images disponibles`)
    } else {
      console.log(`   ⚠️ Aucune image directe pour cet ASIN`)
    }
  }
}

async function runAllTests() {
  await testEnhancedAmazonScraping()
  await testOtherASINs()
  
  console.log('\n📝 Conclusions:')
  console.log('1. Le système amélioré utilise 2 stratégies:')
  console.log('   - URLs d\'images directes basées sur l\'ASIN')
  console.log('   - Scraping de page avec URL nettoyée')
  console.log('2. Même si une URL déclenche un CAPTCHA, l\'ASIN peut')
  console.log('   permettre de récupérer les images directement')
  console.log('3. Les URLs nettoyées ont moins de chance de déclencher')
  console.log('   les protections anti-bot d\'Amazon')
  
  console.log('\n🎉 Test terminé!')
}

runAllTests().catch(console.error) 