'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/ui/image-upload'
import Link from 'next/link'

export default function AddEmployeePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [employeeData, setEmployeeData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF',
    avatar: '',
    permissions: 'read',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEmployeeData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setEmployeeData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Erreur lors du téléchargement')
      
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    try {
      // Validation basique
      if (!employeeData.firstName || !employeeData.lastName || !employeeData.email) {
        toast.error('Veuillez remplir tous les champs obligatoires')
        setIsLoading(false)
        return
      }
      
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création de l\'employé')
      }
      
      toast.success('Employé ajouté avec succès')
      router.push('/admin/settings/employees')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création de l\'employé')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-2"
          onClick={() => router.push('/admin/settings/employees')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Ajouter un employé</h1>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations de l&apos;employé</CardTitle>
            <CardDescription>
              Ajoutez un nouvel employé au système avec ses informations personnelles et ses autorisations.
              <p className="mt-2 text-amber-500">Note: Un mot de passe temporaire sera généré automatiquement.</p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={employeeData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={employeeData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={employeeData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={employeeData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Sélectionner le rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permissions">Permissions</Label>
                <Select
                  value={employeeData.permissions}
                  onValueChange={(value) => handleSelectChange('permissions', value)}
                >
                  <SelectTrigger id="permissions">
                    <SelectValue placeholder="Sélectionner les permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Lecture seule</SelectItem>
                    <SelectItem value="write">Lecture/Écriture</SelectItem>
                    <SelectItem value="full">Accès complet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar">Photo de profil</Label>
              <ImageUpload
                value={employeeData.avatar}
                onChange={(url) => setEmployeeData(prev => ({ ...prev, avatar: url }))}
                onUpload={handleImageUpload}
                isAvatar={true}
                multiple={false}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/admin/settings/employees">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter l&apos;employé
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 