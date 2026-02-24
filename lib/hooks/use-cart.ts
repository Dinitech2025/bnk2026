'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { v4 as uuidv4 } from 'uuid'

export interface CartItem {
  id: string
  type: 'product' | 'service' | 'offer'
  itemId: string
  name: string
  price: number
  quantity: number
  image?: string
  data?: Record<string, any>
}

export interface Cart {
  id: string
  itemCount: number
  total: number
}

interface UseCartReturn {
  cart: Cart | null
  items: CartItem[]
  isLoading: boolean
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

// Hook global pour maintenir l'état partagé
let globalCart: Cart | null = null
let globalItems: CartItem[] = []
let globalIsLoading = true
let globalUserId: string | null = null // Pour tracker les changements d'utilisateur
let subscribers: (() => void)[] = []

function notifySubscribers() {
  subscribers.forEach(callback => callback())
}

export function useCart(): UseCartReturn {
  const { data: session } = useSession()
  const [cart, setCart] = useState<Cart | null>(globalCart)
  const [items, setItems] = useState<CartItem[]>(globalItems)
  const [isLoading, setIsLoading] = useState(globalIsLoading)
  const [sessionId, setSessionId] = useState<string>('')

  // S'abonner aux changements globaux
  useEffect(() => {
    const updateState = () => {
      setCart(globalCart)
      setItems(globalItems)
      setIsLoading(globalIsLoading)
    }
    
    subscribers.push(updateState)
    
    return () => {
      subscribers = subscribers.filter(sub => sub !== updateState)
    }
  }, [])

  // Générer un sessionId pour les invités
  useEffect(() => {
    let storedSessionId = ''
    if (typeof window !== 'undefined') {
      try {
        storedSessionId = localStorage.getItem('guestSessionId') || ''
        if (!storedSessionId) {
          storedSessionId = uuidv4()
          localStorage.setItem('guestSessionId', storedSessionId)
        }
      } catch (error) {
        // Fallback si localStorage n'est pas disponible
        storedSessionId = uuidv4()
      }
    }
    setSessionId(storedSessionId)
  }, [])

  // Fonction pour récupérer le panier
  const fetchCart = useCallback(async () => {
    if (!session?.user?.id && !sessionId) return

    try {
      const params = new URLSearchParams()
      if (sessionId && !session?.user?.id) {
        params.append('sessionId', sessionId)
      }

      const response = await fetch(`/api/cart?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        globalCart = data.cart
        globalItems = data.items || []
        globalIsLoading = false
        notifySubscribers()
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du panier:', error)
    } finally {
      globalIsLoading = false
      notifySubscribers()
    }
  }, [session?.user?.id, sessionId])

  // Charger le panier au montage et quand la session change (mais éviter les refetch inutiles)
  useEffect(() => {
    if (sessionId || session?.user?.id) {
      // Ne pas refetch si on a déjà des données et que l'utilisateur n'a pas changé
      const hasValidData = globalCart && globalItems.length >= 0
      const currentUserId = session?.user?.id
      
      // Refetch seulement si nécessaire
      if (!hasValidData || (currentUserId !== globalUserId)) {
        globalUserId = currentUserId || null
        fetchCart()
      } else {
        // Utiliser les données globales existantes
        setCart(globalCart)
        setItems(globalItems)
        setIsLoading(false)
      }
    }
  }, [fetchCart, sessionId, session?.user?.id])

  // Fonction pour ajouter un item au panier
  const addToCart = useCallback(async (item: Omit<CartItem, 'id'>) => {
    try {
      const params = new URLSearchParams()
      if (sessionId && !session?.user?.id) {
        params.append('sessionId', sessionId)
      }

      const response = await fetch(`/api/cart?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })

      if (response.ok) {
        const data = await response.json()
        globalCart = data.cart
        globalItems = data.items || []
        notifySubscribers()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'ajout au panier')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      throw error
    }
  }, [session?.user?.id, sessionId])

  // Fonction pour mettre à jour la quantité
  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    try {
      const params = new URLSearchParams()
      if (sessionId && !session?.user?.id) {
        params.append('sessionId', sessionId)
      }

      const response = await fetch(`/api/cart?${params.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity })
      })

      if (response.ok) {
        const data = await response.json()
        globalCart = data.cart
        globalItems = data.items || []
        notifySubscribers()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error)
      throw error
    }
  }, [session?.user?.id, sessionId])

  // Fonction pour supprimer un item
  const removeFromCart = useCallback(async (cartItemId: string) => {
    try {
      const params = new URLSearchParams()
      if (sessionId && !session?.user?.id) {
        params.append('sessionId', sessionId)
      }
      params.append('cartItemId', cartItemId)

      const response = await fetch(`/api/cart?${params.toString()}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCart() // Recharger le panier
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      throw error
    }
  }, [session?.user?.id, sessionId, fetchCart])

  // Fonction pour vider le panier
  const clearCart = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (sessionId && !session?.user?.id) {
        params.append('sessionId', sessionId)
      }

      const response = await fetch(`/api/cart?${params.toString()}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        globalCart = null
        globalItems = []
        notifySubscribers()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du vidage du panier')
      }
    } catch (error) {
      console.error('Erreur lors du vidage du panier:', error)
      throw error
    }
  }, [session?.user?.id, sessionId])

  return {
    cart,
    items,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart
  }
} 