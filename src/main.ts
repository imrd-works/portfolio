import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import router from '@/router'
import { i18n } from '@/i18n'
import { portfolioDirectives } from '@/shared/directives'
import 'virtual:svg-icons-register'
import '@/assets/styles/main.scss'

const app = createApp(App)
const head = createHead()
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(head)
app.use(portfolioDirectives)
app.mount('#app')
