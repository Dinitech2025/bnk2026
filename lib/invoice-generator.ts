import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
}

interface Customer {
  name: string;
  email: string;
}

interface InvoiceData {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  currency: string;
  currencySymbol: string;
  exchangeRate?: number;
  selectedLogo?: string;
  invoiceFooterText?: string;
  showInvoiceFooter?: boolean;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  payments?: Array<{
    method: string;
    amount: number;
    provider?: string;
    createdAt: string;
  }>;
  delivery?: {
    mode?: string;
    name?: string;
    cost?: number;
    time?: string;
    details?: string;
  };
  items: InvoiceItem[];
  globalDiscount?: {
    type: string;
    value: number;
    amount: number;
  };
  convertedPrices?: {
    [key: string]: number;
  };
}

/**
 * Formate un prix avec la devise en préservant les décimales si nécessaires
 */
function formatPrice(price: number, currencySymbol: string): string {
  // Arrondir à 2 décimales maximum
  const roundedPrice = Math.round(price * 100) / 100;
  
  // Si le prix est un nombre entier, ne pas afficher de décimales
  let formattedNumber: string;
  if (roundedPrice % 1 === 0) {
    // Nombre entier : utiliser des espaces pour les milliers
    formattedNumber = roundedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  } else {
    // Nombre avec décimales : utiliser toLocaleString avec virgule comme séparateur décimal
    formattedNumber = roundedPrice.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).replace(/\s/g, ' '); // Remplacer les espaces insécables par des espaces normaux
  }
  
  return `${formattedNumber} ${currencySymbol}`;
}

/**
 * Formate une adresse pour l'affichage
 */
function formatAddress(address: any, customerInfo?: any): string[] {
  if (!address || (!address.address && !address.city)) {
    // Si pas d'adresse, utiliser les infos client
    const lines = [];
    if (customerInfo?.name) lines.push(customerInfo.name);
    if (customerInfo?.email) lines.push(customerInfo.email);
    if (customerInfo?.phone) lines.push(`Tél: ${customerInfo.phone}`);
    return lines.length > 0 ? lines : ['Informations non disponibles'];
  }
  
  const lines = [];
  if (address.name) lines.push(address.name);
  if (address.address) lines.push(address.address);
  if (address.city && address.postalCode) {
    lines.push(`${address.postalCode} ${address.city}`);
  } else if (address.city) {
    lines.push(address.city);
  }
  if (address.country) lines.push(address.country);
  if (address.phone) lines.push(address.phone);
  
  return lines;
}

/**
 * Ajoute le logo ou le nom du site dans l'en-tête
 */
function addCompanyHeader(doc: any, margin: number, logoBase64?: string) {
  const companyName = 'Boutik\'nakà';
  const subtitle = 'Service proposé par Dinitech';
  
  // Si un logo existe (en base64), l'ajouter SANS texte
  if (logoBase64 && logoBase64 !== 'none' && logoBase64.startsWith('data:')) {
    try {
      // Dimensions du logo - jsPDF préservera automatiquement les proportions
      // En spécifiant seulement la largeur, la hauteur s'ajustera proportionnellement
      const logoMaxWidth = 55;  // Largeur encore réduite pour un logo plus discret
      
      // Déterminer le format de l'image
      let format = 'PNG';
      if (logoBase64.includes('data:image/jpeg') || logoBase64.includes('data:image/jpg')) {
        format = 'JPEG';
      } else if (logoBase64.includes('data:image/gif')) {
        format = 'GIF';
      }
      
      // Position du logo à la marge initiale (sans décalage)
      const logoStartX = margin; // Position à la marge standard
      
      // Ajouter l'image en spécifiant seulement la largeur pour préserver les proportions
      // jsPDF calculera automatiquement la hauteur proportionnelle
      doc.addImage(logoBase64, format, logoStartX, 15, logoMaxWidth, 0);
      
      // PAS DE TEXTE - le logo remplace complètement le texte
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo au PDF:', error);
      // Fallback: afficher le nom sans logo
      doc.setFontSize(16);
      doc.setTextColor(220, 20, 60);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, margin, 22);
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, margin, 27);
    }
  } else {
    // Utiliser le nom du site en grand si pas de logo
    doc.setFontSize(16);
    doc.setTextColor(220, 20, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, margin, 22);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, margin, 27);
  }
}

/**
 * Récupère le prix converti s'il existe, sinon retourne le prix original
 */
function getConvertedPrice(price: number, invoiceData: InvoiceData): number {
  if (invoiceData.convertedPrices && invoiceData.convertedPrices[price.toString()]) {
    return invoiceData.convertedPrices[price.toString()];
  }
  return price;
}

/**
 * Détermine le type de document selon le statut
 */
function getDocumentType(status: string): string {
  return status === 'QUOTE' ? 'DEVIS' : 'FACTURE';
}

/**
 * Génère le titre de facture avec préfixe selon le type de commande
 */
function generateInvoiceTitle(orderNumber: string): string {
  if (orderNumber.startsWith('DEV-')) {
    // Pour les devis : PROFORMA #DEV-ANNEE-XXXX
    return `PROFORMA #${orderNumber}`;
  } else if (orderNumber.startsWith('CMD-')) {
    // Pour les commandes : FACTURE #CMD-ANNEE-XXXX
    return `FACTURE #${orderNumber}`;
  } else {
    // Fallback pour les autres formats
    return `FACTURE #${orderNumber}`;
  }
}

/**
 * Génère un PDF de facture avec les prix convertis
 */
export function generateInvoicePDF(invoiceData: InvoiceData): string {
  try {
    // Créer un nouveau document PDF en français, format A4
    const doc = new jsPDF();
    
    // Dimensions de la page
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // Marges réduites pour plus d'espace
  const availableWidth = pageWidth - (2 * margin); // Largeur disponible pour les tableaux
    
    // Formater la date
    const invoiceDate = format(new Date(invoiceData.createdAt), 'dd/MM/yyyy');
    
    // === EN-TÊTE AVEC LOGO ===
    // Ajouter le logo ou le nom du site
    addCompanyHeader(doc, margin, invoiceData.selectedLogo);
    
    // Numéro de commande (droite)
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    const invoiceTitle = generateInvoiceTitle(invoiceData.orderNumber);
    doc.text(invoiceTitle, pageWidth - margin, 22, { align: 'right' });
    
    // === ADRESSES DYNAMIQUES ===
    // Calculer la position Y en fonction de la présence du logo
    let currentY = 50; // Position par défaut
    if (invoiceData.selectedLogo && invoiceData.selectedLogo !== 'none' && invoiceData.selectedLogo.startsWith('data:')) {
      // Si logo présent: position logo (15) + hauteur estimée du logo réduit (~28px) + espace très réduit (-3px)
      currentY = 15 + 28 - 3; // 40px - chevauchement pour proximité maximale
    }
    
    // Adresse de facturation (gauche)
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse de facturation', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const billingLines = formatAddress(invoiceData.billingAddress, invoiceData.customer);
    billingLines.forEach((line, index) => {
      // Mettre le nom en gras s'il s'agit de la première ligne et que c'est le nom du client
      if (index === 0 && line === invoiceData.customer.name) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(line, margin, currentY + 8 + (index * 4));
    });
    doc.setFont('helvetica', 'normal');
    
    // Vérifier s'il y a des produits physiques dans la commande
    const hasPhysicalProducts = invoiceData.items.some(item => item.type === 'PRODUCT');
    
    // Adresse de livraison (droite) - seulement si il y a des produits
    const rightCol = pageWidth / 2 + 10;
    
    if (hasPhysicalProducts) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      if (invoiceData.shippingAddress) {
        // Il y a une adresse de livraison (livraison à domicile)
        doc.text('Adresse de livraison', rightCol, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        const shippingLines = formatAddress(invoiceData.shippingAddress, invoiceData.customer);
        shippingLines.forEach((line, index) => {
          // Mettre le nom en gras s'il s'agit de la première ligne et que c'est le nom du client
          if (index === 0 && line === invoiceData.customer.name) {
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setFont('helvetica', 'normal');
          }
          doc.text(line, rightCol, currentY + 8 + (index * 4));
        });
      } else {
        // Pas d'adresse de livraison (retrait au magasin)
        doc.text('Mode de livraison', rightCol, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Retrait au magasin', rightCol, currentY + 8);
      }
      doc.setFont('helvetica', 'normal');
    }
    // Si pas de produits physiques, on n'affiche rien à droite
    
    // === INFORMATIONS DE COMMANDE ===
    currentY += 35;
    
    // === TABLEAU DES INFORMATIONS DE COMMANDE ===
    const orderInfoData = [
      [invoiceDate, invoiceData.orderNumber, invoiceDate]
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Date de facturation', 'Référence de l\'achat', 'Date de commande']],
      body: orderInfoData,
      theme: 'grid',
      headStyles: {
        fillColor: [128, 128, 128] as [number, number, number], // Fond gris foncé
        textColor: [255, 255, 255] as [number, number, number], // Texte blanc
        fontStyle: 'bold' as const,
        fontSize: 8, // Plus compact
        cellPadding: 2, // Plus compact
        halign: 'center' as const
      },
      bodyStyles: {
        fontSize: 7, // Plus compact
        cellPadding: 1.5, // Plus compact
        halign: 'center' as const,
        textColor: [0, 0, 0] as [number, number, number] // Texte noir
      },
      columnStyles: {
        0: { cellWidth: availableWidth / 3 },
        1: { cellWidth: availableWidth / 3 },
        2: { cellWidth: availableWidth / 3 }
      },
      tableWidth: availableWidth, // Forcer la largeur complète
      margin: { left: margin, right: margin }
    });
    
    // === TABLEAU PRINCIPAL AVEC ARTICLES ET TOTAUX ===
    currentY = (doc as any).lastAutoTable.finalY + 8;
    
    // === TABLEAU DES ARTICLES ===
    const articlesData = invoiceData.items.map(item => {
      const convertedUnitPrice = getConvertedPrice(item.unitPrice, invoiceData);
      const convertedTotalPrice = getConvertedPrice(item.totalPrice, invoiceData);
      
      // Calculer le prix original avant réduction pour affichage
      const originalPrice = convertedUnitPrice * item.quantity;
      
      // Préparer l'affichage du prix avec réduction si applicable
      let priceDisplay = formatPrice(convertedTotalPrice, invoiceData.currencySymbol);
      
      if (item.discountAmount && item.discountAmount > 0) {
        const convertedDiscountAmount = getConvertedPrice(item.discountAmount, invoiceData);
        const discountLabel = item.discountType === 'PERCENTAGE' 
          ? `${item.discountValue}%` 
          : formatPrice(convertedDiscountAmount, invoiceData.currencySymbol);
        
        priceDisplay = `${formatPrice(originalPrice, invoiceData.currencySymbol)}\n-${discountLabel}\n= ${formatPrice(convertedTotalPrice, invoiceData.currencySymbol)}`;
      }
      
      return [
      item.name,
        formatPrice(convertedUnitPrice, invoiceData.currencySymbol),
      item.quantity.toString(),
        priceDisplay
      ];
    });
    
    autoTable(doc, {
      startY: currentY,
      head: [['Article', 'Prix unitaire', 'Qté', 'Total']],
      body: articlesData,
      theme: 'grid',
      headStyles: {
        fillColor: [128, 128, 128] as [number, number, number], // Fond gris foncé
        textColor: [255, 255, 255] as [number, number, number], // Texte blanc
        fontStyle: 'bold' as const,
        fontSize: 8, // Plus compact
        cellPadding: 2, // Plus compact
        halign: 'center' as const
      },
      bodyStyles: {
        fontSize: 7, // Taille réduite pour accommoder les réductions
        cellPadding: 2, // Padding légèrement augmenté
        textColor: [0, 0, 0] as [number, number, number], // Texte noir
        valign: 'middle' as const
      },
      columnStyles: {
        0: { cellWidth: availableWidth * 0.5 }, // 50% pour Article
        1: { cellWidth: availableWidth * 0.15, halign: 'right' }, // 15% pour Prix unitaire
        2: { cellWidth: availableWidth * 0.1, halign: 'center' }, // 10% pour Qté
        3: { cellWidth: availableWidth * 0.25, halign: 'right' } // 25% pour Total avec réductions
      },
      tableWidth: availableWidth, // Forcer la largeur complète
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        // Colorer les cellules avec réductions
        if (data.column.index === 3 && data.cell.text.join('').includes('-')) {
          data.cell.styles.textColor = [0, 100, 0]; // Vert pour les réductions
          data.cell.styles.fontSize = 6;
        }
      }
    });
    
    // === TABLEAU DES TOTAUX ===
    const convertedTotal = getConvertedPrice(invoiceData.total, invoiceData);
    
    // Calculer le sous-total des articles (avant réduction globale)
    const itemsSubtotal = invoiceData.items.reduce((sum, item) => {
      return sum + getConvertedPrice(item.totalPrice, invoiceData);
    }, 0);
    
    const totalsData = [];
    
    // Sous-total articles
    totalsData.push(['Sous-total Articles', formatPrice(itemsSubtotal, invoiceData.currencySymbol)]);
    
    // Réduction globale si elle existe
    if (invoiceData.globalDiscount && invoiceData.globalDiscount.amount > 0) {
      const convertedDiscountAmount = getConvertedPrice(invoiceData.globalDiscount.amount, invoiceData);
      const discountLabel = invoiceData.globalDiscount.type === 'PERCENTAGE' 
        ? `Réduction globale (${invoiceData.globalDiscount.value}%)`
        : `Réduction globale`;
      
      totalsData.push([discountLabel, `-${formatPrice(convertedDiscountAmount, invoiceData.currencySymbol)}`]);
    }
    
    // Frais de livraison
    totalsData.push(['Frais de livraison', 'Gratuit']);
    
    // Total final
    totalsData.push(['TOTAL', formatPrice(convertedTotal, invoiceData.currencySymbol)]);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      body: totalsData,
      theme: 'grid',
      bodyStyles: {
        fontSize: 8, // Taille augmentée pour meilleure lisibilité
        cellPadding: 1.5, // Plus compact
        fontStyle: 'bold' as const,
        textColor: [0, 0, 0] as [number, number, number] // Texte noir
      },
      columnStyles: {
        0: { cellWidth: availableWidth * 0.85, halign: 'right' }, // 85% pour Labels (cohérent avec articles)
        1: { cellWidth: availableWidth * 0.15, halign: 'right' } // 15% pour Montants (cohérent avec total articles)
      },
      tableWidth: availableWidth, // Forcer la largeur complète
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        // Ligne TOTAL en gras et fond gris
        if (data.row.index === totalsData.length - 1) {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 9;
        }
        // Lignes de réduction en vert
        else if (data.cell.text[0] && data.cell.text[0].includes('Réduction')) {
          data.cell.styles.textColor = [0, 120, 0]; // Vert foncé
          data.cell.styles.fontStyle = 'bold';
        }
        // Montants de réduction en vert
        else if (data.column.index === 1 && data.cell.text[0] && data.cell.text[0].startsWith('-')) {
          data.cell.styles.textColor = [0, 120, 0]; // Vert foncé
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    // === MOYENS DE PAIEMENT ET MODE DE LIVRAISON (CÔTE À CÔTE) ===
    let finalY = (doc as any).lastAutoTable.finalY + 12;
    
    // Ajouter un petit espace entre les tableaux côte à côte
    const spacing = 6; // Petit espace entre les tableaux
    const tableWidth = (availableWidth - spacing) / 2; // Chaque tableau avec espace
    
    // Styles d'en-tête uniformes et compacts
    const uniformHeaderStyles = {
      fillColor: [128, 128, 128] as [number, number, number], // Fond gris foncé
      textColor: [255, 255, 255] as [number, number, number], // Texte blanc
      fontStyle: 'bold' as const,
      fontSize: 8, // Plus compact
      cellPadding: 2, // Plus compact
      halign: 'center' as const
    };
    
    const uniformBodyStyles = {
      fontSize: 7, // Plus compact
      cellPadding: 1.5, // Plus compact
      textColor: [0, 0, 0] as [number, number, number] // Texte noir
    };
    
    // === TABLEAU MODE DE LIVRAISON (GAUCHE) - seulement si produits physiques ===
    if (hasPhysicalProducts) {
      const deliveryData = [];
      
      if (invoiceData.delivery?.name) {
        let deliveryText = invoiceData.delivery.name;
        
        if (invoiceData.delivery.time) {
          deliveryText += ` (${invoiceData.delivery.time})`;
        }
        
        if (invoiceData.delivery.cost && invoiceData.delivery.cost > 0) {
          deliveryText += ` - ${invoiceData.delivery.cost.toLocaleString('fr-FR')} ${invoiceData.currencySymbol}`;
        } else {
          deliveryText += ' - Gratuit';
        }
        
        deliveryData.push([deliveryText]);
      } else {
        deliveryData.push(['Mode de livraison non spécifié']);
      }
      
      autoTable(doc, {
        startY: finalY,
        head: [['Mode de livraison']],
        body: deliveryData,
        theme: 'grid',
        headStyles: uniformHeaderStyles,
        bodyStyles: uniformBodyStyles,
        columnStyles: {
          0: { cellWidth: tableWidth } // Largeur exacte
        },
        margin: { left: margin },
        tableWidth: tableWidth, // Forcer la largeur du tableau
        tableLineColor: [0, 0, 0], // Bordures noires
        tableLineWidth: 0.1
      });
    }
    
    // === TABLEAU MOYEN DE PAIEMENT (DROITE) ===
    // Préparer les données des paiements avec dates
    const paymentData = [];
    if (invoiceData.payments && invoiceData.payments.length > 0) {
      invoiceData.payments.forEach(payment => {
        const methodLabel = getPaymentMethodLabel(payment.method);
        const providerInfo = payment.provider ? ` (${payment.provider})` : '';
        const paymentDate = format(new Date(payment.createdAt), 'dd/MM/yyyy');
        paymentData.push([
          `${methodLabel}${providerInfo}`,
          formatPrice(getConvertedPrice(payment.amount, invoiceData), invoiceData.currencySymbol),
          paymentDate
        ]);
      });
    } else {
      paymentData.push(['Aucun paiement n\'a été effectué', '', '']);
    }
    
    autoTable(doc, {
      startY: finalY,
      head: [['Moyen de paiement', 'Montant', 'Date']],
      body: paymentData,
      theme: 'grid',
      headStyles: uniformHeaderStyles,
      bodyStyles: uniformBodyStyles,
      columnStyles: {
        0: { cellWidth: tableWidth * 0.5 }, // 50% pour méthode
        1: { cellWidth: tableWidth * 0.3, halign: 'right' }, // 30% pour montant
        2: { cellWidth: tableWidth * 0.2, halign: 'center' } // 20% pour date
      },
      margin: { 
        left: hasPhysicalProducts ? margin + tableWidth + spacing : margin // Si pas de tableau livraison, commencer à gauche
      },
      tableWidth: tableWidth, // Forcer la largeur du tableau
      tableLineColor: [0, 0, 0], // Bordures noires
      tableLineWidth: 0.1
    });
    
    // === CONDITIONS ===
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('NB: En acceptant cet achat vous acceptez ces conditions suivantes', margin, finalY);
    
    const conditions = [
      '• La livraison se 2 ou 3 semaines est compté à partir de la réception dans notre entrepôt ou dépôt des fonds à cause des circonstances de transit de colis',
      '• Comme la prix affiché sur la facture est le prix du produit sur le fournisseur et les frais de livraison de France vers Madagascar donc en cas de retour',
      '• le retour Madagascar vers la France sera à la charge du client'
    ];
    
    conditions.forEach((condition, index) => {
      const lines = doc.splitTextToSize(condition, pageWidth - 2 * margin);
      doc.text(lines, margin, finalY + 5 + (index * 8));
      finalY += lines.length * 3;
    });
    
    finalY += 10;
    doc.text('Pour savoir plus sur ces conditions, veuillez visiter le lien: https://www.boutik-naka.com/content/3-conditions-utilisation', margin, finalY);
    
    // === PIED DE PAGE ===
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    
    let currentFooterY = pageHeight - 25; // Position de départ pour le pied de page
    
    // Afficher le texte de pied personnalisé si activé
    if (invoiceData.showInvoiceFooter && invoiceData.invoiceFooterText) {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0); // Noir pour le texte personnalisé
      
      // Diviser le texte en lignes
      const lines = invoiceData.invoiceFooterText.split('\n');
      lines.forEach((line, index) => {
        if (line.trim()) {
          doc.text(line.trim(), margin, currentFooterY - (index * 4), { align: 'left' });
        }
      });
      
      // Ajuster la position pour les informations de l'entreprise
      currentFooterY -= (lines.length * 4) + 10;
      
      // Remettre la couleur grise pour les infos de l'entreprise
      doc.setFontSize(7);
      doc.setTextColor(128, 128, 128);
    }
    
    // Informations de l'entreprise (toujours affichées)
    const footerText = 'Boutik nakà - Service d\'achat & Marketplace à Madagascar - 102-Lot Lazaret Nord - Croissement Garage Fano - 201 Diego-Suarez - Diégo Suarez - ANTSIRANANA';
    doc.text(footerText, pageWidth / 2, currentFooterY, { align: 'center' });
    
    const footerText2 = 'Pour toute assistance / réclamation : contact@boutik-naka.com';
    doc.text(footerText2, pageWidth / 2, currentFooterY + 5, { align: 'center' });
    
    const footerText3 = 'DINITECH Multi-Services | Services Boutik\'nakà - NIF: 6002203980 | STAT: 45174 71 2019 102041';
    doc.text(footerText3, pageWidth / 2, currentFooterY + 10, { align: 'center' });
    
    // Retourner le document au format base64
    return doc.output('datauristring');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
}

// Fonction de traduction des statuts
function getStatusText(status: string): string {
  switch (status) {
    case 'QUOTE':
      return 'Devis en attente de paiement';
    case 'PENDING':
      return 'En attente';
    case 'PARTIALLY_PAID':
      return 'Payée partiellement';
    case 'PAID':
      return 'Commande payée';
    case 'PROCESSING':
      return 'En traitement';
    case 'SHIPPING':
      return 'En cours de livraison';
    case 'DELIVERED':
      return 'Commande livrée';
    case 'CANCELLED':
      return 'Commande annulée';
    case 'FINISHED':
      return 'Commande terminée';
    default:
      return status;
  }
}

// Fonction de traduction des types d'articles
function getItemTypeText(type: string): string {
  switch (type) {
    case 'PRODUCT':
      return 'Produit';
    case 'SERVICE':
      return 'Service';
    case 'OFFER':
      return 'Abonnement';
    default:
      return type;
  }
}

// Fonction de traduction des méthodes de paiement
function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'mobile_money':
      return 'Mobile Money';
    case 'bank_transfer':
      return 'Virement bancaire';
    case 'cash':
      return 'Espèce';
    case 'paypal':
      return 'PayPal';
    default:
      return method;
  }
}
