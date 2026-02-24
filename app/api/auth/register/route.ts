import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide').optional(),
  phone: z.string().min(8, 'Le téléphone doit contenir au moins 8 caractères').optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
}).refine(data => data.email || data.phone, {
  message: 'Au moins un email ou un téléphone est requis',
  path: ['email']
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Valider les données
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Données invalides', errors: result.error.errors },
        { status: 400 }
      )
    }
    
    const { firstName, lastName, email, phone, password } = result.data
    
    // Vérifier si l'utilisateur existe déjà (par email ou téléphone)
    if (email) {
      const existingUserByEmail = await db.user.findUnique({
        where: { email },
      })
      
      if (existingUserByEmail) {
        return NextResponse.json(
          { message: 'Cet email est déjà utilisé' },
          { status: 400 }
        )
      }
    }

    if (phone) {
      const existingUserByPhone = await db.user.findFirst({
        where: { phone },
      })
      
      if (existingUserByPhone) {
        return NextResponse.json(
          { message: 'Ce numéro de téléphone est déjà utilisé' },
          { status: 400 }
        )
      }
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Créer l'utilisateur
    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // Pour compatibilité
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role: 'CLIENT',
      },
    })
    
    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json(
      { 
        message: 'Utilisateur créé avec succès', 
        user: userWithoutPassword,
        canLoginWith: {
          email: !!email,
          phone: !!phone
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    )
  }
}