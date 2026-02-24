'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMonths, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Calendar as CalendarIcon, X, Settings, Edit, Info, Check, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { PriceDisplay } from '@/components/ui/price-display';
import { useCurrency } from '@/lib/hooks/use-currency';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface PlatformOffer {
  id: string;
  platform: {
    id: string;
    name: string;
    logo?: string;
  };
}

interface Offer {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration: number;
  durationUnit?: string;
  type?: string;
  platformOffers?: PlatformOffer[];
  maxProfiles?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface SubscriptionDetails {
  platformOfferId?: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  platformAccounts?: Array<{
    platformOfferId: string;
    accountId: string;
    profileIds: string[];
  }>;
}

interface OrderItem {
  itemType: 'PRODUCT' | 'SERVICE' | 'OFFER';
  itemId: string;
  offerId?: string;
  productId?: string;
  serviceId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  item?: Product | Service | Offer;
  subscriptionDetails?: SubscriptionDetails;
}

interface OrderFormData {
  userId: string;
  status: string;
  total: number;
  items: OrderItem[];
  notes?: string;
}

interface OrderFormProps {
  users: User[];
  products: Product[];
  services: Service[];
  offers: Offer[];
  initialData?: OrderFormData;
}

interface Profile {
  id: string;
  name: string | null;
  profileSlot: number;
  isAssigned: boolean;
  pin?: string | null;
}

interface Account {
  id: string;
  username: string | null;
  email: string | null;
  platformId: string;
  accountProfiles: Profile[];
}

interface PlatformAccountsData {
  platformOfferId: string;
  accountId: string | null;
  selectedProfiles: string[];
  platform: {
    id: string;
    name: string;
    logo?: string | null;
  };
}

export function OrderForm({ users, products, services, offers, initialData }: OrderFormProps) {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  
  const [formData, setFormData] = useState<OrderFormData>({
    userId: '',
    status: 'PENDING',
    total: 0,
    items: [],
    notes: '',
  });
  
  const [currentItem, setCurrentItem] = useState<{
    itemType: 'PRODUCT' | 'SERVICE' | 'OFFER';
    itemId: string;
    quantity: number;
  }>({
    itemType: 'PRODUCT',
    itemId: '',
    quantity: 1,
  });
  
  const [errors, setErrors] = useState<{
    userId?: string;
    items?: string;
    general?: string;
  }>({});
  
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour la configuration des abonnements
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [currentSubscriptionConfig, setCurrentSubscriptionConfig] = useState<{
    item: OrderItem;
    index: number;
  } | null>(null);
  
  useEffect(() => {
    const total = formData.items.reduce((total, item) => total + item.totalPrice, 0);
    setFormData(prev => ({ ...prev, total }));
  }, [formData.items]);
  
  const getItemsForType = () => {
    switch (currentItem.itemType) {
      case 'PRODUCT':
        return products;
      case 'SERVICE':
        return services;
      case 'OFFER':
        return offers;
      default:
        return [];
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.userId) {
      newErrors.userId = 'Veuillez sélectionner un client';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Veuillez ajouter au moins un article';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddItem = () => {
    if (!currentItem.itemId) {
      setErrors(prev => ({ ...prev, items: 'Veuillez sélectionner un article' }));
      return;
    }

    const itemsForType = getItemsForType();
    const selectedItem = itemsForType.find(item => item.id === currentItem.itemId);
    
    if (!selectedItem) return;
    
    const newItem: OrderItem = {
      itemType: currentItem.itemType,
      itemId: currentItem.itemId,
      quantity: currentItem.quantity,
      unitPrice: selectedItem.price,
      totalPrice: selectedItem.price * currentItem.quantity,
      item: selectedItem,
    };
    
    if (currentItem.itemType === 'OFFER') {
      // Pour les offres, ouvrir le modal de configuration
          setCurrentSubscriptionConfig({
            item: newItem,
        index: -1 // -1 indique un nouvel item
          });
          setShowProfilesModal(true);
        } else {
      // Pour les autres types, ajouter directement
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem],
      }));

          setCurrentItem({
            itemType: 'PRODUCT',
            itemId: '',
            quantity: 1,
          });
        }
    
    setErrors(prev => ({ ...prev, items: undefined }));
  };
  
  const handleProfilesConfirmation = (platformAccountsData: PlatformAccountsData[]) => {
    if (!currentSubscriptionConfig) return;
    
    const { item, index } = currentSubscriptionConfig;
    const offer = item.item as Offer;
    
    const enrichedItem: OrderItem = {
      ...item,
      subscriptionDetails: {
        startDate: new Date(),
        endDate: addMonths(new Date(), offer.duration),
        autoRenew: false,
        platformAccounts: platformAccountsData.map(pad => ({
          platformOfferId: pad.platformOfferId,
          accountId: pad.accountId || '',
          profileIds: pad.selectedProfiles
        }))
      }
    };
    
    if (index === -1) {
      // Ajouter un nouvel item
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, enrichedItem]
      }));

      setCurrentItem({
        itemType: 'PRODUCT',
        itemId: '',
        quantity: 1
      });
    } else {
      // Mettre à jour un item existant
      setFormData(prev => ({
        ...prev,
        items: prev.items.map((item, i) => i === index ? enrichedItem : item)
      }));
    }

    setShowProfilesModal(false);
    setCurrentSubscriptionConfig(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const apiFormData = {
      ...formData,
        items: formData.items.map(item => {
          const transformedItem = {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            itemType: item.itemType,
            subscriptionDetails: item.subscriptionDetails
          };

          switch (item.itemType) {
            case 'PRODUCT':
              return { ...transformedItem, productId: item.itemId };
            case 'SERVICE':
              return { ...transformedItem, serviceId: item.itemId };
            case 'OFFER':
              return { ...transformedItem, offerId: item.itemId };
            default:
              return transformedItem;
          }
        })
      };

      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de la commande');
      }

      const data = await response.json();
      
      // Émettre un événement personnalisé pour notifier la création de la commande
      const event = new CustomEvent('orderCreated', { detail: data });
      window.dispatchEvent(event);
      
      // Rediriger vers la liste des commandes
      router.push('/admin/orders');
      
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        general: error instanceof Error ? error.message : 'Une erreur est survenue' 
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
          <CardDescription>Sélectionnez le client pour cette commande</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="userId">Client</Label>
              <Select
                  value={formData.userId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, userId: value }));
                  setErrors(prev => ({ ...prev, userId: undefined }));
                }}
              >
                <SelectTrigger id="userId">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <span className="text-sm text-red-500">{errors.userId}</span>
              )}
                          </div>
              </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>Ajoutez des produits, services ou offres à la commande</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="itemType">Type</Label>
                <Select
                  value={currentItem.itemType}
                  onValueChange={(value: 'PRODUCT' | 'SERVICE' | 'OFFER') => {
                    setCurrentItem(prev => ({ ...prev, itemType: value, itemId: '' }));
                  }}
                >
                  <SelectTrigger id="itemType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCT">Produit</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="OFFER">Offre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="itemId">Article</Label>
                <Select
                  value={currentItem.itemId}
                  onValueChange={(value) => {
                    setCurrentItem(prev => ({ ...prev, itemId: value }));
                    setErrors(prev => ({ ...prev, items: undefined }));
                  }}
                >
                  <SelectTrigger id="itemId">
                    <SelectValue placeholder="Sélectionner un article" />
                  </SelectTrigger>
                  <SelectContent>
                    {getItemsForType().map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - {formatCurrency(item.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-24">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem(prev => ({ 
                    ...prev, 
                    quantity: Math.max(1, parseInt(e.target.value) || 1)
                  }))}
                />
              </div>
              
              <Button
                  type="button"
                onClick={handleAddItem}
                className="flex gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
          </div>
          
            {errors.items && (
              <Alert variant="destructive">
                <AlertDescription>{errors.items}</AlertDescription>
              </Alert>
            )}

              <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{item.item?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                    {item.itemType === 'OFFER' && item.subscriptionDetails?.platformAccounts && (
                      <div className="mt-2">
                        {item.subscriptionDetails.platformAccounts.map((pa, i) => (
                          <Badge key={i} variant="secondary" className="mr-2">
                            {pa.profileIds.length} profil(s)
                          </Badge>
                        ))}
                </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-medium">
                      {formatCurrency(item.totalPrice)}
                    </p>
                    {item.itemType === 'OFFER' && (
                        <Button
                          variant="outline"
                        size="icon"
                        onClick={() => {
                          setCurrentSubscriptionConfig({ item, index });
                          setShowProfilesModal(true);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                        </Button>
                    )}
                        <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          items: prev.items.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      <X className="w-4 h-4" />
                        </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {formData.items.length} article(s)
          </div>
          <div className="text-lg font-medium">
            Total: {formatCurrency(formData.total)}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Ajoutez des notes à la commande (optionnel)</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Notes..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </CardContent>
      </Card>

      {errors.general && (
        <Alert variant="destructive">
          <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
            )}
          
      <div className="flex justify-end gap-4">
            <Button 
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/orders')}
            >
          Annuler
            </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Créer la commande
        </Button>
      </div>

      {showProfilesModal && currentSubscriptionConfig && (
        <SubscriptionProfilesModal
          isOpen={showProfilesModal}
          onClose={() => {
            setShowProfilesModal(false);
            setCurrentSubscriptionConfig(null);
          }}
          offer={currentSubscriptionConfig.item.item as Offer}
          onConfirm={handleProfilesConfirmation}
        />
      )}
    </form>
  );
}

// Composant modal pour configurer les comptes et profils
function SubscriptionProfilesModal({
  isOpen,
  onClose,
  offer,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
  onConfirm: (data: PlatformAccountsData[]) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>({});
  const [platformSelections, setPlatformSelections] = useState<PlatformAccountsData[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('');

  // Initialisation des sélections de plateformes
  useEffect(() => {
    if (offer && offer.platformOffers && offer.platformOffers.length > 0) {
      // Réinitialiser les sélections
      const selections = offer.platformOffers.map(po => ({
        platformOfferId: po.id,
        accountId: null,
        selectedProfiles: [],
        platform: po.platform
      }));
      
      setPlatformSelections(selections);
      setCurrentTab(offer.platformOffers[0].id);
      
      // Charger les comptes pour chaque plateforme
      offer.platformOffers.forEach(po => {
        fetchAccounts(po.platform.id);
      });
    }
  }, [offer]);

  // Récupérer les comptes disponibles pour une plateforme
  const fetchAccounts = async (platformId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/streaming/accounts?platformId=${platformId}&status=AVAILABLE`);
      if (response.ok) {
        const data = await response.json();
        setAccountsMap(prev => ({
          ...prev,
          [platformId]: data
        }));
      } else {
        console.error('Erreur lors de la récupération des comptes');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer le changement de compte sélectionné
  const handleAccountSelection = (platformOfferId: string, accountId: string) => {
    setPlatformSelections(prev => 
      prev.map(selection => 
        selection.platformOfferId === platformOfferId 
          ? { 
              ...selection, 
              accountId, 
              selectedProfiles: [] // Réinitialiser les profils sélectionnés
            }
          : selection
      )
    );
  };

  // Gérer la sélection/désélection d'un profil
  const handleProfileToggle = (platformOfferId: string, profileId: string) => {
    setPlatformSelections(prev => 
      prev.map(selection => {
        if (selection.platformOfferId !== platformOfferId) return selection;
        
        const maxProfiles = offer?.maxProfiles || 1;
        const profiles = selection.selectedProfiles;
        
        if (profiles.includes(profileId)) {
          // Retirer le profil
          return {
            ...selection,
            selectedProfiles: profiles.filter(id => id !== profileId)
          };
        } else {
          // Ajouter le profil si la limite n'est pas atteinte
          if (profiles.length < maxProfiles) {
            return {
              ...selection,
              selectedProfiles: [...profiles, profileId]
            };
          }
          return selection;
        }
      })
    );
  };

  // Vérifier si la configuration est valide
  const isConfigValid = (): boolean => {
    return platformSelections.every(selection => {
      // Chaque plateforme doit avoir un compte sélectionné
      if (!selection.accountId) return false;
      
      // Si la plateforme a des profils et que l'offre requiert des profils,
      // vérifier que le bon nombre de profils est sélectionné
      const platform = selection.platform;
      const accounts = accountsMap[platform.id] || [];
      const account = accounts.find(a => a.id === selection.accountId);
      
      if (!account) return false;
      
      const hasProfiles = account.accountProfiles && account.accountProfiles.length > 0;
      if (hasProfiles && offer && (offer.maxProfiles ?? 0) > 0) {
        return selection.selectedProfiles.length === (offer.maxProfiles ?? 1);
      }
      
      return true;
    });
  };

  // Gérer la confirmation de la sélection
  const handleConfirm = () => {
    if (isConfigValid()) {
      onConfirm(platformSelections);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-4/5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuration des comptes et profils</DialogTitle>
          <DialogDescription>
            Sélectionnez les comptes et profils à utiliser pour chaque plateforme de l'abonnement.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Chargement des comptes...</span>
          </div>
        ) : (
          <>
            {platformSelections.length > 0 && (
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="mb-4 flex flex-wrap">
                  {platformSelections.map((selection) => (
                    <TabsTrigger 
                      key={selection.platformOfferId}
                      value={selection.platformOfferId}
                      className="flex items-center gap-2"
                    >
                      {selection.platform.logo ? (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{selection.platform.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                          {selection.platform.name.substring(0, 2)}
                        </div>
                      )}
                      <span>{selection.platform.name}</span>
                      {selection.accountId ? (
                        <Badge variant="success" className="ml-1"><Check className="h-3 w-3" /></Badge>
                      ) : (
                        <Badge variant="outline" className="ml-1">À configurer</Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {platformSelections.map((selection) => {
                  const platformId = selection.platform.id;
                  const accounts = accountsMap[platformId] || [];
                  
                  return (
                    <TabsContent 
                      key={selection.platformOfferId} 
                      value={selection.platformOfferId}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-lg font-medium mb-3">Sélection du compte</h3>
                        {accounts.length === 0 ? (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Aucun compte disponible pour cette plateforme.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <RadioGroup
                            value={selection.accountId || ''}
                            onValueChange={(value) => handleAccountSelection(selection.platformOfferId, value)}
                          >
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                              {accounts.map((account) => (
                                <div
                                  key={account.id}
                                  className={`border rounded-md p-4 cursor-pointer hover:border-primary ${
                                    selection.accountId === account.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                                  }`}
                                >
                                  <RadioGroupItem
                                    value={account.id}
                                    id={account.id}
                                    className="sr-only"
                                  />
                                  <label
                                    htmlFor={account.id}
                                    className="flex flex-col gap-2 cursor-pointer"
                                  >
                                    <div className="font-medium">
                                      {account.username || account.email || `Compte ${account.id.substring(0, 6)}`}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {account.accountProfiles.length} profils disponibles
                                    </div>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}
                      </div>
                      
                      {selection.accountId && (
                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Sélection des profils
                            {offer && (
                              <span className="text-sm font-normal text-gray-500 ml-2">
                                (Sélectionnez {offer.maxProfiles ?? 1} profil{(offer.maxProfiles ?? 1) > 1 ? 's' : ''})
                              </span>
                            )}
                          </h3>
                          
                          {(() => {
                            const account = accounts.find(a => a.id === selection.accountId);
                            if (!account) return null;
                            
                            const availableProfiles = account.accountProfiles.filter(p => !p.isAssigned);
                            
                            if (availableProfiles.length === 0) {
                              return (
                                <Alert>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    Aucun profil disponible pour ce compte.
                                  </AlertDescription>
                                </Alert>
                              );
                            }
                            
                            return (
                              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {availableProfiles.map((profile) => {
                                  const isSelected = selection.selectedProfiles.includes(profile.id);
                                  const maxReached = selection.selectedProfiles.length >= (offer?.maxProfiles ?? 1) && !isSelected;
                                  
                                  return (
                                    <div
                                      key={profile.id}
                                      className={`border rounded-md p-4 cursor-pointer ${
                                        isSelected 
                                          ? 'border-primary bg-primary/5' 
                                          : maxReached 
                                            ? 'border-gray-200 opacity-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                      onClick={() => !maxReached && handleProfileToggle(selection.platformOfferId, profile.id)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                          <Checkbox
                                            checked={isSelected}
                                            disabled={maxReached}
                                            onCheckedChange={() => {}}
                                            className="h-5 w-5"
                                          />
                                        </div>
                                        <div>
                                          <div className="font-medium">
                                            {profile.name || `Profil ${profile.profileSlot}`}
                                          </div>
                                          {profile.pin && (
                                            <div className="text-xs text-gray-500">PIN: {profile.pin}</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isConfigValid() || isLoading}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
