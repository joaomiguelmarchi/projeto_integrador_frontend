<template>
    <AppLayout title="Prontuário">
        <div class="patient-record-page bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
            <template v-if="selectedPatient && currentClinicalRecord">
                <div class="patient-record-summary">
                    <div class="patient-record-summary-main">
                        <div class="patient-record-avatar">{{ patientInitials }}</div>
                        <div class="patient-record-summary-content">
                            <div class="patient-record-name-row">
                                <h2>{{ selectedPatient.name }}</h2>
                                <Button v-if="patientHealthAlerts.length" icon="pi pi-exclamation-triangle" severity="warn" text rounded aria-label="Consultar alertas de saúde do paciente" title="Paciente com alertas na anamnese" @click="healthAlertVisible = true" />
                            </div>
                            <div class="patient-record-summary-meta">
                                <span>{{ selectedPatient.displayId || '-' }}</span>
                                <span>{{ selectedPatient.cpf || '-' }}</span>
                                <span>{{ formatAge(selectedPatient.age) }}</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        icon="pi pi-search"
                        label="Selecionar paciente"
                        class="!bg-[var(--p-primary-500)] hover:!bg-[var(--p-primary-600)] !border-none !px-4 !py-2 !font-semibold !text-[var(--p-surface-0)] transition-all h-9 flex items-center !rounded-lg shadow-md"
                        @click="openPatientDialog"
                    />
                </div>

                <Tabs v-model:value="activeTab" class="patient-record-tabs">
                    <TabList>
                        <Tab value="personal">
                            <span class="patient-record-tab-label">
                                <i class="pi pi-id-card" />
                                Dados pessoais
                            </span>
                        </Tab>
                        <Tab value="anamnesis">
                            <span class="patient-record-tab-label">
                                <i class="pi pi-clipboard" />
                                Anamnese
                            </span>
                        </Tab>
                        <Tab value="exams">
                            <span class="patient-record-tab-label">
                                <i class="pi pi-images" />
                                Exames
                            </span>
                        </Tab>
                    </TabList>

                    <TabPanels class="patient-record-tab-panels">
                        <TabPanel value="personal" class="patient-record-tab-panel">
                            <div class="patient-record-personal-grid">
                                <section class="patient-record-info-panel">
                                    <div class="patient-record-section-header">
                                        <div>
                                            <h3>Dados pessoais</h3>
                                            <p>Informações principais do cadastro</p>
                                        </div>
                                        <i class="pi pi-address-book" />
                                    </div>

                                    <dl class="patient-record-detail-list">
                                        <div>
                                            <dt>ID Paciente</dt>
                                            <dd>{{ selectedPatient.displayId || '-' }}</dd>
                                        </div>
                                        <div>
                                            <dt>Nome completo</dt>
                                            <dd>{{ selectedPatient.name || '-' }}</dd>
                                        </div>
                                        <div>
                                            <dt>CPF</dt>
                                            <dd>{{ selectedPatient.cpf || '-' }}</dd>
                                        </div>
                                        <div>
                                            <dt>Nascimento</dt>
                                            <dd>{{ formatDate(selectedPatient.birthDate) || '-' }}</dd>
                                        </div>
                                        <div>
                                            <dt>Sexo</dt>
                                            <dd>{{ selectedPatient.gender || '-' }}</dd>
                                        </div>
                                        <div>
                                            <dt>Responsável</dt>
                                            <dd>{{ selectedPatient.responsibleName || '-' }}</dd>
                                        </div>
                                        <div>
                                            <dt>Telefone principal</dt>
                                            <dd>{{ primaryPatientPhone || '-' }}</dd>
                                        </div>
                                        <div>
                                            <dt>E-mail</dt>
                                            <dd>{{ selectedPatient.email || '-' }}</dd>
                                        </div>
                                        <div class="patient-record-detail-list-wide">
                                            <dt>Endereço</dt>
                                            <dd>{{ patientAddress || '-' }}</dd>
                                        </div>
                                    </dl>
                                </section>

                                <section class="patient-record-history-panel">
                                    <div class="patient-record-section-header">
                                        <div>
                                            <h3>Histórico de atendimentos</h3>
                                            <p>{{ historyLoading ? 'Carregando...' : `${selectedPatientAttendances.length} registro(s)` }}</p>
                                        </div>
                                        <i class="pi pi-history" />
                                    </div>

                                    <div v-if="historyLoading" class="patient-record-empty-panel">
                                        <i class="pi pi-spin pi-spinner" />
                                        <span>Carregando atendimentos...</span>
                                    </div>

                                    <div v-else-if="historyError" class="patient-record-empty-panel">
                                        <i class="pi pi-exclamation-circle" />
                                        <span>{{ historyError }}</span>
                                        <Button label="Tentar novamente" icon="pi pi-refresh" size="small" text @click="reloadHistory" />
                                    </div>

                                    <div v-else-if="selectedPatientAttendances.length" class="patient-record-history-list">
                                        <article
                                            v-for="attendance in selectedPatientAttendances"
                                            :key="attendance.id"
                                            class="patient-record-history-item"
                                        >
                                            <div class="patient-record-history-date">
                                                <strong>{{ formatShortDate(attendance.date) }}</strong>
                                                <span>{{ formatTime(attendance.date) }}</span>
                                            </div>
                                            <div class="patient-record-history-content">
                                                <div class="patient-record-history-title">
                                                    <h4>{{ attendance.procedures.join(', ') || 'Sem procedimentos informados' }}</h4>
                                                    <span :class="['patient-record-status', getAttendanceStatusClass(attendance.status)]">
                                                        {{ attendance.status }}
                                                    </span>
                                                </div>
                                                <p v-if="attendance.notes">{{ attendance.notes }}</p>
                                                <small>{{ attendance.professional }}</small>
                                            </div>
                                        </article>
                                    </div>

                                    <div v-else class="patient-record-empty-panel">
                                        <i class="pi pi-calendar-times" />
                                        <span>Nenhum atendimento encontrado.</span>
                                    </div>
                                </section>
                            </div>
                        </TabPanel>

                        <TabPanel value="anamnesis" class="patient-record-tab-panel">
                            <div class="patient-record-anamnesis-layout">
                                <section class="patient-record-form-panel">
                                    <div class="patient-record-section-header">
                                        <div>
                                            <h3>Anamnese</h3>
                                            <p>{{ anamnesisStatusLabel }}</p>
                                        </div>
                                        <div class="patient-record-anamnesis-actions">
                                            <Select
                                                v-model="currentClinicalRecord.selectedAnamnesisType"
                                                :options="anamnesisTypeOptions"
                                                optionLabel="label"
                                                optionValue="value"
                                                :disabled="!anamnesisReady || savingAnamnesis"
                                                class="patient-record-anamnesis-type"
                                            />
                                            <Button
                                                icon="pi pi-check"
                                                label="Salvar"
                                                size="small"
                                                :loading="savingAnamnesis"
                                                :disabled="!anamnesisReady"
                                                @click="saveAnamnesis"
                                            />
                                        </div>
                                    </div>

                                    <div v-if="anamnesisLoading" class="patient-record-empty-panel">
                                        <i class="pi pi-spin pi-spinner" />
                                        <span>Carregando anamnese...</span>
                                    </div>

                                    <div v-else-if="anamnesisError" class="patient-record-empty-panel">
                                        <i class="pi pi-exclamation-circle" />
                                        <span>{{ anamnesisError }}</span>
                                        <Button label="Tentar novamente" icon="pi pi-refresh" size="small" text @click="reloadAnamnesis" />
                                    </div>

                                    <template v-else-if="currentClinicalRecord.selectedAnamnesisType === 'adult'">
                                        <div class="patient-record-anamnesis-section">
                                            <div class="patient-record-anamnesis-section-title">
                                                <h4>Dados pessoais</h4>
                                                <span>Informações do cadastro</span>
                                            </div>

                                            <dl class="patient-record-anamnesis-personal">
                                                <div>
                                                    <dt>Nome</dt>
                                                    <dd>{{ selectedPatient.name || '-' }}</dd>
                                                </div>
                                                <div>
                                                    <dt>Nascimento</dt>
                                                    <dd>{{ formatDate(selectedPatient.birthDate) || '-' }}</dd>
                                                </div>
                                                <div>
                                                    <dt>Idade</dt>
                                                    <dd>{{ formatAge(selectedPatient.age) }}</dd>
                                                </div>
                                                <div>
                                                    <dt>CPF</dt>
                                                    <dd>{{ selectedPatient.cpf || '-' }}</dd>
                                                </div>
                                                <div>
                                                    <dt>Telefone</dt>
                                                    <dd>{{ primaryPatientPhone || '-' }}</dd>
                                                </div>
                                                <div>
                                                    <dt>E-mail</dt>
                                                    <dd>{{ selectedPatient.email || '-' }}</dd>
                                                </div>
                                            </dl>
                                        </div>

                                        <div class="patient-record-anamnesis-section">
                                            <div class="app-field">
                                                <label for="adult-main-complaint" class="app-field-label">Motivo da consulta / Queixa principal</label>
                                                <Textarea
                                                    id="adult-main-complaint"
                                                    v-model="currentClinicalRecord.adultAnamnesis.mainComplaint"
                                                    rows="3"
                                                    class="w-full"
                                                />
                                            </div>
                                        </div>

                                        <div class="patient-record-anamnesis-section">
                                            <div class="patient-record-anamnesis-section-title">
                                                <h4>Questionário de Saúde</h4>
                                                <span>Modelo adulto</span>
                                            </div>

                                            <div class="patient-record-question-list">
                                                <div
                                                    v-for="question in adultHealthQuestions"
                                                    :key="question.key"
                                                    class="patient-record-question"
                                                >
                                                    <label :for="getQuestionInputId('adult', question.key)" class="patient-record-question-label">
                                                        <strong>{{ question.number }}</strong>
                                                        {{ question.text }}
                                                    </label>
                                                    <div class="patient-record-question-fields">
                                                        <Select
                                                            :id="getQuestionInputId('adult', question.key)"
                                                            :modelValue="getAdultQuestionResponse(question.key).answer"
                                                            @update:modelValue="updateAdultQuestionAnswer(question.key, $event)"
                                                            :options="question.answerOptions ?? healthAnswerOptions"
                                                            placeholder="Selecione"
                                                            class="patient-record-question-select"
                                                        />
                                                        <Textarea rows="2"
                                                            v-if="question.detailLabel"
                                                            :modelValue="getAdultQuestionResponse(question.key).details"
                                                            @update:modelValue="updateAdultQuestionDetails(question.key, $event)"
                                                            :placeholder="question.detailLabel"
                                                            :aria-label="question.text + ' — ' + question.detailLabel"
                                                            class="patient-record-question-detail"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="patient-record-anamnesis-section">
                                            <div class="patient-record-anamnesis-section-title">
                                                <h4>Higiene bucal</h4>
                                                <span>Questão 31</span>
                                            </div>
                                            <div class="app-form-grid">
                                                <div class="app-field col-span-12 md:col-span-6">
                                                    <label for="adult-brushing-frequency" class="app-field-label">Quantas vezes por dia escova os dentes?</label>
                                                    <Textarea rows="2"
                                                        id="adult-brushing-frequency"
                                                        v-model="currentClinicalRecord.adultAnamnesis.brushingFrequency"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-6">
                                                    <label for="adult-floss-use" class="app-field-label">Usa fio dental?</label>
                                                    <Textarea rows="2"
                                                        id="adult-floss-use"
                                                        v-model="currentClinicalRecord.adultAnamnesis.flossUse"
                                                        class="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div class="patient-record-anamnesis-section">
                                            <div class="patient-record-anamnesis-section-title">
                                                <h4>Para mulheres</h4>
                                                <span>Questões 32 a 34</span>
                                            </div>

                                            <div class="patient-record-question-list">
                                                <div
                                                    v-for="question in adultWomenQuestions"
                                                    :key="question.key"
                                                    class="patient-record-question"
                                                >
                                                    <label :for="getQuestionInputId('adult', question.key)" class="patient-record-question-label">
                                                        <strong>{{ question.number }}</strong>
                                                        {{ question.text }}
                                                    </label>
                                                    <div class="patient-record-question-fields">
                                                        <Select
                                                            :id="getQuestionInputId('adult', question.key)"
                                                            :modelValue="getAdultQuestionResponse(question.key).answer"
                                                            @update:modelValue="updateAdultQuestionAnswer(question.key, $event)"
                                                            :options="healthAnswerOptions"
                                                            placeholder="Selecione"
                                                            class="patient-record-question-select"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </template>

                                    <template v-else>
                                        <div class="patient-record-anamnesis-section">
                                            <div class="patient-record-anamnesis-section-title">
                                                <h4>Anamnese Pediátrica</h4>
                                                <span>Rotina e dados da criança</span>
                                            </div>

                                            <div class="app-form-grid">
                                                <div class="app-field col-span-12">
                                                    <label for="pediatric-main-complaint" class="app-field-label">Motivo da consulta / Queixa principal</label>
                                                    <Textarea
                                                        id="pediatric-main-complaint"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.mainComplaint"
                                                        rows="3"
                                                        class="w-full"
                                                    />
                                                </div>

                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="siblings-count" class="app-field-label">Número de irmãos</label>
                                                    <InputText
                                                        id="siblings-count"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.siblingsCount"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-8">
                                                    <label for="main-caregiver" class="app-field-label">Quem permanece a maior parte do tempo com a criança?</label>
                                                    <Textarea rows="2"
                                                        id="main-caregiver"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.mainCaregiver"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12">
                                                    <label for="preferred-activity" class="app-field-label">Qual atividade preferida da criança?</label>
                                                    <Textarea rows="2"
                                                        id="preferred-activity"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.preferredActivity"
                                                        class="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div class="patient-record-anamnesis-section">
                                            <div class="patient-record-anamnesis-section-title">
                                                <h4>Hábitos e rotina</h4>
                                                <span>Escola, escovação e primeira consulta</span>
                                            </div>

                                            <div class="patient-record-checkbox-grid">
                                                <label class="patient-record-checkbox-item">
                                                    <Checkbox v-model="currentClinicalRecord.pediatricAnamnesis.attends.school" binary />
                                                    Escola
                                                </label>
                                                <label class="patient-record-checkbox-item">
                                                    <Checkbox v-model="currentClinicalRecord.pediatricAnamnesis.attends.daycare" binary />
                                                    Creche
                                                </label>
                                                <label class="patient-record-checkbox-item">
                                                    <Checkbox v-model="currentClinicalRecord.pediatricAnamnesis.attends.afterSchool" binary />
                                                    Contraturno
                                                </label>
                                            </div>

                                            <div class="app-form-grid mt-4">
                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="school-period" class="app-field-label">Período</label>
                                                    <Textarea rows="2"
                                                        id="school-period"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.schoolPeriod"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="pediatric-brushing" class="app-field-label">Realiza escovação?</label>
                                                    <Textarea rows="2"
                                                        id="pediatric-brushing"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.brushing"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="pediatric-brushing-frequency" class="app-field-label">Quantas vezes ao dia?</label>
                                                    <Textarea rows="2"
                                                        id="pediatric-brushing-frequency"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.brushingFrequency"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="pediatric-floss" class="app-field-label">Faz uso do fio dental?</label>
                                                    <Textarea rows="2"
                                                        id="pediatric-floss"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.flossUse"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="first-dentist-visit" class="app-field-label">É a primeira vez que vem ao dentista?</label>
                                                    <Select
                                                        id="first-dentist-visit"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.firstDentistVisit"
                                                        :options="yesNoOptions"
                                                        placeholder="Selecione"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="last-dentist-visit" class="app-field-label">Quando foi a última vez?</label>
                                                    <Textarea rows="2"
                                                        id="last-dentist-visit"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.lastDentistVisit"
                                                        class="w-full"
                                                    />
                                                </div>
                                            </div>

                                            <div class="patient-record-anamnesis-subtitle">Escola/Creche oferece</div>
                                            <div class="patient-record-checkbox-grid">
                                                <label class="patient-record-checkbox-item">
                                                    <Checkbox v-model="currentClinicalRecord.pediatricAnamnesis.schoolServices.medicalCare" binary />
                                                    Assistência médica
                                                </label>
                                                <label class="patient-record-checkbox-item">
                                                    <Checkbox v-model="currentClinicalRecord.pediatricAnamnesis.schoolServices.dentalCare" binary />
                                                    Assistência odontológica
                                                </label>
                                                <label class="patient-record-checkbox-item">
                                                    <Checkbox v-model="currentClinicalRecord.pediatricAnamnesis.schoolServices.food" binary />
                                                    Alimentação
                                                </label>
                                            </div>
                                        </div>

                                        <div class="patient-record-anamnesis-section">
                                            <div class="patient-record-anamnesis-section-title">
                                                <h4>Questionário de Saúde</h4>
                                                <span>Modelo pediátrico</span>
                                            </div>

                                            <div class="patient-record-question-list">
                                                <div
                                                    v-for="question in pediatricHealthQuestions"
                                                    :key="question.key"
                                                    class="patient-record-question"
                                                >
                                                    <label :for="getQuestionInputId('pediatric', question.key)" class="patient-record-question-label">
                                                        <strong>{{ question.number }}</strong>
                                                        {{ question.text }}
                                                    </label>
                                                    <div class="patient-record-question-fields">
                                                        <Select
                                                            :id="getQuestionInputId('pediatric', question.key)"
                                                            :modelValue="getPediatricQuestionResponse(question.key).answer"
                                                            @update:modelValue="updatePediatricQuestionAnswer(question.key, $event)"
                                                            :options="question.answerOptions ?? yesNoOptions"
                                                            placeholder="Selecione"
                                                            class="patient-record-question-select"
                                                        />
                                                        <Textarea rows="2"
                                                            v-if="question.detailLabel"
                                                            :modelValue="getPediatricQuestionResponse(question.key).details"
                                                            @update:modelValue="updatePediatricQuestionDetails(question.key, $event)"
                                                            :placeholder="question.detailLabel"
                                                            :aria-label="question.text + ' — ' + question.detailLabel"
                                                            class="patient-record-question-detail"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </section>
                            </div>
                        </TabPanel>

                        <TabPanel value="exams" class="patient-record-tab-panel">
                            <div class="patient-record-exams-layout">
                                <section class="patient-record-upload-panel">
                                    <div class="patient-record-section-header">
                                        <div>
                                            <h3>Exames</h3>
                                            <p>{{ examsLoading ? 'Carregando...' : `${exams.length} anexo(s)` }}</p>
                                        </div>
                                        <Button
                                            icon="pi pi-paperclip"
                                            label="Anexar"
                                            :loading="uploadingExams"
                                            :disabled="examsLoading || !selectedPatient.id"
                                            @click="openExamFilePicker"
                                        />
                                    </div>

                                    <input
                                        ref="examInput"
                                        type="file"
                                        class="hidden"
                                        accept="image/*,application/pdf"
                                        multiple
                                        @change="onExamFilesSelected"
                                    />

                                    <div class="app-form-grid">
                                        <div class="app-field col-span-12 md:col-span-4">
                                            <label for="exam-type" class="app-field-label">Tipo de exame</label>
                                            <Select
                                                id="exam-type"
                                                v-model="examDraft.type"
                                                :options="examTypeOptions"
                                                optionLabel="label"
                                                optionValue="value"
                                                class="w-full"
                                            />
                                        </div>
                                        <div class="app-field col-span-12 md:col-span-4">
                                            <label for="exam-date" class="app-field-label">Data do exame</label>
                                            <InputText
                                                id="exam-date"
                                                v-model="examDraft.date"
                                                type="date"
                                                :max="getTodayInputDate()"
                                                class="w-full"
                                            />
                                        </div>
                                        <div class="app-field col-span-12 md:col-span-4">
                                            <label for="exam-notes" class="app-field-label">Observações</label>
                                            <InputText
                                                id="exam-notes"
                                                v-model="examDraft.notes"
                                                maxlength="500"
                                                class="w-full"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div v-if="examsLoading" class="patient-record-empty-panel patient-record-exams-empty">
                                    <i class="pi pi-spin pi-spinner" />
                                    <span>Carregando exames...</span>
                                </div>

                                <div v-else-if="examsError" class="patient-record-empty-panel patient-record-exams-empty">
                                    <i class="pi pi-exclamation-circle" />
                                    <span>{{ examsError }}</span>
                                    <Button label="Tentar novamente" icon="pi pi-refresh" size="small" text @click="reloadExams" />
                                </div>

                                <div v-else-if="exams.length" class="patient-record-exam-grid">
                                    <article
                                        v-for="exam in exams"
                                        :key="exam.id"
                                        class="patient-record-exam-card"
                                    >
                                        <button
                                            type="button"
                                            class="patient-record-exam-preview"
                                            :aria-label="`Visualizar ${exam.fileName}`"
                                            @click="openExamAttachment(exam)"
                                        >
                                            <img
                                                v-if="thumbnails[exam.id]"
                                                :src="thumbnails[exam.id]"
                                                :alt="exam.fileName"
                                            />
                                            <i v-else :class="['pi', getExamFileIcon(exam)]" />
                                        </button>

                                        <div class="patient-record-exam-info">
                                            <span>{{ getExamTypeLabel(exam.type) }}</span>
                                            <h4>{{ exam.fileName }}</h4>
                                            <p>{{ formatDate(exam.date) }} · {{ formatFileSize(exam.size) }}</p>
                                            <small v-if="exam.notes">{{ exam.notes }}</small>
                                        </div>

                                        <div class="patient-record-exam-actions">
                                            <Button
                                                icon="pi pi-eye"
                                                rounded
                                                outlined
                                                size="small"
                                                aria-label="Visualizar exame"
                                                title="Visualizar exame"
                                                :loading="openingExamId === exam.id"
                                                @click="openExamAttachment(exam)"
                                            />
                                            <Button
                                                icon="pi pi-trash"
                                                rounded
                                                outlined
                                                severity="danger"
                                                size="small"
                                                aria-label="Remover exame"
                                                title="Remover exame"
                                                @click="examToRemove = exam"
                                            />
                                        </div>
                                    </article>
                                </div>

                                <div v-else class="patient-record-empty-panel patient-record-exams-empty">
                                    <i class="pi pi-file-plus" />
                                    <span>Nenhum exame anexado.</span>
                                </div>
                            </div>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </template>

            <div v-else class="patient-record-empty-state">
                <div class="patient-record-empty-card">
                    <div class="patient-record-empty-icon">
                        <i class="pi pi-id-card" />
                    </div>
                    <h2>Selecione um paciente</h2>
                    <p>Escolha um paciente cadastrado para visualizar os dados do prontuário.</p>
                    <Button
                        icon="pi pi-search"
                        label="Selecionar paciente"
                        class="!bg-[var(--p-primary-500)] hover:!bg-[var(--p-primary-600)] !border-none !px-4 !py-2 !font-semibold !text-[var(--p-surface-0)] transition-all h-9 flex items-center !rounded-lg shadow-md"
                        @click="openPatientDialog"
                    />
                </div>
            </div>
        </div>
    </AppLayout>

    <Dialog :visible="!!examToRemove" @update:visible="value => { if (!value && !removingExam) examToRemove = null; }" header="Remover exame" modal :draggable="false" :closable="!removingExam" class="app-dialog" :style="{ width: '450px' }">
        <div class="app-confirm-body">
            <i class="pi pi-exclamation-triangle app-confirm-icon" aria-hidden="true" />
            <div class="app-dialog-section">
                <span v-if="examToRemove">Deseja remover o exame <b>{{ examToRemove.fileName }}</b> do prontuário?</span>
            </div>
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text :disabled="removingExam" @click="examToRemove = null" />
            <Button label="Remover" icon="pi pi-trash" severity="danger" :loading="removingExam" @click="confirmRemoveExam" />
        </template>
    </Dialog>

    <Dialog v-model:visible="healthAlertVisible" modal :draggable="false" header="Alertas de saúde do paciente" class="app-dialog" :style="{ width: '640px', maxWidth: '95vw' }">
        <div class="app-dialog-body app-dialog-section" v-if="selectedPatient">
            <div class="patient-record-health-alert-heading">
                <i class="pi pi-exclamation-triangle" aria-hidden="true" />
                <div><strong>{{ selectedPatient.name }}</strong><p>Condições assinaladas como “Sim” na anamnese. Revise estas informações antes do atendimento.</p></div>
            </div>
            <ul class="patient-record-health-alert-list">
                <li v-for="alert in patientHealthAlerts" :key="alert.key">
                    <strong>{{ alert.label }}</strong><small>Modelo {{ alert.source.toLowerCase() }}</small>
                    <p v-if="alert.details.trim()">{{ alert.details }}</p>
                </li>
            </ul>
        </div>
        <template #footer>
            <Button label="Ver anamnese" icon="pi pi-clipboard" outlined @click="activeTab = 'anamnesis'; healthAlertVisible = false" />
            <Button label="Entendi" icon="pi pi-check" @click="healthAlertVisible = false" />
        </template>
    </Dialog>

    <Dialog :draggable="false"
        v-model:visible="patientDialogVisible"
        :style="{ width: '1120px' }"
        header="Selecionar Paciente"
        :modal="true"
        class="app-dialog p-fluid"
    >
        <div class="app-dialog-body app-dialog-section">
            <AppTableToolbar
                v-model="patientFilters.global.value"
                placeholder="Pesquisar pacientes"
                :has-filters="Object.values(patientFilters).some(filter => !!filter.value)"
                @clear="Object.values(patientFilters).forEach(filter => filter.value = null)"
            />

            <div class="patient-record-lazy-table-wrapper" @scroll.passive="onPatientTableScroll">
                <DataTable
                    v-model:filters="patientFilters"
                    v-model:selection="patientDialogSelection"
                    @row-contextmenu="event => { event.originalEvent.preventDefault(); patientDialogSelection = event.data; }"
                    :value="visiblePatientOptions"
                    :loading="loadingPatients"
                    class="app-table patient-record-patient-table"
                    dataKey="recordKey"
                    filterDisplay="row"
                    :globalFilterFields="['displayId', 'name', 'cpf', 'mobilePhone', 'email']"
                    selectionMode="single"
                    :metaKeySelection="false"
                >
                    <template #empty><AppEmptyState title="Nenhum paciente encontrado." /></template>

                    <template #loading>
                        <div class="text-center py-8 text-[var(--p-surface-500)] font-medium flex items-center justify-center gap-3">
                            <i class="pi pi-spin pi-spinner text-xl"></i>
                            Carregando pacientes...
                        </div>
                    </template>

                    <Column field="displayId" header="ID Paciente" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" aria-label="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="name" header="Nome do Paciente" :showFilterMenu="false">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Nome" aria-label="Buscar Nome" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="cpf" header="CPF" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar CPF" aria-label="Buscar CPF" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="mobilePhone" header="Celular" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Celular" aria-label="Buscar Celular" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>
                </DataTable>

                <div v-if="hasMorePatientOptions" class="patient-record-lazy-loader">
                    <i class="pi pi-spin pi-spinner" />
                    Carregando mais pacientes...
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Fechar" icon="pi pi-times" text @click="patientDialogVisible = false" />
            <Button
                label="Selecionar"
                icon="pi pi-check"
                :disabled="!patientDialogSelection"
                @click="confirmPatientSelection"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import axios from 'axios';
import { getClinicalHealthAlerts } from '../../infrastructure/services/ClinicalHealthAlerts';
import AppEmptyState from '../components/AppEmptyState.vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import AppTableToolbar from '../components/AppTableToolbar.vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import AppLayout from '../components/AppLayout.vue';
import { getApiErrorMessage } from '../../infrastructure/http/api';
import { getPatientServiceErrorMessage, PatientService } from '../../infrastructure/services/PatientService';
import type { ApiPatient } from '../../infrastructure/services/PatientService';
import { AnamnesisService } from '../../infrastructure/services/AnamnesisService';
import type { AnamnesisInput, ApiAnamnesis, ApiHealthAnswer, ApiResponses } from '../../infrastructure/services/AnamnesisService';
import { EXAM_TYPE_LABELS, ExamService, validateExamFiles } from '../../infrastructure/services/ExamService';
import type { ApiExam, ApiExamType } from '../../infrastructure/services/ExamService';
import { AppointmentService } from '../../infrastructure/services/AppointmentService';
import type { ApiAppointment, ApiAppointmentStatus } from '../../infrastructure/services/AppointmentService';

type RecordTab = 'personal' | 'anamnesis' | 'exams';
type AttendanceStatus = 'Realizado' | 'Confirmado' | 'Pendente' | 'Cancelado';
type AnamnesisType = 'adult' | 'pediatric';
type HealthAnswer = '' | 'Sim' | 'Não' | 'Não sei' | 'Pouco' | 'Peito' | 'Mamadeira';

interface PatientOption {
    id: number | null;
    recordKey: string;
    displayId: string;
    status: string;
    name: string;
    cpf: string;
    birthDate: string;
    age: number | null;
    gender: string;
    responsibleName: string;
    address: string;
    addressNumber: string;
    city: string;
    homePhone: string;
    mobilePhone: string;
    profession: string;
    workMobilePhone: string;
    email: string;
}

interface AttendanceHistoryItem {
    id: number;
    date: string;
    status: AttendanceStatus;
    professional: string;
    procedures: string[];
    notes: string;
}

interface AnamnesisQuestion {
    key: string;
    number: string;
    text: string;
    answerOptions?: HealthAnswer[];
    detailLabel?: string;
}

interface AnamnesisQuestionResponse {
    answer: HealthAnswer;
    details: string;
}

interface AdultAnamnesis {
    mainComplaint: string;
    brushingFrequency: string;
    flossUse: string;
    responses: Record<string, AnamnesisQuestionResponse>;
}

interface PediatricAnamnesis {
    mainComplaint: string;
    siblingsCount: string;
    mainCaregiver: string;
    preferredActivity: string;
    attends: {
        school: boolean;
        daycare: boolean;
        afterSchool: boolean;
    };
    schoolPeriod: string;
    brushing: string;
    brushingFrequency: string;
    flossUse: string;
    schoolServices: {
        medicalCare: boolean;
        dentalCare: boolean;
        food: boolean;
    };
    firstDentistVisit: HealthAnswer;
    lastDentistVisit: string;
    responses: Record<string, AnamnesisQuestionResponse>;
}

interface PatientClinicalRecord {
    selectedAnamnesisType: AnamnesisType;
    adultAnamnesis: AdultAnamnesis;
    pediatricAnamnesis: PediatricAnamnesis;
}

interface AnamnesisMeta {
    id: number | null;
    updatedAt: string | null;
    updatedByName: string | null;
}

interface ExamDraft {
    type: ApiExamType;
    date: string;
    notes: string;
}

const toast = useToast();
const patientDialogVisible = ref(false);
const healthAlertVisible = ref(false);
const loadingPatients = ref(false);
const patientOptions = ref<PatientOption[]>([]);
const patientLazyBatchSize = 12;
const visiblePatientCount = ref(patientLazyBatchSize);
const patientDialogSelection = ref<PatientOption | null>(null);
const selectedPatient = ref<PatientOption | null>(null);
const activeTab = ref<RecordTab>('personal');

// Estado do prontuário do paciente selecionado (carregado da API a cada seleção).
const currentClinicalRecord = ref<PatientClinicalRecord | null>(null);
const anamnesisMeta = ref<AnamnesisMeta | null>(null);
const anamnesisLoading = ref(false);
const anamnesisError = ref('');
const savingAnamnesis = ref(false);
const exams = ref<ApiExam[]>([]);
const examsLoading = ref(false);
const examsError = ref('');
const uploadingExams = ref(false);
const thumbnails = ref<Record<number, string>>({});
const openingExamId = ref<number | null>(null);
const examToRemove = ref<ApiExam | null>(null);
const removingExam = ref(false);
const attendances = ref<AttendanceHistoryItem[]>([]);
const historyLoading = ref(false);
const historyError = ref('');
let loadController: AbortController | null = null;

const examInput = ref<HTMLInputElement | null>(null);
const examTypeOptions = (Object.entries(EXAM_TYPE_LABELS) as [ApiExamType, string][]).map(([value, label]) => ({ label, value }));
const examDraft = ref<ExamDraft>({
    type: 'RADIOGRAFIA_PANORAMICA',
    date: getTodayInputDate(),
    notes: ''
});

const patientFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    displayId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    cpf: { value: null, matchMode: FilterMatchMode.CONTAINS },
    mobilePhone: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const anamnesisTypeOptions: { label: string; value: AnamnesisType }[] = [
    { label: 'Adulto', value: 'adult' },
    { label: 'Pediátrica', value: 'pediatric' }
];
const healthAnswerOptions: HealthAnswer[] = ['Sim', 'Não', 'Não sei'];
const yesNoOptions: HealthAnswer[] = ['Sim', 'Não'];
const pediatricAwareOptions: HealthAnswer[] = ['Sim', 'Não', 'Não sei'];

const adultHealthQuestions: AnamnesisQuestion[] = [
    { key: 'currentHealthProblem', number: '01', text: 'Apresenta-se com algum problema de saúde?', detailLabel: 'Qual?' },
    { key: 'medicalTreatment', number: '02', text: 'Está em tratamento médico atualmente?', detailLabel: 'Qual médico?' },
    { key: 'currentMedication', number: '03', text: 'Está tomando algum medicamento?', detailLabel: 'Qual?' },
    { key: 'seriousPastDisease', number: '04', text: 'Já teve alguma doença séria no passado?', detailLabel: 'Qual?' },
    { key: 'hospitalizedOrOperated', number: '05', text: 'Já foi hospitalizado e/ou operado?', detailLabel: 'Qual o motivo? Quando (ano)?' },
    { key: 'smoker', number: '06', text: 'Você é fumante?', detailLabel: 'Em caso afirmativo, quantos cigarros fuma por dia?' },
    { key: 'cardiovascularProblem', number: '07', text: 'Tem ou teve algum problema cardiovascular?', detailLabel: 'Qual?' },
    { key: 'breathOrChestPain', number: '08', text: 'Sente falta de ar ou dor no peito após esforços leves?' },
    { key: 'hypertension', number: '09', text: 'É hipertenso? Tem pressão alta?' },
    { key: 'frequentFainting', number: '10', text: 'Apresenta desmaios frequentes?' },
    { key: 'epilepsy', number: '11', text: 'Tem disritmia/epilepsia?' },
    { key: 'allergy', number: '12', text: 'Apresenta alergia a alguma medicação ou produto?', detailLabel: 'Qual?' },
    { key: 'dentalAnesthesia', number: '13', text: 'Já se submeteu a alguma anestesia dentária?' },
    { key: 'asthmaOrRhinitis', number: '14', text: 'Tem asma ou rinite alérgica?' },
    { key: 'diabetes', number: '15', text: 'É diabético?' },
    { key: 'thirstOrHunger', number: '16', text: 'Sente sede ou fome na maior parte do tempo?' },
    { key: 'slowHealing', number: '17', text: 'As feridas demoram para cicatrizar?' },
    { key: 'abnormalBleeding', number: '18', text: 'Já teve sangramento anormal após extração dentária?' },
    { key: 'bloodProblem', number: '19', text: 'Apresenta algum problema de sangue?', detailLabel: 'Qual?' },
    { key: 'mouthLesionTreatment', number: '20', text: 'Já se submeteu a cirurgia ou radioterapia devido a lesão na boca?', answerOptions: yesNoOptions },
    { key: 'nervous', number: '21', text: 'Considera-se excessivamente nervoso?' },
    { key: 'swallowingDifficulty', number: '22', text: 'Tem dificuldade em engolir?' },
    { key: 'skinDisease', number: '23', text: 'Tem alguma doença de pele?' },
    { key: 'frequentSoreThroat', number: '24', text: 'Sente dores de garganta frequentemente?' },
    { key: 'mouthBreathing', number: '25', text: 'Costuma respirar pela boca?' },
    { key: 'toothAppearanceComplaint', number: '26', text: 'Tem alguma queixa com relação à aparência dos dentes?', answerOptions: yesNoOptions, detailLabel: 'Qual?' },
    { key: 'dentalTreatmentAnxiety', number: '27', text: 'Fica apreensivo ao submeter-se a tratamento dentário?' },
    { key: 'seriousDentalTreatmentProblem', number: '28', text: 'Já teve algum problema sério relacionado a tratamento dentário?', answerOptions: yesNoOptions, detailLabel: 'Qual?' },
    { key: 'gumBleeding', number: '29', text: 'Sua gengiva sangra facilmente?' },
    { key: 'bruxism', number: '30', text: 'Range ou aperta os dentes à noite?' }
];

const adultWomenQuestions: AnamnesisQuestion[] = [
    { key: 'menstrualProblems', number: '32', text: 'Tem problemas associados ao período menstrual?' },
    { key: 'contraceptiveUse', number: '33', text: 'Faz uso de contraceptivo?' },
    { key: 'pregnant', number: '34', text: 'Está grávida?' }
];

const pediatricHealthQuestions: AnamnesisQuestion[] = [
    { key: 'prenatalCare', number: '1', text: 'Gravidez: Pré-natal com médico', answerOptions: yesNoOptions, detailLabel: 'Usou algum medicamento?' },
    { key: 'congenitalAnomalies', number: '2', text: 'Anomalias congênitas?', answerOptions: yesNoOptions, detailLabel: 'Qual?' },
    { key: 'childHealthProblems', number: '3', text: 'Problemas com a saúde da criança?', answerOptions: yesNoOptions, detailLabel: 'Qual?' },
    { key: 'hospitalized', number: '4', text: 'Já esteve hospitalizado?', answerOptions: yesNoOptions, detailLabel: 'Quando?' },
    { key: 'surgery', number: '5', text: 'Já se submeteu a alguma cirurgia?', answerOptions: yesNoOptions, detailLabel: 'Qual?' },
    { key: 'currentMedication', number: '6', text: 'Faz uso de alguma medicação?', answerOptions: yesNoOptions, detailLabel: 'Qual?' },
    { key: 'anesthesia', number: '7', text: 'Já tomou anestesia?', answerOptions: pediatricAwareOptions },
    { key: 'allergy', number: '8', text: 'Tem alguma alergia?', answerOptions: pediatricAwareOptions, detailLabel: 'Qual?' },
    { key: 'initialFeeding', number: '9', text: 'Alimentação inicial?', answerOptions: ['Peito', 'Mamadeira'], detailLabel: 'Qual idade parou?' },
    { key: 'accessoryDevices', number: '10', text: 'Fez ou faz uso de dispositivos acessórios?', detailLabel: 'Bico, mamadeira, dedo ou outro' },
    { key: 'fruitsAndVegetables', number: '11', text: 'Alimenta-se de frutas e verduras?', answerOptions: ['Sim', 'Não', 'Pouco'] }
];

const adultAllQuestions = [...adultHealthQuestions, ...adultWomenQuestions];

const anamnesisReady = computed(() => !!currentClinicalRecord.value && !anamnesisLoading.value && !anamnesisError.value);
const patientHealthAlerts = computed(() => anamnesisReady.value ? getClinicalHealthAlerts(currentClinicalRecord.value) : []);
watch(patientHealthAlerts, alerts => { if (!alerts.length) healthAlertVisible.value = false; });
const currentAnamnesisTypeLabel = computed(() => {
    const selectedType = currentClinicalRecord.value?.selectedAnamnesisType ?? 'adult';
    return selectedType === 'adult' ? 'Modelo adulto' : 'Modelo pediátrico';
});
const anamnesisStatusLabel = computed(() => {
    if (anamnesisLoading.value) return 'Carregando...';
    const meta = anamnesisMeta.value;
    if (!meta?.id) return `${currentAnamnesisTypeLabel.value} · Anamnese ainda não preenchida`;
    const updatedAt = meta.updatedAt ? ` em ${formatDateTime(meta.updatedAt)}` : '';
    const updatedBy = meta.updatedByName ? ` por ${meta.updatedByName}` : '';
    return `${currentAnamnesisTypeLabel.value} · Última atualização${updatedAt}${updatedBy}`;
});

const getFilterValue = (field: keyof typeof patientFilters.value) => String(patientFilters.value[field].value ?? '').trim().toLowerCase();

const matchesFilter = (value: string, filter: string) => {
    return !filter || value.toLowerCase().includes(filter);
};

const filteredPatientOptions = computed(() => {
    const globalFilter = getFilterValue('global');
    const displayIdFilter = getFilterValue('displayId');
    const nameFilter = getFilterValue('name');
    const cpfFilter = getFilterValue('cpf');
    const mobilePhoneFilter = getFilterValue('mobilePhone');

    return patientOptions.value.filter(patient => {
        const globalFields = [patient.displayId, patient.name, patient.cpf, patient.mobilePhone, patient.email];
        const matchesGlobal = !globalFilter || globalFields.some(field => field.toLowerCase().includes(globalFilter));

        return matchesGlobal &&
            matchesFilter(patient.displayId, displayIdFilter) &&
            matchesFilter(patient.name, nameFilter) &&
            matchesFilter(patient.cpf, cpfFilter) &&
            matchesFilter(patient.mobilePhone, mobilePhoneFilter);
    });
});

const visiblePatientOptions = computed(() => filteredPatientOptions.value.slice(0, visiblePatientCount.value));
const hasMorePatientOptions = computed(() => visiblePatientCount.value < filteredPatientOptions.value.length);

const selectedPatientAttendances = computed(() => attendances.value);

const patientInitials = computed(() => {
    const words = selectedPatient.value?.name.trim().split(/\s+/).filter(Boolean) ?? [];
    const initials = words.slice(0, 2).map(word => word[0]?.toUpperCase()).join('');

    return initials || 'P';
});

const primaryPatientPhone = computed(() => {
    if (!selectedPatient.value) return '';

    return selectedPatient.value.mobilePhone || selectedPatient.value.homePhone || selectedPatient.value.workMobilePhone;
});

const patientAddress = computed(() => {
    if (!selectedPatient.value) return '';

    const street = [selectedPatient.value.address, selectedPatient.value.addressNumber]
        .filter(Boolean)
        .join(', ');
    const city = selectedPatient.value.city.trim();

    return [street, city].filter(Boolean).join(' - ');
});

function getTodayInputDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

const createQuestionResponses = (questions: AnamnesisQuestion[]) => {
    return questions.reduce<Record<string, AnamnesisQuestionResponse>>((responses, question) => {
        responses[question.key] = {
            answer: '',
            details: ''
        };

        return responses;
    }, {});
};

function getEmptyAdultAnamnesis(): AdultAnamnesis {
    return {
        mainComplaint: '',
        brushingFrequency: '',
        flossUse: '',
        responses: createQuestionResponses(adultAllQuestions)
    };
}

function getEmptyPediatricAnamnesis(): PediatricAnamnesis {
    return {
        mainComplaint: '',
        siblingsCount: '',
        mainCaregiver: '',
        preferredActivity: '',
        attends: {
            school: false,
            daycare: false,
            afterSchool: false
        },
        schoolPeriod: '',
        brushing: '',
        brushingFrequency: '',
        flossUse: '',
        schoolServices: {
            medicalCare: false,
            dentalCare: false,
            food: false
        },
        firstDentistVisit: '',
        lastDentistVisit: '',
        responses: createQuestionResponses(pediatricHealthQuestions)
    };
}

function getEmptyClinicalRecord(): PatientClinicalRecord {
    return {
        selectedAnamnesisType: 'adult',
        adultAnamnesis: getEmptyAdultAnamnesis(),
        pediatricAnamnesis: getEmptyPediatricAnamnesis()
    };
}

// ---- Mapeamento API <-> tela (anamnese) ----
const answerFromApi: Record<ApiHealthAnswer, Exclude<HealthAnswer, ''>> = {
    SIM: 'Sim',
    NAO: 'Não',
    NAO_SEI: 'Não sei',
    POUCO: 'Pouco',
    PEITO: 'Peito',
    MAMADEIRA: 'Mamadeira'
};
const answerToApi = Object.fromEntries(
    Object.entries(answerFromApi).map(([api, view]) => [view, api])
) as Record<Exclude<HealthAnswer, ''>, ApiHealthAnswer>;

const toViewAnswer = (answer?: ApiHealthAnswer | null): HealthAnswer => (answer && answerFromApi[answer]) || '';
const toApiAnswer = (answer: HealthAnswer): ApiHealthAnswer | null => answer ? answerToApi[answer] ?? null : null;

const toViewResponses = (questions: AnamnesisQuestion[], responses?: ApiResponses | null) => {
    const result = createQuestionResponses(questions);
    questions.forEach(question => {
        const response = responses?.[question.key];
        if (response) {
            result[question.key] = { answer: toViewAnswer(response.answer), details: response.details ?? '' };
        }
    });
    return result;
};

const toApiResponses = (responses: Record<string, AnamnesisQuestionResponse>): ApiResponses => {
    return Object.fromEntries(Object.entries(responses).map(([key, response]) => [
        key,
        { answer: toApiAnswer(response.answer), details: response.details ?? '' }
    ]));
};

const toClinicalRecord = (anamnesis: ApiAnamnesis): PatientClinicalRecord => {
    const adult = anamnesis.adult;
    const pediatric = anamnesis.pediatric;

    return {
        selectedAnamnesisType: anamnesis.selectedType === 'PEDIATRICO' ? 'pediatric' : 'adult',
        adultAnamnesis: {
            mainComplaint: adult?.mainComplaint ?? '',
            brushingFrequency: adult?.brushingFrequency ?? '',
            flossUse: adult?.flossUse ?? '',
            responses: toViewResponses(adultAllQuestions, adult?.responses)
        },
        pediatricAnamnesis: {
            mainComplaint: pediatric?.mainComplaint ?? '',
            siblingsCount: pediatric?.siblingsCount ?? '',
            mainCaregiver: pediatric?.mainCaregiver ?? '',
            preferredActivity: pediatric?.preferredActivity ?? '',
            attends: {
                school: !!pediatric?.attends?.school,
                daycare: !!pediatric?.attends?.daycare,
                afterSchool: !!pediatric?.attends?.afterSchool
            },
            schoolPeriod: pediatric?.schoolPeriod ?? '',
            brushing: pediatric?.brushing ?? '',
            brushingFrequency: pediatric?.brushingFrequency ?? '',
            flossUse: pediatric?.flossUse ?? '',
            schoolServices: {
                medicalCare: !!pediatric?.schoolServices?.medicalCare,
                dentalCare: !!pediatric?.schoolServices?.dentalCare,
                food: !!pediatric?.schoolServices?.food
            },
            firstDentistVisit: toViewAnswer(pediatric?.firstDentistVisit),
            lastDentistVisit: pediatric?.lastDentistVisit ?? '',
            responses: toViewResponses(pediatricHealthQuestions, pediatric?.responses)
        }
    };
};

// O save substitui a anamnese inteira: sempre envia o estado completo dos dois modelos.
const toAnamnesisInput = (patientId: number, record: PatientClinicalRecord): AnamnesisInput => {
    const adult = record.adultAnamnesis;
    const pediatric = record.pediatricAnamnesis;
    const firstDentistVisit = toApiAnswer(pediatric.firstDentistVisit);

    return {
        patientId,
        selectedType: record.selectedAnamnesisType === 'pediatric' ? 'PEDIATRICO' : 'ADULTO',
        adult: {
            mainComplaint: adult.mainComplaint,
            brushingFrequency: adult.brushingFrequency,
            flossUse: adult.flossUse,
            responses: toApiResponses(adult.responses)
        },
        pediatric: {
            mainComplaint: pediatric.mainComplaint,
            siblingsCount: pediatric.siblingsCount,
            mainCaregiver: pediatric.mainCaregiver,
            preferredActivity: pediatric.preferredActivity,
            attends: { ...pediatric.attends },
            schoolPeriod: pediatric.schoolPeriod,
            brushing: pediatric.brushing,
            brushingFrequency: pediatric.brushingFrequency,
            flossUse: pediatric.flossUse,
            schoolServices: { ...pediatric.schoolServices },
            firstDentistVisit: firstDentistVisit === 'SIM' || firstDentistVisit === 'NAO' ? firstDentistVisit : null,
            lastDentistVisit: pediatric.lastDentistVisit,
            responses: toApiResponses(pediatric.responses)
        }
    };
};

const applyAnamnesis = (anamnesis: ApiAnamnesis) => {
    currentClinicalRecord.value = toClinicalRecord(anamnesis);
    anamnesisMeta.value = {
        id: anamnesis.id,
        updatedAt: anamnesis.updatedAt,
        updatedByName: anamnesis.updatedByName
    };
};

// ---- Mapeamento API -> tela (histórico) ----
const attendanceStatusLabels: Record<ApiAppointmentStatus, AttendanceStatus> = {
    PENDENTE: 'Pendente',
    CONFIRMADO: 'Confirmado',
    CANCELADO: 'Cancelado',
    REALIZADO: 'Realizado'
};

const toAttendance = (appointment: ApiAppointment): AttendanceHistoryItem => ({
    id: appointment.id,
    date: appointment.start,
    status: attendanceStatusLabels[appointment.status] ?? 'Pendente',
    professional: appointment.professionalName || '—',
    procedures: (appointment.procedures ?? []).map(procedure => procedure.description).filter(Boolean),
    notes: appointment.notes ?? ''
});

const toAttendances = (appointments: ApiAppointment[]) => appointments
    .map(toAttendance)
    .sort((first, second) => second.date.localeCompare(first.date));

// ---- Formatação ----
const normalizeDigits = (value?: string | number | null) => String(value ?? '').replace(/\D/g, '');

const formatDisplayId = (id?: number | null) => id ? `#${id.toString().padStart(7, '0')}` : '';

const formatCpf = (value?: string | null) => {
    const digits = normalizeDigits(value);
    if (digits.length !== 11) return value ?? '';

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const statusFromCode = (statusCode?: number | null) => statusCode === 1 ? 'Inativo' : 'Ativo';

const calculateAge = (birthDate?: string | null) => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return null;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
    }

    return age;
};

const formatAge = (age?: number | null) => age == null ? '-' : `${age} anos`;

const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';

    const [year, month, day] = dateString.split('T')[0]?.split('-') ?? [];
    if (!year || !month || !day) return dateString;

    return `${day}/${month}/${year}`;
};

const formatDateTime = (dateString: string) => {
    const time = dateString.split('T')[1]?.slice(0, 5);
    return time ? `${formatDate(dateString)} ${time}` : formatDate(dateString);
};

const formatShortDate = (dateString: string) => {
    const formattedDate = formatDate(dateString);
    if (!formattedDate) return '-';

    const [day, month] = formattedDate.split('/');
    return `${day}/${month}`;
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatFileSize = (size: number) => {
    if (size < 1024 * 1024) {
        return `${Math.max(1, Math.round(size / 1024))} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getQuestionInputId = (type: AnamnesisType, key: string) => `${type}-anamnesis-${key}`;

const getEmptyQuestionResponse = (): AnamnesisQuestionResponse => ({
    answer: '',
    details: ''
});

const normalizeHealthAnswer = (value: unknown): HealthAnswer => {
    return ['', 'Sim', 'Não', 'Não sei', 'Pouco', 'Peito', 'Mamadeira'].includes(String(value))
        ? String(value) as HealthAnswer
        : '';
};

const getAdultQuestionResponse = (key: string) => {
    const record = currentClinicalRecord.value;
    if (!record) return getEmptyQuestionResponse();

    if (!record.adultAnamnesis.responses[key]) {
        record.adultAnamnesis.responses[key] = getEmptyQuestionResponse();
    }

    return record.adultAnamnesis.responses[key];
};

const getPediatricQuestionResponse = (key: string) => {
    const record = currentClinicalRecord.value;
    if (!record) return getEmptyQuestionResponse();

    if (!record.pediatricAnamnesis.responses[key]) {
        record.pediatricAnamnesis.responses[key] = getEmptyQuestionResponse();
    }

    return record.pediatricAnamnesis.responses[key];
};

const updateAdultQuestionAnswer = (key: string, value: unknown) => {
    getAdultQuestionResponse(key).answer = normalizeHealthAnswer(value);
};

const updateAdultQuestionDetails = (key: string, value: string | undefined) => {
    getAdultQuestionResponse(key).details = value ?? '';
};

const updatePediatricQuestionAnswer = (key: string, value: unknown) => {
    getPediatricQuestionResponse(key).answer = normalizeHealthAnswer(value);
};

const updatePediatricQuestionDetails = (key: string, value: string | undefined) => {
    getPediatricQuestionResponse(key).details = value ?? '';
};

// ---- Pacientes ----
const getPatientRecordKey = (patient: ApiPatient) => {
    if (patient.id) return `patient-${patient.id}`;

    const document = normalizeDigits(patient.document);
    return document ? `document-${document}` : `patient-${crypto.randomUUID()}`;
};

const toPatientOption = (patient: ApiPatient): PatientOption => ({
    id: patient.id ?? null,
    recordKey: getPatientRecordKey(patient),
    displayId: formatDisplayId(patient.id),
    status: statusFromCode(patient.statusCode),
    name: patient.name ?? '',
    cpf: formatCpf(patient.document),
    birthDate: patient.birthday ?? '',
    age: patient.age ?? calculateAge(patient.birthday),
    gender: patient.sex ?? '',
    responsibleName: patient.responsible ?? '',
    address: patient.address ?? '',
    addressNumber: patient.addressesNumber ?? '',
    city: patient.city ?? '',
    homePhone: patient.homePhoneNumber ?? '',
    mobilePhone: patient.phoneNumber ?? '',
    profession: patient.occupation ?? '',
    workMobilePhone: patient.commercialPhoneNumber ?? '',
    email: patient.email ?? ''
});

const showError = (detail: string) => {
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });
};

const getApiErrorCode = (error: unknown): string | undefined => {
    if (!axios.isAxiosError(error)) return undefined;
    const code = (error.response?.data as { error?: { code?: unknown } } | undefined)?.error?.code;
    return typeof code === 'string' ? code : undefined;
};

const isSelected = (patient: PatientOption) => selectedPatient.value?.recordKey === patient.recordKey;

const loadPatients = async () => {
    loadingPatients.value = true;

    try {
        const patients = await PatientService.list();
        patientOptions.value = patients
            .map(toPatientOption)
            .filter(patient => patient.status !== 'Inativo' && patient.name);
    } catch (error: unknown) {
        showError(getPatientServiceErrorMessage(error));
    } finally {
        loadingPatients.value = false;
    }
};

const openPatientDialog = () => {
    patientDialogVisible.value = true;
    visiblePatientCount.value = patientLazyBatchSize;
    patientDialogSelection.value = selectedPatient.value;

    if (!patientOptions.value.length) {
        void loadPatients();
    }
};

// Paciente removido no backend: avisa, limpa a seleção e recarrega a lista.
const handlePatientNotFound = (message: string) => {
    loadController?.abort();
    releaseThumbnails();
    selectedPatient.value = null;
    currentClinicalRecord.value = null;
    showError(message);
    patientOptions.value = [];
    openPatientDialog();
};

// ---- Carregamento do prontuário ----
const loadAnamnesis = async (patient: PatientOption, signal: AbortSignal) => {
    anamnesisLoading.value = true;
    anamnesisError.value = '';
    try {
        const anamnesis = await AnamnesisService.details(patient.id!, signal);
        if (signal.aborted || !isSelected(patient)) return;
        applyAnamnesis(anamnesis);
        healthAlertVisible.value = patientHealthAlerts.value.length > 0;
    } catch (error: unknown) {
        if (signal.aborted || !isSelected(patient)) return;
        if (getApiErrorCode(error) === 'PATIENT_NOT_FOUND') return handlePatientNotFound(getApiErrorMessage(error));
        anamnesisError.value = getApiErrorMessage(error);
    } finally {
        if (!signal.aborted && isSelected(patient)) anamnesisLoading.value = false;
    }
};

const loadExams = async (patient: PatientOption, signal: AbortSignal) => {
    examsLoading.value = true;
    examsError.value = '';
    try {
        const list = await ExamService.list(patient.id!, signal);
        if (signal.aborted || !isSelected(patient)) return;
        exams.value = list;
        void loadThumbnails(list, signal);
    } catch (error: unknown) {
        if (signal.aborted || !isSelected(patient)) return;
        if (getApiErrorCode(error) === 'PATIENT_NOT_FOUND') return handlePatientNotFound(getApiErrorMessage(error));
        examsError.value = getApiErrorMessage(error);
    } finally {
        if (!signal.aborted && isSelected(patient)) examsLoading.value = false;
    }
};

const loadHistory = async (patient: PatientOption, signal: AbortSignal) => {
    historyLoading.value = true;
    historyError.value = '';
    try {
        const appointments = await AppointmentService.history(patient.id!, signal);
        if (signal.aborted || !isSelected(patient)) return;
        attendances.value = toAttendances(appointments);
    } catch (error: unknown) {
        if (signal.aborted || !isSelected(patient)) return;
        if (getApiErrorCode(error) === 'PATIENT_NOT_FOUND') return handlePatientNotFound(getApiErrorMessage(error));
        historyError.value = getApiErrorMessage(error);
    } finally {
        if (!signal.aborted && isSelected(patient)) historyLoading.value = false;
    }
};

const loadPatientRecord = async (patient: PatientOption) => {
    loadController?.abort();
    releaseThumbnails();
    currentClinicalRecord.value = getEmptyClinicalRecord();
    anamnesisMeta.value = null;
    exams.value = [];
    attendances.value = [];

    if (!patient.id) {
        const message = 'Paciente sem identificador no servidor. Atualize a lista de pacientes.';
        anamnesisError.value = message;
        examsError.value = message;
        historyError.value = message;
        return;
    }

    loadController = new AbortController();
    const { signal } = loadController;

    // Cada aba trata o próprio erro: uma falha nos exames não esconde a anamnese.
    await Promise.allSettled([
        loadAnamnesis(patient, signal),
        loadExams(patient, signal),
        loadHistory(patient, signal)
    ]);
};

const currentSignal = () => loadController?.signal ?? new AbortController().signal;

const reloadAnamnesis = () => {
    if (selectedPatient.value?.id) void loadAnamnesis(selectedPatient.value, currentSignal());
};
const reloadExams = () => {
    if (selectedPatient.value?.id) void loadExams(selectedPatient.value, currentSignal());
};
const reloadHistory = () => {
    if (selectedPatient.value?.id) void loadHistory(selectedPatient.value, currentSignal());
};

const selectPatient = (patient: PatientOption) => {
    selectedPatient.value = patient;
    activeTab.value = 'personal';
    patientDialogVisible.value = false;
    healthAlertVisible.value = false;
    void loadPatientRecord(patient);
};

const confirmPatientSelection = () => {
    if (!patientDialogSelection.value) return;

    selectPatient(patientDialogSelection.value);
};

const onPatientTableScroll = (event: Event) => {
    const target = event.currentTarget as HTMLElement;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceFromBottom <= 48 && hasMorePatientOptions.value) {
        visiblePatientCount.value += patientLazyBatchSize;
    }
};

// ---- Anamnese ----
const saveAnamnesis = async () => {
    const patient = selectedPatient.value;
    const record = currentClinicalRecord.value;
    if (!patient?.id || !record || !anamnesisReady.value || savingAnamnesis.value) return;

    savingAnamnesis.value = true;

    try {
        const saved = await AnamnesisService.save(toAnamnesisInput(patient.id, record));
        if (!isSelected(patient)) return;
        // O servidor normaliza os dados (trim, details descartados): a resposta vira o estado do formulário.
        applyAnamnesis(saved);
        toast.add({
            severity: 'success',
            summary: 'Anamnese salva',
            detail: 'Registro atualizado com sucesso.',
            life: 3000
        });
    } catch (error: unknown) {
        if (!isSelected(patient)) return;
        showError(getApiErrorMessage(error));
        if (getApiErrorCode(error) === 'CONFLICT') reloadAnamnesis();
    } finally {
        savingAnamnesis.value = false;
    }
};

// ---- Exames ----
const getExamTypeLabel = (type: ApiExamType) => EXAM_TYPE_LABELS[type] ?? type;
const isImageAttachment = (exam: ApiExam) => exam.fileType.startsWith('image/');
const getExamFileIcon = (exam: ApiExam) => {
    if (exam.fileType === 'application/pdf') return 'pi-file-pdf';
    return isImageAttachment(exam) ? 'pi-image' : 'pi-file';
};

const releaseThumbnail = (id: number) => {
    const url = thumbnails.value[id];
    if (!url) return;
    URL.revokeObjectURL(url);
    delete thumbnails.value[id];
};

function releaseThumbnails() {
    Object.values(thumbnails.value).forEach(url => URL.revokeObjectURL(url));
    thumbnails.value = {};
}

// Baixa as miniaturas das imagens com no máximo 3 downloads simultâneos.
const loadThumbnails = async (items: ApiExam[], signal: AbortSignal) => {
    const queue = items.filter(exam => isImageAttachment(exam) && !thumbnails.value[exam.id]);
    const worker = async () => {
        while (queue.length && !signal.aborted) {
            const exam = queue.shift()!;
            try {
                const blob = await ExamService.file(exam.id, signal);
                if (signal.aborted || !exams.value.some(item => item.id === exam.id)) continue;
                thumbnails.value[exam.id] = URL.createObjectURL(blob);
            } catch {
                // Sem miniatura: o card continua com o ícone e o arquivo pode ser aberto pelo botão.
            }
        }
    };
    await Promise.all(Array.from({ length: 3 }, worker));
};

const validateExamDraft = () => {
    if (!examDraft.value.type) return 'Selecione o tipo de exame.';
    if (!examDraft.value.date) return 'Informe a data do exame.';
    if (examDraft.value.date > getTodayInputDate()) return 'A data do exame não pode ser futura.';
    if (examDraft.value.notes.trim().length > 500) return 'As observações devem ter até 500 caracteres.';
    return null;
};

const showWarning = (detail: string) => {
    toast.add({ severity: 'warn', summary: 'Arquivo não anexado', detail, life: 4000 });
};

const openExamFilePicker = () => {
    const draftError = validateExamDraft();
    if (draftError) return showWarning(draftError);
    examInput.value?.click();
};

const onExamFilesSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    const patient = selectedPatient.value;
    if (!patient?.id || !files.length || uploadingExams.value) return;

    const validationError = validateExamDraft() ?? validateExamFiles(files);
    if (validationError) return showWarning(validationError);

    uploadingExams.value = true;

    try {
        const created = await ExamService.upload({
            patientId: patient.id,
            type: examDraft.value.type,
            date: examDraft.value.date,
            notes: examDraft.value.notes.trim() || undefined,
            files
        });
        if (!isSelected(patient)) return;

        exams.value = [...[...created].reverse(), ...exams.value];
        void loadThumbnails(created, currentSignal());
        examDraft.value.notes = '';
        toast.add({
            severity: 'success',
            summary: 'Exame anexado',
            detail: `${created.length} arquivo(s) adicionado(s) ao prontuário.`,
            life: 3000
        });
    } catch (error: unknown) {
        if (!isSelected(patient)) return;
        showError(getApiErrorMessage(error));
    } finally {
        uploadingExams.value = false;
    }
};

const openExamAttachment = async (exam: ApiExam) => {
    if (openingExamId.value === exam.id) return;

    const cachedUrl = thumbnails.value[exam.id];
    if (cachedUrl) {
        window.open(cachedUrl, '_blank', 'noopener');
        return;
    }

    // Abre a aba já no clique (evita bloqueio de pop-up) e carrega o arquivo nela depois do download.
    const preview = window.open('', '_blank');
    if (preview) preview.opener = null;
    openingExamId.value = exam.id;

    try {
        const url = URL.createObjectURL(await ExamService.file(exam.id));
        if (preview) preview.location.href = url;
        else window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error: unknown) {
        preview?.close();
        showError(getApiErrorMessage(error));
        if (axios.isAxiosError(error) && error.response?.status === 404) reloadExams();
        else if (error instanceof Error && /não encontrado/i.test(error.message)) reloadExams();
    } finally {
        openingExamId.value = null;
    }
};

const confirmRemoveExam = async () => {
    const exam = examToRemove.value;
    const patient = selectedPatient.value;
    if (!exam || !patient || removingExam.value) return;

    removingExam.value = true;

    try {
        const removed = await ExamService.remove(exam.id);
        if (removed !== true) throw new Error('O servidor não confirmou a remoção do exame.');
        if (isSelected(patient)) {
            exams.value = exams.value.filter(item => item.id !== exam.id);
            releaseThumbnail(exam.id);
        }
        examToRemove.value = null;
        toast.add({ severity: 'success', summary: 'Exame removido', detail: 'Anexo removido do prontuário.', life: 2500 });
    } catch (error: unknown) {
        showError(getApiErrorMessage(error));
        if (getApiErrorCode(error) === 'EXAM_NOT_FOUND') {
            examToRemove.value = null;
            if (isSelected(patient)) {
                exams.value = exams.value.filter(item => item.id !== exam.id);
                releaseThumbnail(exam.id);
                reloadExams();
            }
        }
    } finally {
        removingExam.value = false;
    }
};

const getAttendanceStatusClass = (status: AttendanceStatus) => {
    switch (status) {
        case 'Realizado': return 'patient-record-status-success';
        case 'Confirmado': return 'patient-record-status-info';
        case 'Cancelado': return 'patient-record-status-danger';
        case 'Pendente':
        default:
            return 'patient-record-status-warn';
    }
};

onMounted(() => {
    void loadPatients();
    patientDialogVisible.value = true;
});

watch(patientFilters, () => {
    visiblePatientCount.value = patientLazyBatchSize;
}, { deep: true });

onBeforeUnmount(() => {
    loadController?.abort();
    releaseThumbnails();
});
</script>
