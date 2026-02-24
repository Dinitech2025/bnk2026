'use client';

import { useState } from 'react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceGeneratorButtonProps {
  orderId: string;
  mode?: 'preview' | 'download';
}

export function InvoiceGeneratorButton({ orderId, mode = 'preview' }: InvoiceGeneratorButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { targetCurrency, exchangeRates } = useCurrency();

  const generateInvoice = async () => {
    try {
      setIsLoading(true);

      const hasConversion = targetCurrency &&
                         exchangeRates &&
                         exchangeRates[targetCurrency] &&
                         targetCurrency !== 'EUR';

      let response;

      if (hasConversion) {
        response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversionData: {
              targetCurrency,
              exchangeRate: exchangeRates[targetCurrency]
            }
          })
        });
      } else {
        response = await fetch(`/api/admin/orders/${orderId}/invoice`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération de la facture');
      }

      const data = await response.json();

      if (mode === 'preview') {
        // Ouvrir le PDF dans un nouvel onglet
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Aperçu de la facture</title>
                <style>
                  body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    overflow: hidden;
                  }
                  iframe {
                    border: none;
                    width: 100%;
                    height: 100vh;
                  }
                </style>
              </head>
              <body>
                <iframe src="${data.pdfBase64}"></iframe>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } else {
        // Télécharger le PDF
        const link = document.createElement('a');
        link.href = data.pdfBase64;
        link.download = `facture-${data.orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('Facture générée avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue lors de la génération de la facture');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={generateInvoice}
      disabled={isLoading}
      variant="ghost"
      size="icon"
      title="Aperçu de la facture"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </Button>
  );
}
