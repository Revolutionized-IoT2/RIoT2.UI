import "@/assets/site.css";

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// @ts-ignore
import timeago from 'vue-timeago3'

import { registerPlugins } from '@/plugins'

const app = createApp(App)

app.use(timeago)
app.use(createPinia())
app.use(router)

registerPlugins(app)
app.mount('#app')
