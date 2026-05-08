export type DisciplineId = "content" | "system" | "accessibility";
export type Severity = "critico" | "alto" | "medio" | "baixo";
export type PracticeArea = "App Vivo" | "Vivo Empresas" | "Portais & E-comm" | "Evolução" | "Design Horizontal";

export const practiceAreas: PracticeArea[] = [
  "App Vivo",
  "Vivo Empresas",
  "Portais & E-comm",
  "Evolução",
  "Design Horizontal",
];

export interface MaturityCriterion {
  id: string;
  text: string;
  points: number;
}

export interface MaturityLevel {
  id: "alta" | "media" | "baixa";
  label: string;
  min: number;
  max: number;
  tone: "success" | "warning" | "danger";
}

export interface TaxonomyError {
  id: string;
  name: string;
  severity: Severity;
  avoidable: boolean;
}

export interface TaxonomyCategory {
  id: string;
  label: string;
  errors: TaxonomyError[];
}

export interface DisciplineConfig {
  id: DisciplineId;
  name: string;
  shortName: string;
  description: string;
  maturity: {
    checklist: MaturityCriterion[];
    levels: MaturityLevel[];
  };
  taxonomy: TaxonomyCategory[];
}

export interface ValidationErrorEntry {
  categoryId: string;
  categoryLabel: string;
  errorId: string;
  name: string;
  severity: Severity;
  avoidable: boolean;
  note: string;
}

export interface ValidationRecord {
  id: string;
  disciplineId: DisciplineId;
  designer: string;
  practiceArea: PracticeArea;
  journey: string;
  journeyLink: string;
  round: number;
  date: string;
  checkedCriteria: string[];
  maturityPoints: number;
  maturityLevel: MaturityLevel["id"];
  errors: ValidationErrorEntry[];
}
