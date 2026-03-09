export const useFormRules = () => {
  const t = useT()

  const required = (message) => ({
    required: true,
    message: message || t('validation.required'),
    trigger: 'blur',
  })

  const email = () => ({
    type: 'email',
    message: t('validation.email'),
    trigger: 'blur',
  })

  const minLength = (min) => ({
    min,
    message: t('validation.minLength', { min }),
    trigger: 'blur',
  })

  const maxLength = (max) => ({
    max,
    message: t('validation.maxLength', { max }),
    trigger: 'blur',
  })

  return { required, email, minLength, maxLength }
}
