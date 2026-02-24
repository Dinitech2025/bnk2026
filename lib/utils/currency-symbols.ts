// Mapping des codes de devise vers leurs symboles
export const currencySymbols: Record<string, string> = {
  // Devise de base
  'MGA': 'Ar',
  'Ar': 'Ar',
  
  // Devises principales
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'CAD': 'C$',
  'CHF': 'CHF',
  'JPY': '¥',
  'CNY': '¥',
  'KRW': '₩',
  'INR': '₹',
  'BRL': 'R$',
  'AUD': 'A$',
  'NZD': 'NZ$',
  'SGD': 'S$',
  'HKD': 'HK$',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'PLN': 'zł',
  'CZK': 'Kč',
  'HUF': 'Ft',
  'RUB': '₽',
  'TRY': '₺',
  'ZAR': 'R',
  'MXN': 'MX$',
  'ARS': 'AR$',
  'CLP': 'CL$',
  'COP': 'CO$',
  'PEN': 'S/',
  'UYU': 'UY$',
  'THB': '฿',
  'VND': '₫',
  'IDR': 'Rp',
  'MYR': 'RM',
  'PHP': '₱'
}

/**
 * Obtient le symbole d'une devise à partir de son code
 * @param currencyCode Code de la devise (ex: 'EUR', 'USD', 'MGA')
 * @returns Symbole de la devise (ex: '€', '$', 'Ar')
 */
export function getCurrencySymbol(currencyCode: string): string {
  return currencySymbols[currencyCode] || currencyCode
}

/**
 * Formate un montant avec le symbole de devise approprié
 * @param amount Montant à formater
 * @param currencyCode Code de la devise
 * @param options Options de formatage
 * @returns Montant formaté avec symbole (ex: "1,234.56 €")
 */
export function formatCurrencyAmount(
  amount: number, 
  currencyCode: string, 
  options: {
    showSymbol?: boolean
    symbolPosition?: 'before' | 'after'
    decimals?: number
  } = {}
): string {
  const {
    showSymbol = true,
    symbolPosition = 'after',
    decimals = 2
  } = options

  const formattedAmount = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  if (!showSymbol) {
    return formattedAmount
  }

  const symbol = getCurrencySymbol(currencyCode)
  
  return symbolPosition === 'before' 
    ? `${symbol} ${formattedAmount}`
    : `${formattedAmount} ${symbol}`
}

