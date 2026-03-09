export const useT = () => {
  const { t } = useI18n()
  return t
}

export const useD = () => {
  const { d } = useI18n()
  return d
}

export const useN = () => {
  const { n } = useI18n()
  return n
}
