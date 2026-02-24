'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF',
    avatar: '',
    permissions: 'read',
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/employees')
      if (!response.ok) throw new Error('Erreur lors du chargement des employés')
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des employés')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = currentEmployee.id 
        ? `/api/admin/employees/${currentEmployee.id}`
        : '/api/admin/employees'
      
      const method = currentEmployee.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentEmployee),
      })
      
      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement')
      
      toast.success(
        currentEmployee.id
          ? 'Employé mis à jour avec succès'
          : 'Employé ajouté avec succès'
      )
      
      setIsDialogOpen(false)
      fetchEmployees()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'enregistrement de l\'employé')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/employees/${deleteId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      
      toast.success('L\'employé a été retiré du personnel avec succès')
      fetchEmployees()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression de l\'employé')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleEdit = (employee: Employee) => {
    setCurrentEmployee(employee)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setCurrentEmployee({
      firstName: '',
      lastName: '',
      email: '',
      role: 'STAFF',
      avatar: '',
      permissions: 'read',
    })
    setIsDialogOpen(true)
  }

  const filteredEmployees = employees.filter(employee => 
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion d&apos;employés</h1>
          <p className="text-muted-foreground">
            Gérez les administrateurs et le personnel de la plateforme
          </p>
        </div>
        <Link href="/admin/settings/employees/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un employé
          </Button>
        </Link>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          type="search"
          placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
        <Button type="submit" size="sm" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '50px' }}></TableHead>
              <TableHead>Nom complet</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {searchTerm ? 
                    "Aucun employé trouvé avec cette recherche" : 
                    "Aucun employé trouvé. Ajoutez votre premier employé."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage 
                        src={employee.avatar || ''} 
                        alt={`${employee.firstName} ${employee.lastName}`} 
                      />
                      <AvatarFallback>
                        {employee.firstName[0]}{employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    {employee.firstName} {employee.lastName}
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    {employee.role === 'ADMIN' ? 'Administrateur' : 'Staff'}
                  </TableCell>
                  <TableCell>{employee.permissions}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/settings/employees/edit/${employee.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(employee.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Formulaire d'ajout/édition d'employé */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {currentEmployee.id ? "Modifier l'employé" : "Ajouter un employé"}
            </DialogTitle>
            <DialogDescription>
              {currentEmployee.id 
                ? "Modifier les informations de l'employé ci-dessous"
                : "Remplissez les informations pour créer un nouvel employé"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={currentEmployee.firstName}
                    onChange={(e) => setCurrentEmployee({
                      ...currentEmployee,
                      firstName: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={currentEmployee.lastName}
                    onChange={(e) => setCurrentEmployee({
                      ...currentEmployee,
                      lastName: e.target.value
                    })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={currentEmployee.email}
                  onChange={(e) => setCurrentEmployee({
                    ...currentEmployee,
                    email: e.target.value
                  })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={currentEmployee.role}
                    onValueChange={(value) => setCurrentEmployee({
                      ...currentEmployee,
                      role: value
                    })}
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
                    value={currentEmployee.permissions}
                    onValueChange={(value) => setCurrentEmployee({
                      ...currentEmployee,
                      permissions: value
                    })}
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
                  value={currentEmployee.avatar || ''}
                  onChange={(url) => setCurrentEmployee({
                    ...currentEmployee,
                    avatar: url
                  })}
                  onUpload={handleImageUpload}
                  isAvatar={true}
                  multiple={false}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {currentEmployee.id ? "Mettre à jour" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <Dialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer cet employé du personnel ? Son compte sera converti en compte client standard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 