'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Gavel, 
  Clock, 
  Trophy, 
  XCircle,
  Eye,
  ArrowLeft,
  Filter,
  Search
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
interface UserBid {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    currentHighestBid: number | null;
    auctionEndDate: string | null;
    images: Array<{ path: string }>;
  };
}

type StatusFilter = 'all' | 'active' | 'won' | 'outbid' | 'expired';

export default function MyBidsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<UserBid[]>([]);
  const [filteredBids, setFilteredBids] = useState<UserBid[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Rediriger si pas connecté
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/profile/my-bids');
      return;
    }
  }, [session, status, router]);

  // Charger les enchères
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchBids = async () => {
      try {
        const response = await fetch('/api/profile/bids');
        if (response.ok) {
          const data = await response.json();
          setBids(data);
          setFilteredBids(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des enchères:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [session?.user?.id]);

  // Filtrage
  useEffect(() => {
    let filtered = bids;

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(bid => 
        bid.product.name.toLowerCase().includes(search)
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bid => {
        const now = new Date();
        const endDate = bid.product.auctionEndDate ? new Date(bid.product.auctionEndDate) : null;
        const isExpired = endDate ? endDate <= now : false;

        switch (statusFilter) {
          case 'active':
            return bid.status === 'ACCEPTED' && !isExpired;
          case 'won':
            return bid.status === 'WON';
          case 'outbid':
            return bid.status === 'OUTBID';
          case 'expired':
            return isExpired && bid.status !== 'WON';
          default:
            return true;
        }
      });
    }

    setFilteredBids(filtered);
  }, [bids, searchTerm, statusFilter]);

  const getStatusBadge = (bid: UserBid) => {
    const now = new Date();
    const endDate = bid.product.auctionEndDate ? new Date(bid.product.auctionEndDate) : null;
    const isExpired = endDate ? endDate <= now : false;
    
    if (bid.status === 'WON') {
      return <Badge className="bg-green-100 text-green-700"><Trophy className="h-3 w-3 mr-1" />Gagnée</Badge>;
    } else if (bid.status === 'OUTBID') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Surenchérie</Badge>;
    } else if (isExpired) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Expirée</Badge>;
    } else if (bid.status === 'ACCEPTED') {
      return <Badge className="bg-blue-100 text-blue-700"><Gavel className="h-3 w-3 mr-1" />En tête</Badge>;
    } else {
      return <Badge variant="outline">En attente</Badge>;
    }
  };

  const getTimeRemaining = (auctionEndDate: string | null) => {
    if (!auctionEndDate) return 'Non définie';
    
    const endDate = new Date(auctionEndDate);
    const now = new Date();
    
    if (endDate <= now) {
      return 'Terminée';
    }
    
    return formatDistanceToNow(endDate, { addSuffix: true, locale: fr });
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
          <Gavel className="h-8 w-8 text-primary" />
          Mes Enchères
        </h1>
        <p className="text-muted-foreground">
          Suivez toutes vos enchères et leur statut
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
                <SelectItem value="all">Toutes les enchères</SelectItem>
                <SelectItem value="active">En cours</SelectItem>
                <SelectItem value="won">Gagnées</SelectItem>
                <SelectItem value="outbid">Surenchéries</SelectItem>
                <SelectItem value="expired">Expirées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des enchères */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Enchères ({filteredBids.length})</CardTitle>
          <CardDescription>
            Historique complet de vos enchères
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBids.length > 0 ? (
            <div className="space-y-4">
              {filteredBids.map((bid) => (
                <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {bid.product.images.length > 0 ? (
                      <Image
                        src={bid.product.images[0].path}
                        alt={bid.product.name}
                        width={60}
                        height={60}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-15 h-15 bg-gray-200 rounded flex items-center justify-center">
                        <Gavel className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link 
                        href={`/products/${bid.product.slug}`}
                        className="font-semibold hover:text-primary"
                      >
                        {bid.product.name}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>
                          Enchère placée {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                        <span>•</span>
                        <span>
                          Fin: {getTimeRemaining(bid.product.auctionEndDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Mon enchère: </span>
                          <span className="font-semibold">
                            <PriceWithConversion price={bid.amount} />
                          </span>
                        </div>
                        {bid.product.currentHighestBid && (
                          <div>
                            <span className="text-sm text-muted-foreground">Enchère actuelle: </span>
                            <span className="font-semibold text-green-600">
                              <PriceWithConversion price={bid.product.currentHighestBid} />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(bid)}
                    <div className="mt-2">
                      <Link href={`/products/${bid.product.slug}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gavel className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune enchère trouvée'
                  : 'Vous n\'avez pas encore placé d\'enchères'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune enchère ne correspond à vos critères de recherche.'
                  : 'Découvrez nos produits en enchères et placez vos premières offres.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/products">
                  <Button>
                    <Gavel className="h-4 w-4 mr-2" />
                    Découvrir les enchères
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



