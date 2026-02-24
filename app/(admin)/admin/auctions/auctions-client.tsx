'use client';

import React, { useState, useMemo } from 'react';
import { 
  Gavel, 
  Clock, 
  Users, 
  TrendingUp, 
  Eye, 
  Search,
  Filter,
  Calendar,
  DollarSign,
  Trophy,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  User,
  Package
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface AuctionBid {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    fullName: string;
  };
}

interface Auction {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  minimumBid: number | null;
  currentHighestBid: number | null;
  auctionEndDate: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isExpired: boolean;
  totalBids: number;
  activeBids: number;
  highestBidder: {
    id: string;
    fullName: string;
    email: string;
    amount: number;
    bidDate: string;
  } | null;
  bids: AuctionBid[];
  images: Array<{ path: string }>;
  category: { name: string } | null;
}

interface AuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  expiredAuctions: number;
  totalBids: number;
  activeBids: number;
  totalRevenue: number;
}

interface AuctionsClientProps {
  auctions: Auction[];
  currencySettings: {
    currency: string;
    currencySymbol: string;
  };
  stats: AuctionStats;
}

type StatusFilter = 'all' | 'active' | 'expired' | 'no_bids';

// Composant pour les statistiques
function AuctionStatsCards({ stats }: { stats: AuctionStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Enchères</CardTitle>
          <Gavel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAuctions}</div>
          <p className="text-xs text-muted-foreground">Produits en enchères</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Enchères Actives</CardTitle>
          <Clock className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeAuctions}</div>
          <p className="text-xs text-muted-foreground">En cours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Enchères Expirées</CardTitle>
          <Timer className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.expiredAuctions}</div>
          <p className="text-xs text-muted-foreground">Terminées</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Offres</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBids}</div>
          <p className="text-xs text-muted-foreground">Enchères placées</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Offres Actives</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.activeBids}</div>
          <p className="text-xs text-muted-foreground">Non annulées</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenus Potentiels</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            <PriceWithConversion price={stats.totalRevenue} />
          </div>
          <p className="text-xs text-muted-foreground">Enchères gagnantes</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour le détail des enchères d'un produit
function AuctionBidsDialog({ auction }: { auction: Auction }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Voir Enchères ({auction.totalBids})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Enchères pour "{auction.name}"
          </DialogTitle>
          <DialogDescription>
            {auction.totalBids} enchère(s) placée(s) • 
            {auction.isActive ? ' Enchère active' : ' Enchère terminée'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations du produit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations du Produit</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Prix de départ</p>
                <p className="font-semibold"><PriceWithConversion price={auction.price} /></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enchère minimum</p>
                <p className="font-semibold">
                  {auction.minimumBid ? <PriceWithConversion price={auction.minimumBid} /> : 'Non définie'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enchère la plus haute</p>
                <p className="font-semibold text-green-600">
                  {auction.currentHighestBid ? <PriceWithConversion price={auction.currentHighestBid} /> : 'Aucune'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fin de l'enchère</p>
                <p className="font-semibold">
                  {auction.auctionEndDate ? format(new Date(auction.auctionEndDate), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Non définie'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Liste des enchères */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique des Enchères</CardTitle>
            </CardHeader>
            <CardContent>
              {auction.bids.length > 0 ? (
                <div className="space-y-3">
                  {auction.bids.map((bid, index) => (
                    <div key={bid.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{bid.user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{bid.user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${index === 0 ? 'text-green-600' : ''}`}>
                          <PriceWithConversion price={bid.amount} />
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                        <Badge variant={bid.status === 'ACCEPTED' ? 'default' : 'secondary'} className="text-xs">
                          {bid.status === 'ACCEPTED' ? 'Acceptée' : bid.status === 'PENDING' ? 'En attente' : 'Rejetée'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune enchère placée pour ce produit</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Composant principal
export default function AuctionsClient({ auctions, currencySettings, stats }: AuctionsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filtrage des enchères
  const filteredAuctions = useMemo(() => {
    let filtered = auctions;

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(auction => 
        auction.name.toLowerCase().includes(search) ||
        auction.sku?.toLowerCase().includes(search) ||
        auction.category?.name.toLowerCase().includes(search)
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(auction => {
        switch (statusFilter) {
          case 'active':
            return auction.isActive;
          case 'expired':
            return auction.isExpired;
          case 'no_bids':
            return auction.totalBids === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [auctions, searchTerm, statusFilter]);

  const getStatusBadge = (auction: Auction) => {
    if (auction.isActive) {
      return <Badge className="bg-green-100 text-green-700">Active</Badge>;
    } else if (auction.isExpired) {
      return <Badge variant="destructive">Expirée</Badge>;
    } else {
      return <Badge variant="secondary">Brouillon</Badge>;
    }
  };

  const getTimeRemaining = (auction: Auction) => {
    if (!auction.auctionEndDate) return 'Non définie';
    
    const endDate = new Date(auction.auctionEndDate);
    const now = new Date();
    
    if (endDate <= now) {
      return 'Terminée';
    }
    
    return formatDistanceToNow(endDate, { addSuffix: true, locale: fr });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Enchères</h1>
          <p className="text-muted-foreground">
            Suivez toutes les enchères et offres de vos produits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/new">
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Nouveau Produit Enchère
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <AuctionStatsCards stats={stats} />

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, SKU, catégorie..."
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
                <SelectItem value="active">Enchères actives</SelectItem>
                <SelectItem value="expired">Enchères expirées</SelectItem>
                <SelectItem value="no_bids">Sans enchères</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des enchères */}
      <Card>
        <CardHeader>
          <CardTitle>Enchères ({filteredAuctions.length})</CardTitle>
          <CardDescription>
            Liste de tous les produits en enchères avec leur statut et historique
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAuctions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Prix de départ</TableHead>
                  <TableHead>Enchère actuelle</TableHead>
                  <TableHead>Enchères</TableHead>
                  <TableHead>Temps restant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuctions.map((auction) => (
                  <TableRow key={auction.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {auction.images.length > 0 ? (
                          <Image
                            src={auction.images[0].path}
                            alt={auction.name}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{auction.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {auction.sku && `SKU: ${auction.sku}`}
                            {auction.category && ` • ${auction.category.name}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PriceWithConversion price={auction.price} />
                    </TableCell>
                    <TableCell>
                      {auction.currentHighestBid ? (
                        <div>
                          <p className="font-semibold text-green-600">
                            <PriceWithConversion price={auction.currentHighestBid} />
                          </p>
                          {auction.highestBidder && (
                            <p className="text-sm text-muted-foreground">
                              par {auction.highestBidder.fullName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Aucune enchère</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{auction.totalBids}</Badge>
                        {auction.activeBids > 0 && (
                          <Badge className="bg-blue-100 text-blue-700">
                            {auction.activeBids} active(s)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {auction.isActive && <Clock className="h-4 w-4 text-green-600" />}
                        {auction.isExpired && <Timer className="h-4 w-4 text-red-600" />}
                        <span className={auction.isActive ? 'text-green-600' : auction.isExpired ? 'text-red-600' : ''}>
                          {getTimeRemaining(auction)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(auction)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AuctionBidsDialog auction={auction} />
                        <Link href={`/admin/products/${auction.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Modifier
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Gavel className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune enchère trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune enchère ne correspond à vos critères de recherche.'
                  : 'Vous n\'avez pas encore de produits en enchères.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/admin/products/new">
                  <Button>
                    <Package className="h-4 w-4 mr-2" />
                    Créer un Produit Enchère
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
