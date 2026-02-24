'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrency } from '@/lib/contexts/currency-context'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Image from 'next/image'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber?: string
}

export function InvoiceModal({ isOpen, onClose, orderId, orderNumber }: InvoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [selectedLogo, setSelectedLogo] = useState<string>('default')
  const [availableLogos, setAvailableLogos] = useState<{
    invoiceLogo1Url?: string
    invoiceLogo2Url?: string
    logoUrl?: string
  }>({})
  
  // Récupérer le contexte de devise
  const { targetCurrency, exchangeRates } = useCurrency()

  // Charger les logos disponibles
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const response = await fetch('/api/admin/settings/general')
        if (response.ok) {
          const settings = await response.json()
          setAvailableLogos({
            invoiceLogo1Url: settings.invoiceLogo1Url,
            invoiceLogo2Url: settings.invoiceLogo2Url,
            logoUrl: settings.logoUrl
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des logos:', error)
      }
    }

    if (isOpen) {
      fetchLogos()
    }
  }, [isOpen])

  const generateInvoice = async () => {
    setIsLoading(true)
    try {
      // Préparer les données de conversion si une devise cible est sélectionnée
      const conversionData = targetCurrency ? {
        targetCurrency,
        exchangeRate: exchangeRates[targetCurrency] || 1
      } : null

      // Déterminer le logo à utiliser
      let logoUrl = ''
      if (selectedLogo === 'logo1' && availableLogos.invoiceLogo1Url) {
        logoUrl = availableLogos.invoiceLogo1Url
      } else if (selectedLogo === 'logo2' && availableLogos.invoiceLogo2Url) {
        logoUrl = availableLogos.invoiceLogo2Url
      } else if (selectedLogo === 'default' && availableLogos.logoUrl) {
        logoUrl = availableLogos.logoUrl
      }

      const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          conversionData,
          selectedLogo: logoUrl
        })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données de la facture')
      }
      
      const data = await response.json()
      setInvoiceData(data)
      
      const { generateInvoicePDF } = await import('@/lib/invoice-generator')
      const pdfUrl = generateInvoicePDF(data)
      setPdfDataUrl(pdfUrl)
      
      // Créer un blob URL pour l'affichage dans l'iframe
      try {
        const byteCharacters = atob(pdfUrl.split(',')[1])
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        const blobUrl = URL.createObjectURL(blob)
        setPdfBlobUrl(blobUrl)
      } catch (error) {
        console.error('Erreur lors de la création du blob URL:', error)
      }
      
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de générer la facture')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPDF = () => {
    if (pdfDataUrl && invoiceData) {
      const link = document.createElement('a')
      link.href = pdfDataUrl
      const documentType = invoiceData.status === 'QUOTE' ? 'Devis' : 'Facture'
      link.download = `${documentType}_${invoiceData.orderNumber || orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const openInNewTab = () => {
    if (pdfDataUrl) {
      const newWindow = window.open('')
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${invoiceData?.status === 'QUOTE' ? 'Devis' : 'Facture'} ${invoiceData?.orderNumber}</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${pdfDataUrl}"></iframe>
            </body>
          </html>
        `)
      }
    }
  }


  // Ne plus générer automatiquement - l'utilisateur doit d'abord choisir le logo

  // Nettoyer quand le modal se ferme
  React.useEffect(() => {
    if (!isOpen) {
      setPdfDataUrl(null)
      setInvoiceData(null)
      // Nettoyer le blob URL pour éviter les fuites mémoire
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
        setPdfBlobUrl(null)
      }
    }
  }, [isOpen, pdfBlobUrl])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {invoiceData ? (
                <>
                  {invoiceData.status === 'QUOTE' ? '📄 Devis' : '🧾 Facture'}
                  {orderNumber && ` - ${orderNumber}`}
                </>
              ) : (
                'Génération en cours...'
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {pdfDataUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openInNewTab}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Nouvel onglet
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 pt-4">
          {!pdfDataUrl && !isLoading ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Sélectionner le logo pour la facture</h3>
                <RadioGroup value={selectedLogo} onValueChange={setSelectedLogo} className="space-y-4">
                  {/* Logo par défaut */}
                  {availableLogos.logoUrl && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="default" id="default" />
                      <Label htmlFor="default" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <div className="relative w-16 h-16 border rounded">
                          <Image
                            src={availableLogos.logoUrl}
                            alt="Logo par défaut"
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                        <div>
                          <div className="font-medium">Logo par défaut</div>
                          <div className="text-sm text-muted-foreground">Logo principal du site</div>
                        </div>
                      </Label>
                    </div>
                  )}
                  
                  {/* Logo facture 1 */}
                  {availableLogos.invoiceLogo1Url && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="logo1" id="logo1" />
                      <Label htmlFor="logo1" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <div className="relative w-16 h-16 border rounded">
                          <Image
                            src={availableLogos.invoiceLogo1Url}
                            alt="Logo facture 1"
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                        <div>
                          <div className="font-medium">Logo facture 1</div>
                          <div className="text-sm text-muted-foreground">Premier logo pour factures</div>
                        </div>
                      </Label>
                    </div>
                  )}
                  
                  {/* Logo facture 2 */}
                  {availableLogos.invoiceLogo2Url && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="logo2" id="logo2" />
                      <Label htmlFor="logo2" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <div className="relative w-16 h-16 border rounded">
                          <Image
                            src={availableLogos.invoiceLogo2Url}
                            alt="Logo facture 2"
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                        <div>
                          <div className="font-medium">Logo facture 2</div>
                          <div className="text-sm text-muted-foreground">Deuxième logo pour factures</div>
                        </div>
                      </Label>
                    </div>
                  )}
                  
                  {/* Option sans logo */}
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="flex items-center space-x-3 cursor-pointer flex-1">
                      <div className="relative w-16 h-16 border rounded bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium">Sans logo</div>
                        <div className="text-sm text-muted-foreground">Facture sans logo</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                
                <div className="flex justify-end mt-6">
                  <Button onClick={generateInvoice} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      'Générer la facture'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Génération de la facture...</p>
              </div>
            </div>
          ) : pdfBlobUrl ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPdfDataUrl(null)
                    setInvoiceData(null)
                    if (pdfBlobUrl) {
                      URL.revokeObjectURL(pdfBlobUrl)
                      setPdfBlobUrl(null)
                    }
                  }}
                >
                  Changer de logo
                </Button>
              </div>
              <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                <iframe
                  src={pdfBlobUrl}
                  width="100%"
                  height="100%"
                  className="border-0"
                  title={`${invoiceData?.status === 'QUOTE' ? 'Devis' : 'Facture'} ${orderNumber || orderId}`}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-muted-foreground">Erreur lors de la génération</p>
                <Button
                  variant="outline"
                  onClick={generateInvoice}
                  className="mt-4"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}