import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixOrderItemsMetadata() {
  console.log('🔧 Début de la correction des métadonnées des items de commande...\n')

  try {
    // Récupérer toutes les commandes avec leurs items
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true }
            },
            service: {
              select: { id: true, name: true }
            },
            offer: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    console.log(`📦 ${orders.length} commande(s) trouvée(s)\n`)

    let totalFixed = 0
    let totalSkipped = 0

    for (const order of orders) {
      console.log(`\n📋 Commande ${order.orderNumber || order.id}:`)
      
      for (const item of order.items) {
        // Vérifier si l'item a déjà un nom via une relation
        const hasNameFromRelation = item.product?.name || item.service?.name || item.offer?.name
        
        // Parser les métadonnées
        let metadata: any = null
        try {
          metadata = typeof item.metadata === 'string' 
            ? JSON.parse(item.metadata) 
            : item.metadata
        } catch (e) {
          console.log(`  ⚠️ Item ${item.id}: Erreur parsing métadonnées`)
          continue
        }

        // Si l'item n'a pas de nom via relation ET n'a pas de nom dans les métadonnées
        if (!hasNameFromRelation && (!metadata || !metadata.name)) {
          // Essayer de trouver le nom depuis d'autres propriétés des métadonnées
          const possibleName = metadata?.productName || metadata?.serviceName || metadata?.offerName || metadata?.title
          
          // Pour les produits importés, vérifier aussi dans importData
          let importedName = null
          if (metadata?.isImported && metadata?.importData) {
            // Le nom pourrait être dans la description ou ailleurs
            if (metadata.description) {
              // Extraire le nom depuis la description si possible
              const descMatch = metadata.description.match(/^([^\n]+)/)
              if (descMatch) {
                importedName = descMatch[1].replace(/Produit importé via transport.*depuis.*\./, '').trim()
              }
            }
          }
          
          // Si toujours pas de nom, créer un nom générique basé sur le type
          let nameToUse = possibleName || importedName
          
          if (!nameToUse || nameToUse.length === 0) {
            // Créer un nom générique basé sur le type et le prix
            const typeLabel = item.itemType === 'PRODUCT' ? 'Produit' : 
                             item.itemType === 'SERVICE' ? 'Service' : 
                             item.itemType === 'OFFER' ? 'Abonnement' : 'Article'
            nameToUse = `${typeLabel} - ${Number(item.unitPrice).toLocaleString('fr-FR')} Ar`
          }
          
          // Mettre à jour les métadonnées pour inclure le nom
          const updatedMetadata = {
            ...(metadata || {}),
            name: nameToUse
          }

          await prisma.orderItem.update({
            where: { id: item.id },
            data: {
              metadata: updatedMetadata
            }
          })

          console.log(`  ✅ Item ${item.id}: Nom ajouté dans métadonnées: "${nameToUse}"`)
          totalFixed++
        } else if (!hasNameFromRelation && metadata?.name) {
          // L'item a déjà un nom dans les métadonnées, pas besoin de corriger
          console.log(`  ✓ Item ${item.id}: Nom déjà présent dans métadonnées: "${metadata.name}"`)
        } else if (hasNameFromRelation) {
          // L'item a un nom via relation, pas besoin de corriger
          console.log(`  ✓ Item ${item.id}: Nom via relation: "${hasNameFromRelation}"`)
        }
      }
    }

    console.log(`\n\n📊 Résumé:`)
    console.log(`  ✅ Items corrigés: ${totalFixed}`)
    console.log(`  ⚠️ Items ignorés: ${totalSkipped}`)
    console.log(`\n✅ Correction terminée!`)

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixOrderItemsMetadata()
