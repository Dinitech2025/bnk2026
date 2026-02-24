'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Gavel, 
  MessageSquare, 
  FileText, 
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
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

interface UserOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product?: { name: string };
    service?: { name: string };
  }>;
}

interface ProfileStats {
  totalBids: number;
  activeBids: number;
  wonBids: number;
  totalQuotes: number;
  pendingQuotes: number;
  totalOrders: number;
  totalSpent: number;
}

// Composant pour les statistiques
function ProfileStatsCards({ stats }: { stats: ProfileStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mes Enchères</CardTitle>
          <Gavel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBids}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeBids} en cours • {stats.wonBids} gagnées
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mes Devis</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalQuotes}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingQuotes} en attente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mes Commandes</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-muted-foreground">Commandes passées</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Dépensé</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <PriceWithConversion price={stats.totalSpent} />
          </div>
          <p className="text-xs text-muted-foreground">Montant total</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour les enchères récentes
function RecentBids({ bids }: { bids: UserBid[] }) {
  const getStatusBadge = (bid: UserBid) => {
    const now = new Date();
    const endDate = bid.product.auctionEndDate ? new Date(bid.product.auctionEndDate) : null;
    const isExpired = endDate ? endDate <= now : false;
    
    if (bid.status === 'WON') {
      return <Badge className="bg-green-100 text-green-700">Gagnée</Badge>;
    } else if (bid.status === 'OUTBID') {
      return <Badge variant="destructive">Surenchérie</Badge>;
    } else if (isExpired) {
      return <Badge variant="secondary">Expirée</Badge>;
    } else if (bid.status === 'ACCEPTED') {
      return <Badge className="bg-blue-100 text-blue-700">En tête</Badge>;
    } else {
      return <Badge variant="outline">En attente</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          Mes Enchères Récentes
        </CardTitle>
        <CardDescription>Vos dernières enchères placées</CardDescription>
      </CardHeader>
      <CardContent>
        {bids.length > 0 ? (
          <div className="space-y-4">
            {bids.slice(0, 5).map((bid) => (
              <div key={bid.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {bid.product.images.length > 0 ? (
                    <img
                      src={bid.product.images[0].path}
                      alt={bid.product.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <Link 
                      href={`/products/${bid.product.slug}`}
                      className="font-medium hover:text-primary"
                    >
                      {bid.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    <PriceWithConversion price={bid.amount} />
                  </p>
                  {getStatusBadge(bid)}
                </div>
              </div>
            ))}
            <div className="text-center pt-4">
              <Link href="/profile/my-bids">
                <Button variant="outline">
                  Voir toutes mes enchères
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Vous n'avez pas encore placé d'enchères</p>
            <Link href="/products">
              <Button className="mt-4">
                Découvrir les enchères
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Composant pour les devis récents
function RecentQuotes({ quotes }: { quotes: UserQuote[] }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">En attente</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-green-100 text-green-700">Accepté</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Refusé</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-700">En cours</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mes Devis Récents
        </CardTitle>
        <CardDescription>Vos dernières demandes de devis</CardDescription>
      </CardHeader>
      <CardContent>
        {quotes.length > 0 ? (
          <div className="space-y-4">
            {quotes.slice(0, 5).map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {quote.service ? quote.service.name : 'Service personnalisé'}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {quote.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="text-right">
                  {quote.finalPrice && (
                    <p className="font-semibold mb-1">
                      <PriceWithConversion price={quote.finalPrice} />
                    </p>
                  )}
                  {getStatusBadge(quote.status)}
                </div>
              </div>
            ))}
            <div className="text-center pt-4">
              <Link href="/profile/my-quotes">
                <Button variant="outline">
                  Voir tous mes devis
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Vous n'avez pas encore demandé de devis</p>
            <Link href="/devis">
              <Button className="mt-4">
                Demander un devis
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Composant principal
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProfileStats>({
    totalBids: 0,
    activeBids: 0,
    wonBids: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    totalOrders: 0,
    totalSpent: 0
  });
  const [recentBids, setRecentBids] = useState<UserBid[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<UserQuote[]>([]);

  // Rediriger si pas connecté
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/profile');
      return;
    }
  }, [session, status, router]);

  // Charger les données du profil
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchProfileData = async () => {
      try {
        const [statsRes, bidsRes, quotesRes] = await Promise.all([
          fetch('/api/profile/stats'),
          fetch('/api/profile/bids?limit=5'),
          fetch('/api/profile/quotes?limit=5')
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (bidsRes.ok) {
          const bidsData = await bidsRes.json();
          setRecentBids(bidsData);
        }

        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          setRecentQuotes(quotesData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [session?.user?.id]);

  // Affichage de chargement
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              Bonjour, {session.user.firstName || session.user.name || 'Client'}
            </h1>
            <p className="text-muted-foreground">
              Gérez vos enchères, devis et commandes
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="mb-8">
        <ProfileStatsCards stats={stats} />
      </div>

      {/* Contenu principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentBids bids={recentBids} />
        <RecentQuotes quotes={recentQuotes} />
      </div>

      {/* Actions rapides */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Accès rapide à vos fonctionnalités</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/profile/my-bids">
                <Button variant="outline" className="w-full justify-start">
                  <Gavel className="h-4 w-4 mr-2" />
                  Mes Enchères
                </Button>
              </Link>
              <Link href="/profile/my-proposals">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Mes Propositions
                </Button>
              </Link>
              <Link href="/profile/my-quotes">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mes Devis
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Mon Panier
                </Button>
              </Link>
              <Link href="/devis">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Nouveau Devis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
