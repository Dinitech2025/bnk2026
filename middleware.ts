import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // TEMPORAIREMENT DÉSACTIVÉ POUR DEBUG
  console.log('🔍 Middleware appelé pour:', request.nextUrl.pathname)
  
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  console.log('🔑 Token trouvé:', token ? `${token.email} (${token.role})` : 'Aucun')

  // Protéger les routes admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      console.log('❌ Middleware: Pas de token, redirection vers /')
      // TEMPORAIREMENT DÉSACTIVÉ
      // return NextResponse.redirect(new URL('/', request.url))
    }

    // Vérifier si l'utilisateur a les droits admin ou staff
    if (token && token.role !== 'ADMIN' && token.role !== 'STAFF') {
      console.log('❌ Middleware: Rôle insuffisant:', token.role)
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url))
    }
  }

  console.log('✅ Middleware: Accès autorisé')
  return NextResponse.next()
}

// Configurer les chemins à vérifier
export const config = {
  matcher: ['/admin/:path*'],
} 