'use client'

import { useSession } from 'next-auth/react'

export function DebugSession() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
      🔄 Chargement de la session...
    </div>
  }
  
  if (!session) {
    return <div className="p-4 bg-red-100 border border-red-300 rounded">
      ❌ Pas de session active
    </div>
  }
  
  return (
    <div className="p-4 bg-green-100 border border-green-300 rounded">
      <h3 className="font-bold mb-2">🔍 DEBUG SESSION</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  )
}

