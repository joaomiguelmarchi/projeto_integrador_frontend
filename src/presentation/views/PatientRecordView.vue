<template>
    <AppLayout title="Prontuário">
        <div class="patient-record-page bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
            <template v-if="selectedPatient && currentClinicalRecord">
                <div class="patient-record-summary">
                    <div class="patient-record-summary-main">
                        <div class="patient-record-avatar">{{ patientInitials }}</div>
                        <div class="patient-record-summary-content">
                            <h2>{{ selectedPatient.name }}</h2>
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
                                            <p>{{ selectedPatientAttendances.length }} registro(s)</p>
                                        </div>
                                        <i class="pi pi-history" />
                                    </div>

                                    <div v-if="selectedPatientAttendances.length" class="patient-record-history-list">
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
                                                    <h4>{{ attendance.procedures.join(', ') }}</h4>
                                                    <span :class="['patient-record-status', getAttendanceStatusClass(attendance.status)]">
                                                        {{ attendance.status }}
                                                    </span>
                                                </div>
                                                <p>{{ attendance.notes }}</p>
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
                                            <p>{{ currentAnamnesisTypeLabel }}</p>
                                        </div>
                                        <div class="patient-record-anamnesis-actions">
                                            <Select
                                                v-model="currentClinicalRecord.selectedAnamnesisType"
                                                :options="anamnesisTypeOptions"
                                                optionLabel="label"
                                                optionValue="value"
                                                class="patient-record-anamnesis-type"
                                            />
                                            <Button
                                                icon="pi pi-check"
                                                label="Salvar"
                                                size="small"
                                                @click="saveAnamnesis"
                                            />
                                        </div>
                                    </div>

                                    <template v-if="currentClinicalRecord.selectedAnamnesisType === 'adult'">
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
                                                    autoResize
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
                                                        <InputText
                                                            v-if="question.detailLabel"
                                                            :modelValue="getAdultQuestionResponse(question.key).details"
                                                            @update:modelValue="updateAdultQuestionDetails(question.key, $event)"
                                                            :placeholder="question.detailLabel"
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
                                                    <InputText
                                                        id="adult-brushing-frequency"
                                                        v-model="currentClinicalRecord.adultAnamnesis.brushingFrequency"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-6">
                                                    <label for="adult-floss-use" class="app-field-label">Usa fio dental?</label>
                                                    <InputText
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
                                                        autoResize
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
                                                    <InputText
                                                        id="main-caregiver"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.mainCaregiver"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12">
                                                    <label for="preferred-activity" class="app-field-label">Qual atividade preferida da criança?</label>
                                                    <InputText
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
                                                    <InputText
                                                        id="school-period"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.schoolPeriod"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="pediatric-brushing" class="app-field-label">Realiza escovação?</label>
                                                    <InputText
                                                        id="pediatric-brushing"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.brushing"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="pediatric-brushing-frequency" class="app-field-label">Quantas vezes ao dia?</label>
                                                    <InputText
                                                        id="pediatric-brushing-frequency"
                                                        v-model="currentClinicalRecord.pediatricAnamnesis.brushingFrequency"
                                                        class="w-full"
                                                    />
                                                </div>
                                                <div class="app-field col-span-12 md:col-span-4">
                                                    <label for="pediatric-floss" class="app-field-label">Faz uso do fio dental?</label>
                                                    <InputText
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
                                                    <InputText
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
                                                        <InputText
                                                            v-if="question.detailLabel"
                                                            :modelValue="getPediatricQuestionResponse(question.key).details"
                                                            @update:modelValue="updatePediatricQuestionDetails(question.key, $event)"
                                                            :placeholder="question.detailLabel"
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
                                            <p>{{ currentClinicalRecord.exams.length }} anexo(s)</p>
                                        </div>
                                        <Button
                                            icon="pi pi-paperclip"
                                            label="Anexar"
                                            @click="openExamFilePicker"
                                        />
                                    </div>

                                    <input
                                        ref="examInput"
                                        type="file"
                                        class="hidden"
                                        accept="image/*,application/pdf,.pdf"
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
                                                class="w-full"
                                            />
                                        </div>
                                        <div class="app-field col-span-12 md:col-span-4">
                                            <label for="exam-date" class="app-field-label">Data do exame</label>
                                            <InputText
                                                id="exam-date"
                                                v-model="examDraft.date"
                                                type="date"
                                                class="w-full"
                                            />
                                        </div>
                                        <div class="app-field col-span-12 md:col-span-4">
                                            <label for="exam-notes" class="app-field-label">Observações</label>
                                            <InputText
                                                id="exam-notes"
                                                v-model="examDraft.notes"
                                                class="w-full"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div v-if="currentClinicalRecord.exams.length" class="patient-record-exam-grid">
                                    <article
                                        v-for="exam in currentClinicalRecord.exams"
                                        :key="exam.id"
                                        class="patient-record-exam-card"
                                    >
                                        <button
                                            type="button"
                                            class="patient-record-exam-preview"
                                            @click="openExamAttachment(exam)"
                                        >
                                            <img
                                                v-if="isImageAttachment(exam)"
                                                :src="exam.url"
                                                :alt="exam.fileName"
                                            />
                                            <i v-else :class="['pi', getExamFileIcon(exam)]" />
                                        </button>

                                        <div class="patient-record-exam-info">
                                            <span>{{ exam.type }}</span>
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
                                                @click="openExamAttachment(exam)"
                                            />
                                            <Button
                                                icon="pi pi-trash"
                                                rounded
                                                outlined
                                                severity="danger"
                                                size="small"
                                                @click="removeExamAttachment(exam)"
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

    <Dialog
        v-model:visible="patientDialogVisible"
        :style="{ width: '920px' }"
        header="Selecionar Paciente"
        :modal="true"
        class="app-dialog p-fluid"
    >
        <div class="app-dialog-body app-dialog-section">
            <IconField>
                <InputIcon class="flex items-center">
                    <i class="pi pi-search text-[var(--p-surface-400)]" />
                </InputIcon>
                <InputText
                    v-model="patientFilters.global.value"
                    placeholder="Pesquisar"
                    class="py-2 px-3 pl-10 h-9 bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-full w-full focus:ring-2 focus:ring-[var(--p-surface-900)] focus:border-[var(--p-surface-900)] shadow-sm transition-shadow"
                />
            </IconField>

            <div class="patient-record-lazy-table-wrapper" @scroll.passive="onPatientTableScroll">
                <DataTable
                    v-model:filters="patientFilters"
                    v-model:selection="patientDialogSelection"
                    :value="visiblePatientOptions"
                    :loading="loadingPatients"
                    class="app-table patient-record-patient-table"
                    dataKey="recordKey"
                    filterDisplay="row"
                    :globalFilterFields="['displayId', 'name', 'cpf', 'mobilePhone', 'email']"
                    selectionMode="single"
                    :metaKeySelection="false"
                >
                    <template #empty>
                        <div class="flex flex-col items-center justify-center py-12 text-[var(--p-surface-400)]">
                            <i class="pi pi-inbox text-4xl mb-3 text-[var(--p-surface-300)]"></i>
                            <p class="font-medium text-[var(--p-surface-500)]">Nenhum paciente encontrado.</p>
                        </div>
                    </template>

                    <template #loading>
                        <div class="text-center py-8 text-[var(--p-surface-500)] font-medium flex items-center justify-center gap-3">
                            <i class="pi pi-spin pi-spinner text-xl"></i>
                            Carregando pacientes...
                        </div>
                    </template>

                    <Column field="displayId" header="ID Paciente" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="name" header="Nome do Paciente" :showFilterMenu="false">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Nome" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="cpf" header="CPF" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar CPF" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="mobilePhone" header="Celular" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Celular" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
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
import { getPatientServiceErrorMessage, PatientService } from '../../infrastructure/services/PatientService';
import type { ApiPatient } from '../../infrastructure/services/PatientService';

type RecordTab = 'personal' | 'anamnesis' | 'exams';
type AttendanceStatus = 'Realizado' | 'Pendente' | 'Cancelado';
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
    homePhone: string;
    mobilePhone: string;
    profession: string;
    workMobilePhone: string;
    email: string;
}

interface AttendanceHistoryItem {
    id: string;
    patientId: number | null;
    patientCpf: string;
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

interface ExamAttachment {
    id: string;
    type: string;
    date: string;
    notes: string;
    fileName: string;
    fileType: string;
    size: number;
    url: string;
}

interface PatientClinicalRecord {
    selectedAnamnesisType: AnamnesisType;
    adultAnamnesis: AdultAnamnesis;
    pediatricAnamnesis: PediatricAnamnesis;
    exams: ExamAttachment[];
}

interface ExamDraft {
    type: string;
    date: string;
    notes: string;
}

const toast = useToast();
const patientDialogVisible = ref(false);
const loadingPatients = ref(false);
const patientOptions = ref<PatientOption[]>([]);
const patientLazyBatchSize = 12;
const visiblePatientCount = ref(patientLazyBatchSize);
const patientDialogSelection = ref<PatientOption | null>(null);
const selectedPatient = ref<PatientOption | null>(null);
const activeTab = ref<RecordTab>('personal');
const patientRecords = ref<Record<string, PatientClinicalRecord>>({});
const examInput = ref<HTMLInputElement | null>(null);
const examTypeOptions = ref(['Radiografia panorâmica', 'Radiografia periapical', 'Tomografia', 'Fotografia intraoral', 'Exame laboratorial', 'Outro']);
const examDraft = ref<ExamDraft>({
    type: 'Radiografia panorâmica',
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

const attendanceHistory = ref<AttendanceHistoryItem[]>([
    {
        id: 'attendance-1',
        patientId: null,
        patientCpf: '555.666.777-88',
        date: '2026-08-18T09:00',
        status: 'Realizado',
        professional: 'Dra. Ana Paula',
        procedures: ['Limpeza Simples'],
        notes: 'Profilaxia concluída sem intercorrências.'
    },
    {
        id: 'attendance-2',
        patientId: null,
        patientCpf: '111.222.333-44',
        date: '2026-08-18T14:30',
        status: 'Pendente',
        professional: 'Dr. Marcos Lima',
        procedures: ['Clareamento Dental'],
        notes: 'Atendimento agendado para continuidade do plano.'
    },
    {
        id: 'attendance-3',
        patientId: null,
        patientCpf: '555.666.777-88',
        date: '2026-08-25T10:00',
        status: 'Realizado',
        professional: 'Dra. Ana Paula',
        procedures: ['Avaliação clínica'],
        notes: 'Paciente orientada sobre retorno preventivo.'
    }
]);

const selectedPatientKey = computed(() => selectedPatient.value?.recordKey ?? '');
const currentClinicalRecord = computed(() => selectedPatientKey.value ? patientRecords.value[selectedPatientKey.value] ?? null : null);
const currentAnamnesisTypeLabel = computed(() => {
    const selectedType = currentClinicalRecord.value?.selectedAnamnesisType ?? 'adult';
    return selectedType === 'adult' ? 'Modelo adulto' : 'Modelo pediátrico';
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

const selectedPatientAttendances = computed(() => {
    if (!selectedPatient.value) return [];

    const selectedCpf = normalizeDigits(selectedPatient.value.cpf);

    return attendanceHistory.value
        .filter(attendance => {
            const sameId = attendance.patientId && selectedPatient.value?.id && attendance.patientId === selectedPatient.value.id;
            const sameCpf = selectedCpf && normalizeDigits(attendance.patientCpf) === selectedCpf;

            return sameId || sameCpf;
        })
        .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
});

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

    return [selectedPatient.value.address, selectedPatient.value.addressNumber]
        .filter(Boolean)
        .join(', ');
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
        responses: createQuestionResponses([...adultHealthQuestions, ...adultWomenQuestions])
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
        pediatricAnamnesis: getEmptyPediatricAnamnesis(),
        exams: []
    };
}

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
    homePhone: patient.homePhoneNumber ?? '',
    mobilePhone: patient.phoneNumber ?? '',
    profession: patient.occupation ?? '',
    workMobilePhone: patient.commercialPhoneNumber ?? '',
    email: patient.email ?? ''
});

const ensureClinicalRecord = (patient: PatientOption) => {
    if (!patientRecords.value[patient.recordKey]) {
        patientRecords.value[patient.recordKey] = getEmptyClinicalRecord();
    }
};

const showError = (detail: string) => {
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });
};

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

const selectPatient = (patient: PatientOption) => {
    selectedPatient.value = patient;
    ensureClinicalRecord(patient);
    activeTab.value = 'personal';
    patientDialogVisible.value = false;
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

const saveAnamnesis = () => {
    if (!selectedPatient.value) return;

    toast.add({
        severity: 'success',
        summary: 'Anamnese salva',
        detail: 'Registro atualizado com sucesso.',
        life: 3000
    });
};

const openExamFilePicker = () => {
    examInput.value?.click();
};

const isAcceptedExamFile = (file: File) => {
    return file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

const onExamFilesSelected = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (!currentClinicalRecord.value || !files.length) return;

    const acceptedFiles = files.filter(isAcceptedExamFile);
    const rejectedCount = files.length - acceptedFiles.length;

    acceptedFiles.forEach(file => {
        currentClinicalRecord.value?.exams.unshift({
            id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: examDraft.value.type,
            date: examDraft.value.date,
            notes: examDraft.value.notes.trim(),
            fileName: file.name,
            fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : ''),
            size: file.size,
            url: URL.createObjectURL(file)
        });
    });

    if (acceptedFiles.length) {
        toast.add({
            severity: 'success',
            summary: 'Exame anexado',
            detail: `${acceptedFiles.length} arquivo(s) adicionado(s) ao prontuário.`,
            life: 3000
        });
        examDraft.value.notes = '';
    }

    if (rejectedCount) {
        toast.add({
            severity: 'warn',
            summary: 'Arquivo não anexado',
            detail: 'Apenas imagens e PDFs são permitidos.',
            life: 4000
        });
    }

    input.value = '';
};

const isImageAttachment = (exam: ExamAttachment) => exam.fileType.startsWith('image/');
const getExamFileIcon = (exam: ExamAttachment) => exam.fileType === 'application/pdf' ? 'pi-file-pdf' : 'pi-file';

const openExamAttachment = (exam: ExamAttachment) => {
    window.open(exam.url, '_blank', 'noopener,noreferrer');
};

const removeExamAttachment = (exam: ExamAttachment) => {
    if (!currentClinicalRecord.value) return;

    URL.revokeObjectURL(exam.url);
    currentClinicalRecord.value.exams = currentClinicalRecord.value.exams.filter(item => item.id !== exam.id);
    toast.add({ severity: 'success', summary: 'Exame removido', detail: 'Anexo removido do prontuário.', life: 2500 });
};

const getAttendanceStatusClass = (status: AttendanceStatus) => {
    switch (status) {
        case 'Realizado': return 'patient-record-status-success';
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
    Object.values(patientRecords.value).forEach(record => {
        record.exams.forEach(exam => URL.revokeObjectURL(exam.url));
    });
});
</script>
