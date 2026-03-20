import { resolve } from 'path'

export default defineNuxtConfig({
  extends: ['@attendu/design-system'],

  modules: [
    '@pinia/nuxt',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxt/test-utils/module',
    '@vueuse/nuxt',
  ],

  devServer: {
    port: 3002,
  },

  ssr: true,

  routeRules: {
    '/': { ssr: false },
    '/classes': { ssr: false },
    '/classes/**': { ssr: false },
    '/setup/**': { ssr: false },
    '/app/**': { ssr: false },
  },

  runtimeConfig: {
    public: {
      apiPort: process.env.API_PORT || '5051',
      sentryDsn: process.env.SENTRY_DSN || '',
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
    },
  },

  imports: {
    dirs: ['stores', 'utils'],
    imports: [
      { name: 'defineStore', from: 'pinia' },
    ],
  },

  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
      { code: 'cs', language: 'cs-CZ', file: 'cs.json', name: 'Cestina' },
      { code: 'es', language: 'es-ES', file: 'es.json', name: 'Espanol' },
    ],
    lazy: false,
    langDir: 'locales/',
    defaultLocale: 'en',
    strategy: 'no_prefix',
    restructureDir: false,
    detectBrowserLanguage: false,
  },

  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [
      (await import('@tailwindcss/vite')).default(),
    ],
    resolve: {
      dedupe: ['dayjs'],
      alias: {
        'dayjs/plugin/localeData': 'dayjs/esm/plugin/localeData/index.js',
      },
    },
    optimizeDeps: {
      include: ['dayjs', 'element-plus', '@attendu/utils'],
    },
  },

  sourcemap: {
    server: true,
    client: true,
  },

  nitro: {
    devProxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT || '5051'}/api`,
        changeOrigin: true,
      },
    },
  },

  postcss: {
    plugins: {
      'postcss-inline-svg': {
        paths: [resolve('./node_modules/@attendu/icons/svg')],
      },
    },
  },

  future: {
    compatibilityVersion: 3,
  },

  compatibilityDate: '2025-01-01',
})
