'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, User, Mail, Phone, Lock, Eye, EyeOff, UserCircle2, Users, UserCheck } from 'lucide-react'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'
import { toast } from '@/components/ui/use-toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { settings } = useSiteSettings()
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Récupération des paramètres du site
  const siteName = getSetting(settings, 'siteName', 'Boutik\'nakà')
  const logoUrl = getSetting(settings, 'logoUrl', '')
  const useSiteLogo = getSetting(settings, 'useSiteLogo', 'false') === 'true'

  // États pour login
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  // États pour register
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const resetForm = () => {
    setIdentifier('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setConfirmPassword('')
    setError(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode)
    resetForm()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const isEmail = (value: string) => value.includes('@')

    const timeoutId = setTimeout(() => {
      setError('Connexion trop longue - veuillez réessayer')
      setIsLoading(false)
    }, 10000)

    try {
      const credentials = {
        email: isEmail(identifier) ? identifier : undefined,
        phone: !isEmail(identifier) ? identifier : undefined,
        password,
        redirect: false,
      }

      const result = await signIn('credentials', credentials)
      clearTimeout(timeoutId)

      if (result?.error) {
        setError('Identifiants incorrects')
        setIsLoading(false)
      } else if (result?.ok === true) {
        toast({
          title: "Connexion réussie !",
          description: "Bienvenue !",
        })
        handleClose()
        
        // Récupérer les informations de session pour déterminer le rôle
        try {
          // Attendre un peu pour que la session soit mise à jour
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const session = await getSession()
          
          if (session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF') {
            window.location.href = '/admin'
          } else {
            window.location.reload()
          }
        } catch (error) {
          // Fallback en cas d'erreur lors de la récupération de la session
          console.error('Erreur lors de la récupération de la session:', error)
          window.location.reload()
        }
      } else {
        setError('Résultat de connexion inattendu')
        setIsLoading(false)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      setError('Une erreur est survenue')
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (!email && !phone) {
      setError('Veuillez fournir au moins un email ou un téléphone')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email || undefined,
          phone: phone || undefined,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue')
      }

      toast({
        title: "Inscription réussie !",
        description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
      })

      // Switcher vers login après inscription réussie
      handleModeSwitch('login')
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Une erreur est survenue')
      }
      setIsLoading(false)
    }
  }

  const loginAsUser = async (type: 'admin' | 'staff' | 'client') => {
    setIsLoading(true)
    setError(null)
    
    let credentials = {
      email: '',
      password: '',
    }
    
    switch (type) {
      case 'admin':
        credentials = { email: 'admin@test.com', password: 'test123' }
        break
      case 'staff':
        credentials = { email: 'staff@test.com', password: 'test123' }
        break
      case 'client':
        credentials = { email: 'client@test.com', password: 'test123' }
        break
    }
    
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        setError(`Échec de connexion en tant que ${type}`)
        setIsLoading(false)
        return
      }

      if (result?.ok === true) {
        toast({
          title: "Connexion réussie !",
          description: `Connecté en tant que ${type}`,
        })
        handleClose()
        
        if (type === 'admin' || type === 'staff') {
          window.location.href = '/admin'
        } else {
          window.location.reload()
        }
      } else {
        setError(`Résultat inattendu pour la connexion ${type}`)
        setIsLoading(false)
      }
    } catch (error) {
      setError('Une erreur est survenue')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          {/* Logo/Nom du site */}
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center space-x-2">
              {useSiteLogo && logoUrl ? (
                <div className="relative h-8 w-32 md:h-12 md:w-48 lg:h-16 lg:w-64">
                  <Image
                    src={logoUrl}
                    alt={siteName}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <span className="text-lg md:text-xl font-bold text-gray-900">{siteName}</span>
              )}
            </Link>
          </div>
          
          <DialogTitle className="text-xl font-semibold text-center">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabs pour switcher entre login et register */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleModeSwitch('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'login' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => handleModeSwitch('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'register' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-3">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {mode === 'login' ? 'Erreur de connexion' : 'Erreur d\'inscription'}
                </p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Formulaire Login */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email ou Téléphone</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {identifier.includes('@') ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                  </div>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="votre@email.com ou téléphone"
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    required
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="danger"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connexion...</span>
                  </div>
                ) : (
                  'Se connecter'
                )}
              </Button>

              {/* Boutons de test en développement */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">
                        Développement - Connexion rapide
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => loginAsUser('admin')}
                      disabled={isLoading}
                      className="text-xs p-2 flex flex-col items-center gap-1"
                      title="Connexion Admin (admin@test.com)"
                    >
                      <UserCircle2 className="h-4 w-4" />
                      <span className="text-[10px]">Admin</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => loginAsUser('staff')}
                      disabled={isLoading}
                      className="text-xs p-2 flex flex-col items-center gap-1"
                      title="Connexion Staff (staff@test.com)"
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-[10px]">Staff</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => loginAsUser('client')}
                      disabled={isLoading}
                      className="text-xs p-2 flex flex-col items-center gap-1"
                      title="Connexion Client (client@test.com)"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span className="text-[10px]">Client</span>
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* Formulaire Register */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+261 34 12 345 67"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regPassword">Mot de passe</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="regPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    required
                    minLength={8}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer le mot de passe"
                    required
                    minLength={8}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="danger"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Inscription...</span>
                  </div>
                ) : (
                  'S\'inscrire'
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 