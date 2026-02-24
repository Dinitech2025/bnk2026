'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/ui/image-upload'
import Link from 'next/link'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar?: string | null
  permissions: string
  createdAt: Date
  updatedAt: Date
}

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [employeeData, setEmployeeData] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF',
    avatar: '',
    permissions: 'read',
  })

  // Récupérer les données de l'employé
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/admin/employees/${id}`)
        
        if (!response.ok) {
          toast.error('Impossible de récupérer les données de l\'employé')
          router.push('/admin/settings/employees')
          return
        }
        
        const data = await response.json()
        setEmployeeData(data)
      } catch (error) {
        toast.error('Erreur lors de la récupération des données')
        router.push('/admin/settings/employees')
      } finally {
        setIsFetching(false)
      }
    }

    if (id) {
      fetchEmployee()
    }
  }, [id, router])

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
      
      const response = await fetch(`/api/admin/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour de l\'employé')
      }
      
      toast.success('Employé mis à jour avec succès')
      router.push('/admin/settings/employees')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour de l\'employé')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
        <h1 className="text-2xl font-bold">Modifier l&apos;employé</h1>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations de l&apos;employé</CardTitle>
            <CardDescription>
              Modifiez les informations de l&apos;employé et ses permissions.
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
                value={employeeData.avatar || ''}
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
              Mettre à jour l&apos;employé
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 