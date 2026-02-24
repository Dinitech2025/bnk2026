import { ReactNode } from 'react'

export default function AdminLayoutBypass({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
        <strong>⚠️ MODE BYPASS:</strong> Layout admin sans vérifications de sécurité
      </div>
      {children}
    </div>
  )
}

