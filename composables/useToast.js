import dsToast from '@attendu/design-system/composables/useToast.js'

export const useToast = () => ({
  success: (message, options) => dsToast(message, { type: 'success', ...options }),
  error: (message, options) => dsToast.error(message, options),
  warning: (message, options) => dsToast(message, { type: 'warning', ...options }),
  info: (message, options) => dsToast(message, { type: 'info', ...options }),
})
