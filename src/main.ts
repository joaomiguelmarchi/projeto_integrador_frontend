import { createApp } from 'vue'
import App from './App.vue'
import router from './presentation/router'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes';
import './assets/style.css';
import 'primeicons/primeicons.css';
import ToastService from 'primevue/toastservice';

const SmileHubPreset = definePreset(Aura, {
    semantic: {
        primary: {
            25: '#fbab3c', 50: '#e6effa', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
            500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554', 
            1000: '#72C037', 1010: '#D24740'
        },
        colorScheme: {
            light: {
                surface: {
                    0: '#fbfbf3', 
                    50: '#f8fafc', 
                    100: '#f1f5f9', 
                    200: '#e2e8f0', 
                    300: '#cbd5e1',
                    400: '#94a3b8', 
                    500: '#64748b', 
                    600: '#475569', 
                    700: '#334155', 
                    800: '#1e293b', 
                    900: '#0f172a', 
                    950: '#020617', 
                    1000: '#f8f7f7',
                    1050: '#e1ecf8'
                }
            }
        }
    }
});

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: SmileHubPreset,
        options: {
            darkModeSelector: 'none', 
            cssLayer: false 
        }
    }
});
app.mount('#app');
app.use(ToastService);