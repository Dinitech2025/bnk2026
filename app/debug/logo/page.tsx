// Désactiver le pré-rendu statique pour cette page
export const dynamic = 'force-dynamic'

// Page de debug logo - temporairement désactivée pour le déploiement
export default function DebugLogoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Debug Logo</h1>
        <p className="text-gray-600">Page de debug logo en cours de développement.</p>
      </div>
    </div>
  )
}
