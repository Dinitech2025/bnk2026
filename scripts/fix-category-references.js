const fs = require('fs')

console.log('🔧 Correction des références prisma.category...')

// Corriger les pages de services pour utiliser serviceCategory
const serviceFiles = [
  'app/(admin)/admin/services/[id]/edit/page.tsx',
  'app/(admin)/admin/services/add/page.tsx'
]

serviceFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const newContent = content.replace(/prisma\.category/g, 'prisma.serviceCategory')
      fs.writeFileSync(filePath, newContent, 'utf8')
      console.log(`✅ Corrigé: ${filePath}`)
    } else {
      console.log(`⚠️ Non trouvé: ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Erreur: ${filePath}`, error.message)
  }
})

// Corriger le script de seed des services
const seedFile = 'scripts/seed-services.js'
try {
  if (fs.existsSync(seedFile)) {
    const content = fs.readFileSync(seedFile, 'utf8')
    const newContent = content.replace(/prisma\.category/g, 'prisma.serviceCategory')
    fs.writeFileSync(seedFile, newContent, 'utf8')
    console.log(`✅ Corrigé: ${seedFile}`)
  }
} catch (error) {
  console.error(`❌ Erreur: ${seedFile}`, error.message)
}

console.log('🎉 Corrections terminées!') 

console.log('🔧 Correction des références prisma.category...')

// Corriger les pages de services pour utiliser serviceCategory
const serviceFiles = [
  'app/(admin)/admin/services/[id]/edit/page.tsx',
  'app/(admin)/admin/services/add/page.tsx'
]

serviceFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const newContent = content.replace(/prisma\.category/g, 'prisma.serviceCategory')
      fs.writeFileSync(filePath, newContent, 'utf8')
      console.log(`✅ Corrigé: ${filePath}`)
    } else {
      console.log(`⚠️ Non trouvé: ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Erreur: ${filePath}`, error.message)
  }
})

// Corriger le script de seed des services
const seedFile = 'scripts/seed-services.js'
try {
  if (fs.existsSync(seedFile)) {
    const content = fs.readFileSync(seedFile, 'utf8')
    const newContent = content.replace(/prisma\.category/g, 'prisma.serviceCategory')
    fs.writeFileSync(seedFile, newContent, 'utf8')
    console.log(`✅ Corrigé: ${seedFile}`)
  }
} catch (error) {
  console.error(`❌ Erreur: ${seedFile}`, error.message)
}

console.log('🎉 Corrections terminées!') 