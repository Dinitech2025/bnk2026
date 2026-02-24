'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import type { Ticket } from '@/app/api/admin/tickets/types';

interface TicketsListProps {
  tickets: Ticket[];
}

export default function TicketsList({ tickets }: TicketsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [valueFilter, setValueFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNUSED':
        return <Badge variant="outline">Non utilisé</Badge>;
      case 'USED':
        return <Badge variant="success">Utilisé</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expiré</Badge>;
      case 'INVALID':
        return <Badge variant="destructive">Invalide</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      ticket.status === statusFilter;
    
    const matchesValue = 
      valueFilter === 'all' || 
      ticket.value.toString() === valueFilter;

    return matchesSearch && matchesStatus && matchesValue;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher un code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="UNUSED">Non utilisé</SelectItem>
              <SelectItem value="USED">Utilisé</SelectItem>
              <SelectItem value="EXPIRED">Expiré</SelectItem>
              <SelectItem value="INVALID">Invalide</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={valueFilter}
            onValueChange={setValueFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Valeur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les valeurs</SelectItem>
              <SelectItem value="500">500 Ar</SelectItem>
              <SelectItem value="1000">1 000 Ar</SelectItem>
              <SelectItem value="2000">2 000 Ar</SelectItem>
              <SelectItem value="5000">5 000 Ar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead>Date d'utilisation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono">{ticket.code}</TableCell>
                    <TableCell>{ticket.value.toLocaleString()} Ar</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {ticket.usedAt 
                        ? new Date(ticket.usedAt).toLocaleDateString('fr-FR')
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Aucun ticket trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 
 