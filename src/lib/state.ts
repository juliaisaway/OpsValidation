import type { DisciplineId, ValidationErrorEntry, ValidationRecord } from "./types";

const storageKey = "ops-validation.records";

export interface FormState {
  disciplineId: DisciplineId;
  checkedCriteria: Set<string>;
  selectedCategoryId: string;
  selectedErrorId: string | null;
  errors: ValidationErrorEntry[];
}

export function loadRecords(): ValidationRecord[] {
  const rawRecords = localStorage.getItem(storageKey);

  if (!rawRecords) {
    return [];
  }

  try {
    return JSON.parse(rawRecords) as ValidationRecord[];
  } catch {
    return [];
  }
}

export function saveRecords(records: ValidationRecord[]): void {
  localStorage.setItem(storageKey, JSON.stringify(records));
}
