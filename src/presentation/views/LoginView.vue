<template>
  <div class="flex justify-center items-center min-h-screen bg-[radial-gradient(circle_at_10%_80%,#bc6cdb_0%,#5d5dcc_40%,#5dabcc_60%,#bc6cdb_100%)] p-8">
    <div class="flex flex-col items-center w-full max-w-[440px]">
      <AppBrand variant="white" container-class="flex items-center justify-center gap-4 mb-8" logo-class="w-[40px] h-auto" />

      <div class="bg-[var(--p-surface-0)] p-12 rounded-[16px] shadow-[0_10px_25px_rgba(2,24,71,0.15)] w-full">
        <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <label for="username" class="text-sm font-semibold text-slate-700">
              Email<span class="app-required-mark">*</span>
            </label>
            <IconField>
              <InputIcon class="pi pi-envelope" />
              <InputText
                id="username"
                v-model="username"
                placeholder="Digite seu email"
                :invalid="!!errors.username"
                fluid
              />
            </IconField>
            <Message v-if="errors.username" severity="error" variant="simple" size="small">
              {{ errors.username }}
            </Message>
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-semibold text-slate-700">
              Senha<span class="app-required-mark">*</span>
            </label>
            <IconField>
              <InputIcon class="pi pi-lock" />
              <Password
                id="password"
                v-model="password"
                placeholder="Digite sua senha"
                :feedback="false"
                toggleMask
                :invalid="!!errors.password"
                fluid
              />
            </IconField>
            <Message v-if="errors.password" severity="error" variant="simple" size="small">
              {{ errors.password }}
            </Message>

            <div class="flex justify-end mt-1">
              <a
                href="#"
                @click.prevent="openForgotDialog"
                class="text-sm font-medium text-[var(--p-primary-500)] hover:text-[var(--p-primary-600)] transition-colors"
              >
                Esqueci minha senha
              </a>
            </div>
          </div>

          <Button
            type="submit"
            label="Entrar"
            :loading="loading"
            class="!border-none !p-[0.85rem] font-semibold !rounded-lg mt-1"
            fluid
          />
        </form>
      </div>
    </div>

    <Dialog
      v-model:visible="forgotDialogVisible"
      :style="{ width: '450px' }"
      header="Recuperar Senha"
      :modal="true"
      class="app-dialog p-fluid"
    >
      <div class="app-dialog-body app-dialog-section">
        <span class="text-slate-600 text-sm">
          Informe o seu e-mail de cadastro. Enviaremos as instrucoes para voce criar uma nova senha.
        </span>

        <div class="app-field">
          <label for="recovery-email" class="app-field-label">
            E-mail<span class="app-required-mark">*</span>
          </label>
          <InputText
            id="recovery-email"
            v-model.trim="recoveryEmail"
            type="email"
            placeholder="exemplo@email.com"
            autofocus
            :invalid="recoverySubmitted && !recoveryEmail"
            class="w-full"
          />
          <small v-if="recoverySubmitted && !recoveryEmail" class="app-field-error">
            Por favor, informe um e-mail valido.
          </small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="closeForgotDialog" />
        <Button label="Enviar" icon="pi pi-send" @click="sendRecoveryEmail" :loading="recoveryLoading" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import { useToast } from 'primevue/usetoast';
import { AuthService } from '../../infrastructure/services/AuthService';
import AppBrand from '../components/AppBrand.vue';

const username = ref('');
const password = ref('');
const loading = ref(false);
const router = useRouter();
const toast = useToast();

const errors = ref({
  username: '',
  password: ''
});

const forgotDialogVisible = ref(false);
const recoveryEmail = ref('');
const recoverySubmitted = ref(false);
const recoveryLoading = ref(false);

const validateForm = () => {
  errors.value = { username: '', password: '' };
  let isValid = true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!username.value.trim()) {
    errors.value.username = 'O campo email e obrigatorio.';
    isValid = false;
  } else if (!emailRegex.test(username.value)) {
    errors.value.username = 'Por favor, insira um e-mail valido.';
    isValid = false;
  }

  if (!password.value) {
    errors.value.password = 'O campo senha e obrigatorio.';
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;

  loading.value = true;

  try {
    const result = await AuthService.login(username.value, password.value);

    if (result.sucesso) {
      AuthService.saveSession(result.data);
      router.push('/inicio');
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erro de Autenticacao',
        detail: result.mensagem || 'Nao foi possivel realizar o login.',
        life: 5000
      });
    }
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro de Conexao',
      detail: 'Erro de comunicacao com o servidor. Tente novamente mais tarde.',
      life: 5000
    });
  } finally {
    loading.value = false;
  }
};

const openForgotDialog = () => {
  recoveryEmail.value = '';
  recoverySubmitted.value = false;
  forgotDialogVisible.value = true;
};

const closeForgotDialog = () => {
  forgotDialogVisible.value = false;
};

const sendRecoveryEmail = async () => {
  recoverySubmitted.value = true;

  if (!recoveryEmail.value) return;

  recoveryLoading.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    closeForgotDialog();
    toast.add({
      severity: 'success',
      summary: 'E-mail enviado',
      detail: 'As instrucoes de recuperacao foram enviadas para seu e-mail.',
      life: 5000
    });
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Nao foi possivel enviar o e-mail de recuperacao.',
      life: 5000
    });
  } finally {
    recoveryLoading.value = false;
  }
};
</script>
