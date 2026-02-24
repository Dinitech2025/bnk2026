import { toast as sonnerToast } from 'sonner'

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default'

interface ToastOptions {
  title?: string
  description?: string
  type?: ToastType
}

// Hook pour utiliser les toasts
export function useToast() {
  const toast = (options: ToastOptions) => {
    const { title, description, type = 'default' } = options

    switch (type) {
      case 'success':
        return sonnerToast.success(title, {
          description,
        })
      case 'error':
        return sonnerToast.error(title, {
          description,
        })
      case 'info':
        return sonnerToast.info(title, {
          description,
        })
      case 'warning':
        return sonnerToast.warning(title, {
          description,
        })
      default:
        return sonnerToast(title || '', {
          description,
        })
    }
  }

  return { toast }
}

// Exportation pour une utilisation sans hook
export const toast = {
  success: (options: { title?: string; description?: string }) => {
    return sonnerToast.success(options.title, {
      description: options.description,
    })
  },
  error: (options: { title?: string; description?: string }) => {
    return sonnerToast.error(options.title, {
      description: options.description,
    })
  },
  info: (options: { title?: string; description?: string }) => {
    return sonnerToast.info(options.title, {
      description: options.description,
    })
  },
  warning: (options: { title?: string; description?: string }) => {
    return sonnerToast.warning(options.title, {
      description: options.description,
    })
  },
  // Version générique
  show: (options: { title?: string; description?: string }) => {
    return sonnerToast(options.title || '', {
      description: options.description,
    })
  },
} 