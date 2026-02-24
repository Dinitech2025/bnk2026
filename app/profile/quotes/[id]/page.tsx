import { Metadata } from 'next'
import { QuoteDiscussion } from '@/components/quotes/quote-discussion'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface QuotePageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: 'Détails du devis | BNK',
  description: 'Consultez les détails de votre devis et communiquez avec notre équipe',
}

export default function QuotePage({ params }: QuotePageProps) {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/quotes">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour aux devis
            </Link>
          </Button>
        </div>

        {/* Discussion du devis - Pleine largeur */}
        <QuoteDiscussion quoteId={params.id} />
      </div>
    </div>
  )
} 