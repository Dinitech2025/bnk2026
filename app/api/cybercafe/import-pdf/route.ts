import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Fonction générique pour extraire des codes depuis un PDF avec OCR automatique
async function extractFromPDFBuffer(buffer: Buffer, filename: string): Promise<string> {
  console.log(`🔍 Analyse du PDF: ${filename}`);
  console.log(`📄 Taille: ${buffer.length} bytes`);
  
  // Détecter les caractéristiques depuis le nom de fichier
  let detectedPrice = 1000;
  let detectedDuration = '1h';
  let detectedData = '2 GiB';
  
  if (filename.toLowerCase().includes('1000')) {
    detectedPrice = 1000;
    detectedDuration = '1h';
    detectedData = '2 GiB';
  } else if (filename.toLowerCase().includes('500')) {
    detectedPrice = 500;
    detectedDuration = '30min';
    detectedData = '1 GiB';
  } else if (filename.toLowerCase().includes('2000')) {
    detectedPrice = 2000;
    detectedDuration = '2h';
    detectedData = '3 GiB';
  } else if (filename.toLowerCase().includes('300')) {
    detectedPrice = 300;
    detectedDuration = '20min';
    detectedData = '500 MB';
  }
  
  console.log(`🎯 Type détecté: ${detectedDuration}, ${detectedData}, ${detectedPrice}Ar`);
  
  // Extraction OCR direct uniquement
  console.log('🔄 Démarrage de l\'extraction OCR directe...');
  
  try {
    const extractedCodes = await performDirectOCRExtraction(buffer, filename, detectedPrice, detectedDuration);
    
    if (extractedCodes && extractedCodes.length > 0) {
      console.log(`✅ ${extractedCodes.length} codes extraits avec succès par OCR direct`);
      return formatTicketsFromCodes(extractedCodes, detectedDuration, detectedData, detectedPrice);
    } else {
      console.log('⚠️ Aucun code extrait par OCR');
      throw new Error('Aucun code de ticket trouvé dans le PDF par extraction OCR');
    }
  } catch (ocrError: any) {
    console.error('❌ Erreur lors de l\'extraction OCR directe:', ocrError.message);
    throw new Error(`Erreur d'extraction OCR: ${ocrError.message || 'Erreur inconnue'}`);
  }
}

// Fonction helper pour obtenir le nombre de pages d'un PDF
async function getPageCount(buffer: Buffer): Promise<number> {
  try {
    const pdf = await import('pdf-parse');
    // Utiliser directement le buffer au lieu d'un fichier
    const data = await pdf.default(buffer);
    console.log(`📊 Pages détectées par pdf-parse: ${data.numpages}`);
    return data.numpages;
  } catch (error) {
    console.warn('⚠️ Erreur pdf-parse pour compter les pages:', error);
    
    // Essayer une méthode alternative - compter les objets "Page" dans le PDF
    try {
      const pdfText = buffer.toString('latin1');
      const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g);
      const alternativeCount = pageMatches ? pageMatches.length : 6;
      console.log(`📊 Pages détectées par méthode alternative: ${alternativeCount}`);
      return alternativeCount;
    } catch (altError) {
      console.warn('⚠️ Méthode alternative échouée, utilisation de 6 par défaut');
      return 6; // Valeur par défaut basée sur votre PDF
    }
  }
}

// Fonction pour obtenir le pattern de code selon la durée (plus flexible)
function getCodePatternForDuration(duration: string): RegExp {
  // Pattern basé uniquement sur la durée + caractères variables
  // Ex: 1h + n'importe quels caractères, 30m + n'importe quels caractères
  // Ceci permet de capturer 1h2G, 1h3G, 1h4G, etc.
  return new RegExp(`${duration}[A-Za-z0-9]{3,8}`, 'g');
}

// Fonction pour déterminer la durée basée sur les 2-3 premiers caractères du code
function getDurationFromCodePrefix(code: string): string | null {
  // Vérifier les patterns de durée dans les 2-3 premiers caractères
  const codeStart = code.substring(0, 3).toLowerCase();
  
  // Patterns de durée exacte (2-3 caractères)
  if (code.startsWith('1h')) return '1h';
  if (code.startsWith('2h')) return '2h';
  if (code.startsWith('3h')) return '3h';
  if (code.startsWith('4h')) return '4h';
  if (code.startsWith('5h')) return '5h';
  if (code.startsWith('6h')) return '6h';
  if (code.startsWith('8h')) return '8h';
  if (code.startsWith('10h')) return '10h';
  if (code.startsWith('24h')) return '24h';
  
  // Minutes (15m, 20m, 30m)
  if (code.startsWith('15m')) return '15m';
  if (code.startsWith('20m')) return '20m';
  if (code.startsWith('30m')) return '30m';
  
  // Mois (1m, 3m, 6m)
  if (code.startsWith('1m')) return '1m';
  if (code.startsWith('3m')) return '3m';
  if (code.startsWith('6m')) return '6m';
  
  // Semaines et années
  if (code.startsWith('1s')) return '1s';
  if (code.startsWith('1y')) return '1y';
  
  return null;
}

// Fonction pour extraire les codes depuis le texte selon un pattern
function extractCodesFromText(text: string, pattern: RegExp): string[] {
  const matches: string[] = text.match(pattern) || [];
  
  // Analyser la distribution des longueurs pour déterminer la longueur optimale
  const getLengthDistribution = (codes: string[]) => {
    const distribution: Record<number, number> = {};
    codes.forEach(code => {
      const length = code.length;
      distribution[length] = (distribution[length] || 0) + 1;
    });
    return distribution;
  };
  
  const getMostFrequentLength = (distribution: Record<number, number>) => {
    let maxCount = 0;
    let mostFrequentLength = 0;
    Object.entries(distribution).forEach(([length, count]) => {
      if ((count as number) > maxCount) {
        maxCount = count as number;
        mostFrequentLength = parseInt(length);
      }
    });
    return mostFrequentLength;
  };
  
  // Séparer les codes par type - nouvelle logique: s=semaines, m=mois/minutes selon chiffres, y=ans
  const codes1s = matches.filter(code => code.startsWith('1s')); // 1 semaine
  const codes1m = matches.filter(code => code.startsWith('1m')); // 1 mois
  const codes3m = matches.filter(code => code.startsWith('3m')); // 3 mois
  const codes6m = matches.filter(code => code.startsWith('6m')); // 6 mois
  const codes15m = matches.filter(code => code.startsWith('15m')); // 15 minutes
  const codes20m = matches.filter(code => code.startsWith('20m')); // 20 minutes
  const codes30m = matches.filter(code => code.startsWith('30m')); // 30 minutes
  const codes1h = matches.filter(code => code.startsWith('1h'));
  const codes2h = matches.filter(code => code.startsWith('2h'));
  const codes3h = matches.filter(code => code.startsWith('3h'));
  const codes4h = matches.filter(code => code.startsWith('4h'));
  const codes5h = matches.filter(code => code.startsWith('5h'));
  const codes6h = matches.filter(code => code.startsWith('6h'));
  const codes8h = matches.filter(code => code.startsWith('8h'));
  const codes10h = matches.filter(code => code.startsWith('10h'));
  const codes24h = matches.filter(code => code.startsWith('24h'));
  const codes1y = matches.filter(code => code.startsWith('1y')); // 1 an
  
  // Déterminer les longueurs optimales pour chaque type
  const length1sDist = getLengthDistribution(codes1s);
  const length1mDist = getLengthDistribution(codes1m);
  const length3mDist = getLengthDistribution(codes3m);
  const length6mDist = getLengthDistribution(codes6m);
  const length15mDist = getLengthDistribution(codes15m);
  const length20mDist = getLengthDistribution(codes20m);
  const length30mDist = getLengthDistribution(codes30m);
  const length1hDist = getLengthDistribution(codes1h);
  const length2hDist = getLengthDistribution(codes2h);
  const length3hDist = getLengthDistribution(codes3h);
  const length4hDist = getLengthDistribution(codes4h);
  const length5hDist = getLengthDistribution(codes5h);
  const length6hDist = getLengthDistribution(codes6h);
  const length8hDist = getLengthDistribution(codes8h);
  const length10hDist = getLengthDistribution(codes10h);
  const length24hDist = getLengthDistribution(codes24h);
  const length1yDist = getLengthDistribution(codes1y);
  
  // Longueurs optimales avec défauts appropriés
  const optimalLength1s = getMostFrequentLength(length1sDist) || 5;   // 1s + 3 chars (semaine)
  const optimalLength1m = getMostFrequentLength(length1mDist) || 5;   // 1m + 3 chars (mois)
  const optimalLength3m = getMostFrequentLength(length3mDist) || 5;   // 3m + 3 chars (mois)
  const optimalLength6m = getMostFrequentLength(length6mDist) || 5;   // 6m + 3 chars (mois)
  const optimalLength15m = getMostFrequentLength(length15mDist) || 7; // 15m + 3 chars (minutes)
  const optimalLength20m = getMostFrequentLength(length20mDist) || 7; // 20m + 3 chars (minutes)
  const optimalLength30m = getMostFrequentLength(length30mDist) || 9; // 30m + défaut (minutes)
  const optimalLength1h = getMostFrequentLength(length1hDist) || 8;   // défaut à 8
  const optimalLength2h = getMostFrequentLength(length2hDist) || 5;   // défaut à 5 (2h + 3 chars)
  const optimalLength3h = getMostFrequentLength(length3hDist) || 5;   // 3h + 3 chars
  const optimalLength4h = getMostFrequentLength(length4hDist) || 5;   // 4h + 3 chars
  const optimalLength5h = getMostFrequentLength(length5hDist) || 5;   // 5h + 3 chars
  const optimalLength6h = getMostFrequentLength(length6hDist) || 5;   // 6h + 3 chars
  const optimalLength8h = getMostFrequentLength(length8hDist) || 5;   // 8h + 3 chars
  const optimalLength10h = getMostFrequentLength(length10hDist) || 6; // 10h + 3 chars
  const optimalLength24h = getMostFrequentLength(length24hDist) || 7; // 24h + 3 chars
  const optimalLength1y = getMostFrequentLength(length1yDist) || 5;   // 1y + 3 chars (an)
  
  console.log(`📏 Distribution longueurs 1s (semaine): ${JSON.stringify(length1sDist)}`);
  console.log(`📏 Distribution longueurs 1m (mois): ${JSON.stringify(length1mDist)}`);
  console.log(`📏 Distribution longueurs 3m (mois): ${JSON.stringify(length3mDist)}`);
  console.log(`📏 Distribution longueurs 6m (mois): ${JSON.stringify(length6mDist)}`);
  console.log(`📏 Distribution longueurs 15m (minutes): ${JSON.stringify(length15mDist)}`);
  console.log(`📏 Distribution longueurs 20m (minutes): ${JSON.stringify(length20mDist)}`);
  console.log(`📏 Distribution longueurs 30m (minutes): ${JSON.stringify(length30mDist)}`);
  console.log(`📏 Distribution longueurs 1h: ${JSON.stringify(length1hDist)}`);
  console.log(`📏 Distribution longueurs 2h: ${JSON.stringify(length2hDist)}`);
  console.log(`📏 Distribution longueurs 3h: ${JSON.stringify(length3hDist)}`);
  console.log(`📏 Distribution longueurs 4h: ${JSON.stringify(length4hDist)}`);
  console.log(`📏 Distribution longueurs 5h: ${JSON.stringify(length5hDist)}`);
  console.log(`📏 Distribution longueurs 6h: ${JSON.stringify(length6hDist)}`);
  console.log(`📏 Distribution longueurs 8h: ${JSON.stringify(length8hDist)}`);
  console.log(`📏 Distribution longueurs 10h: ${JSON.stringify(length10hDist)}`);
  console.log(`📏 Distribution longueurs 24h: ${JSON.stringify(length24hDist)}`);
  console.log(`📏 Distribution longueurs 1y (an): ${JSON.stringify(length1yDist)}`);
  
  console.log(`🎯 Longueur optimale 1s (semaine): ${optimalLength1s} chars`);
  console.log(`🎯 Longueur optimale 1m (mois): ${optimalLength1m} chars`);
  console.log(`🎯 Longueur optimale 3m (mois): ${optimalLength3m} chars`);
  console.log(`🎯 Longueur optimale 6m (mois): ${optimalLength6m} chars`);
  console.log(`🎯 Longueur optimale 15m (minutes): ${optimalLength15m} chars`);
  console.log(`🎯 Longueur optimale 20m (minutes): ${optimalLength20m} chars`);
  console.log(`🎯 Longueur optimale 30m (minutes): ${optimalLength30m} chars`);
  console.log(`🎯 Longueur optimale 1h: ${optimalLength1h} chars`);
  console.log(`🎯 Longueur optimale 2h: ${optimalLength2h} chars`);
  console.log(`🎯 Longueur optimale 3h: ${optimalLength3h} chars`);
  console.log(`🎯 Longueur optimale 4h: ${optimalLength4h} chars`);
  console.log(`🎯 Longueur optimale 5h: ${optimalLength5h} chars`);
  console.log(`🎯 Longueur optimale 6h: ${optimalLength6h} chars`);
  console.log(`🎯 Longueur optimale 8h: ${optimalLength8h} chars`);
  console.log(`🎯 Longueur optimale 10h: ${optimalLength10h} chars`);
  console.log(`🎯 Longueur optimale 24h: ${optimalLength24h} chars`);
  console.log(`🎯 Longueur optimale 1y (an): ${optimalLength1y} chars`);
  
  return matches.filter(code => {
    // Filtrer les codes trop courts
    if (code.length < 4) return false;
    
    // Vérifier la longueur optimale selon le type de code
    if (code.startsWith('1s') && code.length !== optimalLength1s) return false;
    if (code.startsWith('1m') && code.length !== optimalLength1m) return false;
    if (code.startsWith('3m') && code.length !== optimalLength3m) return false;
    if (code.startsWith('6m') && code.length !== optimalLength6m) return false;
    if (code.startsWith('15m') && code.length !== optimalLength15m) return false;
    if (code.startsWith('20m') && code.length !== optimalLength20m) return false;
    if (code.startsWith('30m') && code.length !== optimalLength30m) return false;
    if (code.startsWith('1h') && code.length !== optimalLength1h) return false;
    if (code.startsWith('2h') && code.length !== optimalLength2h) return false;
    if (code.startsWith('3h') && code.length !== optimalLength3h) return false;
    if (code.startsWith('4h') && code.length !== optimalLength4h) return false;
    if (code.startsWith('5h') && code.length !== optimalLength5h) return false;
    if (code.startsWith('6h') && code.length !== optimalLength6h) return false;
    if (code.startsWith('8h') && code.length !== optimalLength8h) return false;
    if (code.startsWith('10h') && code.length !== optimalLength10h) return false;
    if (code.startsWith('24h') && code.length !== optimalLength24h) return false;
    if (code.startsWith('1y') && code.length !== optimalLength1y) return false;
    
    // Exclure les faux codes qui contiennent des mots de description
    const lowerCode = code.toLowerCase();
    if (/gib500/i.test(code) ||                 // pour détecter GiB500A ou gib500a spécifiquement
        lowerCode.includes('500ar') || 
        lowerCode.includes('500a') ||
        lowerCode.includes('1000ar') ||
        lowerCode.includes('1000a') ||
        lowerCode.includes('coupon') ||
        lowerCode.includes('wifi') ||
        lowerCode.includes('zone')) {
      return false;
    }
    
    return true;
  });
}

function extractCodesAndPricesFromText(text: string): Array<{
  duration: string;
  price: number;
  codes: string[];
}> {
  console.log('🔍 Extraction basée sur les 2-3 premiers caractères des codes...');
  
  // Pattern pour extraire tous les codes possibles (6+ caractères alphanumériques)
  const codePattern = /\b[A-Za-z0-9]{6,}\b/g;
  const pricePattern = /(\d+)\s*Ar/g;
  
  // Extraire tous les codes du texte
  const allCodes = text.match(codePattern) || [];
  console.log(`📋 ${allCodes.length} codes potentiels trouvés:`, allCodes.slice(0, 10));
  
  // Extraire tous les prix du texte
  const allPrices: number[] = [];
  let priceMatch;
  while ((priceMatch = pricePattern.exec(text)) !== null) {
    allPrices.push(parseInt(priceMatch[1]));
  }
  console.log(`💰 ${allPrices.length} prix trouvés:`, allPrices);
  
  // Grouper les codes par durée (déterminée par les 2-3 premiers caractères)
  const codesByDuration: { [duration: string]: string[] } = {};
  
  allCodes.forEach(code => {
    const duration = getDurationFromCodePrefix(code);
    if (duration) {
      if (!codesByDuration[duration]) {
        codesByDuration[duration] = [];
      }
      codesByDuration[duration].push(code);
      console.log(`✅ Code ${code} → durée ${duration}`);
    } else {
      console.log(`⚠️ Code ${code} → durée non reconnue (premiers caractères: ${String(code).substring(0, 3)})`);
    }
  });
  
  // Associer chaque durée avec un prix (logique simple pour commencer)
  const results: Array<{ duration: string; price: number; codes: string[] }> = [];
  
  Object.entries(codesByDuration).forEach(([duration, codes]) => {
    if (codes.length > 0) {
      // Pour l'instant, utiliser le premier prix ou un prix par défaut basé sur la durée
      let price = allPrices.length > 0 ? allPrices[0] : 1000;
      
      // Prix par défaut basés sur la durée (à ajuster selon vos tarifs)
      if (duration.includes('30m')) price = 500;
      else if (duration.includes('1h')) price = 1000;
      else if (duration.includes('2h')) price = 2000;
      else if (duration.includes('3h')) price = 3000;
      
      results.push({
        duration,
        price,
        codes
      });
      
      console.log(`🎯 Durée ${duration}: ${codes.length} codes, prix: ${price} Ar`);
    }
  });
  
  // Si aucun code trouvé avec la nouvelle méthode, fallback vers l'ancienne
  if (results.length === 0) {
    console.log('🔄 Fallback vers l\'ancienne méthode basée sur les patterns...');
    return extractCodesOldMethod(text);
  }
  
  return results;
}

// Fonction fallback avec l'ancienne méthode
function extractCodesOldMethod(text: string): Array<{
  duration: string;
  price: number;
  codes: string[];
}> {
  const patterns = [
    /DT WIFI ZONE\s+\d+\s*\n\s*Coupon\s*\n\s*([A-Za-z0-9]+)\s*\n\s*(\d+[smhy])\s+[^0-9]*(\d+)\s*Ar/gi,
    /([A-Za-z0-9]*(\d+[smhy])[A-Za-z0-9]*)\s*.*?(\d+)\s*Ar/gi,
    /(\d+[smhy])\s+[^0-9]*(\d+)\s*Ar/gi
  ];
  
  const results: Array<{ duration: string; price: number; codes: string[] }> = [];
  const foundCombinations = new Set<string>();
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    let match;
    
    console.log(`🔍 Utilisation du pattern ${i + 1}...`);
    
    while ((match = pattern.exec(text)) !== null) {
      let code = '';
      let duration = '';
      let price: number = 0;
      
      if (i === 0) {
        // Pattern principal
        code = match[1];
        duration = match[2];
        price = parseInt(match[3]);
      } else if (i === 1) {
        // Pattern alternatif
        code = match[1];
        duration = match[2];
        price = parseInt(match[3]);
      } else {
        // Pattern simple - chercher les codes séparément
        duration = match[1];
        price = parseInt(match[2]);
        
        // Chercher les codes avec cette durée dans le texte environnant
        const durationPattern = new RegExp(`([A-Za-z0-9]*${duration}[A-Za-z0-9]*)`, 'gi');
        let codeMatch;
        while ((codeMatch = durationPattern.exec(text)) !== null) {
          if (codeMatch[1] && codeMatch[1].length >= 6) {
            code = codeMatch[1];
            break;
          }
        }
      }
      
      if (code && duration && price > 0) {
        const key = `${duration}-${price}`;
        if (!foundCombinations.has(key)) {
          foundCombinations.add(key);
          
          // Chercher tous les codes avec cette durée
          const allCodesPattern = new RegExp(`([A-Za-z0-9]*${duration}[A-Za-z0-9]*)`, 'gi');
          const allCodes: string[] = [];
          let allCodesMatch;
          
          while ((allCodesMatch = allCodesPattern.exec(text)) !== null) {
            const foundCode = allCodesMatch[1];
            if (foundCode && foundCode.length >= 6 && !allCodes.includes(foundCode)) {
              allCodes.push(foundCode);
            }
          }
          
          console.log(`✅ Trouvé: ${duration} = ${price}Ar (${allCodes.length} codes)`);
          
          results.push({
            duration: duration,
            price: price,
            codes: allCodes
          });
        }
      }
    }
  }
  
  return results;
}

// Fonction pour formater les tickets depuis une liste de codes
function formatTicketsFromCodes(codes: string[], duration: string, data: string, price: number): string {
  console.log(`✅ ${codes.length} codes formatés pour ${duration}, ${data}, ${price}Ar`);
  console.log('📋 Échantillon:', codes.slice(0, 5).join(', '));
  
  let formattedText = '';
  codes.forEach((code, index) => {
    formattedText += `DT WIFI ZONE ${index + 1}\n`;
    formattedText += `Coupon\n`;
    formattedText += `${code}\n`;
    formattedText += `${duration} ${data} ${price}Ar\n\n`;
  });
  
  return formattedText;
}

// GET method for testing
export async function GET() {
  return NextResponse.json({ message: 'PDF Import API is working', status: 'ok' });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Fichier PDF requis' },
        { status: 400 }
      );
    }
    
    console.log('PDF file received:', file.name, file.size, 'bytes');

    try {
      // EXTRACTION RÉELLE DU PDF UNIQUEMENT
      let extractedText = '';
      
      try {
        // Essayer d'abord avec pdf-parse pour les PDFs avec du texte
        const pdf = await import('pdf-parse');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdf.default(buffer);
        
        if (data.text && data.text.trim().length > 10) {
          extractedText = data.text;
          console.log('✅ Texte extrait avec pdf-parse');
        } else {
          // PDF avec images - extraire depuis le buffer brut
          console.log('📸 PDF avec images détecté, extraction depuis le buffer...');
          const buffer = Buffer.from(arrayBuffer);
          extractedText = await extractFromPDFBuffer(buffer, file.name);
        }
      } catch (pdfError: any) {
        console.log('⚠️ Erreur pdf-parse, tentative d\'extraction buffer...', pdfError.message);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        extractedText = await extractFromPDFBuffer(buffer, file.name);
      }
      
      // Vérifier que l'extraction a réussi
      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { 
            error: 'Impossible d\'extraire des données du PDF',
            details: 'Le PDF ne contient pas de codes de tickets lisibles ou est corrompu'
          },
          { status: 400 }
        );
      }
      
              console.log('Extracted PDF text generated, length:', extractedText.length);
        console.log('Sample text:', extractedText.substring(0, 500));

        // Check if we have codes already extracted (from OCR direct extraction)
        let tickets = [];
        
        // Extract tickets with dynamic price detection
        console.log('🔍 Extraction dynamique des tickets avec prix depuis le PDF...');
        const extractedTickets = extractCodesAndPricesFromText(extractedText);
        
        if (extractedTickets.length > 0) {
          console.log(`✅ ${extractedTickets.length} types de tickets détectés dynamiquement`);
          
          for (const ticketData of extractedTickets) {
            // Convertir la durée en format d'affichage selon vos règles
            let displayDuration = ticketData.duration;
            
            if (ticketData.duration.endsWith('s')) {
              const num = ticketData.duration.replace('s', '');
              displayDuration = `${num} semaine${num !== '1' ? 's' : ''}`;
            } else if (ticketData.duration.endsWith('m')) {
              const num = parseInt(ticketData.duration.replace('m', ''));
              if (num >= 15 && num <= 30) {
                // 15m, 20m, 30m = minutes
                displayDuration = `${num} minutes`;
              } else {
                // 1m, 3m, 6m = mois
                displayDuration = `${num} mois`;
              }
            } else if (ticketData.duration.endsWith('h')) {
              const num = ticketData.duration.replace('h', '');
              displayDuration = `${num}h`;
            } else if (ticketData.duration.endsWith('y')) {
              const num = ticketData.duration.replace('y', '');
              displayDuration = `${num} an${num !== '1' ? 's' : ''}`;
            }
            
            tickets.push({
              duration: displayDuration,
              price: ticketData.price,
              quantity: ticketData.codes.length,
              codes: ticketData.codes
            });
          }
        } else {
          console.log('🔄 Aucun ticket trouvé avec extraction dynamique, essai du fallback...');
          // Fallback to parsing DT WIFI ZONE format
          tickets = parseWifiZoneTickets(extractedText);
        }
      
      console.log('Tickets parsed:', tickets.length, 'types found');
      console.log('Parsed tickets:', tickets);
      
      if (tickets.length === 0) {
        return NextResponse.json(
          { 
            error: 'Aucun ticket DT WIFI ZONE trouvé dans le PDF',
            debug: {
              textLength: extractedText.length,
              sampleText: extractedText.substring(0, 500)
            }
          },
          { status: 400 }
        );
      }

      // Create or update tickets in database
      const results = [];
      for (const ticketData of tickets) {
        // Check if ticket type already exists
        let existingTicket = await prisma.ticket.findFirst({
          where: { duration: ticketData.duration }
        });

        if (existingTicket) {
          // Update stock
          const previousStock = existingTicket.stock;
          existingTicket = await prisma.ticket.update({
            where: { id: existingTicket.id },
            data: { 
              stock: existingTicket.stock + ticketData.quantity,
              price: ticketData.price
            }
          });
          
          // Record stock update
          await prisma.stockUpdate.create({
            data: {
              ticketId: existingTicket.id,
              amount: ticketData.quantity,
              previousStock: previousStock,
              newStock: existingTicket.stock
            }
          });
        } else {
          // Create new ticket type
          existingTicket = await prisma.ticket.create({
            data: {
              duration: ticketData.duration,
              price: ticketData.price,
              stock: ticketData.quantity
            }
          });
          
          // Record initial stock
          await prisma.stockUpdate.create({
            data: {
              ticketId: existingTicket.id,
              amount: ticketData.quantity,
              previousStock: 0,
              newStock: ticketData.quantity
            }
          });
        }

        // Store individual ticket codes in the database
        for (const code of ticketData.codes) {
          try {
            await prisma.ticketCode.create({
              data: {
                code: code,
                ticketId: existingTicket.id,
                isUsed: false
              }
            });
          } catch (error) {
            // Skip if code already exists (duplicate)
            console.log(`Code ${code} already exists, skipping...`);
          }
        }
        
        results.push({
          duration: ticketData.duration,
          price: ticketData.price,
          quantity: ticketData.quantity,
          codes: ticketData.codes
        });
      }

      return NextResponse.json({
        success: true,
        imported: results.length,
        tickets: results,
        totalTickets: results.reduce((sum, t) => sum + t.quantity, 0),
        note: 'Import réel depuis PDF'
      });

    } catch (pdfError) {
      console.error('Error processing PDF:', pdfError);
      return NextResponse.json(
        { 
          error: 'Erreur lors du traitement du PDF',
          details: (pdfError as Error).message
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Erreur lors de l\'import PDF:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        details: error.message || 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

function parseWifiZoneTickets(text: string) {
  const tickets: Array<{
    duration: string;
    price: number;
    quantity: number;
    codes: string[];
  }> = [];

  console.log('🔍 Parsing DT WIFI ZONE tickets...');

  // Clean and normalize text
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Pattern for DT WIFI ZONE tickets based on your PDF format:
  // DT WIFI ZONE [number]
  // Coupon
  // [code] - codes like 30m1GDmC9, 1h2Gf8rg
  // [duration] [data] [price]Ar
  
  const ticketPattern = /DT WIFI ZONE\s+\d+\s*\n\s*Coupon\s*\n\s*([A-Za-z0-9]+)\s*\n\s*(\d+[mh]in?)\s+(\d+\s*GiB|\d+\s*MB)\s+(\d+)Ar/gi;

  let match;
  const ticketGroups: { [key: string]: { codes: string[], price: number } } = {};
  let totalMatches = 0;

  while ((match = ticketPattern.exec(cleanText)) !== null) {
    totalMatches++;
    const [fullMatch, code, duration, data, priceStr] = match;
    
    console.log(`✅ Match ${totalMatches}:`, {
      code,
      duration,
      data,
      price: priceStr
    });

    const price = parseInt(priceStr);
    
    // Normalize duration
    let normalizedDuration = duration.toLowerCase();
    if (normalizedDuration.includes('m')) {
      const minutes = parseInt(normalizedDuration.replace('m', ''));
      if (minutes === 30) normalizedDuration = '30min';
      else if (minutes === 60) normalizedDuration = '1h';
      else normalizedDuration = `${minutes}min`;
    } else if (normalizedDuration.includes('h')) {
      const hours = parseInt(normalizedDuration.replace('h', ''));
      normalizedDuration = `${hours}h`;
    }

    if (!ticketGroups[normalizedDuration]) {
      ticketGroups[normalizedDuration] = { codes: [], price };
    }
    
    ticketGroups[normalizedDuration].codes.push(code);
  }

  // If no matches with strict pattern, try looser patterns
  if (totalMatches === 0) {
    console.log('🔄 No strict matches, trying looser patterns...');
    
    // Pattern for just the ticket info line: "30m 1 GiB 500Ar"
    const loosePattern = /(\d+[mh])\s+(\d+\s*GiB|\d+\s*MB)\s+(\d+)Ar/gi;
    
    while ((match = loosePattern.exec(cleanText)) !== null) {
      totalMatches++;
      const [fullMatch, duration, data, priceStr] = match;
      
      console.log(`📌 Loose match ${totalMatches}:`, {
        duration,
        data,
        price: priceStr
      });

      const price = parseInt(priceStr);
      
      // Normalize duration
      let normalizedDuration = duration.toLowerCase();
      if (normalizedDuration.includes('m')) {
        const minutes = parseInt(normalizedDuration.replace('m', ''));
        if (minutes === 30) normalizedDuration = '30min';
        else if (minutes === 60) normalizedDuration = '1h';
        else normalizedDuration = `${minutes}min`;
      } else if (normalizedDuration.includes('h')) {
        const hours = parseInt(normalizedDuration.replace('h', ''));
        normalizedDuration = `${hours}h`;
      }

      if (!ticketGroups[normalizedDuration]) {
        ticketGroups[normalizedDuration] = { codes: [], price };
      }
      
      // Generate a code since we don't have the actual code
      ticketGroups[normalizedDuration].codes.push(`IMPORT_${totalMatches}`);
    }
  }

  // Convert to final format
  Object.entries(ticketGroups).forEach(([duration, data]) => {
    tickets.push({
      duration,
      price: data.price,
      quantity: data.codes.length,
      codes: data.codes
    });
  });

  console.log(`🎯 Final result: ${tickets.length} ticket types, ${totalMatches} total tickets`);
  return tickets;
}

// Fonction pour découper le PDF page par page avec pdf-lib
async function performDirectOCRExtraction(buffer: Buffer, filename: string, price: number, duration: string): Promise<string[]> {
  console.log('🔄 Initialisation de l\'extraction OCR page par page avec pdf-lib...');
  console.log(`🎯 Extraction pour: ${filename} (${price}Ar, ${duration})`);
  
  try {
    // Configuration OCR
    const API_KEY_OCR = 'K86617027088957';
    
    // Importer les dépendances
    const { ocrSpace } = await import('ocr-space-api-wrapper');
    const fs = await import('fs');
    const path = await import('path');
    const { PDFDocument } = await import('pdf-lib');
    
    // Créer le répertoire temporaire
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Vérifier la taille du PDF
    const fileSizeKB = buffer.length / 1024;
    console.log(`📄 Taille du PDF: ${fileSizeKB.toFixed(0)} KB`);
    
    console.log('📄 Chargement du PDF avec pdf-lib...');
    
    // Charger le PDF source
    const sourcePdf = await PDFDocument.load(buffer);
    const pageCount = sourcePdf.getPageCount();
    
    console.log(`📊 Nombre de pages détecté: ${pageCount}`);
    
    // Configuration OCR optimisée pour capturer tous les codes avec qualité élevée
    const configOCR = {
      apiKey: API_KEY_OCR,
      language: 'eng' as const,
      isOverlayRequired: false,
      detectOrientation: true,
      scale: true,                      // Scaling pour améliorer la résolution
      isTable: true,
      OCREngine: "2" as const,
      filetype: 'PDF' as const,
      // Paramètres de qualité ajoutés
      isCreateSearchablePdf: false,
      isSearchablePdfHideTextLayer: false,
      // Amélioration de la qualité pour OCR
      imageQuality: "normal" as const,  // Qualité normale plutôt que compressée
      optimizeImageQuality: true        // Optimiser la qualité d'image
    };
    
    // Pattern de codes adaptatif selon le prix
    const codePattern = getCodePatternForDuration(duration);
    console.log(`🔍 Pattern utilisé: ${codePattern}`);
    
    const allCodes: string[] = [];
    const uniqueCodes = new Set<string>();
    
    // Traiter chaque page individuellement
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      const pageNum = pageIndex + 1;
      console.log(`🔍 OCR Page ${pageNum}/${pageCount}:`);
      
      try {
        // Créer un nouveau PDF pour cette page uniquement
        console.log(`   📄 Extraction page ${pageNum}...`);
        const newPdf = await PDFDocument.create();
        
        // Copier la page du PDF source vers le nouveau PDF
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex]);
        newPdf.addPage(copiedPage);
        
        // Générer le PDF de la page avec optimisation
        const pdfBytes = await newPdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 50
        });
        const pageSizeKB = pdfBytes.length / 1024;
        
        console.log(`   📄 Taille page: ${pageSizeKB.toFixed(0)} KB`);
        
        if (pageSizeKB > 1000) {
          console.log(`   ⚠️ Page trop grande (${pageSizeKB.toFixed(0)} KB), ignorée`);
          continue;
        }
        
        // Sauvegarder la page temporairement avec nom optimisé
        const pagePath = path.join(tempDir, `temp_page_${pageNum}_${Date.now()}.pdf`);
        fs.writeFileSync(pagePath, pdfBytes);
        
        console.log(`   🎯 Page PDF optimisée: ${pageSizeKB.toFixed(0)} KB`);
        
        // Envoyer à OCR
        console.log(`   🔍 Envoi OCR page ${pageNum}...`);
        const ocrResult = await ocrSpace(pagePath, configOCR);
        
        if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
          const text = ocrResult.ParsedResults[0].ParsedText;
          
          if (text && text.length > 10) {
            console.log(`   📝 Texte: ${text.length} caractères`);
            
            // Nettoyer le texte d'abord pour enlever les espaces parasites dans les codes
            // Gérer plusieurs espaces et cas complexes + corriger erreurs OCR
            let cleanedText = text
              // Corriger les erreurs OCR communes AVANT le nettoyage des espaces
              .replace(/\(/g, 'C')    // ( devient C
              .replace(/\)/g, 'J')    // ) devient J  
              .replace(/\|/g, 'I')    // | devient I
              .replace(/\[/g, 'C')    // [ devient C
              .replace(/\]/g, 'J')    // ] devient J
              // Nettoyer SEULEMENT les espaces, GARDER le "1"
              // "30m 1 GXiMZ" -> "30m1GXiMZ" (garder le 1)
              .replace(/\b(30m|1h)\s+1\s+([A-Za-z0-9])/gi, '$11$2')
              // "30m  1GXiMZ" -> "30m1GXiMZ" (garder le 1)  
              .replace(/\b(30m|1h)\s+1([A-Za-z0-9])/gi, '$11$2')
              // "30m1 Gen3x" -> "30m1Gen3x" (enlever espace au milieu)
              .replace(/\b(30m1[A-Za-z0-9]{1,3})\s+([A-Za-z0-9]{3,5})\b/gi, '$1$2')
              // "30m1 G9G9n" -> "30m1G9G9n" (enlever espace après préfixe+1)
              .replace(/\b(30m1)\s+([A-Za-z0-9]{5,6})\b/gi, '$1$2')
              // "1h 2 GXiMZ" -> "1h2GXiMZ" (garder le 2)
              .replace(/\b(1h)\s+([2-9])\s+([A-Za-z0-9])/gi, '$1$2$3')
              // "1h2 GXiMZ" -> "1h2GXiMZ" (enlever espace après 1h2)
              .replace(/\b(1h2)\s+([A-Za-z0-9]{5,6})\b/gi, '$1$2')
              // Cas complexes avec espaces multiples dans les codes
              // "30m 1G(2k6" -> "30m1GC2k6" (corriger OCR + espaces)
              .replace(/\b(30m|1h)\s+1([A-Za-z0-9]{5,6})\b/gi, '$11$2');
            
            console.log(`   🧹 Nettoyage effectué, échantillon avant/après:`);
            console.log(`   Avant: ${text.substring(0, 200)}...`);
            console.log(`   Après: ${cleanedText.substring(0, 200)}...`);
            
            // Capturer TOUS les codes potentiels avec longueurs variables
            const allPotential30m = [];
            const allPotential1h = [];
            const allPotential2h = [];
            
            // Pattern adaptatif pour capturer toutes les longueurs possibles
            const codePattern30mVariable = /\b30m1([A-Za-z0-9]{3,8})\b/gi;  // 30m1 + 3 à 8 chars
            const codePattern1hVariable = /\b1h2([A-Za-z0-9]{3,8})\b/gi;    // 1h2 + 3 à 8 chars
            const codePattern2hVariable = /\b2h3([A-Za-z0-9]{3,8})\b/gi;    // 2h3 + 3 à 8 chars
            
            // Extraire tous les codes potentiels
            let match30mVar;
            while ((match30mVar = codePattern30mVariable.exec(cleanedText)) !== null) {
              const cleanCode = match30mVar[1].replace(/\s+/g, '');
              const fullCode = '30m1' + cleanCode;
              if (cleanCode.length >= 3) {
                allPotential30m.push(fullCode);
              }
            }
            
            let match1hVar;
            while ((match1hVar = codePattern1hVariable.exec(cleanedText)) !== null) {
              const cleanCode = match1hVar[1].replace(/\s+/g, '');
              const fullCode = '1h2' + cleanCode;
              if (cleanCode.length >= 3) {
                allPotential1h.push(fullCode);
              }
            }
            
            let match2hVar;
            while ((match2hVar = codePattern2hVariable.exec(cleanedText)) !== null) {
              const cleanCode = match2hVar[1].replace(/\s+/g, '');
              const fullCode = '2h3' + cleanCode;
              if (cleanCode.length >= 3) {
                allPotential2h.push(fullCode);
              }
            }
            
            // Analyser la distribution des longueurs pour trouver la plus fréquente
            const getLengthDistribution = (codes: string[]) => {
              const distribution: Record<number, number> = {};
              codes.forEach(code => {
                const length = code.length;
                distribution[length] = (distribution[length] || 0) + 1;
              });
              return distribution;
            };
            
            const getMostFrequentLength = (distribution: Record<number, number>) => {
              let maxCount = 0;
              let mostFrequentLength = 0;
              Object.entries(distribution).forEach(([length, count]) => {
                if ((count as number) > maxCount) {
                  maxCount = count as number;
                  mostFrequentLength = parseInt(length);
                }
              });
              return mostFrequentLength;
            };
            
            // D'abord appliquer les filtres de qualité sur tous les codes potentiels
            const cleanPotential30m = allPotential30m.filter(fullCode => {
              return !/gib500/i.test(fullCode) &&
                     !fullCode.toLowerCase().includes('500ar') && 
                     !fullCode.toLowerCase().includes('500a') &&
                     !fullCode.toLowerCase().includes('1000ar') &&
                     !fullCode.toLowerCase().includes('1000a') &&
                     !fullCode.toLowerCase().includes('coupon') &&
                     !fullCode.toLowerCase().includes('wifi') &&
                     !fullCode.toLowerCase().includes('zone') &&
                     !fullCode.toLowerCase().includes('gib');  // Exclure les fragments GiB
            });
            
            const cleanPotential1h = allPotential1h.filter(fullCode => {
              return !/gib500/i.test(fullCode) &&
                     !fullCode.toLowerCase().includes('500ar') && 
                     !fullCode.toLowerCase().includes('500a') &&
                     !fullCode.toLowerCase().includes('1000ar') &&
                     !fullCode.toLowerCase().includes('1000a') &&
                     !fullCode.toLowerCase().includes('coupon') &&
                     !fullCode.toLowerCase().includes('wifi') &&
                     !fullCode.toLowerCase().includes('zone') &&
                     !fullCode.toLowerCase().includes('gib');  // Exclure les fragments GiB
            });
            
            const cleanPotential2h = allPotential2h.filter(fullCode => {
              return !/gib500/i.test(fullCode) &&
                     !fullCode.toLowerCase().includes('500ar') && 
                     !fullCode.toLowerCase().includes('500a') &&
                     !fullCode.toLowerCase().includes('1000ar') &&
                     !fullCode.toLowerCase().includes('1000a') &&
                     !fullCode.toLowerCase().includes('coupon') &&
                     !fullCode.toLowerCase().includes('wifi') &&
                     !fullCode.toLowerCase().includes('zone') &&
                     !fullCode.toLowerCase().includes('gib');  // Exclure les fragments GiB
            });
            
            // Ensuite déterminer les longueurs optimales sur les codes nets
            const length30mDist = getLengthDistribution(cleanPotential30m);
            const length1hDist = getLengthDistribution(cleanPotential1h);
            const length2hDist = getLengthDistribution(cleanPotential2h);
            const optimalLength30m = getMostFrequentLength(length30mDist) || 9; // défaut 9
            const optimalLength1h = getMostFrequentLength(length1hDist) || 8;   // défaut 8
            const optimalLength2h = getMostFrequentLength(length2hDist) || 5;   // défaut 5 (2h + 3 chars)
            
            console.log(`   📏 Distribution longueurs 30m:`, length30mDist);
            console.log(`   📏 Distribution longueurs 1h:`, length1hDist);
            console.log(`   📏 Distribution longueurs 2h:`, length2hDist);
            console.log(`   �� Longueur optimale 30m: ${optimalLength30m} chars`);
            console.log(`   🎯 Longueur optimale 1h: ${optimalLength1h} chars`);
            console.log(`   🎯 Longueur optimale 2h: ${optimalLength2h} chars`);
            
            // Enfin filtrer selon la longueur optimale
            const codes30m = cleanPotential30m.filter(fullCode => {
              return fullCode.length === optimalLength30m;
            });
            
            const codes1h = cleanPotential1h.filter(fullCode => {
              return fullCode.length === optimalLength1h;
            });
            
            const codes2h = cleanPotential2h.filter(fullCode => {
              return fullCode.length === optimalLength2h;
            });

            
            // Diagnostic - chercher TOUS les mots potentiels
            const allWords = cleanedText.match(/\b[A-Za-z0-9]{6,12}\b/g) || [];
            
            console.log(`   🔍 Mots 6-12 chars: ${allWords.length}`);
            console.log(`   🔍 Codes 30m trouvés: ${codes30m.length} (extraction propre)`);
            console.log(`   🔍 Codes 1h trouvés: ${codes1h.length}`);
            console.log(`   🔍 Codes 2h trouvés: ${codes2h.length}`);
            
            if (codes30m.length > 0) {
              console.log(`   📋 Échantillon 30m: ${codes30m.slice(0, 5).join(', ')}`);
            }
            if (codes1h.length > 0) {
              console.log(`   📋 Échantillon 1h: ${codes1h.slice(0, 5).join(', ')}`);
            }
            if (codes2h.length > 0) {
              console.log(`   📋 Échantillon 2h: ${codes2h.slice(0, 5).join(', ')}`);
            }
            
            // Extraire avec pattern strict sur le texte nettoyé
            const strictCodes = extractCodesFromText(cleanedText, codePattern);
            
            // Utiliser les codes extraits proprement
            console.log(`   🔍 Diagnostic - codes30m: ${codes30m.length}, codes1h: ${codes1h.length}, codes2h: ${codes2h.length}`);
            if (codes30m.length > 0) {
              console.log(`   📋 Échantillon codes30m: ${codes30m.slice(0, 5).join(', ')}`);
            }
            if (codes1h.length > 0) {
              console.log(`   📋 Échantillon codes1h: ${codes1h.slice(0, 5).join(', ')}`);
            }
            if (codes2h.length > 0) {
              console.log(`   📋 Échantillon codes2h: ${codes2h.slice(0, 5).join(', ')}`);
            }
            
            const allPotentialCodes = [...codes30m, ...codes1h, ...codes2h];
            const uniquePotentialCodes = Array.from(new Set(allPotentialCodes));
            
            console.log(`   🔍 Après déduplication: ${allPotentialCodes.length} -> ${uniquePotentialCodes.length} codes`);
            console.log(`   📱 Pattern strict: ${strictCodes.length} codes`);
            console.log(`   📱 Pattern propre: ${uniquePotentialCodes.length} codes`);
            
            // TOUJOURS utiliser les codes propres (pattern adaptatif) au lieu du pattern strict
            const finalCodes = uniquePotentialCodes;
            
            // Ajouter seulement les codes uniques
            finalCodes.forEach(code => {
              if (!uniqueCodes.has(code)) {
                uniqueCodes.add(code);
                allCodes.push(code);
              }
            });
            
            console.log(`   📱 ${finalCodes.length} codes extraits (${allCodes.length} total uniques)`);
            console.log(`   🎯 Objectif: ~65 codes par page`);
            
            // Afficher le texte avec les codes extraits masqués
            let maskedText = text;
            finalCodes.forEach(code => {
              // Masquer les codes récupérés avec succès (version nettoyée)
              const codePattern = new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
              maskedText = maskedText.replace(codePattern, '***CODE-OK***');
              
              // Masquer aussi les versions avec espaces (avant nettoyage)
              // Par exemple: "30m 1GdPrz" ou "30m 1 GdPrz" 
              if (code.startsWith('30m') || code.startsWith('1h') || code.startsWith('2h')) {
                const prefix = code.substring(0, code.startsWith('30m') ? 3 : code.startsWith('1h') ? 2 : 2);
                const suffix = code.substring(prefix.length);
                
                // Différentes patterns d'espaces possibles
                const spacedPatterns = [
                  `${prefix} ${suffix}`,                        // "30m GdPrz"
                  `${prefix} 1 ${suffix.substring(1)}`,         // "30m 1 GdPrz" 
                  `${prefix}1 ${suffix.substring(1)}`,          // "30m1 GdPrz"
                  `${prefix} 1${suffix.substring(1)}`,          // "30m 1GdPrz"
                  `${prefix}  1  ${suffix.substring(1)}`,       // "30m  1  GdPrz" (espaces multiples)
                  `${prefix}   1   ${suffix.substring(1)}`,     // "30m   1   GdPrz" (espaces multiples)
                  `${prefix} 1${suffix.substring(1, 4)} ${suffix.substring(4)}`,  // "30m 1Gen 3x" (espace au milieu)
                  `${prefix}1${suffix.substring(1, 4)} ${suffix.substring(4)}`,   // "30m1Gen 3x" (espace au milieu)
                  // Cas spéciaux pour les codes qui perdent le "1" pendant le nettoyage
                  `${prefix} 1${suffix}`,                       // "30m 1GhmJ5" -> "30mGhmJ5"
                  `${prefix}  1${suffix}`,                      // "30m  1GhmJ5" -> "30mGhmJ5"
                  `${prefix}   1${suffix}`,                     // "30m   1GhmJ5" -> "30mGhmJ5"
                ];
                
                spacedPatterns.forEach(spacedCode => {
                  const spacedPattern = new RegExp(spacedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                  maskedText = maskedText.replace(spacedPattern, '***CODE-ESPACE-OK***');
                });
              }
            });
            
            console.log(`   📋 TEXTE AVEC CODES MASQUÉS PAGE ${pageNum}:`);
            console.log('   =' + '='.repeat(60));
            console.log(maskedText);
            console.log('   =' + '='.repeat(60));
            
            // Vérification des DT WIFI ZONE manquants
            const wifiZonePattern = /DT WIFI ZONE\s+(\d+)/gi;
            const wifiZoneNumbers = [];
            let zoneMatch;
            while ((zoneMatch = wifiZonePattern.exec(text)) !== null) {
              wifiZoneNumbers.push(parseInt(zoneMatch[1]));
            }
            
            console.log(`   📊 DT WIFI ZONE détectées: ${wifiZoneNumbers.length}`);
            console.log(`   📊 Codes extraits: ${finalCodes.length}`);
            
                         // Vérification des zones séquentielles : on devrait avoir 65 codes par page (sauf dernière)
             const expectedCodes = (pageNum === pageCount) ? -1 : 65; // -1 = variable pour dernière page
             
             if (expectedCodes !== -1 && finalCodes.length < expectedCodes) {
               const missing = expectedCodes - finalCodes.length;
               console.log(`   ⚠️ CODES MANQUANTS: ${missing} codes (${finalCodes.length}/${expectedCodes})`);
               
               // Calculer la plage attendue de numéros de zones pour cette page
               const startZone = (pageNum - 1) * 65 + 1;
               const endZone = pageNum * 65;
               const expectedZones = [];
               for (let i = startZone; i <= endZone; i++) {
                 expectedZones.push(i);
               }
               
               // Extraire tous les numéros de zones détectées
               const detectedZones: number[] = [];
               const zonePattern = /DT WIFI ZONE\s+(\d+)/gi;
               let match;
               while ((match = zonePattern.exec(text)) !== null) {
                 detectedZones.push(parseInt(match[1]));
               }
               
               // Identifier les zones complètement manquantes
               const missingZones = expectedZones.filter(zone => !detectedZones.includes(zone));
               
               // Identifier les zones détectées mais avec codes problématiques
               const zonesWithBadCodes = [];
               const zoneCodePattern = /DT WIFI ZONE\s+(\d+)\s*\n\s*Coupon\s*\n\s*([^\n]*)/gi;
               let codeMatch;
               while ((codeMatch = zoneCodePattern.exec(text)) !== null) {
                 const zoneNum = parseInt(codeMatch[1]);
                 const content = codeMatch[2].trim();
                 
                 // Vérifier si le contenu après Coupon ressemble à un code valide
                 if (!content.match(/^30m[A-Za-z0-9]{6,8}$/i)) {
                   zonesWithBadCodes.push({
                     num: zoneNum,
                     content: content
                   });
                 }
               }
               
               // Afficher les résultats détaillés
               if (missingZones.length > 0) {
                 console.log(`   ❌ ZONES COMPLÈTEMENT MANQUANTES: ${missingZones.join(', ')}`);
               }
               
               if (zonesWithBadCodes.length > 0) {
                 console.log(`   🔍 ZONES AVEC CODES INVALIDES: ${zonesWithBadCodes.map(z => z.num).join(', ')}`);
                 console.log(`   📋 Codes invalides détectés:`);
                 zonesWithBadCodes.slice(0, 5).forEach(zone => {
                   console.log(`   ❌ Zone ${zone.num}: "${zone.content}"`);
                 });
                 
                 if (zonesWithBadCodes.length > 5) {
                   console.log(`   ... et ${zonesWithBadCodes.length - 5} autres codes invalides`);
                 }
               }
               
               // Identifier aussi tous les codes potentiels (même invalides) pour diagnostic
               const allPotentialCodes = [];
               const potentialCodePattern = /DT WIFI ZONE\s+(\d+)\s*\n\s*Coupon\s*\n\s*([^\n]+)/gi;
               let potentialMatch;
               while ((potentialMatch = potentialCodePattern.exec(text)) !== null) {
                 const zoneNum = parseInt(potentialMatch[1]);
                 const content = potentialMatch[2].trim();
                 if (content && content.length > 0) {
                   allPotentialCodes.push({
                     zone: zoneNum,
                     content: content,
                     valid: content.match(/^30m[A-Za-z0-9]{6,8}$/i) ? true : false
                   });
                 }
               }
               
               const invalidCodes = allPotentialCodes.filter(c => !c.valid);
               if (invalidCodes.length > 0) {
                 console.log(`   📊 Diagnostic complet: ${allPotentialCodes.length} codes trouvés, ${invalidCodes.length} invalides`);
                 console.log(`   ⚠️ Exemples de codes INVALIDES:`);
                 invalidCodes.slice(0, 3).forEach(code => {
                   console.log(`   🚫 Zone ${code.zone}: "${code.content}"`);
                 });
               }
               
               console.log(`   📊 Attendu: zones ${startZone} à ${endZone} (${expectedCodes} zones)`);
               console.log(`   📊 Détectées: ${detectedZones.length} zones, Codes valides: ${finalCodes.length}`);
               
             } else if (expectedCodes !== -1) {
               console.log(`   ✅ Page complète: ${finalCodes.length}/${expectedCodes} codes`);
             } else {
               console.log(`   ✅ Dernière page: ${finalCodes.length} codes (variable)`);
             }
            
            if (finalCodes.length < 50) {
              console.log(`   ⚠️ Moins de 50 codes trouvés, échantillon texte:`);
              console.log(`   ${text.substring(0, 200)}...`);
            }
          } else {
            console.log(`   ⚠️ Texte trop court ou vide`);
          }
        } else {
          console.log(`   ⚠️ Aucun texte extrait pour page ${pageNum}`);
          if (ocrResult && ocrResult.ErrorMessage && Array.isArray(ocrResult.ErrorMessage)) {
            console.log(`   ❌ Erreur: ${ocrResult.ErrorMessage.join(', ')}`);
          }
        }
        
        // Nettoyer la page immédiatement
        try {
          fs.unlinkSync(pagePath);
        } catch (cleanupError) {
          console.warn(`   ⚠️ Nettoyage impossible pour page ${pageNum}`);
        }
        
        // Pause entre les pages pour éviter les limitations de taux
        if (pageNum < pageCount) {
          console.log('   ⏳ Pause 2s...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (pageError: any) {
        console.error(`   ❌ Erreur OCR page ${pageNum}:`, pageError.message || 'Erreur inconnue');
      }
    }
    
    console.log(`🎯 EXTRACTION PDF-LIB + OCR TERMINÉE:`);
    console.log(`✅ ${allCodes.length} codes uniques extraits de ${pageCount} pages`);
    console.log(`📊 Taux de réussite: ${pageCount > 0 ? ((allCodes.length / pageCount) * 100).toFixed(1) : 0}% codes/page`);
    
    if (allCodes.length > 0) {
      console.log(`📋 Échantillon: ${allCodes.slice(0, 5).join(', ')}...`);
    }
    
    return allCodes;
    
  } catch (error: any) {
    console.error('❌ Erreur extraction pdf-lib:', error);
    throw new Error(`Erreur extraction pdf-lib: ${error.message || 'Erreur inconnue'}`);
  }
} 