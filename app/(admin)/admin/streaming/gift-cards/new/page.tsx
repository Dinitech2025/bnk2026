'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'

const formSchema = z.object({
  codes: z.string()
    .min(1, 'La liste des codes est requise')
    .refine(value => value.trim().split('\n').every(line => line.trim().length > 0), {
      message: 'Chaque ligne doit contenir un code valide'
    }),
  amount: z.string().min(1, 'Le montant est requis'),
})

export default function NewGiftCardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codes: '',
      amount: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      // Nettoyer et valider les codes
      const codes = values.codes
        .split('\n')
        .map(code => code.trim())
        .filter(code => code.length > 0)

      const response = await fetch('/api/admin/streaming/gift-cards/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codes,
          amount: parseFloat(values.amount),
        }),
      })

      if (!response.ok) throw new Error('Erreur lors de la création des cartes cadeaux')

      toast.success(`${codes.length} cartes cadeaux créées avec succès`)
      router.push('/admin/streaming/gift-cards')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création des cartes cadeaux')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/streaming/gift-cards">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Import de Cartes Cadeaux Netflix</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations des cartes</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (TL)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codes des cartes cadeaux</FormLabel>
                    <FormDescription>
                      Collez la liste des codes, un par ligne
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="CODE1&#10;CODE2&#10;CODE3"
                        className="min-h-[200px] font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Link href="/admin/streaming/gift-cards">
                  <Button variant="outline" type="button">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Création...' : 'Créer les cartes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 