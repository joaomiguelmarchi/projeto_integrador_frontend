import axios from 'axios';
import { api } from '../http/api';

export type ApiExamType =
  | 'RADIOGRAFIA_PANORAMICA' | 'RADIOGRAFIA_PERIAPICAL' | 'TOMOGRAFIA'
  | 'FOTOGRAFIA_INTRAORAL' | 'EXAME_LABORATORIAL' | 'OUTRO';
export interface ApiExam {
  id: number;
  patientId: number;
  type: ApiExamType;
  date: string;       // YYYY-MM-DD
  notes: string;
  fileName: string;
  fileType: string;   // MIME detectado pelo servidor
  size: number;       // bytes
  createdAt: string;  // YYYY-MM-DDTHH:mm:ss
}
export interface ExamUploadInput {
  patientId: number;
  type: ApiExamType;
  date: string;
  notes?: string;
  files: File[];
}

export const EXAM_TYPE_LABELS: Record<ApiExamType, string> = {
  RADIOGRAFIA_PANORAMICA: 'Radiografia panorâmica',
  RADIOGRAFIA_PERIAPICAL: 'Radiografia periapical',
  TOMOGRAFIA: 'Tomografia',
  FOTOGRAFIA_INTRAORAL: 'Fotografia intraoral',
  EXAME_LABORATORIAL: 'Exame laboratorial',
  OUTRO: 'Outro',
};
export const EXAM_MAX_FILES = 10;
export const EXAM_MAX_BYTES = 10 * 1024 * 1024;
const TRANSFER_TIMEOUT = 120_000;

interface Envelope<T> { data: T; error?: { message?: string } | null }
function unwrap<T>(response: { data: Envelope<T> }): T {
  if (response.data?.error || response.data?.data == null) {
    throw new Error(response.data?.error?.message || 'Resposta inesperada da API.');
  }
  return response.data.data;
}

/** Erros de rotas com responseType 'blob' chegam como Blob: extrai error.message do envelope. */
async function readBlobError(error: unknown): Promise<never> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    let message: unknown;
    try {
      message = JSON.parse(await error.response.data.text())?.error?.message;
    } catch {
      message = undefined;
    }
    if (typeof message === 'string' && message) throw new Error(message);
  }
  throw error;
}

export const ExamService = {
  async list(patientId: number, signal?: AbortSignal) {
    return unwrap(await api.get<Envelope<ApiExam[]>>('/exam/list', { params: { patientId }, signal }));
  },
  async upload(input: ExamUploadInput) {
    const form = new FormData();
    form.append('patientId', String(input.patientId));
    form.append('type', input.type);
    form.append('date', input.date);
    if (input.notes) form.append('notes', input.notes);
    input.files.forEach(file => form.append('files', file, file.name));
    return unwrap(await api.post<Envelope<ApiExam[]>>('/exam/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }, // sobrescreve o JSON padrão do api.ts
      timeout: TRANSFER_TIMEOUT,
    }));
  },
  /** Baixa o arquivo autenticado (a rota exige cookie, então não dá para usar <img src> direto na API). */
  async file(id: number, signal?: AbortSignal): Promise<Blob> {
    try {
      const response = await api.get<Blob>(`/exam/${id}/file`, { responseType: 'blob', timeout: TRANSFER_TIMEOUT, signal });
      return response.data;
    } catch (error) {
      return readBlobError(error);
    }
  },
  async remove(id: number) {
    return unwrap(await api.delete<Envelope<boolean>>(`/exam/delete/${id}`));
  },
};

const isAcceptedExamFile = (file: File) =>
  file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

/** Validação no cliente antes do upload; devolve a mensagem de erro ou null. O servidor valida de novo. */
export function validateExamFiles(files: File[]): string | null {
  if (files.length === 0) return 'Selecione ao menos um arquivo.';
  if (files.length > EXAM_MAX_FILES) return `Envie no máximo ${EXAM_MAX_FILES} arquivos por vez.`;
  const big = files.find(file => file.size > EXAM_MAX_BYTES);
  if (big) return `O arquivo '${big.name}' excede o limite de 10 MB.`;
  const wrong = files.find(file => !isAcceptedExamFile(file));
  if (wrong) return `O arquivo '${wrong.name}' não é permitido. Envie apenas imagens ou PDF.`;
  return null;
}
