'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { addDays, addMonths, addYears, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { Loader2, AlertTriangle, CheckCircle2, Search, CreditCard, Calendar, User, Clock, Check, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { formatDuration, formatPrice } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const formSchema = z.object({
  userId: z.string({
    required_error: 'Veuillez sélectionner un client',
  }),
  offerId: z.string({
    required_error: 'Veuillez sélectionner une offre',
  }),
  platformAccounts: z.array(
    z.object({
      platformOfferId: z.string(),
      accountId: z.string().optional(),
      profileIds: z.array(z.string()).optional(),
    })
  ).optional(),
  autoRenew: z.boolean().default(false),
})

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phone?: string | null
  createdAt?: Date
  subscriptions?: {
    id: string
    offer: {
      name: string
    }
  }[]
}

interface Platform {
  id: string
  name: string
  hasProfiles: boolean
  maxProfilesPerAccount: number | null
  logo?: string | null
}

interface PlatformOffer {
  id: string
  platform: Platform
  profileCount: number
}

interface Offer {
  id: string
  name: string
  duration: number
  durationUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  maxProfiles: number
  platformOffers: PlatformOffer[]
  price: number
  description?: string | null
  features?: string[]
}

interface Profile {
  id: string
  name: string
  profileSlot: number
  isAssigned: boolean
}

interface Account {
  id: string
  username: string
  email: string | null
  platformId: string
  platform: {
    id: string
    name: string
  }
  accountProfiles: Profile[]
}

interface PlatformAccountSelection {
  platformOfferId: string
  accountId?: string
  profileIds: string[]
  platform: Platform
}

interface SubscriptionFormProps {
  users: User[]
  offers: Offer[]
  platforms: Platform[]
}

export function SubscriptionForm({ users, offers, platforms }: SubscriptionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>({})
  const [platformSelections, setPlatformSelections] = useState<PlatformAccountSelection[]>([])
  const [hasInconsistency, setHasInconsistency] = useState(false)
  
  // États pour la recherche
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [offerSearchTerm, setOfferSearchTerm] = useState('')
  const [accountSearchTerm, setAccountSearchTerm] = useState('')
  const [filteredPlatformId, setFilteredPlatformId] = useState<string | null>(null)
  
  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      (user.firstName?.toLowerCase().includes(searchLower) || false) ||
      (user.lastName?.toLowerCase().includes(searchLower) || false) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });
  
  // Filtrer les offres
  const filteredOffers = offers.filter(offer => {
    if (!offerSearchTerm && !filteredPlatformId) return true;
    
    let matchesSearch = true;
    if (offerSearchTerm) {
      const searchLower = offerSearchTerm.toLowerCase();
      matchesSearch = offer.name.toLowerCase().includes(searchLower) ||
                     (offer.description?.toLowerCase().includes(searchLower) || false);
    }
    
    let matchesPlatform = true;
    if (filteredPlatformId) {
      matchesPlatform = offer.platformOffers.some(po => 
        po.platform.id === filteredPlatformId
      );
    }
    
    return matchesSearch && matchesPlatform;
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      autoRenew: false,
      platformAccounts: [],
    },
  })

  const selectedOffer = offers.find(offer => offer.id === form.watch('offerId'))

  // Initialiser les sélections de plateforme quand une offre est choisie
  useEffect(() => {
    if (selectedOffer) {
      const selections = selectedOffer.platformOffers.map(po => ({
        platformOfferId: po.id,
        profileIds: [],
        platform: po.platform
      }));
      
      setPlatformSelections(selections);
      
      // Charger les comptes pour chaque plateforme
      selectedOffer.platformOffers.forEach(po => {
        fetchAccounts(po.platform.id);
      });
    } else {
      setPlatformSelections([]);
      setAccountsMap({});
    }
  }, [selectedOffer]);

  // Vérifier les incohérences
  useEffect(() => {
    let hasIssue = false;
    
    // Vérifier si tous les comptes nécessaires ont été sélectionnés
    if (selectedOffer && platformSelections.length > 0) {
      platformSelections.forEach(selection => {
        // Si le compte n'est pas sélectionné
        if (!selection.accountId) {
          hasIssue = true;
          return;
        }
        
        // Si le nombre de profils n'est pas suffisant
        const platform = selection.platform;
        if (platform.hasProfiles && selectedOffer.maxProfiles > 0) {
          const accountProfiles = accountsMap[platform.id]?.find(a => a.id === selection.accountId)?.accountProfiles || [];
          const availableProfiles = accountProfiles.filter(p => !p.isAssigned);
          
          if (selection.profileIds.length < selectedOffer.maxProfiles && availableProfiles.length >= selectedOffer.maxProfiles) {
            hasIssue = true;
          }
        }
      });
    }
    
    setHasInconsistency(hasIssue);
  }, [platformSelections, selectedOffer, accountsMap]);

  const fetchAccounts = async (platformId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/streaming/accounts?platformId=${platformId}`);
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

  const handleAccountChange = (platformOfferId: string, accountId: string) => {
    setPlatformSelections(prev => 
      prev.map(selection => 
        selection.platformOfferId === platformOfferId 
          ? { ...selection, accountId, profileIds: [] } 
          : selection
      )
    );
  };

  const handleProfileToggle = (platformOfferId: string, profileId: string) => {
    setPlatformSelections(prev => 
      prev.map(selection => {
        if (selection.platformOfferId !== platformOfferId) return selection;
        
        // Vérifier si le profil est déjà sélectionné
        const profileIndex = selection.profileIds.indexOf(profileId);
        let newProfileIds = [...selection.profileIds];
        
        if (profileIndex === -1) {
          // Ajouter le profil si pas déjà sélectionné
          newProfileIds.push(profileId);
        } else {
          // Supprimer le profil s'il est déjà sélectionné
          newProfileIds.splice(profileIndex, 1);
        }
        
        return { ...selection, profileIds: newProfileIds };
      })
    );
  };

  const getSelectedAccount = (platformId: string, accountId?: string) => {
    if (!accountId) return null;
    return accountsMap[platformId]?.find(account => account.id === accountId) || null;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      
      // Vérifier qu'une offre est sélectionnée
      const offer = offers.find(o => o.id === values.offerId);
      if (!offer) throw new Error('Offre non trouvée');

      const startDate = new Date();
      let endDate: Date;
      
      // Calculer la date de fin en fonction de l'unité de durée
      switch(offer.durationUnit) {
        case 'DAY':
          endDate = addDays(startDate, offer.duration);
          break;
        case 'WEEK':
          endDate = addDays(startDate, offer.duration * 7);
          break;
        case 'MONTH':
          endDate = addDays(startDate, offer.duration * 30);
          break;
        case 'YEAR':
          endDate = addDays(startDate, offer.duration * 360);
          break;
        default:
          endDate = addDays(startDate, offer.duration);
          break;
      }

      // Préparer les données pour l'API
      const platformAccounts = platformSelections.map(selection => ({
        platformOfferId: selection.platformOfferId,
        accountId: selection.accountId,
        profileIds: selection.profileIds
      }));

      const response = await fetch('/api/admin/streaming/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: values.userId,
          offerId: values.offerId,
          platformAccounts,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          autoRenew: values.autoRenew,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'abonnement');
      }

      toast({
        title: 'Abonnement créé',
        description: 'L\'abonnement a été créé avec succès.',
      });

      router.push('/admin/streaming/subscriptions');
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de l\'abonnement.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderPlatformAccountSelection = (selection: PlatformAccountSelection) => {
    const platform = selection.platform;
    const allAccounts = accountsMap[platform.id] || [];
    
    // Filtrer les comptes par terme de recherche
    const accounts = allAccounts.filter(account => {
      if (!accountSearchTerm) return true;
      const searchLower = accountSearchTerm.toLowerCase();
      return (
        (account.username?.toLowerCase().includes(searchLower) || false) ||
        (account.email?.toLowerCase().includes(searchLower) || false)
      );
    });
    
    const selectedAccount = getSelectedAccount(platform.id, selection.accountId);
    
    const availableProfiles = selectedAccount?.accountProfiles.filter(p => !p.isAssigned) || [];
    // Récupérer le nombre de profils de la platformOffer
    const platformOffer = selectedOffer?.platformOffers.find(po => po.id === selection.platformOfferId);
    const profilesToSelect = platformOffer?.profileCount || 0;
    const canSelectMoreProfiles = selection.profileIds.length < profilesToSelect;
    
    return (
      <Card key={selection.platformOfferId} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {platform.logo && (
              <Avatar className="h-8 w-8">
                <AvatarFallback>{platform.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <CardTitle className="text-lg">{platform.name}</CardTitle>
              {platform.hasProfiles && (
                <CardDescription>
                  {profilesToSelect} profil{profilesToSelect > 1 ? 's' : ''} requis
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>Compte</FormLabel>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un compte..."
                    className="pl-8"
                    value={accountSearchTerm}
                    onChange={(e) => setAccountSearchTerm(e.target.value)}
                  />
                  {accountSearchTerm && (
                    <Button
                      variant="ghost"
                      className="absolute right-0 top-0 h-full aspect-square p-0"
                      onClick={() => setAccountSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <Select 
                value={selection.accountId} 
                onValueChange={(value) => handleAccountChange(selection.platformOfferId, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 ? (
                    <SelectItem value="no-accounts" disabled>
                      Aucun compte disponible
                    </SelectItem>
                  ) : (
                    accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.username} {account.email ? `(${account.email})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedAccount && platform.hasProfiles && profilesToSelect > 0 && (
              <div>
                <div className="flex justify-between mb-2">
                  <FormLabel>Profils ({selection.profileIds.length}/{profilesToSelect})</FormLabel>
                  <Badge variant={selection.profileIds.length === profilesToSelect ? "success" : "destructive"}>
                    {selection.profileIds.length === profilesToSelect 
                      ? "Complet" 
                      : `${selection.profileIds.length}/${profilesToSelect}`}
                  </Badge>
                </div>
                
                {availableProfiles.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Aucun profil disponible sur ce compte
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {availableProfiles.map(profile => (
                      <div key={profile.id} className="flex items-center space-x-2 border p-2 rounded">
                        <Checkbox 
                          id={`profile-${profile.id}`} 
                          checked={selection.profileIds.includes(profile.id)}
                          disabled={!selection.profileIds.includes(profile.id) && !canSelectMoreProfiles}
                          onCheckedChange={() => handleProfileToggle(selection.platformOfferId, profile.id)}
                        />
                        <label 
                          htmlFor={`profile-${profile.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {profile.name || `Profil ${profile.profileSlot}`}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {selection.accountId && platform.hasProfiles && profilesToSelect > 0 ? (
            selection.profileIds.length === profilesToSelect ? (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>Configuration complète</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Sélectionnez {profilesToSelect - selection.profileIds.length} profil{profilesToSelect - selection.profileIds.length > 1 ? 's' : ''} supplémentaire{profilesToSelect - selection.profileIds.length > 1 ? 's' : ''}</span>
              </div>
            )
          ) : selection.accountId && !platform.hasProfiles ? (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              <span>Configuration complète (sans profils)</span>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    );
  };

  // Calculer les dates en fonction de l'offre sélectionnée
  const calculateDates = () => {
    if (!selectedOffer) return { startDate: null, endDate: null };
    
    const startDate = new Date();
    let endDate: Date;
    
    switch(selectedOffer.durationUnit) {
      case 'DAY':
        endDate = addDays(startDate, selectedOffer.duration);
        break;
      case 'WEEK':
        endDate = addDays(startDate, selectedOffer.duration * 7);
        break;
      case 'MONTH':
        endDate = addDays(startDate, selectedOffer.duration * 30);
        break;
      case 'YEAR':
        endDate = addDays(startDate, selectedOffer.duration * 360);
        break;
      default:
        endDate = addDays(startDate, selectedOffer.duration);
        break;
    }
    
    return {
      startDate: format(startDate, 'dd MMMM yyyy', { locale: fr }),
      endDate: format(endDate, 'dd MMMM yyyy', { locale: fr })
    };
  };
  
  // Obtenir les détails de l'utilisateur sélectionné
  const selectedUser = users.find(user => user.id === form.watch('userId'));
  
  // Obtenir les détails des dates
  const { startDate, endDate } = calculateDates();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du client</CardTitle>
              <CardDescription>
                Sélectionnez le client pour cet abonnement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <div className="flex items-center mb-2">
                  <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un client..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  {userSearchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => setUserSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredUsers.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">
                            Aucun client trouvé
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedUser && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {selectedUser.firstName?.charAt(0) || ''}{selectedUser.lastName?.charAt(0) || ''}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="h-3 w-3 mr-1" /> {selectedUser.email}
                      </div>
                      {selectedUser.phone && (
                        <div className="text-sm text-muted-foreground">
                          📞 {selectedUser.phone}
                        </div>
                      )}
                      {selectedUser.subscriptions && selectedUser.subscriptions.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground mb-1">Abonnements actifs:</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedUser.subscriptions.map(sub => (
                              <Badge key={sub.id} variant="outline">
                                {sub.offer.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails de l'abonnement</CardTitle>
              <CardDescription>
                Choisissez l'offre pour cet abonnement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une offre..."
                    className="pl-8"
                    value={offerSearchTerm}
                    onChange={(e) => setOfferSearchTerm(e.target.value)}
                  />
                  {offerSearchTerm && (
                    <Button
                      variant="ghost"
                      className="absolute right-0 top-0 h-full aspect-square p-0"
                      onClick={() => setOfferSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <Select
                  value={filteredPlatformId || "all"}
                  onValueChange={(value) => setFilteredPlatformId(value === "all" ? null : value)}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Filtrer par plateforme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les plateformes</SelectItem>
                    {platforms.map(platform => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <FormField
                control={form.control}
                name="offerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une offre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredOffers.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">
                            Aucune offre trouvée
                          </div>
                        ) : (
                          filteredOffers.map((offer) => (
                            <SelectItem key={offer.id} value={offer.id}>
                              {offer.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedOffer && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-lg mb-2">{selectedOffer.name}</h3>
                  
                  {selectedOffer.description && (
                    <p className="text-sm text-muted-foreground mb-4">{selectedOffer.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                      <span>{formatPrice(Number(selectedOffer.price))}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-green-500" />
                      <span>{formatDuration(selectedOffer.duration, selectedOffer.durationUnit || 'MONTH')}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-purple-500" />
                      <span>
                        {selectedOffer.platformOffers.reduce((total, po) => total + (po.profileCount || 0), 0)} profil(s)
                      </span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Plateformes incluses:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedOffer.platformOffers.map(po => (
                          <Badge key={po.platform.id} variant="outline" className="flex items-center gap-1">
                            {po.platform.logo && (
                              <Avatar className="h-4 w-4">
                                <AvatarFallback>{po.platform.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            {po.platform.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {selectedOffer.features && selectedOffer.features.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Caractéristiques:</h4>
                        <ul className="space-y-1">
                          {selectedOffer.features.map((feature, index) => (
                            <li key={index} className="flex items-start text-sm">
                              <Check className="h-4 w-4 mr-1 text-green-500 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {startDate && endDate && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Période d'abonnement:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                          <div>
                            <span className="text-xs text-muted-foreground">Date de début:</span>
                            <div className="font-medium">{startDate}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-red-500" />
                          <div>
                            <span className="text-xs text-muted-foreground">Date de fin:</span>
                            <div className="font-medium">{endDate}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedOffer && platformSelections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comptes et Profils</CardTitle>
                <CardDescription>
                  Sélectionnez les comptes et profils pour chaque plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformSelections.map(renderPlatformAccountSelection)}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
              <CardDescription>
                Paramètres supplémentaires pour l'abonnement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="autoRenew"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Renouvellement automatique</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Activer le renouvellement automatique de l'abonnement
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || hasInconsistency}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'abonnement
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
} 
 
 
 