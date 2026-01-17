'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft,
  Package,
  Plus,
  Minus,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  Save,
  Calculator,
  Eye,
  Calendar,
  User,
  FileText,
  Hash
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import Link from 'next/link';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

// Types
interface StockMovement {
  id: string;
  type: 'adjustment' | 'sale' | 'correction' | 'return';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
  reference?: string;
}

interface ProductWithStock {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  inventory: number;
  price: number;
  compareAtPrice: number | null;
  pricingType: string;
  published: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: Array<{ id: string; path: string; alt?: string }>;
  category: { id: string; name: string; slug: string } | null;
  variations: Array<{
    id: string;
    sku: string | null;
    inventory: number;
    price: number;
    attributes: Array<{ name: string; value: string }>;
  }>;
  totalInventory: number;
  stockValue: number;
  stockStatus: 'critical' | 'low' | 'normal' | 'high';
  hasVariations: boolean;
  variationsCount: number;
  ordersCount: number;
}

interface StockSettings {
  lowStockThreshold: number;
  criticalStockThreshold: number;
  autoReorderEnabled: boolean;
  autoReorderQuantity: number;
}

interface StockAdjustmentClientProps {
  product: ProductWithStock;
  stockHistory: StockMovement[];
  stockSettings: StockSettings;
}

// Composant d'historique des mouvements
function StockHistoryTable({ movements }: { movements: StockMovement[] }) {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'adjustment':
        return <Calculator className="h-4 w-4 text-blue-600" />;
      case 'sale':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'correction':
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      case 'return':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'adjustment': return 'Ajustement';
      case 'sale': return 'Vente';
      case 'correction': return 'Correction';
      case 'return': return 'Retour';
      default: return 'Mouvement';
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'adjustment': return 'bg-blue-100 text-blue-800';
      case 'sale': return 'bg-red-100 text-red-800';
      case 'correction': return 'bg-orange-100 text-orange-800';
      case 'return': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des Mouvements
        </CardTitle>
        <CardDescription>
          Suivi complet des modifications de stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Avant</TableHead>
              <TableHead>Après</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Par</TableHead>
              <TableHead>Référence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getMovementIcon(movement.type)}
                    <Badge className={getMovementColor(movement.type)}>
                      {getMovementLabel(movement.type)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </span>
                </TableCell>
                <TableCell>{movement.previousQuantity}</TableCell>
                <TableCell className="font-medium">{movement.newQuantity}</TableCell>
                <TableCell className="max-w-xs truncate" title={movement.reason}>
                  {movement.reason}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{new Date(movement.createdAt).toLocaleDateString()}</div>
                    <div className="text-gray-500">
                      {new Date(movement.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{movement.createdBy}</Badge>
                </TableCell>
                <TableCell>
                  {movement.reference && (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {movement.reference}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Composant principal
export default function StockAdjustmentClient({ 
  product, 
  stockHistory, 
  stockSettings 
}: StockAdjustmentClientProps) {
  const { toast } = useToast();
  const router = useRouter();

  // États pour l'ajustement
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'remove'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentReference, setAdjustmentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour les variations
  const [variationAdjustments, setVariationAdjustments] = useState<Record<string, number>>({});

  // Calculer la nouvelle quantité selon le type d'ajustement
  const calculateNewQuantity = () => {
    switch (adjustmentType) {
      case 'set':
        return adjustmentQuantity;
      case 'add':
        return product.inventory + adjustmentQuantity;
      case 'remove':
        return Math.max(0, product.inventory - adjustmentQuantity);
      default:
        return product.inventory;
    }
  };

  // Gérer l'ajustement du stock principal
  const handleStockAdjustment = async () => {
    if (!adjustmentReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer une raison pour l'ajustement.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newQuantity = calculateNewQuantity();
      
      // TODO: Appeler l'API pour ajuster le stock
      const response = await fetch(`/api/admin/products/${product.id}/inventory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory: newQuantity,
          reason: adjustmentReason,
          reference: adjustmentReference || undefined,
          type: adjustmentType
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajustement du stock');
      }

      toast({
        title: "Stock ajusté !",
        description: `Le stock a été mis à jour de ${product.inventory} à ${newQuantity} unités.`,
      });

      // Réinitialiser le formulaire
      setAdjustmentQuantity(0);
      setAdjustmentReason('');
      setAdjustmentReference('');

      // Rafraîchir la page
      router.refresh();

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajuster le stock. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer l'ajustement des variations
  const handleVariationAdjustment = async (variationId: string, newQuantity: number) => {
    try {
      // TODO: Appeler l'API pour ajuster le stock de la variation
      const response = await fetch(`/api/admin/products/variations/${variationId}/inventory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory: newQuantity,
          reason: `Ajustement variation ${variationId}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajustement de la variation');
      }

      toast({
        title: "Variation ajustée !",
        description: `Le stock de la variation a été mis à jour.`,
      });

      router.refresh();

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajuster la variation.",
        variant: "destructive",
      });
    }
  };

  const getStockStatusConfig = (status: string) => {
    switch (status) {
      case 'critical':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: XCircle, 
          label: 'Critique' 
        };
      case 'low':
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          icon: AlertTriangle, 
          label: 'Faible' 
        };
      case 'high':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: TrendingUp, 
          label: 'Élevé' 
        };
      default:
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircle, 
          label: 'Normal' 
        };
    }
  };

  const statusConfig = getStockStatusConfig(product.stockStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products/inventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'inventaire
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ajustement de Stock</h1>
            <p className="text-muted-foreground">
              Gestion du stock pour {product.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/products/${product.id}/edit`}>
            <Button variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Modifier Produit
            </Button>
          </Link>
          <Link href={`/products/${product.slug}`} target="_blank">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Voir Public
            </Button>
          </Link>
        </div>
      </div>

      {/* Informations produit */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {product.images[0]?.path ? (
                  <Image 
                    src={product.images[0].path} 
                    alt={product.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{product.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500">
                    SKU: {product.sku || 'Non défini'}
                  </span>
                  {product.category && (
                    <Badge variant="outline">{product.category.name}</Badge>
                  )}
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                <PriceWithConversion price={product.price} />
              </div>
              <div className="text-sm text-gray-500">
                Valeur stock: <PriceWithConversion price={product.stockValue} />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alertes */}
      {product.stockStatus === 'critical' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Stock Critique</AlertTitle>
          <AlertDescription className="text-red-700">
            Le stock de ce produit est critique ({product.totalInventory} unités). 
            Un réapprovisionnement est urgent.
          </AlertDescription>
        </Alert>
      )}

      {product.stockStatus === 'low' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Stock Faible</AlertTitle>
          <AlertDescription className="text-orange-700">
            Le stock de ce produit est faible ({product.totalInventory} unités). 
            Pensez à le réapprovisionner prochainement.
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets principaux */}
      <Tabs defaultValue="adjustment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="adjustment">Ajustement Stock</TabsTrigger>
          <TabsTrigger value="variations">Variations</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Onglet Ajustement */}
        <TabsContent value="adjustment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire d'ajustement */}
            <Card>
              <CardHeader>
                <CardTitle>Ajuster le Stock Principal</CardTitle>
                <CardDescription>
                  Stock actuel: {product.inventory} unités
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adjustmentType">Type d'ajustement</Label>
                  <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-600" />
                          Ajouter au stock
                        </div>
                      </SelectItem>
                      <SelectItem value="remove">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-600" />
                          Retirer du stock
                        </div>
                      </SelectItem>
                      <SelectItem value="set">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-blue-600" />
                          Définir la quantité
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    {adjustmentType === 'set' ? 'Nouvelle quantité' : 'Quantité à ajuster'}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Raison de l'ajustement *</Label>
                  <Textarea
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Ex: Réapprovisionnement, correction inventaire, produit défectueux..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Référence (optionnel)</Label>
                  <Input
                    id="reference"
                    value={adjustmentReference}
                    onChange={(e) => setAdjustmentReference(e.target.value)}
                    placeholder="Ex: BON-2024-001, INV-NOV-2024"
                  />
                </div>

                {adjustmentQuantity > 0 && (
                  <Alert>
                    <Calculator className="h-4 w-4" />
                    <AlertTitle>Aperçu de l'ajustement</AlertTitle>
                    <AlertDescription>
                      Stock actuel: {product.inventory} → Nouveau stock: {calculateNewQuantity()}
                      <br />
                      Différence: {calculateNewQuantity() - product.inventory > 0 ? '+' : ''}{calculateNewQuantity() - product.inventory}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleStockAdjustment} 
                  disabled={isSubmitting || !adjustmentReason.trim() || adjustmentQuantity === 0}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Ajustement en cours...' : 'Ajuster le Stock'}
                </Button>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques du Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{product.inventory}</div>
                    <div className="text-sm text-blue-700">Stock Principal</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {product.totalInventory - product.inventory}
                    </div>
                    <div className="text-sm text-purple-700">Variations</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{product.totalInventory}</div>
                    <div className="text-sm text-green-700">Total</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{product.ordersCount}</div>
                    <div className="text-sm text-orange-700">Commandes</div>
                  </div>
                </div>

                {product.hasVariations && (
                  <div className="space-y-2">
                    <Label>Répartition du stock</Label>
                    <Progress 
                      value={(product.inventory / product.totalInventory) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Principal: {product.inventory}</span>
                      <span>Variations: {product.totalInventory - product.inventory}</span>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Seuil critique:</span>
                    <span className="font-medium">{stockSettings.criticalStockThreshold}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Seuil faible:</span>
                    <span className="font-medium">{stockSettings.lowStockThreshold}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Réapprovisionnement auto:</span>
                    <Badge variant={stockSettings.autoReorderEnabled ? "default" : "secondary"}>
                      {stockSettings.autoReorderEnabled ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Variations */}
        <TabsContent value="variations" className="space-y-6">
          {product.hasVariations ? (
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Variations</CardTitle>
                <CardDescription>
                  Ajustez le stock de chaque variation individuellement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variation</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Stock Actuel</TableHead>
                      <TableHead>Nouveau Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variations.map((variation) => (
                      <TableRow key={variation.id}>
                        <TableCell>
                          <div className="space-y-1">
                            {variation.attributes.map((attr, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {attr.name}: {attr.value}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {variation.sku || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <PriceWithConversion price={variation.price} />
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{variation.inventory}</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            defaultValue={variation.inventory}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 0;
                              setVariationAdjustments(prev => ({
                                ...prev,
                                [variation.id]: newValue
                              }));
                            }}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              const newQuantity = variationAdjustments[variation.id] ?? variation.inventory;
                              handleVariationAdjustment(variation.id, newQuantity);
                            }}
                            disabled={!(variation.id in variationAdjustments)}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Ajuster
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune Variation
                </h3>
                <p className="text-gray-500 mb-4">
                  Ce produit n'a pas de variations. Vous pouvez ajuster uniquement le stock principal.
                </p>
                <Link href={`/admin/products/${product.id}/variations`}>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter des Variations
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="history" className="space-y-6">
          <StockHistoryTable movements={stockHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}



