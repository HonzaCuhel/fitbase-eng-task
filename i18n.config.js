export default defineI18nConfig(() => ({
  fallbackLocale: {
    cs: ['en'],
    es: ['en'],
    default: ['en'],
  },
  pluralRules: {
    cs: (choice) => {
      if (choice === 0) return 0
      if (choice === 1) return 1
      if (choice >= 2 && choice <= 4) return 2
      return 3
    },
  },
}))
