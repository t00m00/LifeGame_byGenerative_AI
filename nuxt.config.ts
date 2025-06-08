import { resolveAlias } from "nuxt/kit";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: '/LifeGame_byGenerative_AI/'
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
    nitro: {
    output: {
      publicDir: 'docs'
    },
    prerender: {
      crawlLinks: true,
    }
  }
})
