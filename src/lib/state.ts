import type { DisciplineId, ValidationErrorEntry, ValidationRecord } from "./types";

export interface FormState {
  disciplineId: DisciplineId;
  designer: string;
  journey: string;
  journeyLink: string;
  round: number;
  date: string;
  checkedCriteria: Set<string>;
  selectedCategoryId: string;
  selectedErrorId: string | null;
  errorNote: string;
  errors: ValidationErrorEntry[];
}

export type NewValidationRecord = Omit<ValidationRecord, "id">;

export async function loadRecords(): Promise<ValidationRecord[]> {
  const response = await fetch("/api/records");

  if (!response.ok) {
    throw new Error("Não foi possível carregar o histórico de validações.");
  }

  const payload = await parseJsonResponse<{ records: ValidationRecord[] }>(response, "histórico de validações");
  return payload.records;
}

export async function createRecord(record: NewValidationRecord): Promise<ValidationRecord> {
  const response = await fetch("/api/records", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error("Não foi possível salvar a validação.");
  }

  const payload = await parseJsonResponse<{ record: ValidationRecord }>(response, "validação salva");
  return payload.record;
}

async function parseJsonResponse<T>(response: Response, label: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(`A API retornou uma resposta inválida para ${label}.`);
  }

  return (await response.json()) as T;
}
