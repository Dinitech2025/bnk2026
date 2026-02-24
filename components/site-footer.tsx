'use client'

import Link from 'next/link'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Heart, ShoppingBag, Star } from 'lucide-react'

export function SiteFooter() {
  const { settings } = useSiteSettings()
  
  const siteName = getSetting(settings, 'siteName', 'Boutik\'nakà')
  const footerText = getSetting(settings, 'footerText', `© ${new Date().getFullYear()} ${siteName}. Tous droits réservés.`)
  const facebookUrl = getSetting(settings, 'facebookUrl', '')
  const instagramUrl = getSetting(settings, 'instagramUrl', '')
  const twitterUrl = getSetting(settings, 'twitterUrl', '')
  const youtubeUrl = getSetting(settings, 'youtubeUrl', '')

  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/3 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
      
      <div className="container relative z-10 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 md:grid-cols-2">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {siteName}
              </h3>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-md">
              Votre destination de choix pour des produits et services de qualité exceptionnelle.
            </p>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">500+</div>
                <div className="text-sm text-gray-400">Produits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">50+</div>
                <div className="text-sm text-gray-400">Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">1000+</div>
                <div className="text-sm text-gray-400">Clients</div>
              </div>
            </div>

            <div className="flex space-x-4">
              {facebookUrl && (
                <a 
                  href={facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                >
                  <Facebook className="h-5 w-5 text-white" />
                </a>
              )}
              {instagramUrl && (
                <a 
                  href={instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center hover:from-pink-600 hover:to-purple-700 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                >
                  <Instagram className="h-5 w-5 text-white" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400" />
              Navigation
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></span>
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></span>
                  Produits
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></span>
                  Services
                </Link>
              </li>
              <li>
                <Link href="/subscriptions" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></span>
                  Abonnements
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-green-400" />
              Contact
            </h3>
            <div className="mt-8 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <h4 className="font-semibold mb-2 text-yellow-400">Horaires</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Lun - Ven</span>
                  <span>8h - 18h</span>
                </div>
                <div className="flex justify-between">
                  <span>Samedi</span>
                  <span>9h - 17h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">{footerText}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Fait avec</span>
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
              <span>à Madagascar</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
