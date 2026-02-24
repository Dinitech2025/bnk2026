'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, X } from 'lucide-react'
import { toast } from 'sonner'

interface DeliveryNoteModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber?: string
}

export function DeliveryNoteModal({ isOpen, onClose, orderId, orderNumber }: DeliveryNoteModalProps) {
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('')
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [deliveryNoteData, setDeliveryNoteData] = useState<any>(null)

  // Générer le bon de commande quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && orderId) {
      generateDeliveryNote()
    }
  }, [isOpen, orderId])

  // Nettoyer l'URL blob quand le modal se ferme
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
      }
    }
  }, [pdfBlobUrl])

  const generateDeliveryNote = async () => {
    setLoading(true)
    try {
      // Récupérer les données du bon de commande
      const response = await fetch(`/api/admin/orders/${orderId}/delivery-note`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la récupération des données')
      }
      
      const deliveryData = await response.json()
      setDeliveryNoteData(deliveryData)
      
      // Générer le PDF
      const { generateDeliveryNotePDF } = await import('@/lib/delivery-note-generator')
      const dataUrl = await generateDeliveryNotePDF(deliveryData)
      setPdfDataUrl(dataUrl)
      
      // Créer une URL blob pour l'iframe (contourne les restrictions CSP)
      // Extraire les données base64 de l'URL data
      const base64Data = dataUrl.split(',')[1]
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      setPdfBlobUrl(blobUrl)
      
    } catch (error: any) {
      console.error('Erreur lors de la génération du bon de livraison:', error)
      toast.error(error.message || 'Impossible de générer le bon de livraison')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    if (pdfDataUrl) {
      const link = document.createElement('a')
      link.href = pdfDataUrl
      link.download = `bon-livraison-${orderNumber || orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Bon de livraison téléchargé')
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
              <title>Bon de livraison - ${orderNumber || orderId}</title>
              <style>
                body, html { margin: 0; padding: 0; height: 100%; }
                iframe { border: none; width: 100%; height: 100%; }
              </style>
            </head>
            <body>
              <iframe src="${pdfDataUrl}"></iframe>
            </body>
          </html>
        `)
        newWindow.document.close()
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>
              Bon de livraison {orderNumber && `- ${orderNumber}`}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!loading && pdfDataUrl && (
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

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Génération du bon de livraison...</p>
              </div>
            </div>
          ) : pdfBlobUrl ? (
            <div className="h-full w-full">
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full border-0 rounded-md"
                title="Aperçu du bon de livraison"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Impossible de charger l'aperçu</p>
                <Button onClick={generateDeliveryNote} variant="outline">
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
