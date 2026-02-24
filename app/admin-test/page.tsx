'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function AdminTestPage() {
  const { data: session, status } = useSession()
  
  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Test Admin - Page de Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Session Info</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            {session ? (
              <>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Nom:</strong> {session.user?.name}</p>
                <p><strong>Rôle:</strong> {session.user?.role}</p>
                <p><strong>ID:</strong> {session.user?.id}</p>
              </>
            ) : (
              <p className="text-red-600">Pas de session</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Tests de Navigation</h2>
          <div className="space-y-4">
            <div>
              <Link href="/admin" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Aller vers /admin (avec guard)
              </Link>
            </div>
            <div>
              <Link href="/admin/orders" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Aller vers /admin/orders (direct)
              </Link>
            </div>
            <div>
              <button 
                onClick={() => window.location.href = '/admin'}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                window.location vers /admin
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Diagnostic</h2>
          <div className="space-y-2 text-sm">
            <p>✅ Cette page fonctionne (pas dans le groupe (admin))</p>
            <p>🔍 Testez les liens ci-dessus pour voir lequel fonctionne</p>
            <p>📍 URL actuelle: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

