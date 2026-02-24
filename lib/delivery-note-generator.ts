import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DeliveryNoteData {
  orderNumber: string;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone?: string | null;
  };
  items: Array<{
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    product?: {
      name: string;
    };
    service?: {
      name: string;
    };
    offer?: {
      name: string;
    };
  }>;
  address?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  total?: number;
  currency?: string;
}

// Fonction utilitaire pour formater les prix
function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR').replace(/,/g, ' ')
}

// Fonction utilitaire pour formater les adresses
function formatAddress(address: any, customerInfo?: any): string[] {
  if (!address || (!address.street && !address.city)) {
    if (customerInfo) {
      return [
        customerInfo.name || '',
        customerInfo.email || '',
        customerInfo.phone || ''
      ].filter(Boolean)
    }
    return ['Adresse non spécifiée']
  }
  
  return [
    address.street || '',
    `${address.zipCode || ''} ${address.city || ''}`.trim(),
    address.country || ''
  ].filter(Boolean)
}

export function generateDeliveryNotePDF(data: DeliveryNoteData): string {
  try {
    // Créer un nouveau document PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // Ajouter autoTable au document
    autoTable(doc, {})
    
    // Dimensions et marges
    const pageWidth = doc.internal.pageSize.width
    const margin = 15
    let currentY = margin
    
    // Fonction pour ajouter l'en-tête de l'entreprise
    const addCompanyHeader = () => {
      // Logo ou nom de l'entreprise
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text("Boutik'nakà", margin, currentY)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Service proposé par Dinitech', margin, currentY + 5)
      
      currentY += 15
    }
    
    // Ajouter l'en-tête
    addCompanyHeader()
    
    // Titre du document
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('BON DE LIVRAISON', pageWidth / 2, currentY, { align: 'center' })
    
    // Numéro de commande
    doc.setFontSize(12)
    doc.text(`N° ${data.orderNumber}`, pageWidth - margin, currentY, { align: 'right' })
    
    currentY += 15
    
    // Informations client et adresses
    const customerInfo = {
      name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
      email: data.user.email,
      phone: data.user.phone || ''
    }
    
    // Informations client et adresse de livraison
    const shippingAddress = formatAddress(data.address, customerInfo)
    
    // Informations client
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('DESTINATAIRE :', margin, currentY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    currentY += 6
    doc.text(customerInfo.name || 'Client', margin, currentY)
    currentY += 4
    doc.text(customerInfo.email, margin, currentY)
    if (customerInfo.phone) {
      currentY += 4
      doc.text(customerInfo.phone, margin, currentY)
    }
    
    currentY += 10
    
    // Adresse de livraison
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('ADRESSE DE LIVRAISON :', margin, currentY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    currentY += 6
    shippingAddress.forEach(line => {
      if (line) {
        doc.text(line, margin, currentY)
        currentY += 4
      }
    })
    
    currentY += 15
    
    // Date de livraison
    const deliveryDate = format(new Date(), 'dd/MM/yyyy', { locale: fr })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`DATE DE LIVRAISON : ${deliveryDate}`, margin, currentY)
    
    currentY += 15
    
    // Tableau des articles à livrer (sans prix)
    const articlesData = data.items.map(item => {
      const itemName = item.product?.name || item.service?.name || item.offer?.name || 'Article'
      
      return [
        itemName,
        item.quantity.toString(),
        '☐ Conforme',
        ''
      ]
    })
    
    autoTable(doc, {
      head: [['Article à livrer', 'Quantité', 'État', 'Remarques']],
      body: articlesData,
      startY: currentY,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 4,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [128, 128, 128],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 35 }
      }
    })
    
    currentY = (doc as any).lastAutoTable.finalY + 15
    
    // Instructions de livraison
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('INSTRUCTIONS DE LIVRAISON :', margin, currentY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    currentY += 6
    const instructions = [
      '• Vérifiez la conformité des articles à la réception',
      '• Cochez la case "Conforme" pour chaque article vérifié',
      '• Notez toute remarque dans la colonne prévue à cet effet',
      '• Signez le bon de livraison après vérification complète'
    ]
    
    instructions.forEach(instruction => {
      doc.text(instruction, margin, currentY)
      currentY += 5
    })
    
    // Signatures
    currentY += 15
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    
    // Signature livreur
    doc.text('Signature du livreur :', margin, currentY)
    doc.rect(margin, currentY + 5, 70, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Date et heure :', margin, currentY + 30)
    doc.line(margin + 25, currentY + 30, margin + 70, currentY + 30)
    
    // Signature destinataire
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Signature du destinataire :', pageWidth - margin - 70, currentY)
    doc.rect(pageWidth - margin - 70, currentY + 5, 70, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Date et heure :', pageWidth - margin - 70, currentY + 30)
    doc.line(pageWidth - margin - 45, currentY + 30, pageWidth - margin, currentY + 30)
    
    return doc.output('datauristring')
  } catch (error) {
    console.error('Erreur lors de la génération du bon de commande:', error)
    throw new Error('Erreur lors de la génération du PDF')
  }
}