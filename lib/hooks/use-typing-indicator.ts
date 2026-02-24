import { useState, useEffect, useCallback, useRef } from 'react'

interface TypingUser {
  userId: string
  userName: string
}

interface UseTypingIndicatorProps {
  quoteId: string
  isAdmin?: boolean
}

export function useTypingIndicator({ quoteId, isAdmin = false }: UseTypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const pollIntervalRef = useRef<NodeJS.Timeout>()

  const apiPath = isAdmin ? `/api/admin/quotes/${quoteId}/typing` : `/api/quotes/${quoteId}/typing`

  // Send typing status to server
  const sendTypingStatus = useCallback(async (typing: boolean) => {
    try {
      await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isTyping: typing })
      })
    } catch (error) {
      console.error('Erreur lors de l\'envoi du statut de frappe:', error)
    }
  }, [apiPath])

  // Fetch current typing users
  const fetchTypingUsers = useCallback(async () => {
    try {
      const response = await fetch(apiPath)
      if (response.ok) {
        const data = await response.json()
        setTypingUsers(data.typingUsers || [])
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs en train de taper:', error)
    }
  }, [apiPath])

  // Start typing
  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      sendTypingStatus(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingStatus(false)
    }, 3000)
  }, [isTyping, sendTypingStatus])

  // Stop typing
  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false)
      sendTypingStatus(false)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [isTyping, sendTypingStatus])

  // Poll for typing users every 2 seconds
  useEffect(() => {
    fetchTypingUsers()
    
    pollIntervalRef.current = setInterval(() => {
      fetchTypingUsers()
    }, 2000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [fetchTypingUsers])

  // Cleanup on unmount
  useEffect(() => {
    // Cleanup function when component unmounts
    const cleanup = () => {
      stopTyping()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }

    // Cleanup when user leaves the page
    const handleBeforeUnload = () => {
      sendTypingStatus(false)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      cleanup()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [stopTyping, sendTypingStatus])

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping
  }
} 