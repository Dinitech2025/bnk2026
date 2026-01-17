'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  CreditCard, 
  Truck, 
  MapPin, 
  User, 
  ShoppingCart,
  Calculator,
  Save,
  AlertTriangle,
  Search,
  X,
  Copy,
  Percent,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ImportSimulationModal } from './import-simulation-modal';
import { useCurrency } from '@/components/providers/currency-provider';

// Types
interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  state: string | null;
  zipCode: string;
  country: string;
  phoneNumber: string | null;
  isDefault: boolean;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone?: string | null;
  addresses?: Address[];
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
  pricingType?: 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED';
  requiresQuote?: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  autoAcceptNegotiation?: boolean;
  duration?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  image?: string | null;
}

interface Offer {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration: number;
  platformOffers?: {
    id: string;
    platform: {
      id: string;
      name: string;
      logo?: string;
    };
  }[];
}

interface Profile {
  id: string;
  name: string;
  profileSlot: number;
  isAssigned: boolean;
}

interface StreamingAccount {
  id: string;
  email?: string;
  username?: string;
  status: string;
  profilesUsed?: number;
  maxProfiles?: number;
  platform?: {
    id: string;
    name: string;
    logo?: string;
    hasProfiles: boolean;
    maxProfilesPerAccount: number | null;
  };
  accountProfiles: Profile[];
}

interface OrderItem {
  id: string;
  itemType: 'PRODUCT' | 'SERVICE' | 'OFFER';
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  discountAmount?: number;
  subscriptionDetails?: {
    accountId: string;
    profileIds: string[];
  };
}

interface PaymentData {
  method: string;
  provider: string;
  amount: number;
  transactionId?: string;
  reference?: string;
  notes?: string;
}

interface DeliveryData {
  method: 'PICKUP' | 'DELIVERY';
  address?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  notes?: string;
}

interface FormData {
  userId: string;
  status: 'PENDING'; // Toujours PENDING par défaut
  items: OrderItem[];
  globalDiscount?: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    amount: number;
  };
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  payment?: PaymentData;
  delivery: DeliveryData;
  notes?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  description?: string;
  feeType?: string;
  feeValue: number;
  isActive: boolean;
}

interface DeliveryMethod {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedDays: number;
  isActive: boolean;
}

interface EnhancedOrderFormProps {
  users: User[];
  products: Product[];
  services: Service[];
  offers: Offer[];
  paymentMethods: PaymentMethod[];
  deliveryMethods: DeliveryMethod[];
}

export function EnhancedOrderForm({ users, products, services, offers, paymentMethods, deliveryMethods }: EnhancedOrderFormProps) {
  const router = useRouter();
  const { targetCurrency, formatCurrency, exchangeRates, convertCurrency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('client');
  
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    status: 'PENDING',
    items: [],
    delivery: {
      method: 'PICKUP'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatalogTab, setSelectedCatalogTab] = useState('products');
  
  // États pour la configuration des abonnements
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<StreamingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Pré-remplir automatiquement les adresses quand un client est sélectionné
  useEffect(() => {
    if (formData.userId) {
      const selectedUser = users.find(u => u.id === formData.userId);
      if (selectedUser) {
        // Chercher l'adresse par défaut ou la première adresse disponible
        const defaultAddress = selectedUser.addresses?.find(addr => addr.isDefault) || selectedUser.addresses?.[0];
        
        if (defaultAddress) {
          const formattedAddress = convertAddressToFormFormat(defaultAddress, selectedUser);
          
          setFormData(prev => ({
            ...prev,
            billingAddress: formattedAddress,
            // Aussi pré-remplir l'adresse de livraison si pas encore définie
            delivery: {
              ...prev.delivery,
              address: prev.delivery.address ? prev.delivery.address : formattedAddress
            }
          }));
          
          console.log('✅ Adresse par défaut du client utilisée automatiquement');
        }
      }
    }
  }, [formData.userId, users]);

  // Calculer le sous-total des articles (avant réduction globale)
  const itemsSubtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculer la réduction globale
  const globalDiscountAmount = formData.globalDiscount ? formData.globalDiscount.amount : 0;
  
  // Calculer le coût de livraison
  const deliveryCost = formData.delivery.method 
    ? (deliveryMethods.find(m => m.id === formData.delivery.method)?.basePrice || 0)
    : 0;
  
  // Calculer le total de la commande (après réduction globale + livraison)
  const orderTotal = Math.max(0, itemsSubtotal - globalDiscountAmount + deliveryCost);

  // Fonction de conversion de prix avec le contexte de devise
  const convertPrice = (amount: number) => {
    if (!targetCurrency || targetCurrency === 'Ar' || targetCurrency === 'MGA') {
      return amount;
    }
    
    try {
      return convertCurrency(amount, 'MGA', targetCurrency, exchangeRates);
    } catch (error) {
      console.error('Erreur de conversion:', error);
      return amount;
    }
  };

  // Formater le prix avec la devise sélectionnée
  const formatPrice = (amount: number) => {
    if (formatCurrency) {
      return formatCurrency(amount);
    }
    const convertedAmount = convertPrice(amount);
    const symbol = targetCurrency === 'USD' ? '$' : 
                   targetCurrency === 'EUR' ? '€' : 
                   targetCurrency === 'GBP' ? '£' : 'Ar';
    return `${convertedAmount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${symbol}`;
  };

  // Filtrer les articles selon la recherche
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredOffers = offers.filter(offer =>
    offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (offer.description && offer.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculer le prix total d'un article avec réduction
  const calculateItemTotalPrice = (unitPrice: number, quantity: number, discountType?: 'PERCENTAGE' | 'FIXED', discountValue?: number) => {
    const subtotal = unitPrice * quantity;
    if (!discountType || !discountValue) return subtotal;
    
    let discountAmount = 0;
    if (discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (discountType === 'FIXED') {
      discountAmount = Math.min(discountValue, subtotal); // Ne pas dépasser le sous-total
    }
    
    return Math.max(0, subtotal - discountAmount);
  };

  // Calculer le montant de réduction d'un article
  const calculateItemDiscountAmount = (unitPrice: number, quantity: number, discountType?: 'PERCENTAGE' | 'FIXED', discountValue?: number) => {
    const subtotal = unitPrice * quantity;
    if (!discountType || !discountValue) return 0;
    
    if (discountType === 'PERCENTAGE') {
      return (subtotal * discountValue) / 100;
    } else if (discountType === 'FIXED') {
      return Math.min(discountValue, subtotal);
    }
    
    return 0;
  };

  // Calculer la réduction globale
  const calculateGlobalDiscount = (subtotal: number, discountType: 'PERCENTAGE' | 'FIXED', discountValue: number) => {
    if (discountType === 'PERCENTAGE') {
      return (subtotal * discountValue) / 100;
    } else if (discountType === 'FIXED') {
      return Math.min(discountValue, subtotal);
    }
    return 0;
  };

  // Ajouter un article
  const addItem = (type: 'PRODUCT' | 'SERVICE' | 'OFFER', item: Product | Service | Offer) => {
    // Vérifier si c'est un service qui nécessite un devis
    if (type === 'SERVICE' && item.pricingType === 'QUOTE_REQUIRED') {
      toast.info(`"${item.name}" nécessite un devis. Redirection vers la création de devis...`, {
        duration: 3000,
      });

      // Rediriger vers la page de devis avec le service pré-sélectionné
      setTimeout(() => {
        router.push(`/admin/quotes/new?serviceId=${item.id}`);
      }, 1000);
      return;
    }

    // Vérifier si c'est un service négociable
    if (type === 'SERVICE' && item.pricingType === 'NEGOTIABLE') {
      toast.info(`"${item.name}" est négociable. Un devis sera créé pour négociation.`, {
        duration: 3000,
      });
    }

    // Prix à utiliser (pour les services avec fourchette, utiliser le prix minimum)
    const finalPrice = (type === 'SERVICE' && item.pricingType === 'RANGE' && item.minPrice)
      ? item.minPrice
      : item.price;

    const newItem: OrderItem = {
      id: `${type}_${item.id}_${Date.now()}`,
      itemType: type,
      itemId: item.id,
      name: item.name,
      unitPrice: finalPrice,
      quantity: 1,
      totalPrice: finalPrice
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    toast.success(`${item.name} ajouté au panier`);
  };

  // Ajouter un article importé depuis la simulation
  const addImportedItem = (importedItem: any) => {
    const newItem: OrderItem = {
      id: importedItem.id,
      itemType: importedItem.itemType,
      itemId: null, // Pas d'ID de produit existant
      name: importedItem.name,
      unitPrice: importedItem.price,
      quantity: 1,
      totalPrice: importedItem.price,
      metadata: {
        isImported: true,
        name: importedItem.name, // Ajouter le nom dans les métadonnées
        weight: importedItem.weight,
        description: importedItem.description,
        importData: importedItem.importData
      }
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    toast.success(`${importedItem.itemType === 'SERVICE' ? 'Service' : 'Produit'} importé ajouté au panier`);
  };

  // Supprimer un article
  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Mettre à jour la quantité d'un article
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setFormData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const totalPrice = calculateItemTotalPrice(item.unitPrice, quantity, item.discountType, item.discountValue);
          const discountAmount = calculateItemDiscountAmount(item.unitPrice, quantity, item.discountType, item.discountValue);
          return { 
            ...item, 
            quantity, 
            totalPrice,
            discountAmount
          };
        }
        return item;
      });

      // Recalculer la réduction globale si elle existe
      let updatedGlobalDiscount = prev.globalDiscount;
      if (prev.globalDiscount && prev.globalDiscount.type !== 'NONE') {
        const newItemsSubtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const newDiscountAmount = calculateGlobalDiscount(newItemsSubtotal, prev.globalDiscount.type, prev.globalDiscount.value);
        updatedGlobalDiscount = {
          ...prev.globalDiscount,
          amount: newDiscountAmount
        };
      }

      return {
        ...prev,
        items: updatedItems,
        globalDiscount: updatedGlobalDiscount
      };
    });
  };

  // Mettre à jour la réduction d'un article
  const updateItemDiscount = (itemId: string, discountType: 'PERCENTAGE' | 'FIXED' | undefined, discountValue: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const totalPrice = calculateItemTotalPrice(item.unitPrice, item.quantity, discountType, discountValue);
          const discountAmount = calculateItemDiscountAmount(item.unitPrice, item.quantity, discountType, discountValue);
          return { 
            ...item, 
            discountType,
            discountValue,
            discountAmount,
            totalPrice
          };
        }
        return item;
      })
    }));
  };

  // Mettre à jour la réduction globale
  const updateGlobalDiscount = (discountType: 'PERCENTAGE' | 'FIXED' | undefined, discountValue: number | undefined) => {
    if (!discountType || discountType === 'NONE' || !discountValue || discountValue <= 0) {
      setFormData(prev => ({
        ...prev,
        globalDiscount: undefined
      }));
      return;
    }

    // Calculer le sous-total actuel des articles
    const currentItemsSubtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = calculateGlobalDiscount(currentItemsSubtotal, discountType, discountValue);
    
    setFormData(prev => ({
      ...prev,
      globalDiscount: {
        type: discountType,
        value: discountValue,
        amount: discountAmount
      }
    }));
  };

  // Copier l'adresse de livraison vers l'adresse de facturation
  const copyDeliveryToBilling = () => {
    if (formData.delivery.address) {
      setFormData(prev => ({
        ...prev,
        billingAddress: { ...formData.delivery.address! }
      }));
      toast.success('Adresse de livraison copiée vers l\'adresse de facturation');
    }
  };

  // Copier l'adresse de facturation vers l'adresse de livraison
  const copyBillingToDelivery = () => {
    if (formData.billingAddress) {
      setFormData(prev => ({
        ...prev,
        delivery: {
          ...prev.delivery,
          address: { ...formData.billingAddress! }
        }
      }));
      toast.success('Adresse de facturation copiée vers l\'adresse de livraison');
    }
  };

  // Convertir l'adresse de la DB vers le format du formulaire
  const convertAddressToFormFormat = (address: Address, user: User) => {
    return {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      address: address.street,
      city: address.city,
      postalCode: address.zipCode,
      country: address.country,
      phone: address.phoneNumber || user.phone || ''
    };
  };

  // Pré-remplir les adresses avec les informations du client
  const fillAddressesFromClient = () => {
    const selectedUser = users.find(u => u.id === formData.userId);
    if (selectedUser) {
      // Chercher l'adresse par défaut ou la première adresse disponible
      const defaultAddress = selectedUser.addresses?.find(addr => addr.isDefault) || selectedUser.addresses?.[0];
      
      if (defaultAddress) {
        const formattedAddress = convertAddressToFormFormat(defaultAddress, selectedUser);
        
        setFormData(prev => ({
          ...prev,
          billingAddress: formattedAddress
        }));
        
        toast.success('Adresse par défaut du client utilisée pour la facturation');
      } else {
        // Fallback vers les informations de base du client
        const clientAddress = {
          name: `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim(),
          address: '',
          city: '',
          postalCode: '',
          country: 'Madagascar',
          phone: selectedUser.phone || ''
        };

        setFormData(prev => ({
          ...prev,
          billingAddress: clientAddress
        }));
        
        toast.success('Informations client ajoutées à l\'adresse de facturation');
      }
    }
  };

  // Gérer la sélection des profils
  const handleProfileToggle = (profileId: string) => {
    const currentAccount = availableAccounts.find(acc => acc.id === selectedAccount);
    if (!currentAccount || !selectedOffer) return;

    // Trouver le platformOffer pour cette plateforme
    const platformOffer = selectedOffer.platformOffers?.find(
      po => po.platform.id === currentAccount.platform?.id
    );
    const requiredProfiles = platformOffer?.profileCount || 1;

    setSelectedProfileIds(prev => {
      const isSelected = prev.includes(profileId);
      
      if (isSelected) {
        // Désélectionner le profil
        return prev.filter(id => id !== profileId);
      } else {
        // Sélectionner le profil si on n'a pas atteint la limite
        if (prev.length < requiredProfiles) {
          return [...prev, profileId];
        }
        return prev;
      }
    });
  };

  // Gérer la sélection d'une offre d'abonnement
  const handleOfferSelection = async (offer: Offer) => {
    if (!formData.userId) {
      toast.error('Veuillez d\'abord sélectionner un client');
      setCurrentTab('client');
      return;
    }


    setSelectedOffer(offer);
    setShowSubscriptionModal(true);
    setIsLoadingAccounts(true);

    try {
      // Récupérer les plateformes compatibles avec cette offre
      const platformIds = offer.platformOffers?.map(po => po.platform.id) || [];
      
      if (platformIds.length === 0) {
        setAvailableAccounts([]);
        return;
      }

            // Récupérer les comptes pour chaque plateforme avec leurs profils
            const accountPromises = platformIds.map(platformId => 
              fetch(`/api/admin/streaming/accounts?platformId=${platformId}`)
                .then(res => res.ok ? res.json() : [])
                .catch(() => [])
            );

      const accountsArrays = await Promise.all(accountPromises);
      const allAccounts = accountsArrays.flat();
      
      // Filtrer les comptes actifs avec des slots disponibles
      const availableAccounts = allAccounts.filter(account => {
        const isActive = account.status === 'ACTIVE';
        const hasAvailableSlots = account.maxProfiles === null || (account.profilesUsed || 0) < account.maxProfiles;
        return isActive && hasAvailableSlots;
      });

      setAvailableAccounts(availableAccounts);
    } catch (error) {
      console.error('Erreur lors de la récupération des comptes:', error);
      setAvailableAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Confirmer la configuration de l'abonnement
  const confirmSubscriptionConfig = () => {
    if (!selectedOffer || !selectedAccount) {
      toast.error('Veuillez sélectionner un compte');
      return;
    }

    const currentAccount = availableAccounts.find(acc => acc.id === selectedAccount);
    if (!currentAccount) return;

    // Vérifier si on a sélectionné le bon nombre de profils
    const platformOffer = selectedOffer.platformOffers?.find(
      po => po.platform.id === currentAccount.platform?.id
    );
    const requiredProfiles = platformOffer?.profileCount || 1;

    if (currentAccount.platform?.hasProfiles && selectedProfileIds.length !== requiredProfiles) {
      toast.error(`Veuillez sélectionner exactement ${requiredProfiles} profil${requiredProfiles > 1 ? 's' : ''}`);
      return;
    }

    const subscriptionDetails = {
      accountId: selectedAccount,
      profileIds: selectedProfileIds
    };

    const newItem: OrderItem = {
      id: `OFFER_${selectedOffer.id}_${Date.now()}`,
      itemType: 'OFFER',
      itemId: selectedOffer.id,
      name: selectedOffer.name,
      unitPrice: selectedOffer.price,
      quantity: 1,
      totalPrice: selectedOffer.price,
      subscriptionDetails
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Réinitialiser les états
    setShowSubscriptionModal(false);
    setSelectedOffer(null);
    setSelectedAccount('');
    setSelectedProfileIds([]);
    setAvailableAccounts([]);

    toast.success('Abonnement ajouté au panier');
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    console.log('🔍 Validation du formulaire...');

    if (!formData.userId) {
      newErrors.userId = 'Veuillez sélectionner un client';
      console.log('❌ Erreur: Aucun client sélectionné');
    } else {
      console.log('✅ Client sélectionné:', formData.userId);
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Veuillez ajouter au moins un article';
      console.log('❌ Erreur: Aucun article dans le panier');
    } else {
      console.log('✅ Articles dans le panier:', formData.items.length);
    }

    // Validation de l'adresse de facturation (toujours requise)
    if (!formData.billingAddress?.name || !formData.billingAddress?.address || !formData.billingAddress?.city) {
      newErrors.billingAddress = 'Adresse de facturation complète requise (nom, adresse, ville)';
      console.log('❌ Erreur: Adresse de facturation incomplète');
    } else {
      console.log('✅ Adresse de facturation complète');
    }

    if (formData.delivery.method === 'DELIVERY' && !formData.delivery.address?.address) {
      newErrors.deliveryAddress = 'Adresse de livraison requise pour la livraison';
      console.log('❌ Erreur: Adresse de livraison manquante pour la livraison');
    }

    if (formData.payment && formData.payment.amount > orderTotal) {
      newErrors.paymentAmount = 'Le montant du paiement ne peut pas dépasser le total de la commande';
      console.log('❌ Erreur: Montant du paiement trop élevé');
    }

    // Validation des réductions
    formData.items.forEach((item, index) => {
      if (item.discountType && item.discountType !== 'NONE') {
        if (!item.discountValue || item.discountValue <= 0) {
          newErrors[`item_${index}_discount`] = `Valeur de réduction invalide pour ${item.name}`;
          console.log(`❌ Erreur: Réduction invalide pour l'article ${item.name}`);
        }
      }
    });

    if (formData.globalDiscount && formData.globalDiscount.type !== 'NONE') {
      if (!formData.globalDiscount.value || formData.globalDiscount.value <= 0) {
        newErrors.globalDiscount = 'Valeur de réduction globale invalide';
        console.log('❌ Erreur: Réduction globale invalide');
      }
    }

    console.log('📊 Résultat validation:', Object.keys(newErrors).length === 0 ? 'SUCCÈS' : 'ÉCHEC');
    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Erreurs trouvées:', newErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    try {
      setIsLoading(true);

      // Préparer les données pour l'API
      const orderData = {
        userId: formData.userId,
        status: formData.status,
        items: formData.items.map(item => {
          const itemData: any = {
            itemType: item.itemType,
            productId: item.itemType === 'PRODUCT' ? item.itemId : undefined,
            serviceId: item.itemType === 'SERVICE' ? item.itemId : undefined,
            offerId: item.itemType === 'OFFER' ? item.itemId : undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          };

          // Ajouter les métadonnées si elles existent (pour les produits importés)
          if (item.metadata) {
            itemData.metadata = item.metadata;
          }

          // Ajouter les champs de réduction seulement s'ils existent vraiment
          if (item.discountType && item.discountType !== 'NONE' && item.discountValue) {
            itemData.discountType = item.discountType;
            itemData.discountValue = item.discountValue;
            itemData.discountAmount = item.discountAmount;
          }

          return itemData;
        }),
        globalDiscount: (formData.globalDiscount && formData.globalDiscount.type !== 'NONE') ? formData.globalDiscount : undefined,
        billingAddress: formData.billingAddress,
        shippingAddress: formData.delivery.method === 'DELIVERY' ? formData.delivery.address : undefined,
        notes: formData.notes
      };

      // Créer la commande
      console.log('=== CRÉATION DE COMMANDE ===');
      console.log('Données envoyées à l\'API:', JSON.stringify(orderData, null, 2));
      console.log('URL:', '/api/admin/orders');
      
      const orderResponse = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      console.log('Réponse API status:', orderResponse.status);
      console.log('Réponse API headers:', Object.fromEntries(orderResponse.headers.entries()));

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        console.error('Erreur API:', orderResponse.status, errorData);
        throw new Error(`Erreur lors de la création de la commande: ${errorData.message || orderResponse.statusText}`);
      }

      const order = await orderResponse.json();

      // Ajouter le paiement si spécifié
      if (formData.payment && formData.payment.amount > 0) {
        const paymentResponse = await fetch(`/api/admin/orders/${order.id}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.payment)
        });

        if (!paymentResponse.ok) {
          console.warn('Erreur lors de l\'ajout du paiement, mais commande créée');
        }
      }

      toast.success('Commande créée avec succès');
      router.push(`/admin/orders/${order.id}`);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-none space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouvelle Commande</h1>
          <p className="text-xs text-gray-600">
            Créez une nouvelle commande avec paiement et livraison
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-base px-3 py-1 bg-white border-blue-300 text-blue-700 font-semibold">
            Total: {formatPrice(orderTotal)}
          </Badge>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || formData.items.length === 0}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Créer la commande
          </Button>
        </div>
      </div>

      {/* Erreurs générales */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Veuillez corriger les erreurs suivantes :
            <ul className="list-disc list-inside mt-2">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Formulaire par onglets */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-3">
        <div className="bg-white p-2 rounded-lg border shadow-sm">
          <TabsList className="grid w-full grid-cols-5 h-9 bg-gray-50">
            <TabsTrigger value="client" className="flex items-center gap-1 text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <User className="h-3 w-3" />
              Client
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-1 text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <ShoppingCart className="h-3 w-3" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-1 text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Truck className="h-3 w-3" />
              Livraison
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1 text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <CreditCard className="h-3 w-3" />
              Paiement
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-1 text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Calculator className="h-3 w-3" />
              Résumé
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Onglet Client */}
        <TabsContent value="client" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Informations Client
              </CardTitle>
              <CardDescription className="text-xs">
                Sélectionnez le client pour cette commande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userId">Client *</Label>
                <Select 
                  value={formData.userId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger className={errors.userId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span>{user.firstName} {user.lastName}</span>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.userId && (
                  <p className="text-sm text-red-500 mt-1">{errors.userId}</p>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Articles */}
        <TabsContent value="items" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Catalogue - Plus large */}
            <div className="xl:col-span-3">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Catalogue</CardTitle>
                      <CardDescription className="text-xs">
                        Sélectionnez les articles à ajouter à la commande
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Calculator className="h-4 w-4" />
                      Simuler importation
                    </Button>
                  </div>
                </CardHeader>
              <CardContent className="space-y-3">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans le catalogue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <Tabs value={selectedCatalogTab} onValueChange={setSelectedCatalogTab} className="space-y-3">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="products" className="text-sm">
                      Produits ({filteredProducts.length})
                    </TabsTrigger>
                    <TabsTrigger value="services" className="text-sm">
                      Services ({filteredServices.length})
                    </TabsTrigger>
                    <TabsTrigger value="offers" className="text-sm">
                      Offres ({filteredOffers.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="products" className="space-y-1 max-h-80 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun produit trouvé</p>
                        {searchTerm && (
                          <p className="text-xs">pour "{searchTerm}"</p>
                        )}
                      </div>
                    ) : (
                      filteredProducts.map(product => {
                        try {
                          return (
                            <div key={product.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{product.name || 'Nom non disponible'}</h4>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                                )}
                                <p className="text-sm font-medium text-primary">
                                  {formatPrice(product.price || 0)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addItem('PRODUCT', product)}
                                className="flex items-center gap-1 ml-2 h-8"
                              >
                                <Plus className="h-3 w-3" />
                                <span className="hidden sm:inline">Ajouter</span>
                              </Button>
                            </div>
                          );
                        } catch (error) {
                          console.error('Erreur lors du rendu du produit:', product.id, error);
                          return (
                            <div key={product.id} className="flex items-center justify-between p-2 border rounded-md bg-red-50">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-red-600">Erreur de chargement</h4>
                                <p className="text-xs text-red-500">ID: {product.id}</p>
                              </div>
                            </div>
                          );
                        }
                      })
                    )}
                  </TabsContent>

                  <TabsContent value="services" className="space-y-1 max-h-80 overflow-y-auto">
                    {filteredServices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun service trouvé</p>
                        {searchTerm && (
                          <p className="text-xs">pour "{searchTerm}"</p>
                        )}
                      </div>
                    ) : (
                      filteredServices.map(service => (
                        <div key={service.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{service.name}</h4>
                            {service.description && (
                              <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              {service.pricingType === 'QUOTE_REQUIRED' ? (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                  Sur devis
                                </Badge>
                              ) : service.pricingType === 'RANGE' && service.minPrice && service.maxPrice ? (
                                <span className="text-sm font-medium text-primary">
                                  {formatPrice(service.minPrice)} - {formatPrice(service.maxPrice)}
                                </span>
                              ) : service.pricingType === 'NEGOTIABLE' ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium text-primary">{formatPrice(service.price)}</span>
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                                    Négociable
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-primary">{formatPrice(service.price)}</span>
                              )}
                              {service.requiresQuote && (
                                <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                                  Devis requis
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addItem('SERVICE', service)}
                            className={`flex items-center gap-1 ml-2 h-8 ${
                              service.pricingType === 'QUOTE_REQUIRED'
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : service.pricingType === 'NEGOTIABLE'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            <Plus className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              {service.pricingType === 'QUOTE_REQUIRED'
                                ? 'Demander devis'
                                : service.pricingType === 'NEGOTIABLE'
                                ? 'Négocier'
                                : 'Ajouter'
                              }
                            </span>
                          </Button>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="offers" className="space-y-1 max-h-80 overflow-y-auto">
                    {filteredOffers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune offre trouvée</p>
                        {searchTerm && (
                          <p className="text-xs">pour "{searchTerm}"</p>
                        )}
                      </div>
                    ) : (
                      filteredOffers.map(offer => (
                        <div key={offer.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{offer.name}</h4>
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {offer.duration}m
                              </Badge>
                            </div>
                            {offer.description && (
                              <p className="text-xs text-muted-foreground truncate">{offer.description}</p>
                            )}
                            <p className="text-sm font-medium text-primary">{formatPrice(offer.price)}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleOfferSelection(offer)}
                            className="flex items-center gap-1 ml-2 h-8"
                          >
                            <Plus className="h-3 w-3" />
                            <span className="hidden sm:inline">Configurer</span>
                          </Button>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Panier */}
            <div className="xl:col-span-1">
              <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Panier</span>
                  <Badge variant="secondary" className="text-xs">
                    {formData.items.length} article{formData.items.length > 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Articles sélectionnés pour cette commande
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun article sélectionné</p>
                    <p className="text-sm">Ajoutez des articles depuis le catalogue</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {formData.items.map(item => (
                      <div key={item.id} className="border rounded-lg p-3 space-y-3">
                        {/* En-tête de l'article */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(item.unitPrice)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Réduction par article */}
                        <div className="bg-orange-50 border border-orange-200 rounded p-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Percent className="h-3 w-3 text-orange-600" />
                            <Label className="text-xs font-medium text-orange-700">Réduction article</Label>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <Select
                              value={item.discountType || 'NONE'}
                              onValueChange={(value: 'PERCENTAGE' | 'FIXED' | 'NONE') => {
                                if (value === 'NONE') {
                                  updateItemDiscount(item.id, undefined, undefined);
                                } else {
                                  // Initialiser avec une valeur par défaut non nulle
                                  const defaultValue = item.discountValue || (value === 'PERCENTAGE' ? 5 : 1000);
                                  updateItemDiscount(item.id, value, defaultValue);
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NONE">Aucune</SelectItem>
                                <SelectItem value="PERCENTAGE">%</SelectItem>
                                <SelectItem value="FIXED">Ar</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Input
                              type="number"
                              placeholder="Valeur"
                              value={item.discountValue || ''}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                if (item.discountType) {
                                  updateItemDiscount(item.id, item.discountType, value);
                                }
                              }}
                              disabled={!item.discountType}
                              className="h-7 text-xs"
                              min="0"
                              max={item.discountType === 'PERCENTAGE' ? 100 : (item.unitPrice * item.quantity)}
                            />
                            
                            <div className="text-xs text-center self-center text-orange-600 font-medium">
                              {item.discountAmount ? 
                                `-${formatPrice(item.discountAmount)}` : 
                                '0 Ar'
                              }
                            </div>
                          </div>
                        </div>

                        {/* Prix final */}
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            {item.discountAmount ? (
                              <span>
                                <span className="line-through">{formatPrice(item.unitPrice * item.quantity)}</span>
                                {' → '}
                                <span className="text-green-600 font-medium">{formatPrice(item.totalPrice)}</span>
                              </span>
                            ) : (
                              <span>Sous-total: {formatPrice(item.totalPrice)}</span>
                            )}
                          </div>
                          <div className="text-sm font-bold">
                            Total: {formatPrice(item.totalPrice)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    {/* Réduction globale */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Tag className="h-4 w-4" />
                          Réduction sur le panier
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={formData.globalDiscount?.type || 'NONE'}
                            onValueChange={(value: 'PERCENTAGE' | 'FIXED' | 'NONE') => {
                              if (value === 'NONE') {
                                updateGlobalDiscount(undefined, undefined);
                              } else {
                                // Initialiser avec une valeur par défaut non nulle
                                const defaultValue = formData.globalDiscount?.value || (value === 'PERCENTAGE' ? 5 : 1000);
                                setFormData(prev => ({
                                  ...prev,
                                  globalDiscount: {
                                    type: value,
                                    value: defaultValue,
                                    amount: calculateGlobalDiscount(
                                      prev.items.reduce((sum, item) => sum + item.totalPrice, 0),
                                      value,
                                      defaultValue
                                    )
                                  }
                                }));
                              }
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">Aucune</SelectItem>
                              <SelectItem value="PERCENTAGE">%</SelectItem>
                              <SelectItem value="FIXED">Ar</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Input
                            type="number"
                            placeholder="Valeur"
                            value={formData.globalDiscount?.value || ''}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (formData.globalDiscount?.type) {
                                updateGlobalDiscount(formData.globalDiscount.type, value);
                              }
                            }}
                            disabled={!formData.globalDiscount?.type || formData.globalDiscount?.type === 'NONE'}
                            className="h-8"
                            min="0"
                            max={formData.globalDiscount?.type === 'PERCENTAGE' ? 100 : itemsSubtotal}
                          />
                          
                          <div className="text-xs text-center self-center text-green-600 font-medium">
                            {formData.globalDiscount ? 
                              `-${formatPrice(formData.globalDiscount.amount)}` : 
                              '0 Ar'
                            }
                          </div>
                        </div>
                        
                        {formData.globalDiscount && (
                          <div className="text-xs text-muted-foreground">
                            Réduction de {formData.globalDiscount.value}
                            {formData.globalDiscount.type === 'PERCENTAGE' ? '%' : ' Ar'} 
                            {' '}sur {formatPrice(itemsSubtotal)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Separator />
                    
                    {/* Résumé des prix */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Sous-total articles:</span>
                        <span>{formatPrice(itemsSubtotal)}</span>
                      </div>
                      
                      {formData.globalDiscount && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                          <span>Réduction globale:</span>
                          <span>-{formatPrice(formData.globalDiscount.amount)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatPrice(orderTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}
                {errors.items && (
                  <p className="text-sm text-red-500 mt-2">{errors.items}</p>
                )}
              </CardContent>
            </Card>
            </div>
          </div>
        </TabsContent>

        {/* Onglet Livraison */}
        <TabsContent value="delivery" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adresse de facturation */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" />
                    Adresse de Facturation
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Adresse pour la facturation de cette commande
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fillAddressesFromClient}
                    disabled={!formData.userId}
                    className="flex items-center gap-1 text-xs"
                  >
                    <User className="h-3 w-3" />
                    Infos client
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyDeliveryToBilling}
                    disabled={!formData.delivery.address?.name || !formData.delivery.address?.address}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Copy className="h-3 w-3" />
                    Copier livraison
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingName">Nom complet *</Label>
                  <Input
                    id="billingName"
                    value={formData.billingAddress?.name || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        name: e.target.value,
                        address: prev.billingAddress?.address || '',
                        city: prev.billingAddress?.city || '',
                        postalCode: prev.billingAddress?.postalCode || '',
                        country: prev.billingAddress?.country || 'Madagascar'
                      }
                    }))}
                    className={errors.billingAddress ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="billingPhone">Téléphone</Label>
                  <Input
                    id="billingPhone"
                    value={formData.billingAddress?.phone || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        phone: e.target.value,
                        name: prev.billingAddress?.name || '',
                        address: prev.billingAddress?.address || '',
                        city: prev.billingAddress?.city || '',
                        postalCode: prev.billingAddress?.postalCode || '',
                        country: prev.billingAddress?.country || 'Madagascar'
                      }
                    }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="billingAddress">Adresse *</Label>
                <Input
                  id="billingAddress"
                  value={formData.billingAddress?.address || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingAddress: {
                      ...prev.billingAddress,
                      address: e.target.value,
                      name: prev.billingAddress?.name || '',
                      city: prev.billingAddress?.city || '',
                      postalCode: prev.billingAddress?.postalCode || '',
                      country: prev.billingAddress?.country || 'Madagascar'
                    }
                  }))}
                  className={errors.billingAddress ? 'border-red-500' : ''}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="billingCity">Ville *</Label>
                  <Input
                    id="billingCity"
                    value={formData.billingAddress?.city || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        city: e.target.value,
                        name: prev.billingAddress?.name || '',
                        address: prev.billingAddress?.address || '',
                        postalCode: prev.billingAddress?.postalCode || '',
                        country: prev.billingAddress?.country || 'Madagascar'
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="billingPostal">Code postal</Label>
                  <Input
                    id="billingPostal"
                    value={formData.billingAddress?.postalCode || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        postalCode: e.target.value,
                        name: prev.billingAddress?.name || '',
                        address: prev.billingAddress?.address || '',
                        city: prev.billingAddress?.city || '',
                        country: prev.billingAddress?.country || 'Madagascar'
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="billingCountry">Pays</Label>
                  <Input
                    id="billingCountry"
                    value={formData.billingAddress?.country || 'Madagascar'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        country: e.target.value,
                        name: prev.billingAddress?.name || '',
                        address: prev.billingAddress?.address || '',
                        city: prev.billingAddress?.city || '',
                        postalCode: prev.billingAddress?.postalCode || ''
                      }
                    }))}
                  />
                </div>
              </div>

              {errors.billingAddress && (
                <p className="text-sm text-red-500">{errors.billingAddress}</p>
              )}
            </CardContent>
          </Card>

          {/* Mode de livraison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                Mode de Livraison
              </CardTitle>
              <CardDescription className="text-xs">
                Choisissez comment la commande sera livrée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.delivery.method}
                onValueChange={(value: 'PICKUP' | 'DELIVERY') => 
                  setFormData(prev => ({ 
                    ...prev, 
                    delivery: { ...prev.delivery, method: value }
                  }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PICKUP" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Retrait au magasin
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DELIVERY" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Livraison à domicile
                  </Label>
                </div>
              </RadioGroup>

              {formData.delivery.method === 'DELIVERY' && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Adresse de livraison</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyBillingToDelivery}
                        disabled={!formData.billingAddress?.name || !formData.billingAddress?.address}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Copy className="h-3 w-3" />
                        Copier facturation
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="deliveryName">Nom complet *</Label>
                        <Input
                          id="deliveryName"
                          value={formData.delivery.address?.name || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            delivery: {
                              ...prev.delivery,
                              address: {
                                ...prev.delivery.address,
                                name: e.target.value,
                                address: prev.delivery.address?.address || '',
                                city: prev.delivery.address?.city || '',
                                postalCode: prev.delivery.address?.postalCode || '',
                                country: prev.delivery.address?.country || 'Madagascar'
                              }
                            }
                          }))}
                          className={errors.deliveryAddress ? 'border-red-500' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="deliveryPhone">Téléphone</Label>
                        <Input
                          id="deliveryPhone"
                          value={formData.delivery.address?.phone || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            delivery: {
                              ...prev.delivery,
                              address: {
                                ...prev.delivery.address,
                                phone: e.target.value,
                                name: prev.delivery.address?.name || '',
                                address: prev.delivery.address?.address || '',
                                city: prev.delivery.address?.city || '',
                                postalCode: prev.delivery.address?.postalCode || '',
                                country: prev.delivery.address?.country || 'Madagascar'
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="deliveryAddress">Adresse *</Label>
                      <Input
                        id="deliveryAddress"
                        value={formData.delivery.address?.address || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          delivery: {
                            ...prev.delivery,
                            address: {
                              ...prev.delivery.address,
                              address: e.target.value,
                              name: prev.delivery.address?.name || '',
                              city: prev.delivery.address?.city || '',
                              postalCode: prev.delivery.address?.postalCode || '',
                              country: prev.delivery.address?.country || 'Madagascar'
                            }
                          }
                        }))}
                        className={errors.deliveryAddress ? 'border-red-500' : ''}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="deliveryCity">Ville *</Label>
                        <Input
                          id="deliveryCity"
                          value={formData.delivery.address?.city || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            delivery: {
                              ...prev.delivery,
                              address: {
                                ...prev.delivery.address,
                                city: e.target.value,
                                name: prev.delivery.address?.name || '',
                                address: prev.delivery.address?.address || '',
                                postalCode: prev.delivery.address?.postalCode || '',
                                country: prev.delivery.address?.country || 'Madagascar'
                              }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="deliveryPostal">Code postal</Label>
                        <Input
                          id="deliveryPostal"
                          value={formData.delivery.address?.postalCode || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            delivery: {
                              ...prev.delivery,
                              address: {
                                ...prev.delivery.address,
                                postalCode: e.target.value,
                                name: prev.delivery.address?.name || '',
                                address: prev.delivery.address?.address || '',
                                city: prev.delivery.address?.city || '',
                                country: prev.delivery.address?.country || 'Madagascar'
                              }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="deliveryCountry">Pays</Label>
                        <Input
                          id="deliveryCountry"
                          value={formData.delivery.address?.country || 'Madagascar'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            delivery: {
                              ...prev.delivery,
                              address: {
                                ...prev.delivery.address,
                                country: e.target.value,
                                name: prev.delivery.address?.name || '',
                                address: prev.delivery.address?.address || '',
                                city: prev.delivery.address?.city || '',
                                postalCode: prev.delivery.address?.postalCode || ''
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                    
                    {errors.deliveryAddress && (
                      <p className="text-sm text-red-500">{errors.deliveryAddress}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div>
                <Label htmlFor="deliveryNotes">Notes de livraison</Label>
                <Textarea
                  id="deliveryNotes"
                  value={formData.delivery.notes || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    delivery: { ...prev.delivery, notes: e.target.value }
                  }))}
                  placeholder="Instructions spéciales pour la livraison..."
                />
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* Onglet Paiement */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Paiement Initial
              </CardTitle>
              <CardDescription>
                Enregistrez un paiement lors de la création de la commande (optionnel)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="addPayment"
                  checked={!!formData.payment}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        payment: {
                          method: '',
                          provider: '',
                          amount: orderTotal
                        }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        payment: undefined
                      }));
                    }
                  }}
                />
                <Label htmlFor="addPayment">Ajouter un paiement</Label>
              </div>

              {formData.payment && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMethod">Méthode de paiement *</Label>
                      <Select
                        value={formData.payment.method}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          payment: prev.payment ? {
                            ...prev.payment,
                            method: value,
                            provider: ''
                          } : undefined
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une méthode" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map(method => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.payment.method && (
                      <div>
                        <Label htmlFor="paymentProvider">Fournisseur *</Label>
                        <Select
                          value={formData.payment.provider}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            payment: prev.payment ? {
                              ...prev.payment,
                              provider: value
                            } : undefined
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un fournisseur" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods
                              .find(m => m.value === formData.payment?.method)
                              ?.providers.map(provider => (
                                <SelectItem key={provider} value={provider}>
                                  {provider === 'orange_money' ? 'Orange Money' :
                                   provider === 'mvola' ? 'MVola' :
                                   provider === 'bank_transfer' ? 'Virement bancaire' :
                                   provider === 'paypal' ? 'PayPal' :
                                   provider === 'cash' ? 'Espèce' : provider}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentAmount">Montant *</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        value={formData.payment.amount}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          payment: prev.payment ? {
                            ...prev.payment,
                            amount: Number(e.target.value)
                          } : undefined
                        }))}
                        max={orderTotal}
                        className={errors.paymentAmount ? 'border-red-500' : ''}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Maximum: {formatPrice(orderTotal)}
                      </p>
                      {errors.paymentAmount && (
                        <p className="text-sm text-red-500 mt-1">{errors.paymentAmount}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="paymentReference">Référence</Label>
                      <Input
                        id="paymentReference"
                        value={formData.payment.reference || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          payment: prev.payment ? {
                            ...prev.payment,
                            reference: e.target.value
                          } : undefined
                        }))}
                        placeholder="Numéro de référence..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="paymentNotes">Notes</Label>
                    <Textarea
                      id="paymentNotes"
                      value={formData.payment.notes || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payment: prev.payment ? {
                          ...prev.payment,
                          notes: e.target.value
                        } : undefined
                      }))}
                      placeholder="Notes sur le paiement..."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Résumé */}
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Résumé de la Commande
              </CardTitle>
              <CardDescription>
                Vérifiez les détails avant de créer la commande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client */}
              <div>
                <h3 className="font-semibold mb-2">Client</h3>
                {formData.userId ? (
                  <div className="p-3 bg-muted rounded-lg">
                    {(() => {
                      const user = users.find(u => u.id === formData.userId);
                      return user ? (
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Client non sélectionné</p>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-red-500">⚠️ Aucun client sélectionné</p>
                )}
              </div>

              {/* Articles */}
              <div>
                <h3 className="font-semibold mb-2">Articles ({formData.items.length})</h3>
                {formData.items.length > 0 ? (
                  <div className="space-y-2">
                    {formData.items.map(item => (
                      <div key={item.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(item.unitPrice)} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                          </div>
                        </div>
                        
                        {/* Affichage des réductions par article */}
                        {item.discountType && item.discountValue && (
                          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border">
                            <div className="flex justify-between items-center">
                              <span>
                                Réduction: {item.discountValue}
                                {item.discountType === 'PERCENTAGE' ? '%' : ' Ar'}
                              </span>
                              <span className="font-medium">
                                -{formatPrice(item.discountAmount || 0)}
                              </span>
                            </div>
                            <div className="text-muted-foreground mt-1">
                              Prix original: {formatPrice(item.unitPrice * item.quantity)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Résumé des prix */}
                    <div className="space-y-2 p-3 bg-primary/5 rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span>Sous-total articles:</span>
                        <span>{formatPrice(itemsSubtotal)}</span>
                      </div>
                      
                      {formData.globalDiscount && (
                        <div className="flex justify-between items-center text-sm text-blue-600">
                          <span>
                            Réduction globale ({formData.globalDiscount.value}
                            {formData.globalDiscount.type === 'PERCENTAGE' ? '%' : ' Ar'}):
                          </span>
                          <span>-{formatPrice(formData.globalDiscount.amount)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total final:</span>
                        <span>{formatPrice(orderTotal)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-500">⚠️ Aucun article ajouté</p>
                )}
              </div>

              {/* Livraison */}
              <div>
                <h3 className="font-semibold mb-2">Livraison</h3>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">
                    {formData.delivery.method === 'PICKUP' ? 'Retrait au magasin' : 'Livraison à domicile'}
                  </p>
                  {formData.delivery.method === 'DELIVERY' && formData.delivery.address && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>{formData.delivery.address.name}</p>
                      <p>{formData.delivery.address.address}</p>
                      <p>{formData.delivery.address.city}, {formData.delivery.address.country}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Paiement */}
              <div>
                <h3 className="font-semibold mb-2">Paiement</h3>
                {formData.payment ? (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">
                      {paymentMethods.find(m => m.value === formData.payment?.method)?.label} - {formatPrice(formData.payment.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fournisseur: {formData.payment.provider}
                    </p>
                    {formData.payment.amount < orderTotal && (
                      <p className="text-sm text-orange-600 mt-1">
                        Restant à payer: {formatPrice(orderTotal - formData.payment.amount)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun paiement initial</p>
                )}
              </div>

              {/* Statut */}
              <div>
                <h3 className="font-semibold mb-2">Statut</h3>
                <Badge variant="outline" className="text-sm">
                  {formData.status === 'PENDING' ? 'En attente' :
                   formData.status === 'PAID' ? 'Payée' :
                   formData.status === 'PROCESSING' ? 'En cours' : formData.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation entre onglets */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const tabs = ['client', 'items', 'delivery', 'payment', 'summary'];
            const currentIndex = tabs.indexOf(currentTab);
            if (currentIndex > 0) {
              setCurrentTab(tabs[currentIndex - 1]);
            }
          }}
          disabled={currentTab === 'client'}
        >
          Précédent
        </Button>
        
        <Button
          onClick={() => {
            const tabs = ['client', 'items', 'delivery', 'payment', 'summary'];
            const currentIndex = tabs.indexOf(currentTab);
            if (currentIndex < tabs.length - 1) {
              setCurrentTab(tabs[currentIndex + 1]);
            } else {
              handleSubmit();
            }
          }}
          disabled={isLoading}
        >
          {currentTab === 'summary' ? (
            <>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Créer la commande
            </>
          ) : (
            'Suivant'
          )}
        </Button>
      </div>

      {/* Modal de configuration des abonnements */}
      {showSubscriptionModal && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Configuration de l'abonnement</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    setSelectedOffer(null);
                    setSelectedAccount('');
                    setSelectedProfileIds([]);
                    setAvailableAccounts([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Informations de l'offre */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{selectedOffer.name}</CardTitle>
                    <CardDescription>
                      {selectedOffer.description} - {selectedOffer.duration} mois
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(selectedOffer.price)}
                    </p>
                  </CardContent>
                </Card>

                {/* Sélection du compte */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Compte de streaming</CardTitle>
                    <CardDescription>
                      Sélectionnez le compte à utiliser pour cet abonnement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingAccounts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Chargement des comptes...</span>
                      </div>
                    ) : availableAccounts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <p>Aucun compte disponible pour cette offre</p>
                        <p className="text-sm">Veuillez d'abord créer un compte compatible</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableAccounts.map(account => (
                          <div
                            key={account.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedAccount === account.id
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setSelectedAccount(account.id);
                              setSelectedProfileIds([]); // Réinitialiser les profils sélectionnés
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {account.platform?.logo && (
                                  <img
                                    src={account.platform.logo}
                                    alt={account.platform.name}
                                    className="w-8 h-8 rounded"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{account.platform?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {account.email || account.username}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                  {account.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {account.profilesUsed || 0}/{account.maxProfiles || 1} profils
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Configuration des profils (si applicable) */}
                {selectedAccount && (() => {
                  const currentAccount = availableAccounts.find(acc => acc.id === selectedAccount);
                  const platformOffer = selectedOffer?.platformOffers?.find(
                    po => po.platform.id === currentAccount?.platform?.id
                  );
                  const requiredProfiles = platformOffer?.profileCount || 1;
                  const availableProfiles = currentAccount?.accountProfiles?.filter(p => !p.isAssigned) || [];
                  
                  return (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Configuration des profils</CardTitle>
                        <CardDescription>
                          {currentAccount?.platform?.hasProfiles 
                            ? `Sélectionnez ${requiredProfiles} profil${requiredProfiles > 1 ? 's' : ''} pour cet abonnement`
                            : 'Cette plateforme ne nécessite pas de configuration de profils'
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {currentAccount?.platform?.hasProfiles ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Profils requis par l'offre</Label>
                              <Badge variant="outline">
                                {requiredProfiles} profil{requiredProfiles > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label>Profils sélectionnés</Label>
                              <Badge variant={selectedProfileIds.length === requiredProfiles ? "default" : "destructive"}>
                                {selectedProfileIds.length}/{requiredProfiles}
                              </Badge>
                            </div>

                            {availableProfiles.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground">
                                <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                                <p>Aucun profil disponible sur ce compte</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label>Profils disponibles :</Label>
                                <div className="grid grid-cols-1 gap-2">
                                  {availableProfiles.map(profile => (
                                    <div 
                                      key={profile.id} 
                                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                        selectedProfileIds.includes(profile.id)
                                          ? 'border-primary bg-primary/5'
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                      onClick={() => handleProfileToggle(profile.id)}
                                    >
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        selectedProfileIds.includes(profile.id)
                                          ? 'border-primary bg-primary'
                                          : 'border-gray-300'
                                      }`}>
                                        {selectedProfileIds.includes(profile.id) && (
                                          <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium">
                                          {profile.name || `Profil ${profile.profileSlot}`}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Position: {profile.profileSlot}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedProfileIds.length < requiredProfiles && (
                              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                ⚠️ Sélectionnez {requiredProfiles - selectedProfileIds.length} profil{requiredProfiles - selectedProfileIds.length > 1 ? 's' : ''} supplémentaire{requiredProfiles - selectedProfileIds.length > 1 ? 's' : ''}
                              </div>
                            )}

                            {selectedProfileIds.length === requiredProfiles && (
                              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                                ✅ Configuration complète
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                            ✅ Aucune configuration de profil requise pour cette plateforme
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    setSelectedOffer(null);
                    setSelectedAccount('');
                    setSelectedProfileIds([]);
                    setAvailableAccounts([]);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmSubscriptionConfig}
                  disabled={!selectedAccount}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter au panier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de simulation d'importation */}
      <ImportSimulationModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onAddToCart={addImportedItem}
      />
    </div>
  );
}
