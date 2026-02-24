'use client'

interface OfferImageProps {
  src: string;
  alt: string;
}

export function OfferImage({ src, alt }: OfferImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        console.error(`Erreur de chargement de l'image:`, src);
        const imgElement = e.currentTarget as HTMLImageElement;
        imgElement.onerror = null; // Éviter les boucles
        imgElement.src = '/placeholder-image.svg';
      }}
    />
  );
} 