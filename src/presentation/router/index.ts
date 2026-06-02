import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import ProceduresView from '../views/ProceduresView.vue'
import PatientRegistrationView from '../views/PatientRegistrationView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import QuotationView from '../views/QuotationView.vue'
import AttendanceView from '../views/AttendanceView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/redefinirSenha',
    name: 'redefinirSenha',
    component: ResetPasswordView
  },
  {
    path: '/inicio',
    name: 'inicio',
    component: HomeView,
    //meta: { requiresAuth: true } 
  },
  {
    path: '/procedimentos',
    name: 'procedimentos',
    component: ProceduresView
  },
  {
    path: '/cadastroPaciente',
    name: 'cadastroPaciente',
    component: PatientRegistrationView
  },
  {
    path: '/orcamento',
    name: 'orcamento',
    component: QuotationView
  },
   {
    path: '/atendimento',
    name: 'atendimento',
    component: AttendanceView
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = localStorage.getItem('usuario_logado')   // Substituir 'usuario_logado' pela chave AuthService

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/inicio')
  } else {
    next()
  }
})

export default router