'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  ArrowLeft,
  Filter,
  Search,
  FileText
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface UserQuote {
  id: string;
  status: string;
  description: string;
  budget: number | null;
  finalPrice: number | null;
  createdAt: string;
  service: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected' | 'in_progress';

export default function MyQuotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<UserQuote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<UserQuote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Rediriger si pas connecté
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/profile/my-quotes');
      return;
    }
  }, [session, status, router]);

  // Charger les devis
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/profile/quotes');
        if (response.ok) {
          const data = await response.json();
          setQuotes(data);
          setFilteredQuotes(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des devis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [session?.user?.id]);

  // Filtrage
  useEffect(() => {
    let filtered = quotes;

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.description.toLowerCase().includes(search) ||
        (quote.service && quote.service.name.toLowerCase().includes(search))
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => {
        switch (statusFilter) {
          case 'pending':
            return quote.status === 'PENDING';
          case 'accepted':
            return quote.status === 'ACCEPTED';
          case 'rejected':
            return quote.status === 'REJECTED';
          case 'in_progress':
            return quote.status === 'IN_PROGRESS';
          default:
            return true;
        }
      });
    }

    setFilteredQuotes(filtered);
  }, [quotes, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Accepté</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Affichage de chargement
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Redirection si pas de session
  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/profile">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au profil
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          Mes Devis
        </h1>
        <p className="text-muted-foreground">
          Suivez toutes vos demandes de devis et leur statut
        </p>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par description ou service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les devis</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accepted">Acceptés</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="rejected">Refusés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des devis */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Devis ({filteredQuotes.length})</CardTitle>
          <CardDescription>
            Historique complet de vos demandes de devis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length > 0 ? (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">
                        {quote.service ? quote.service.name : 'Service personnalisé'}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-3">
                      {quote.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Demandé {formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true, locale: fr })}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                    {quote.budget && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">Budget indicatif: </span>
                        <span className="font-semibold">
                          <PriceWithConversion price={quote.budget} />
                        </span>
                      </div>
                    )}
                    {quote.finalPrice && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">Prix final: </span>
                        <span className="font-semibold text-green-600">
                          <PriceWithConversion price={quote.finalPrice} />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    {getStatusBadge(quote.status)}
                    <div className="mt-3">
                      <Link href={`/admin/quotes/${quote.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun devis trouvé'
                  : 'Vous n\'avez pas encore demandé de devis'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun devis ne correspond à vos critères de recherche.'
                  : 'Demandez un devis pour nos services personnalisés.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/devis">
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Demander un devis
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



