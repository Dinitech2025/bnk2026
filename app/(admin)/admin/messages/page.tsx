'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Search,
  Filter,
  Send,
  Loader2,
  RefreshCw,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  Check,
  CheckCheck,
  Pencil,
  Quote,
  ShoppingBag,
  Star,
  TrendingUp,
  FileText,
  Package,
  Calendar,
  DollarSign,
  XCircle,
  ArrowRight,
  Info,
  History,
  Phone,
  MapPin
} from 'lucide-react'
import ProposalActions from '@/components/admin/proposal-actions'
import EnhancedMessageInput from '@/components/admin/enhanced-message-input'
import EnhancedQuoteMessageCard from '@/components/admin/enhanced-quote-message-card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { useCurrency } from '@/lib/contexts/currency-context'
import { CurrencySelector } from '@/components/ui/currency-selector'

interface Message {
  id: string
  subject: string
  content: string
  type: string
  priority: string
  status: string
  sentAt: string
  createdAt: string
  fromUserId: string
  toUserId: string
  clientEmail?: string | null
  clientName?: string | null
  conversationId?: string | null
  readAt?: string | null
}

interface QuoteConversation {
  id: string
  status: string
  description: string
  createdAt: string
  updatedAt: string
  negotiationType: string
  user: {
    id: string
    name: string | null
    email: string
  }
  service?: {
    id: string
    name: string
  }
  product?: {
    id: string
    name: string
  }
  messages: Array<{
    id: string
    message: string
    createdAt: string
    senderId: string
    sender: {
      id: string
      name: string | null
      email: string
      role: string
    }
  }>
}

interface UnifiedConversation {
  id: string
  clientName: string
  clientEmail: string
  clientUserId?: string | null
  otherParticipantId?: string | null
  otherParticipantRole?: string | null
  messages: any[]
  lastMessage: {
    content: string
    type: string
  } | null
  lastMessageAt: string
  unreadCount: number
  type: 'MESSAGE' | 'QUOTE' | 'MIXED' | 'INTERNAL'
  relatedQuoteId?: string | null
  relatedOrderId?: string | null
  quoteStatus?: string | null
  hasMoreMessages?: boolean
  totalMessages?: number
  quoteData?: {
    id: string
    status: string
    negotiationType: string
    proposedPrice?: number | null
    finalPrice?: number | null
    budget?: number | null
    description: string
    createdAt?: string
    updatedAt?: string
    user: {
      id: string
      name?: string
      email: string
    }
    service?: {
      id: string
      name: string
      slug?: string
      price: number
      pricingType?: string
      description?: string
      images?: Array<{ path: string; alt?: string }>
    } | null
    product?: {
      id: string
      name: string
      slug?: string
      price: number
      pricingType?: string
      description?: string
      images?: Array<{ path: string; alt?: string }>
    } | null
  } | null
}

const MESSAGE_TYPES = {
  GENERAL: 'Général',
  SUPPORT: 'Support',
  ORDER: 'Commande',
  SUBSCRIPTION: 'Abonnement',
  PAYMENT: 'Paiement',
  QUOTE: 'Devis',
  CUSTOM: 'Personnalisé',
}

const MESSAGE_PRIORITIES = {
  LOW: { label: 'Basse', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  HIGH: { label: 'Haute', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' },
}

const QUOTE_STATUSES = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  NEGOTIATING: { label: 'En négociation', color: 'bg-blue-100 text-blue-700' },
  PRICE_PROPOSED: { label: 'Prix proposé', color: 'bg-purple-100 text-purple-700' },
  ACCEPTED: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
}

export default function UnifiedMessagesPage() {
  const router = useRouter()
  const { formatCurrency, formatWithTargetCurrency, targetCurrency, currency } = useCurrency()
  const [conversations, setConversations] = useState<UnifiedConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesTopRef = useRef<HTMLDivElement>(null)
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [quickPrice, setQuickPrice] = useState('')
  const [isUpdatingQuote, setIsUpdatingQuote] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const [showCounterForm, setShowCounterForm] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(false)
  const [userStats, setUserStats] = useState<any>(null)
  const [loadingUserStats, setLoadingUserStats] = useState(false)
  
  // Fonction helper pour formater les prix avec conversion
  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined || price === 0) return 'Non spécifié'
    if (targetCurrency && targetCurrency !== 'MGA' && targetCurrency !== currency) {
      return formatWithTargetCurrency(price, targetCurrency)
    }
    return formatCurrency(price)
  }
  
  // Calculer l'historique des propositions
  const getProposalHistory = () => {
    if (!selectedConversation || selectedConversation.type !== 'QUOTE') return []
    
    const history: Array<{
      type: 'client' | 'admin' | 'system'
      price: number
      date: Date
      messageId: string
    }> = []
    
    // Ajouter le budget initial si disponible
    if (selectedConversation.quoteData?.budget) {
      history.push({
        type: 'client',
        price: selectedConversation.quoteData.budget,
        date: new Date(selectedConversation.quoteData.createdAt || selectedConversation.messages[0]?.sentAt || new Date()),
        messageId: 'initial-budget'
      })
    }
    
    // Parcourir les messages pour trouver les propositions
    selectedConversation.messages.forEach((msg: any) => {
      if (msg.proposedPrice && msg.proposedPrice > 0) {
        const isAdmin = msg.isAdminReply || (msg.sender && (msg.sender.role === 'ADMIN' || msg.sender.role === 'STAFF'))
        history.push({
          type: isAdmin ? 'admin' : 'client',
          price: msg.proposedPrice,
          date: new Date(msg.sentAt),
          messageId: msg.id
        })
      }
    })
    
    return history.sort((a, b) => a.date.getTime() - b.date.getTime())
  }
  
  // Compter le nombre de propositions
  const proposalCount = selectedConversation && selectedConversation.type === 'QUOTE'
    ? selectedConversation.messages.filter((msg: any) => msg.proposedPrice && msg.proposedPrice > 0).length
    : 0
  
  const maxProposals = 3
  
  // Gérer les actions rapides sur les propositions
  const handleQuickAction = async (action: 'accept' | 'reject' | 'counter', messageId?: string, price?: number) => {
    if (!selectedConversation?.relatedQuoteId) return
    
    setIsUpdatingQuote(true)
    try {
      if (action === 'counter' && !price) {
        // Ouvrir le formulaire de contre-proposition
        setShowCounterForm(messageId || 'new')
        setIsUpdatingQuote(false)
        return
      }
      
      const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}/quick-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          price: action === 'counter' ? parseFloat(counterPrice) : price,
          message: action === 'counter' ? `Contre-proposition: ${formatPrice(parseFloat(counterPrice))}` : undefined
        })
      })
      
      if (response.ok) {
        toast.success(
          action === 'accept' ? 'Proposition acceptée' :
          action === 'reject' ? 'Proposition refusée' :
          'Contre-proposition envoyée'
        )
        setCounterPrice('')
        setShowCounterForm(null)
        fetchConversations(false)
      } else {
        toast.error('Erreur lors de l\'action')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'action')
    } finally {
      setIsUpdatingQuote(false)
    }
  }
  
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'message', // Par défaut sur "Messages" au lieu de "all"
    priority: 'all',
    search: '',
  })

  // Réinitialiser le prix rapide quand la conversation change
  useEffect(() => {
    setQuickPrice('')
  }, [selectedConversation?.id])

  // Charger les informations utilisateur pour les messages normaux et internes
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!selectedConversation) {
        setUserInfo(null)
        return
      }

      // Charger les infos seulement pour les messages normaux et internes (pas pour les devis)
      if (selectedConversation.type === 'MESSAGE' || selectedConversation.type === 'INTERNAL') {
        const userId = selectedConversation.type === 'INTERNAL' 
          ? selectedConversation.otherParticipantId 
          : selectedConversation.clientUserId

        console.log('🔍 Chargement infos utilisateur:', {
          type: selectedConversation.type,
          clientUserId: selectedConversation.clientUserId,
          otherParticipantId: selectedConversation.otherParticipantId,
          userId
        })

        if (!userId) {
          console.log('⚠️ Pas d\'ID utilisateur disponible')
          setUserInfo(null)
          return
        }

        setLoadingUserInfo(true)
        try {
          // Pour les messages internes, utiliser l'API employees, sinon l'API clients
          const apiUrl = selectedConversation.type === 'INTERNAL' 
            ? `/api/admin/employees/${userId}`
            : `/api/admin/clients/${userId}`
          
          const response = await fetch(apiUrl)
          console.log('📡 Réponse API:', response.status, response.ok, apiUrl)
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ Données utilisateur chargées:', data)
            // Normaliser les données pour qu'elles aient le même format
            const normalizedData = {
              ...data,
              name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Non spécifié',
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              whatsappNumber: data.whatsappNumber,
              addresses: data.addresses || []
            }
            setUserInfo(normalizedData)
          } else {
            console.log('❌ Erreur API:', response.status)
            // En cas d'erreur, utiliser les données de base de la conversation
            setUserInfo({
              name: selectedConversation.clientName,
              email: selectedConversation.clientEmail
            })
          }
        } catch (error) {
          console.error('❌ Erreur lors du chargement des informations utilisateur:', error)
          // En cas d'erreur, utiliser les données de base de la conversation
          setUserInfo({
            name: selectedConversation.clientName,
            email: selectedConversation.clientEmail
          })
        } finally {
          setLoadingUserInfo(false)
        }

        // Charger les statistiques si c'est un client (pas un employé interne)
        if (selectedConversation.type === 'MESSAGE' && userId) {
          setLoadingUserStats(true)
          try {
            const statsResponse = await fetch(`/api/admin/clients/${userId}/stats`)
            if (statsResponse.ok) {
              const statsData = await statsResponse.json()
              setUserStats(statsData)
            }
          } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error)
          } finally {
            setLoadingUserStats(false)
          }
        } else {
          setUserStats(null)
        }
      } else {
        setUserInfo(null)
        setUserStats(null)
      }
    }

    loadUserInfo()
  }, [selectedConversation?.id, selectedConversation?.type, selectedConversation?.clientUserId, selectedConversation?.otherParticipantId])

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom()
    }
  }, [selectedConversation?.messages])

  const fetchConversations = async (isManualRefresh = false) => {
    try {
      // Pour le chargement initial, on utilise isLoading
      // Pour les actualisations, on utilise isRefreshing
      if (conversations.length === 0) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      
      console.log('🔍 Récupération des conversations unifiées...')
      
      // Utiliser la nouvelle API unifiée avec cache-busting
      const response = await fetch(`/api/admin/messages/unified?limit=100&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 Données reçues:', data)

      const unifiedConversations = data.conversations || []
      setConversations(unifiedConversations)

      // TOUJOURS vérifier localStorage en premier pour restaurer la conversation sélectionnée
      // Cela garantit que même après un refresh, la bonne conversation est restaurée
      const savedConversationId = localStorage.getItem('adminSelectedConversationId')
      console.log('🔄 Recherche de conversation sauvegardée dans localStorage:', savedConversationId)
      
      if (savedConversationId) {
        const savedConversation = unifiedConversations.find(
          (c: UnifiedConversation) => c.id === savedConversationId
        )
        
        if (savedConversation) {
          // Conversation sauvegardée trouvée, la restaurer
          console.log('✅ Conversation restaurée depuis localStorage:', savedConversationId)
          setSelectedConversation(savedConversation)
          setHasMoreMessages(savedConversation.hasMoreMessages || false)
        } else {
          // La conversation sauvegardée n'existe plus dans la liste
          console.log('⚠️ Conversation sauvegardée introuvable dans la liste, recherche de la conversation actuelle...')
          
          // Si une conversation est déjà sélectionnée et qu'elle existe encore, la garder
          if (selectedConversation) {
            const currentConversation = unifiedConversations.find(
              (c: UnifiedConversation) => c.id === selectedConversation.id
            )
            if (currentConversation) {
              console.log('✅ Conversation actuelle trouvée, mise à jour:', selectedConversation.id)
              setSelectedConversation(currentConversation)
              setHasMoreMessages(currentConversation.hasMoreMessages || false)
              // Mettre à jour localStorage avec la conversation actuelle
              localStorage.setItem('adminSelectedConversationId', currentConversation.id)
            } else {
              // La conversation actuelle n'existe plus non plus, sélectionner la première
              console.log('⚠️ Conversation actuelle introuvable, sélection de la première')
              if (unifiedConversations.length > 0) {
                setSelectedConversation(unifiedConversations[0])
                setHasMoreMessages(unifiedConversations[0].hasMoreMessages || false)
                localStorage.setItem('adminSelectedConversationId', unifiedConversations[0].id)
              } else {
                setSelectedConversation(null)
                localStorage.removeItem('adminSelectedConversationId')
              }
            }
          } else {
            // Aucune conversation sauvegardée ni sélectionnée, sélectionner la première
            console.log('⚠️ Aucune conversation valide, sélection de la première')
            if (unifiedConversations.length > 0) {
              setSelectedConversation(unifiedConversations[0])
              setHasMoreMessages(unifiedConversations[0].hasMoreMessages || false)
              localStorage.setItem('adminSelectedConversationId', unifiedConversations[0].id)
            } else {
              setSelectedConversation(null)
              localStorage.removeItem('adminSelectedConversationId')
            }
          }
        }
      } else {
        // Pas de conversation sauvegardée dans localStorage
        console.log('🔄 Aucune conversation sauvegardée dans localStorage')
        
        // Si une conversation est déjà sélectionnée et qu'elle existe encore, la garder
        if (selectedConversation) {
          const currentConversation = unifiedConversations.find(
            (c: UnifiedConversation) => c.id === selectedConversation.id
          )
          if (currentConversation) {
            console.log('✅ Conversation actuelle trouvée, mise à jour:', selectedConversation.id)
            setSelectedConversation(currentConversation)
            setHasMoreMessages(currentConversation.hasMoreMessages || false)
            // Sauvegarder dans localStorage
            localStorage.setItem('adminSelectedConversationId', currentConversation.id)
          } else {
            // La conversation actuelle n'existe plus, sélectionner la première
            console.log('⚠️ Conversation actuelle introuvable, sélection de la première')
            if (unifiedConversations.length > 0) {
              setSelectedConversation(unifiedConversations[0])
              setHasMoreMessages(unifiedConversations[0].hasMoreMessages || false)
              localStorage.setItem('adminSelectedConversationId', unifiedConversations[0].id)
            } else {
              setSelectedConversation(null)
            }
          }
        } else {
          // Première visite, sélectionner la première conversation
          console.log('🆕 Première visite, sélection de la première conversation')
          if (unifiedConversations.length > 0) {
            setSelectedConversation(unifiedConversations[0])
            setHasMoreMessages(unifiedConversations[0].hasMoreMessages || false)
            localStorage.setItem('adminSelectedConversationId', unifiedConversations[0].id)
          }
        }
      }

      console.log(`✅ ${unifiedConversations.length} conversations chargées`)

      // Afficher un message de succès seulement pour les actualisations manuelles
      if (isManualRefresh) {
        toast.success('Conversations actualisées')
      }

    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des conversations')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    
    // Actualiser toutes les 30 secondes (en arrière-plan)
    const interval = setInterval(() => fetchConversations(false), 30000)
    return () => clearInterval(interval)
  }, [])

  // Sauvegarder la conversation sélectionnée dans localStorage
  useEffect(() => {
    if (selectedConversation) {
      localStorage.setItem('adminSelectedConversationId', selectedConversation.id)
    }
  }, [selectedConversation])

  // Restaurer la conversation sélectionnée uniquement au premier chargement
  // Cette logique est maintenant principalement gérée dans fetchConversations
  // Ce useEffect sert de fallback uniquement si fetchConversations n'a pas déjà sélectionné une conversation
  useEffect(() => {
    // Ne s'exécuter que si les conversations sont chargées mais aucune n'est sélectionnée
    // ET que ce n'est pas un refresh en cours (pour éviter les conflits)
    if (conversations.length > 0 && !selectedConversation && !isLoading && !isRefreshing) {
      const savedConversationId = localStorage.getItem('adminSelectedConversationId')
      if (savedConversationId) {
        const savedConversation = conversations.find(conv => conv.id === savedConversationId)
        if (savedConversation) {
          console.log('🔄 Restauration de la conversation sauvegardée:', savedConversationId)
          setSelectedConversation(savedConversation)
          setHasMoreMessages(savedConversation.hasMoreMessages || false)
          return
        }
      }
      // Si aucune conversation sauvegardée ou si la sauvegardée n'existe plus, sélectionner la première
      console.log('🔄 Sélection de la première conversation (fallback)')
      setSelectedConversation(conversations[0])
      setHasMoreMessages(conversations[0].hasMoreMessages || false)
    }
  }, [conversations.length, isLoading, isRefreshing]) // Retirer selectedConversation des dépendances pour éviter les boucles

  // Charger plus de messages (scroll infini)
  const loadMoreMessages = async () => {
    if (!selectedConversation || loadingMoreMessages || !hasMoreMessages) return

    const oldestMessage = selectedConversation.messages[0]
    if (!oldestMessage) return

    setLoadingMoreMessages(true)
    try {
      const response = await fetch(
        `/api/admin/messages/conversations/${selectedConversation.id}/messages?before=${oldestMessage.sentAt}&limit=25`
      )

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.messages && data.messages.length > 0) {
        // Insérer les nouveaux messages en haut de la liste
        setSelectedConversation({
          ...selectedConversation,
          messages: [...data.messages, ...selectedConversation.messages],
          hasMoreMessages: data.hasMore
        })
        setHasMoreMessages(data.hasMore)
      } else {
        setHasMoreMessages(false)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de plus de messages:', error)
      toast.error('Erreur lors du chargement des messages')
    } finally {
      setLoadingMoreMessages(false)
    }
  }

  // Observer pour détecter le scroll en haut et charger plus de messages
  useEffect(() => {
    if (!hasMoreMessages || !messagesTopRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMoreMessages) {
          loadMoreMessages()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(messagesTopRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMoreMessages, loadingMoreMessages, selectedConversation])

  const sendReply = async (message: string, files?: any[]) => {
    if (!selectedConversation || (!message.trim() && (!files || files.length === 0))) return

    setIsSending(true)
    try {
      let response

      if (selectedConversation.type === 'QUOTE' && selectedConversation.relatedQuoteId) {
        // Envoyer via l'API des messages de devis
        response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message.trim(),
            attachments: files ? files.map(f => f.file.name) : []
          }),
        })
      } else if (selectedConversation.type === 'INTERNAL' && selectedConversation.otherParticipantId) {
        // Envoyer un message interne entre employés
        response = await fetch('/api/admin/messages/internal/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: selectedConversation.otherParticipantId,
            subject: 'Message interne',
            content: message.trim(),
            type: 'INTERNAL',
            priority: 'NORMAL'
          }),
        })
      } else {
        // Envoyer via l'API des messages classiques
        console.log('Envoi de message classique:', message)
        response = { ok: true }
      }

      if (response.ok) {
        await fetchConversations(false) // Actualisation silencieuse après envoi
        toast.success('Message envoyé')
      } else {
        toast.error('Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur de connexion')
    } finally {
      setIsSending(false)
    }
  }

  const handleProposalAction = async (action: string, data?: any) => {
    if (!selectedConversation?.relatedQuoteId) return

    try {
      console.log('🎯 Action de proposition:', action, data)
      
      const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })

      if (response.ok) {
        console.log('✅ Action réussie, actualisation des conversations...')
        
        // Petit délai pour s'assurer que la base de données est mise à jour
        setTimeout(async () => {
          await fetchConversations(false)
          console.log('🔄 Conversations actualisées')
        }, 500)
        
        // Toast de succès selon l'action
        switch (action) {
          case 'accept':
            toast.success('Proposition acceptée')
            break
          case 'reject':
            toast.success('Proposition refusée')
            break
          case 'counter':
            toast.success('Contre-proposition envoyée')
            break
          default:
            toast.success('Action effectuée')
        }
      } else {
        const errorData = await response.json()
        console.error('❌ Erreur API:', errorData)
        toast.error('Erreur lors de l\'action')
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      toast.error('Erreur de connexion')
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      if (conversationId.startsWith('quote-')) {
        // Marquer les messages de devis comme lus
        const quoteId = conversationId.replace('quote-', '')
        await fetch(`/api/admin/quotes/${quoteId}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read' }),
        })
      } else if (conversationId.startsWith('message-')) {
        // Marquer les messages généraux comme lus
        await fetch('/api/admin/messages/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        })
        // Actualiser les conversations pour mettre à jour les compteurs
        await fetchConversations(false)
      }
    } catch (error) {
      console.error('Erreur marquage lecture:', error)
    }
  }

  const getConversationIcon = (conversation: UnifiedConversation) => {
    switch (conversation.type) {
      case 'QUOTE':
        return <Quote className="h-4 w-4 text-purple-500" />
      case 'MESSAGE':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'MIXED':
        return <FileText className="h-4 w-4 text-indigo-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getMessageIcon = (message: any) => {
    if (message.source === 'QUOTE_INITIAL') {
      return <FileText className="h-3 w-3 text-green-500" />
    }
    if (message.type === 'QUOTE' || message.source === 'QUOTE' || message.source === 'QUOTE_MESSAGE') {
      return <Quote className="h-3 w-3 text-purple-500" />
    }
    return <MessageSquare className="h-3 w-3 text-blue-500" />
  }

  const getMessageLabel = (message: any) => {
    if (message.source === 'QUOTE_INITIAL') {
      return 'Demande initiale'
    }
    if (message.source === 'QUOTE_MESSAGE') {
      return 'Conversation'
    }
    if (message.source === 'QUOTE') {
      return 'Devis'
    }
    return 'Message'
  }

  const filteredConversations = conversations.filter(conversation => {
    // Filtrer par type
    if (filters.type !== 'all') {
      const filterType = filters.type.toLowerCase()
      
      // Mapper les filtres vers les types réels
      if (filterType === 'message') {
        // Messages généraux (pas de commande, pas de devis, pas de messages internes)
        // Exclure les conversations internes et les commandes
        if (conversation.type === 'INTERNAL') {
          return false
        }
        if (conversation.type !== 'MESSAGE') {
          return false
        }
        // Exclure les messages liés à des commandes
        const hasOrderMessage = conversation.messages.some((msg: any) => 
          msg.type === 'ORDER' || msg.relatedOrderId
        )
        if (hasOrderMessage) {
          return false
        }
      } else if (filterType === 'quote') {
        if (conversation.type !== 'QUOTE') return false
      } else if (filterType === 'order') {
        // Les conversations de commande sont dans les messages avec type ORDER ou relatedOrderId
        if (conversation.type === 'MESSAGE') {
          const hasOrderMessage = conversation.messages.some((msg: any) => 
            msg.type === 'ORDER' || msg.relatedOrderId
          )
          if (!hasOrderMessage) return false
        } else {
          return false
        }
      } else if (filterType === 'internal') {
        // Conversations internes entre employés
        if (conversation.type !== 'INTERNAL') return false
      } else {
        if (conversation.type !== filterType.toUpperCase()) return false
      }
    }
    
    // Filtrer par recherche
    if (filters.search && !conversation.clientName.toLowerCase().includes(filters.search.toLowerCase()) && 
        !conversation.clientEmail.toLowerCase().includes(filters.search.toLowerCase())) return false
    
    return true
  })

  const stats = {
    totalConversations: conversations.length,
    messageConversations: conversations.filter(c => {
      if (c.type === 'INTERNAL') return false
      if (c.type !== 'MESSAGE') return false
      // Exclure seulement les messages liés à des commandes
      const hasOrderMessage = c.messages.some((msg: any) => msg.type === 'ORDER' || msg.relatedOrderId)
      return !hasOrderMessage
    }).length,
    quoteConversations: conversations.filter(c => c.type === 'QUOTE').length,
    orderConversations: conversations.filter(c => {
      if (c.type !== 'MESSAGE') return false
      return c.messages.some((msg: any) => msg.type === 'ORDER' || msg.relatedOrderId)
    }).length,
    unreadCount: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    unreadMessages: conversations.filter(c => {
      if (c.type === 'INTERNAL') return false
      if (c.type !== 'MESSAGE') return false
      // Exclure seulement les messages liés à des commandes
      const hasOrderMessage = c.messages.some((msg: any) => msg.type === 'ORDER' || msg.relatedOrderId)
      return !hasOrderMessage && c.unreadCount > 0
    }).reduce((sum, c) => sum + c.unreadCount, 0),
    unreadQuotes: conversations.filter(c => c.type === 'QUOTE').reduce((sum, c) => sum + c.unreadCount, 0),
    unreadOrders: conversations.filter(c => {
      if (c.type !== 'MESSAGE') return false
      const hasOrderMessage = c.messages.some((msg: any) => msg.type === 'ORDER' || msg.relatedOrderId)
      return hasOrderMessage && c.unreadCount > 0
    }).reduce((sum, c) => sum + c.unreadCount, 0),
    internalConversations: conversations.filter(c => c.type === 'INTERNAL').length,
    unreadInternal: conversations.filter(c => c.type === 'INTERNAL' && c.unreadCount > 0).reduce((sum, c) => sum + c.unreadCount, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1800px] mx-auto p-6">
        {/* Header avec statistiques */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Messages & Conversations</h1>
              <p className="text-sm text-slate-500">
                Gestion unifiée des messages et conversations de devis
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <CurrencySelector className="border-slate-200" />
              <Button
                onClick={() => fetchConversations(true)}
                variant="outline"
                size="sm"
                disabled={isLoading || isRefreshing}
                className="rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>
              
              <Button
                onClick={() => router.push('/admin/messages/new')}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau message
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
            {/* Indicateur d'actualisation global */}
            {isRefreshing && (
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalConversations}</p>
                  <p className="text-xs text-blue-600">Total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{stats.messageConversations}</p>
                  <p className="text-xs text-green-600">Messages</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3">
                <Quote className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{stats.quoteConversations}</p>
                  <p className="text-xs text-purple-600">Devis</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-900">{stats.orderConversations}</p>
                  <p className="text-xs text-orange-600">Commandes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{stats.unreadCount}</p>
                  <p className="text-xs text-red-600">Non lus</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Liste des conversations - Plus compacte */}
          <div className="lg:col-span-3">
            <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden h-[700px]">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-100 p-3">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-600" />
                  Conversations ({filteredConversations.length})
                </CardTitle>
                
                {/* Filtres */}
                <div className="space-y-2 mt-3">
                  <Input
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="rounded-lg border-slate-200 h-8 text-xs"
                  />
                  
                  {/* Onglets pour les types de conversations */}
                  <Tabs 
                    value={filters.type} 
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4 h-auto bg-slate-100 rounded-lg p-0.5">
                      <TabsTrigger 
                        value="message" 
                        className="text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-1 justify-center py-1.5 px-1"
                      >
                        <MessageSquare className="h-2.5 w-2.5" />
                        <span className="hidden sm:inline">Messages</span>
                        {stats.unreadMessages > 0 && (
                          <Badge className="bg-red-500 text-white text-[9px] px-1 py-0 h-3 min-w-[14px] flex items-center justify-center">
                            {stats.unreadMessages}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="quote" 
                        className="text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-1 justify-center py-1.5 px-1"
                      >
                        <Quote className="h-2.5 w-2.5" />
                        <span className="hidden sm:inline">Devis</span>
                        {stats.unreadQuotes > 0 && (
                          <Badge className="bg-red-500 text-white text-[9px] px-1 py-0 h-3 min-w-[14px] flex items-center justify-center">
                            {stats.unreadQuotes}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="order" 
                        className="text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-1 justify-center py-1.5 px-1"
                      >
                        <ShoppingBag className="h-2.5 w-2.5" />
                        <span className="hidden sm:inline">Cmd</span>
                        {stats.unreadOrders > 0 && (
                          <Badge className="bg-red-500 text-white text-[9px] px-1 py-0 h-3 min-w-[14px] flex items-center justify-center">
                            {stats.unreadOrders}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="internal" 
                        className="text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all flex items-center gap-1 justify-center py-1.5 px-1"
                      >
                        <User className="h-2.5 w-2.5" />
                        <span className="hidden sm:inline">Int</span>
                        {stats.unreadInternal > 0 && (
                          <Badge className="bg-red-500 text-white text-[9px] px-1 py-0 h-3 min-w-[14px] flex items-center justify-center">
                            {stats.unreadInternal}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="overflow-y-auto h-[580px] relative">
                  {/* Indicateur d'actualisation en arrière-plan */}
                  {isRefreshing && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Actualisation...
                      </div>
                    </div>
                  )}
                  
                  {isLoading && conversations.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      <span className="ml-2 text-slate-500">Chargement des conversations...</span>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500">
                      <MessageSquare className="h-8 w-8 mr-2" />
                      Aucune conversation
                    </div>
                  ) : (
                    filteredConversations.map((conversation, index) => (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          console.log('🖱️ Sélection de conversation:', conversation.id)
                          setSelectedConversation(conversation)
                          setHasMoreMessages(conversation.hasMoreMessages || false)
                          // Sauvegarder immédiatement dans localStorage
                          localStorage.setItem('adminSelectedConversationId', conversation.id)
                          markAsRead(conversation.id)
                        }}
                        className={`p-2.5 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-all duration-200 ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                        } ${isRefreshing ? 'opacity-90' : 'opacity-100'}`}
                        style={{
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="w-8 h-8 border-2 border-white shadow-sm flex-shrink-0">
                            <AvatarFallback className="bg-slate-200 text-slate-600 font-medium text-xs">
                              {conversation.clientName[0]?.toUpperCase() || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="font-medium text-xs text-slate-900 truncate">
                                  {conversation.clientName}
                                </p>
                                <div className="flex-shrink-0">{getConversationIcon(conversation)}</div>
                              </div>
                              
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {conversation.unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-[16px] flex items-center justify-center">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                                <span className="text-[10px] text-slate-400">
                                  {format(new Date(conversation.lastMessageAt), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                            
                            <p className={`text-xs truncate mb-1 ${
                              conversation.unreadCount > 0 
                                ? 'text-slate-900 font-medium' 
                                : 'text-slate-600'
                            }`}>
                              {conversation.lastMessage?.content || 'Aucun message'}
                            </p>
                            
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                                {conversation.lastMessage?.type ? 
                                  (MESSAGE_TYPES[conversation.lastMessage.type as keyof typeof MESSAGE_TYPES] || conversation.lastMessage.type) : 
                                  'Message'
                                }
                              </Badge>
                              
                              {conversation.quoteStatus && (
                                <Badge className={`text-[9px] px-1.5 py-0 h-4 ${QUOTE_STATUSES[conversation.quoteStatus as keyof typeof QUOTE_STATUSES]?.color || 'bg-gray-100 text-gray-700'}`}>
                                  {QUOTE_STATUSES[conversation.quoteStatus as keyof typeof QUOTE_STATUSES]?.label || conversation.quoteStatus}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone de conversation */}
          <div className="lg:col-span-9">
            {selectedConversation ? (
              <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden h-[700px]">
                <CardHeader className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200 p-3">
                  {/* Informations client uniquement */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar className="w-9 h-9 border-2 border-white shadow-sm flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm">
                          {selectedConversation.clientName[0]?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-slate-900 truncate">
                          {selectedConversation.clientName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{selectedConversation.clientEmail}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {getConversationIcon(selectedConversation)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 flex flex-row overflow-hidden" style={{ height: 'calc(700px - 80px)' }}>
                  {/* Sidebar gauche avec informations du devis/commande/utilisateur */}
                  {(selectedConversation.type === 'QUOTE' && selectedConversation.quoteData) || 
                   (selectedConversation.type === 'MESSAGE' && selectedConversation.messages.some((msg: any) => msg.relatedOrderId)) ||
                   (selectedConversation.type === 'MESSAGE' || selectedConversation.type === 'INTERNAL') ? (
                    <div className="w-1/2 border-r border-slate-200 bg-slate-50/50 p-4 overflow-y-auto flex-shrink-0">
                      {/* Informations du devis */}
                      {selectedConversation.type === 'QUOTE' && selectedConversation.quoteData && (() => {
                        const quoteStatus = selectedConversation.quoteStatus || 'PENDING'
                        const budget = selectedConversation.quoteData.budget || 0
                        const proposedPrice = selectedConversation.quoteData.proposedPrice || 0
                        const finalPrice = selectedConversation.quoteData.finalPrice || 0
                        const basePrice = selectedConversation.quoteData.service?.price || selectedConversation.quoteData.product?.price || 0
                        
                        // Calcul de la progression
                        const getProgress = () => {
                          switch(quoteStatus) {
                            case 'PENDING': return 20
                            case 'NEGOTIATING': return 40
                            case 'PRICE_PROPOSED': return 60
                            case 'ACCEPTED': return 100
                            case 'REJECTED': return 0
                            default: return 20
                          }
                        }
                        
                        const handleQuickPropose = async () => {
                          const value = parseFloat(quickPrice)
                          if (isNaN(value) || value <= 0) {
                            toast.error('Veuillez entrer un montant valide')
                            return
                          }
                          setIsUpdatingQuote(true)
                          try {
                            const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                proposedPrice: value,
                                finalPrice: value,
                                status: 'PRICE_PROPOSED'
                              })
                            })
                            if (response.ok) {
                              toast.success('Prix proposé avec succès')
                              setQuickPrice('')
                              fetchConversations(false)
                            } else {
                              toast.error('Erreur lors de la proposition')
                            }
                          } catch (error) {
                            toast.error('Erreur lors de la proposition')
                          } finally {
                            setIsUpdatingQuote(false)
                          }
                        }
                        
                        const handleQuickReject = async () => {
                          if (!confirm('Êtes-vous sûr de vouloir rejeter ce devis ?')) return
                          setIsUpdatingQuote(true)
                          try {
                            const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'REJECTED' })
                            })
                            if (response.ok) {
                              toast.success('Devis rejeté')
                              fetchConversations(false)
                            }
                          } catch (error) {
                            toast.error('Erreur lors du rejet')
                          } finally {
                            setIsUpdatingQuote(false)
                          }
                        }
                        
                        const handleQuickAccept = async () => {
                          // Utiliser proposedPrice si finalPrice n'est pas défini
                          const priceToUse = finalPrice || proposedPrice
                          if (!priceToUse || priceToUse <= 0) {
                            toast.error('Aucun prix proposé disponible')
                            return
                          }
                          setIsUpdatingQuote(true)
                          try {
                            const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                status: 'ACCEPTED',
                                finalPrice: priceToUse
                              })
                            })
                            if (response.ok) {
                              toast.success('Devis accepté avec succès')
                              fetchConversations(false)
                            } else {
                              toast.error('Erreur lors de l\'acceptation')
                            }
                          } catch (error) {
                            toast.error('Erreur lors de l\'acceptation')
                          } finally {
                            setIsUpdatingQuote(false)
                          }
                        }
                        
                        return (
                          <div className="space-y-3">
                            {/* En-tête avec statut */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5">
                                <Quote className="h-4 w-4 text-purple-500" />
                                <h4 className="font-semibold text-sm text-slate-900">Informations du devis</h4>
                              </div>
                              <Badge className={`px-2 py-0.5 text-xs font-medium ${
                                quoteStatus === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                quoteStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                quoteStatus === 'PRICE_PROPOSED' ? 'bg-orange-100 text-orange-700' :
                                quoteStatus === 'NEGOTIATING' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {quoteStatus === 'ACCEPTED' ? '✓ Accepté' :
                                 quoteStatus === 'REJECTED' ? '✗ Rejeté' :
                                 quoteStatus === 'PRICE_PROPOSED' ? '💰 Prix proposé' :
                                 quoteStatus === 'NEGOTIATING' ? 'En négociation' :
                                 'En attente'}
                              </Badge>
                            </div>
                            
                            {/* Barre de progression */}
                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Progression</span>
                                <span className="text-xs font-medium text-slate-700">{getProgress()}%</span>
                              </div>
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    quoteStatus === 'ACCEPTED' ? 'bg-green-500' :
                                    quoteStatus === 'REJECTED' ? 'bg-red-500' :
                                    quoteStatus === 'PRICE_PROPOSED' ? 'bg-orange-500' :
                                    quoteStatus === 'NEGOTIATING' ? 'bg-blue-500' :
                                    'bg-amber-500'
                                  }`}
                                  style={{ width: `${getProgress()}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                <span>Demande</span>
                                <span>Négociation</span>
                                <span>Prix proposé</span>
                                <span>Accepté</span>
                              </div>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            {/* Actions rapides */}
                            {quoteStatus !== 'ACCEPTED' && quoteStatus !== 'REJECTED' && (
                              <div className="space-y-2.5 p-3 bg-white rounded-lg border border-slate-200 mb-3">
                                <label className="text-xs font-medium text-slate-700 block">Actions rapides</label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Montant"
                                    value={quickPrice}
                                    onChange={(e) => setQuickPrice(e.target.value)}
                                    className="flex-1 h-7 text-xs px-2"
                                    disabled={isUpdatingQuote}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={handleQuickPropose}
                                    disabled={isUpdatingQuote || !quickPrice}
                                    className="h-7 px-2 text-xs bg-purple-500 hover:bg-purple-600"
                                  >
                                    <TrendingUp className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  {quoteStatus === 'PRICE_PROPOSED' && (
                                    <Button
                                      size="sm"
                                      onClick={handleQuickAccept}
                                      disabled={isUpdatingQuote || !finalPrice}
                                      className="flex-1 h-7 text-xs bg-green-500 hover:bg-green-600"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                      Accepter
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleQuickReject}
                                    disabled={isUpdatingQuote}
                                    className="flex-1 h-7 text-xs"
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Rejeter
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            <Separator className="my-3" />
                            
                            {/* Informations financières */}
                            <div className="space-y-2.5">
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1.5">
                                  <DollarSign className="h-3 w-3" />
                                  Budget client
                                </label>
                                <div className="px-3 py-1.5 bg-white rounded text-sm font-medium text-slate-700 border border-slate-200">
                                  {budget > 0 ? formatPrice(budget) : 'Non spécifié'}
                                </div>
                              </div>
                              
                              {basePrice > 0 && (
                                <div>
                                  <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1.5">
                                    <Info className="h-3 w-3" />
                                    Prix de base
                                  </label>
                                  <div className="px-3 py-1.5 bg-blue-50 rounded text-sm font-medium text-blue-700 border border-blue-200">
                                    {formatPrice(basePrice)}
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">Prix proposé</label>
                                <input
                                  type="number"
                                  defaultValue={proposedPrice || ''}
                                  placeholder="Prix"
                                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                  onBlur={async (e) => {
                                    const value = parseFloat(e.target.value)
                                    if (!isNaN(value) && value !== proposedPrice) {
                                      try {
                                        const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ proposedPrice: value })
                                        })
                                        if (response.ok) {
                                          toast.success('Prix proposé mis à jour')
                                          fetchConversations(false)
                                        }
                                      } catch (error) {
                                        toast.error('Erreur lors de la mise à jour')
                                      }
                                    }
                                  }}
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">Prix final</label>
                                <input
                                  type="number"
                                  defaultValue={finalPrice || ''}
                                  placeholder="Prix"
                                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                  onBlur={async (e) => {
                                    const value = parseFloat(e.target.value)
                                    if (!isNaN(value) && value !== finalPrice) {
                                      try {
                                        const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ finalPrice: value })
                                        })
                                        if (response.ok) {
                                          toast.success('Prix final mis à jour')
                                          fetchConversations(false)
                                        }
                                      } catch (error) {
                                        toast.error('Erreur lors de la mise à jour')
                                      }
                                    }
                                  }}
                                />
                              </div>
                              
                              {budget > 0 && proposedPrice > 0 && (
                                <div className="pt-2 border-t border-slate-200">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Écart budget</span>
                                    <span className={`font-medium ${
                                      proposedPrice <= budget ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {proposedPrice <= budget ? '+' : '-'}
                                      {formatPrice(Math.abs(budget - proposedPrice))}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Bouton d'acceptation toujours visible si prix proposé */}
                              {proposedPrice > 0 && quoteStatus !== 'ACCEPTED' && quoteStatus !== 'REJECTED' && (
                                <div className="pt-2 border-t border-slate-200">
                                  <Button
                                    onClick={handleQuickAccept}
                                    disabled={isUpdatingQuote || !proposedPrice}
                                    className="w-full h-8 text-xs bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Accepter la proposition ({formatPrice(proposedPrice)})
                                  </Button>
                                </div>
                              )}
                              
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">Statut</label>
                                <Select
                                  value={quoteStatus}
                                  onValueChange={async (value) => {
                                    try {
                                      const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: value })
                                      })
                                      if (response.ok) {
                                        toast.success('Statut mis à jour')
                                        fetchConversations(false)
                                      }
                                    } catch (error) {
                                      toast.error('Erreur lors de la mise à jour')
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full h-8 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PENDING">En attente</SelectItem>
                                    <SelectItem value="NEGOTIATING">En négociation</SelectItem>
                                    <SelectItem value="PRICE_PROPOSED">Prix proposé</SelectItem>
                                    <SelectItem value="ACCEPTED">Accepté</SelectItem>
                                    <SelectItem value="REJECTED">Rejeté</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            {/* Informations produit/service */}
                            {(selectedConversation.quoteData.service || selectedConversation.quoteData.product) && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <Package className="h-4 w-4 text-slate-400" />
                                  <span className="text-xs font-medium text-slate-500">Article concerné</span>
                                </div>
                                <div className="pl-5 space-y-1">
                                  <p className="text-sm font-medium text-slate-900">
                                    {selectedConversation.quoteData.service?.name || selectedConversation.quoteData.product?.name}
                                  </p>
                                  {selectedConversation.quoteData.service?.description && (
                                    <p className="text-xs text-slate-600 line-clamp-3">
                                      {selectedConversation.quoteData.service.description}
                                    </p>
                                  )}
                                  {selectedConversation.quoteData.product?.description && (
                                    <p className="text-xs text-slate-600 line-clamp-3">
                                      {selectedConversation.quoteData.product.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <Separator className="my-3" />
                            
                            {/* Historique des propositions */}
                            {(() => {
                              const history = getProposalHistory()
                              return history.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <History className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="text-xs font-medium text-slate-500">Historique des propositions</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                      {proposalCount}/{maxProposals}
                                    </Badge>
                                  </div>
                                  <div className="pl-5 space-y-2">
                                    {history.map((item, idx) => (
                                      <div key={item.messageId} className="flex items-center gap-2 text-xs">
                                        <div className={`w-2 h-2 rounded-full ${
                                          item.type === 'client' ? 'bg-purple-500' :
                                          item.type === 'admin' ? 'bg-blue-500' :
                                          'bg-gray-400'
                                        }`} />
                                        <span className="text-slate-500">
                                          {item.type === 'client' ? 'Client' : item.type === 'admin' ? 'Admin' : 'Système'}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-slate-400" />
                                        <span className="font-semibold text-slate-700">
                                          {formatPrice(item.price)}
                                        </span>
                                        {idx < history.length - 1 && (
                                          <div className="ml-auto text-[10px] text-slate-400">
                                            {format(item.date, 'dd/MM HH:mm')}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {proposalCount >= maxProposals && (
                                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                                        ⚠️ Limite atteinte. Retour au prix du produit.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })()}
                            
                            <Separator className="my-3" />
                            
                            {/* Historique */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs font-medium text-slate-500">Historique</span>
                              </div>
                              <div className="pl-5 space-y-1.5 text-xs text-slate-600">
                                <div className="flex justify-between">
                                  <span>Créé le:</span>
                                  <span className="font-medium">
                                    {selectedConversation.quoteData.createdAt 
                                      ? format(new Date(selectedConversation.quoteData.createdAt), 'dd/MM/yyyy', { locale: fr })
                                      : '-'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Modifié le:</span>
                                  <span className="font-medium">
                                    {selectedConversation.quoteData.updatedAt 
                                      ? format(new Date(selectedConversation.quoteData.updatedAt), 'dd/MM/yyyy', { locale: fr })
                                      : '-'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Messages:</span>
                                  <span className="font-medium">{selectedConversation.messages.length}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Informations de commande */}
                      {selectedConversation.type === 'MESSAGE' && selectedConversation.messages.some((msg: any) => msg.relatedOrderId) && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <ShoppingBag className="h-4 w-4 text-orange-500" />
                            <h4 className="font-semibold text-xs text-slate-900">Commande</h4>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const orderId = selectedConversation.messages.find((msg: any) => msg.relatedOrderId)?.relatedOrderId
                              if (orderId) {
                                router.push(`/admin/orders/${orderId}`)
                              }
                            }}
                            className="w-full text-xs h-7"
                          >
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            Voir la commande
                          </Button>
                        </div>
                      )}

                      {/* Informations utilisateur pour messages normaux et internes */}
                      {(selectedConversation.type === 'MESSAGE' || selectedConversation.type === 'INTERNAL') && 
                       !selectedConversation.messages.some((msg: any) => msg.relatedOrderId) && (
                        <div className="space-y-3 border-t border-slate-200 pt-3 mt-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <User className="h-4 w-4 text-blue-500" />
                            <h4 className="font-semibold text-xs text-slate-900">
                              {selectedConversation.type === 'INTERNAL' ? 'Informations employé' : 'Informations utilisateur'}
                            </h4>
                          </div>
                          
                          {loadingUserInfo ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            </div>
                          ) : userInfo ? (
                            <div className="space-y-2 text-xs">
                              {/* Nom */}
                              <div className="flex items-start gap-2">
                                <User className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-slate-500 block">Nom</span>
                                  <span className="font-medium text-slate-700 truncate">
                                    {userInfo.name || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Non spécifié'}
                                  </span>
                                </div>
                              </div>

                              {/* Email */}
                              {userInfo.email && (
                                <div className="flex items-start gap-2">
                                  <Mail className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-slate-500 block">Email</span>
                                    <span className="font-medium text-slate-700 truncate">{userInfo.email}</span>
                                  </div>
                                </div>
                              )}

                              {/* Téléphone */}
                              {userInfo.phone && (
                                <div className="flex items-start gap-2">
                                  <Phone className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-slate-500 block">Téléphone</span>
                                    <span className="font-medium text-slate-700">{userInfo.phone}</span>
                                  </div>
                                </div>
                              )}

                              {/* WhatsApp */}
                              {userInfo.whatsappNumber && (
                                <div className="flex items-start gap-2">
                                  <Phone className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-slate-500 block">WhatsApp</span>
                                    <span className="font-medium text-slate-700">{userInfo.whatsappNumber}</span>
                                  </div>
                                </div>
                              )}

                              {/* Adresse */}
                              {userInfo.addresses && userInfo.addresses.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-slate-500 block">Adresse{userInfo.addresses.length > 1 ? 's' : ''}</span>
                                    <div className="space-y-1 mt-1">
                                      {userInfo.addresses.slice(0, 2).map((address: any, idx: number) => (
                                        <div key={idx} className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded">
                                          <span className="font-medium text-[9px] text-slate-500 uppercase">{address.type || 'Adresse'}</span>
                                          <div className="mt-0.5">
                                            {address.street && <div>{address.street}</div>}
                                            <div>{address.zipCode} {address.city}{address.country && `, ${address.country}`}</div>
                                          </div>
                                        </div>
                                      ))}
                                      {userInfo.addresses.length > 2 && (
                                        <div className="text-[9px] text-slate-400 italic">
                                          +{userInfo.addresses.length - 2} autre{userInfo.addresses.length - 2 > 1 ? 's' : ''}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Statistiques - Commandes, Devis, Abonnements */}
                              {selectedConversation.type === 'MESSAGE' && userStats && (
                                <div className="pt-2 border-t border-slate-200 mt-2">
                                  <div className="space-y-2">
                                    {/* Commandes */}
                                    <div className="flex items-center justify-between p-1.5 bg-blue-50 rounded">
                                      <div className="flex items-center gap-1.5">
                                        <ShoppingBag className="h-3 w-3 text-blue-600" />
                                        <span className="text-[10px] text-slate-600">Commandes</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-blue-700">{userStats.orders?.total || 0}</span>
                                        {userStats.orders?.pending > 0 && (
                                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-yellow-50 text-yellow-700 border-yellow-200">
                                            {userStats.orders.pending} en attente
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Devis */}
                                    <div className="flex items-center justify-between p-1.5 bg-purple-50 rounded">
                                      <div className="flex items-center gap-1.5">
                                        <Quote className="h-3 w-3 text-purple-600" />
                                        <span className="text-[10px] text-slate-600">Devis</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-purple-700">{userStats.quotes?.total || 0}</span>
                                        {userStats.quotes?.pending > 0 && (
                                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-yellow-50 text-yellow-700 border-yellow-200">
                                            {userStats.quotes.pending} en cours
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Abonnements */}
                                    {userStats.subscriptions && userStats.subscriptions.total > 0 && (
                                      <div className="flex items-center justify-between p-1.5 bg-green-50 rounded">
                                        <div className="flex items-center gap-1.5">
                                          <Star className="h-3 w-3 text-green-600" />
                                          <span className="text-[10px] text-slate-600">Abonnements</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-green-700">{userStats.subscriptions.total}</span>
                                          {userStats.subscriptions.active > 0 && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-green-100 text-green-700 border-green-200">
                                              {userStats.subscriptions.active} actif{userStats.subscriptions.active > 1 ? 's' : ''}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Total dépensé */}
                                    {userStats.totalSpent > 0 && (
                                      <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
                                        <div className="flex items-center gap-1.5">
                                          <DollarSign className="h-3 w-3 text-slate-600" />
                                          <span className="text-[10px] text-slate-600">Total dépensé</span>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700">{formatPrice(userStats.totalSpent)}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Liens rapides */}
                                  <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-200">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const userId = selectedConversation.clientUserId
                                        if (userId) {
                                          router.push(`/admin/orders?userId=${userId}`)
                                        }
                                      }}
                                      className="text-[10px] h-6 px-2"
                                      disabled={!userStats?.orders?.total}
                                    >
                                      <ShoppingBag className="h-2.5 w-2.5 mr-1" />
                                      Commandes
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const userId = selectedConversation.clientUserId
                                        if (userId) {
                                          router.push(`/admin/quotes?userId=${userId}`)
                                        }
                                      }}
                                      className="text-[10px] h-6 px-2"
                                      disabled={!userStats?.quotes?.total}
                                    >
                                      <Quote className="h-2.5 w-2.5 mr-1" />
                                      Devis
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Rôle (pour les messages internes) */}
                              {selectedConversation.type === 'INTERNAL' && selectedConversation.otherParticipantRole && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px]">
                                    {selectedConversation.otherParticipantRole === 'ADMIN' ? 'Administrateur' : 'Staff'}
                                  </Badge>
                                </div>
                              )}

                              {/* Bouton pour voir le profil complet */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const userId = selectedConversation.type === 'INTERNAL' 
                                    ? selectedConversation.otherParticipantId 
                                    : selectedConversation.clientUserId
                                  if (userId) {
                                    router.push(`/admin/clients/${userId}`)
                                  }
                                }}
                                className="w-full text-xs h-7 mt-2"
                              >
                                <User className="h-3 w-3 mr-1" />
                                Voir le profil complet
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 py-2">
                              Informations non disponibles
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Zone de messages - Prend le reste de l'espace */}
                  <div className="w-1/2 flex flex-col min-w-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
                    {/* Indicateur de chargement en haut */}
                    {loadingMoreMessages && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      </div>
                    )}
                    
                    {/* Ref pour observer le scroll en haut */}
                    {hasMoreMessages && <div ref={messagesTopRef} className="h-1" />}
                    
                    {selectedConversation.messages.map((message, index) => {
                      const isFromAdmin = message.isAdminReply || (message.sender && (message.sender.role === 'ADMIN' || message.sender.role === 'STAFF'))
                      const isSystemMessage = message.isSystemMessage || false
                      const isCounterProposal = message.content?.includes('💰 Nouvelle proposition de prix:') || false
                      const isInitialQuote = message.source === 'QUOTE_INITIAL'
                      const hasProposedPrice = (message as any).proposedPrice && (message as any).proposedPrice > 0
                      
                      return (
                        <div key={message.id}>
                          {/* Message normal */}
                          <div className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'} mb-2`}>
                            <div className={`max-w-[70%] ${isFromAdmin ? 'order-2' : 'order-1'}`}>
                              <div className={`flex items-start gap-3 ${isFromAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                                  <AvatarFallback className={`text-xs font-medium ${
                                    isFromAdmin 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {isFromAdmin ? 'AD' : (selectedConversation.clientName[0] || 'C')}
                                  </AvatarFallback>
                                </Avatar>
                                
                                {/* Message bubble */}
                                <div className={`space-y-1 ${isFromAdmin ? 'text-right' : 'text-left'}`}>
                                  <div className={`inline-block p-3 rounded-2xl shadow-sm ${
                                    isCounterProposal
                                      ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 text-orange-800'
                                      : isSystemMessage
                                      ? 'bg-green-50 border border-green-200 text-green-800'
                                      : isFromAdmin
                                      ? 'bg-blue-500 text-white rounded-br-md'
                                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                                  }`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    {getMessageIcon(message)}
                                    <span className="text-xs opacity-75">
                                      {getMessageLabel(message)}
                                    </span>
                                    {message.source === 'QUOTE_INITIAL' && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        Nouvelle demande
                                      </span>
                                    )}
                                    {isCounterProposal && (
                                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                        💰 Proposition
                                      </span>
                                    )}
                                    {isSystemMessage && !isCounterProposal && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        Système
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Budget client et prix proposé dans le message initial */}
                                  {isInitialQuote && selectedConversation.quoteData && (
                                    <div className={`mb-2 p-3 rounded-lg border-2 ${
                                      isFromAdmin 
                                        ? 'bg-blue-50 border-blue-300 text-blue-900' 
                                        : 'bg-green-50 border-green-300 text-green-900'
                                    }`}>
                                      <div className="space-y-2.5">
                                        {/* Budget client */}
                                        {selectedConversation.quoteData.budget && selectedConversation.quoteData.budget > 0 && (
                                          <div className="flex items-center gap-2.5 p-2 bg-white/60 rounded-md">
                                            <DollarSign className="h-5 w-5 text-green-600" />
                                            <div>
                                              <p className="text-xs font-semibold text-slate-600">Budget client</p>
                                              <p className="text-base font-bold text-green-700">
                                                {formatPrice(selectedConversation.quoteData.budget)}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Prix proposé actuel du devis */}
                                        {selectedConversation.quoteData.proposedPrice && selectedConversation.quoteData.proposedPrice > 0 && (
                                          <div className="flex items-center gap-2.5 p-2 bg-white/60 rounded-md">
                                            <DollarSign className="h-5 w-5 text-purple-600" />
                                            <div>
                                              <p className="text-xs font-semibold text-slate-600">Prix proposé actuel</p>
                                              <p className="text-base font-bold text-purple-700">
                                                {formatPrice(selectedConversation.quoteData.proposedPrice)}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Prix proposé par le client ou l'admin dans les messages suivants */}
                                  {hasProposedPrice && !isInitialQuote && (
                                    <div className={`mb-2 p-3 rounded-lg border-2 ${
                                      isFromAdmin 
                                        ? 'bg-blue-50 border-blue-300 text-blue-900' 
                                        : 'bg-purple-50 border-purple-300 text-purple-900'
                                    }`}>
                                      <div className="flex items-center gap-2.5 p-2 bg-white/60 rounded-md">
                                        <DollarSign className={`h-5 w-5 ${isFromAdmin ? 'text-blue-600' : 'text-purple-600'}`} />
                                        <div className="flex-1">
                                          <p className="text-xs font-semibold text-slate-600">
                                            {isFromAdmin ? 'Prix proposé par l\'admin' : 'Prix proposé par le client'}
                                          </p>
                                          <p className={`text-base font-bold ${isFromAdmin ? 'text-blue-700' : 'text-purple-700'}`}>
                                            {formatPrice((message as any).proposedPrice)}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {/* Boutons d'action rapide pour l'admin si c'est une proposition client */}
                                      {!isFromAdmin && selectedConversation.type === 'QUOTE' && selectedConversation.quoteStatus !== 'ACCEPTED' && selectedConversation.quoteStatus !== 'REJECTED' && (
                                        <div className="mt-3 pt-3 border-t border-current/20 space-y-2">
                                          {showCounterForm === message.id ? (
                                            <div className="space-y-2">
                                              <Input
                                                type="number"
                                                placeholder="Montant de la contre-proposition"
                                                value={counterPrice}
                                                onChange={(e) => setCounterPrice(e.target.value)}
                                                className="h-8 text-xs"
                                              />
                                              <div className="flex gap-2">
                                                <Button
                                                  size="sm"
                                                  onClick={() => handleQuickAction('counter', message.id, parseFloat(counterPrice))}
                                                  disabled={isUpdatingQuote || !counterPrice}
                                                  className="flex-1 h-7 text-xs bg-purple-500 hover:bg-purple-600"
                                                >
                                                  Envoyer
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    setShowCounterForm(null)
                                                    setCounterPrice('')
                                                  }}
                                                  className="h-7 text-xs"
                                                >
                                                  Annuler
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={() => handleQuickAction('accept', message.id, (message as any).proposedPrice)}
                                                disabled={isUpdatingQuote}
                                                className="flex-1 h-7 text-xs bg-green-500 hover:bg-green-600"
                                              >
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Accepter
                                              </Button>
                                              <Button
                                                size="sm"
                                                onClick={() => setShowCounterForm(message.id)}
                                                disabled={isUpdatingQuote || proposalCount >= maxProposals}
                                                className="flex-1 h-7 text-xs bg-purple-500 hover:bg-purple-600"
                                              >
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                Contre-proposer
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleQuickAction('reject', message.id)}
                                                disabled={isUpdatingQuote}
                                                className="flex-1 h-7 text-xs"
                                              >
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Refuser
                                              </Button>
                                            </div>
                                          )}
                                          {proposalCount >= maxProposals && (
                                            <p className="text-[10px] text-amber-600 mt-1">
                                              Limite de {maxProposals} propositions atteinte
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                  </div>
                                  
                                  <div className={`flex items-center gap-2 text-xs text-slate-400 ${
                                    isFromAdmin ? 'justify-end' : 'justify-start'
                                  }`}>
                                    <span>
                                      {format(new Date(message.sentAt), 'dd/MM à HH:mm')}
                                    </span>
                                    {message.readAt && (
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Carte enrichie pour les devis de produits */}
                          {message.source === 'QUOTE_INITIAL' && 
                           selectedConversation.quoteData && 
                           (selectedConversation.quoteData.negotiationType === 'PRODUCT_PRICE' || selectedConversation.quoteData.negotiationType === 'PRODUCT_QUOTE') &&
                           (selectedConversation.quoteData.status === 'PENDING' || selectedConversation.quoteData.status === 'NEGOTIATING') && (
                            <div className="mb-4">
                              <EnhancedQuoteMessageCard
                                quote={selectedConversation.quoteData}
                                onAction={handleProposalAction}
                                compact={true}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Zone de saisie avancée */}
                  <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
                    <EnhancedMessageInput
                      value={replyMessage}
                      onChange={setReplyMessage}
                      onSend={sendReply}
                      disabled={isSending}
                      placeholder="Tapez votre réponse... (Shift+Entrée pour nouvelle ligne)"
                    />
                  </div>
                </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden h-[700px]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <MessageSquare className="h-16 w-16 mx-auto text-slate-300" />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-600">
                        Sélectionnez une conversation
                      </h3>
                      <p className="text-sm text-slate-400">
                        Choisissez une conversation dans la liste pour commencer à discuter
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}