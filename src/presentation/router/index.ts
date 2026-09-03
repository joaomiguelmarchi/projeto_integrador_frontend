import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import ProceduresView from '../views/ProceduresView.vue'
import PatientRegistrationView from '../views/PatientRegistrationView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import QuotationView from '../views/QuotationView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import { AuthService } from '../../infrastructure/services/AuthService'

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
    meta: { requiresAuth: true } 
  },
  {
    path: '/procedimentos',
    name: 'procedimentos',
    component: ProceduresView,
    meta: { requiresAuth: true }
  },
  {
    path: '/cadastroPaciente',
    name: 'cadastroPaciente',
    component: PatientRegistrationView,
    meta: { requiresAuth: true }
  },
  {
    path: '/orcamento',
    name: 'orcamento',
    component: QuotationView,
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: ScheduleView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = AuthService.isAuthenticated()

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/inicio')
  } else {
    next()
  }
})

export default router
