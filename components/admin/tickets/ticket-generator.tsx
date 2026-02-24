'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { TicketValue } from '@/app/api/admin/tickets/types';

export default function TicketGenerator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    value: '500' as string,
    quantity: '10' as string,
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/tickets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: parseInt(formData.value),
          quantity: parseInt(formData.quantity),
          description: formData.description || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des tickets');
      }

      const data = await response.json();
      
      toast({
        title: "Tickets générés avec succès",
        description: `${data.quantity} tickets de ${data.value} Ar ont été créés.`,
      });

      // Rafraîchir la page pour voir les nouveaux tickets
      router.refresh();
      
      // Réinitialiser le formulaire
      setFormData({
        value: '500',
        quantity: '10',
        description: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les tickets. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Générer des Nouveaux Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valeur du ticket</Label>
              <Select
                value={formData.value}
                onValueChange={(value) => setFormData(prev => ({ ...prev, value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une valeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">500 Ar</SelectItem>
                  <SelectItem value="1000">1 000 Ar</SelectItem>
                  <SelectItem value="2000">2 000 Ar</SelectItem>
                  <SelectItem value="5000">5 000 Ar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="1000"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Lot pour le mois de janvier"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Générer les tickets
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 
 