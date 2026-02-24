import { ReactNode } from 'react'

interface AdminLayoutMinimalProps {
  children: ReactNode
}

export function AdminLayoutMinimal({ children }: AdminLayoutMinimalProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 mb-4">
        <strong>🔧 MODE MINIMAL:</strong> Layout admin minimal sans composants complexes
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

