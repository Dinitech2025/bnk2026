'use client'

const logoUrls = [
  'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Aliexpress_logo.svg/204px-Aliexpress_logo.svg.png',
  'https://cdn.worldvectorlogo.com/logos/alibaba-1.svg',
  'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
  'https://static.wikia.nocookie.net/lemondededisney/images/6/65/Disney%2BLogo.png/revision/latest?cb=20231028124416&path-prefix=fr',
  'https://cdn.worldvectorlogo.com/logos/amazon-prime-video-1.svg',
  'https://upload.wikimedia.org/wikipedia/commons/2/20/YouTube_2024.svg',
  'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg',
  'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg',
  'https://cdn.worldvectorlogo.com/logos/shein-1.svg',
  'https://cdn.worldvectorlogo.com/logos/decathlon-2.svg',
  'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg'
]

const logoNames = [
  'Amazon', 'eBay', 'AliExpress', 'Alibaba Group', 'Netflix', 
  'Disney+', 'Prime Video', 'YouTube', 'PayPal', 'Zara', 
  'Shein', 'Decathlon', 'Spotify'
]

export default function PartnersSlider() {
  return (
    <section className="relative py-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-hidden rounded-2xl">
      {/* Fond décoratif subtil */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-200/10 to-transparent"></div>
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-200/10 to-transparent"></div>
      
      <div className="container mx-auto px-4 text-center">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Nos Partenaires de Confiance
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            Découvrez les grandes marques et plateformes avec lesquelles nous collaborons
          </p>
        </div>
        
        {/* Slider Container */}
        <div className="relative overflow-hidden">
          {/* Gradients de masquage */}
          <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-gray-50 via-blue-50/30 to-transparent z-10"></div>
          <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-gray-50 via-purple-50/20 to-transparent z-10"></div>
          
          {/* Slider animé */}
          <div className="flex space-x-4 animate-scroll">
            {/* Première série de logos */}
            {logoUrls.map((logoUrl, index) => (
              <div key={index} className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                <img 
                  src={logoUrl} 
                  alt={logoNames[index]}
                  className="h-8 w-auto object-contain max-w-[90px]"
                />
              </div>
            ))}
            
            {/* Duplication pour l'animation continue */}
            {logoUrls.map((logoUrl, index) => (
              <div key={`duplicate-${index}`} className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                <img 
                  src={logoUrl} 
                  alt={logoNames[index]}
                  className="h-8 w-auto object-contain max-w-[90px]"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Texte de confiance */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 max-w-2xl mx-auto">
            Et bien d'autres partenaires de confiance pour vous offrir les meilleurs produits et services
          </p>
        </div>
      </div>
    </section>
  )
}
