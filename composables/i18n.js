export const useT = (key, payload, options) => {
  const { t } = useI18n()
  if (key !== undefined) return t(key, payload, options)
  return t
}

export const useD = (key, payload) => {
  const { d } = useI18n()
  if (key !== undefined) return d(key, payload)
  return d
}

export const useN = (key, payload) => {
  const { n } = useI18n()
  if (key !== undefined) return n(key, payload)
  return n
}
