import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import ProceduresView from '../views/ProceduresView.vue'
import PatientRegistrationView from '../views/PatientRegistrationView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import QuotationView from '../views/QuotationView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import PatientRecordView from '../views/PatientRecordView.vue'
import BillingView from '../views/BillingView.vue'
import { AuthService } from '../../infrastructure/services/AuthService'

const routes = [
  {
    path: '/faturamento',
    alias: '/billing',
    name: 'faturamento',
    component: BillingView,
    meta: { requiresAuth: true }
  },
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
    path: '/prontuarioPaciente',
    name: 'prontuarioPaciente',
    component: PatientRecordView,
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

router.beforeEach(async to => {
  const protectedRoute = to.matched.some(record => record.meta.requiresAuth);
  if (!protectedRoute && to.name !== 'login') return true;
  if (!AuthService.isAuthenticated()) return protectedRoute ? { name: 'login' } : true;
  try {
    const authenticated = await AuthService.validateSession();
    if (!authenticated) return protectedRoute ? { name: 'login', query: { reason: 'expired' } } : true;
    return to.name === 'login' ? { name: 'inicio' } : true;
  } catch {
    // Fail closed on startup/navigation without misreporting a network failure as a 401.
    return protectedRoute ? { name: 'login', query: { reason: 'unavailable' } } : true;
  }
});

export default router;
