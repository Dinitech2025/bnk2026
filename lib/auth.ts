import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

// Étendre les types de NextAuth
declare module "next-auth" {
  interface User {
    id: string
    role: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    image?: string | null
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      firstName?: string | null
      lastName?: string | null
      phone?: string | null
      image?: string | null
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    image?: string | null
  }
}

// Définir les options d'authentification
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        phone: { label: 'Téléphone', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 NextAuth authorize appelé avec:', {
          email: credentials?.email || 'non fourni',
          phone: credentials?.phone || 'non fourni',
          hasPassword: !!credentials?.password
        })

        if ((!credentials?.email && !credentials?.phone) || !credentials?.password) {
          console.error('❌ Identifiants manquants:', { email: credentials?.email, phone: credentials?.phone })
          throw new Error('Email ou téléphone et mot de passe requis')
        }

        try {
          let user = null

          // Rechercher par email ou téléphone
          if (credentials.email && credentials.email !== 'undefined') {
            console.log('🔍 Recherche par email:', credentials.email)
            user = await prisma.user.findUnique({
              where: {
                email: credentials.email,
              },
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                password: true,
                role: true,
                image: true,
              },
            })
          } else if (credentials.phone && credentials.phone !== 'undefined') {
            console.log('🔍 Recherche par téléphone:', credentials.phone)
            user = await prisma.user.findFirst({
              where: {
                phone: credentials.phone,
              },
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                password: true,
                role: true,
                image: true,
              },
            })
            console.log('📱 Résultat recherche téléphone:', user ? `Trouvé: ${user.id}` : 'Non trouvé')
          }

          if (!user || !user.password) {
            console.error('❌ Utilisateur non trouvé ou sans mot de passe:', credentials.email || credentials.phone)
            throw new Error('Utilisateur non trouvé')
          }

          console.log('✅ Utilisateur trouvé:', { id: user.id, email: user.email, phone: user.phone })

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!passwordMatch) {
            console.error('❌ Mot de passe incorrect pour:', credentials.email || credentials.phone)
            throw new Error('Mot de passe incorrect')
          }

          console.log('✅ Connexion réussie pour:', credentials.email || credentials.phone, 'avec le rôle:', user.role)
          
          return {
            id: user.id,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            image: user.image,
          }
        } catch (error) {
          console.error('❌ Erreur lors de l\'authentification:', error)
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.phone = user.phone
        token.image = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.firstName = token.firstName
        session.user.lastName = token.lastName
        session.user.phone = token.phone
        session.user.image = token.image
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Si l'URL contient déjà une destination, l'utiliser
      if (url.startsWith('/')) return `${baseUrl}${url}`
      
      // Si l'URL est externe au domaine, retourner la base
      if (new URL(url).origin !== baseUrl) return baseUrl
      
      return url
    },
  },
  // Pas de pages personnalisées - utilisation du modal AuthModal
  // pages: {
  //   signIn: '/auth/login',
  //   error: '/auth/error',
  // },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('🎉 Connexion réussie:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        isNewUser
      })
    }
  },
  debug: process.env.NODE_ENV === 'development',
}

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  console.log('🔍 getCurrentUser - Session:', session ? 'Trouvée' : 'Aucune')
  if (session?.user) {
    console.log('👤 getCurrentUser - Utilisateur:', session.user.email, 'Rôle:', session.user.role)
  }
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/unauthorized')
  }
  
  return user
}

export async function requireStaff() {
  const user = await getCurrentUser()
  
  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    redirect('/auth/unauthorized')
  }
  
  return user
} 