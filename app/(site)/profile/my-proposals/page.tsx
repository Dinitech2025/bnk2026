'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  ArrowLeft,
  Filter,
  Search,
  Package,
  MessageSquare
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
import Image from 'next/image';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface ProductProposal {
  id: string;
  status: string;
  description: string;
  proposedPrice: number;
  finalPrice: number | null;
  adminResponse: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ path: string }>;
  };
}

type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected' | 'counter_offer';

export default function MyProposalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<ProductProposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<ProductProposal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Rediriger si pas connecté
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/profile/my-proposals');
      return;
    }
  }, [session, status, router]);

  // Charger les propositions
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchProposals = async () => {
      try {
        const response = await fetch('/api/profile/proposals');
        if (response.ok) {
          const data = await response.json();
          setProposals(data);
          setFilteredProposals(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des propositions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [session?.user?.id]);

  // Filtrage
  useEffect(() => {
    let filtered = proposals;

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(proposal => 
        proposal.product.name.toLowerCase().includes(search) ||
        proposal.description.toLowerCase().includes(search)
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => {
        switch (statusFilter) {
          case 'pending':
            return proposal.status === 'PENDING';
          case 'accepted':
            return proposal.status === 'ACCEPTED';
          case 'rejected':
            return proposal.status === 'REJECTED';
          case 'counter_offer':
            return proposal.status === 'COUNTER_OFFER';
          default:
            return true;
        }
      });
    }

    setFilteredProposals(filtered);
  }, [proposals, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Acceptée</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refusée</Badge>;
      case 'COUNTER_OFFER':
        return <Badge className="bg-blue-100 text-blue-700"><MessageSquare className="h-3 w-3 mr-1" />Contre-proposition</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAcceptProposal = async (proposalId: string, finalPrice: number) => {
    try {
      const response = await fetch(`/api/profile/proposals/${proposalId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ finalPrice })
      });

      if (response.ok) {
        // Recharger les propositions
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
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
          <TrendingUp className="h-8 w-8 text-primary" />
          Mes Propositions de Prix
        </h1>
        <p className="text-muted-foreground">
          Suivez toutes vos propositions de prix et leur statut
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
                placeholder="Rechercher par nom de produit..."
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
                <SelectItem value="all">Toutes les propositions</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accepted">Acceptées</SelectItem>
                <SelectItem value="counter_offer">Contre-propositions</SelectItem>
                <SelectItem value="rejected">Refusées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des propositions */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Propositions ({filteredProposals.length})</CardTitle>
          <CardDescription>
            Historique complet de vos propositions de prix
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProposals.length > 0 ? (
            <div className="space-y-4">
              {filteredProposals.map((proposal) => (
                <div key={proposal.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    {proposal.product.images.length > 0 ? (
                      <Image
                        src={proposal.product.images[0].path}
                        alt={proposal.product.name}
                        width={60}
                        height={60}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-15 h-15 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link 
                        href={`/products/${proposal.product.slug}`}
                        className="font-semibold hover:text-primary"
                      >
                        {proposal.product.name}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>
                          Proposé {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(proposal.createdAt), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 mt-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Prix original: </span>
                          <span className="font-semibold">
                            <PriceWithConversion price={proposal.product.price} />
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Prix proposé: </span>
                          <span className="font-semibold text-blue-600">
                            <PriceWithConversion price={proposal.proposedPrice} />
                          </span>
                        </div>
                        {proposal.finalPrice && (
                          <div>
                            <span className="text-sm text-muted-foreground">Prix final: </span>
                            <span className="font-semibold text-green-600">
                              <PriceWithConversion price={proposal.finalPrice} />
                            </span>
                          </div>
                        )}
                      </div>
                      {proposal.adminResponse && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Réponse admin :</p>
                          <p className="text-sm">{proposal.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {getStatusBadge(proposal.status)}
                    <div className="mt-3 space-y-2">
                      <Link href={`/products/${proposal.product.slug}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir produit
                        </Button>
                      </Link>
                      {proposal.status === 'ACCEPTED' && proposal.finalPrice && (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleAcceptProposal(proposal.id, proposal.finalPrice!)}
                        >
                          Ajouter au panier
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune proposition trouvée'
                  : 'Vous n\'avez pas encore fait de propositions'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune proposition ne correspond à vos critères de recherche.'
                  : 'Découvrez nos produits négociables et faites vos premières propositions.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/products">
                  <Button>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Découvrir les produits
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



