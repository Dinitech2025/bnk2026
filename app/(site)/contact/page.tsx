import { Metadata } from 'next'
import { ContactForm } from '@/components/contact/contact-form'
import { ContactInfo } from '@/components/contact/contact-info'

export const metadata: Metadata = {
  title: 'Contact - BoutikNaka',
  description: 'Contactez-nous pour toute question ou demande d\'aide',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Contactez-nous
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Vous avez une question ? Besoin d'aide ? Notre équipe est là pour vous répondre.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire de contact */}
            <div>
              <ContactForm />
            </div>

            {/* Informations de contact */}
            <div>
              <ContactInfo />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}