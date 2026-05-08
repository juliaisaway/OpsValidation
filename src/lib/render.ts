import { severityLabels } from "./config";
import type { FormState } from "./state";
import type { DisciplineConfig, DisciplineId, MaturityLevel, ValidationRecord } from "./types";

export type PageId = "nova" | "historico" | "dashboard" | "designers" | "taxonomia" | "regua";
export type FilterId = DisciplineId | "all";

export const toneClassByLevel: Record<MaturityLevel["id"], string> = {
  alta: "tone-success",
  media: "tone-warning",
  baixa: "tone-danger",
};

export interface RenderContext {
  configs: DisciplineConfig[];
  records: ValidationRecord[];
  activeFilter: FilterId;
  form: FormState;
  currentConfig: () => DisciplineConfig;
  configById: (id: DisciplineId) => DisciplineConfig;
  filteredRecords: () => ValidationRecord[];
  maturityPoints: (config: DisciplineConfig) => number;
}

export function icon(name: string): string {
  return `<i class="ti ti-${name}"></i>`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return map[char];
  });
}

export function severityBadge(severity: string): string {
  return `<span class="badge severity-${severity}">${severityLabels[severity as keyof typeof severityLabels]}</span>`;
}

export function maturityPill(config: DisciplineConfig, levelId: MaturityLevel["id"], points: number): string {
  const level = config.maturity.levels.find((item) => item.id === levelId) ?? config.maturity.levels.at(-1)!;
  return `<span class="mat-pill ${toneClassByLevel[level.id]}">${level.label} <span>${points} pts</span></span>`;
}

export function disciplineBadge(context: RenderContext, id: DisciplineId): string {
  const config = context.configById(id);
  return `<span class="badge badge-front">${config.shortName}</span>`;
}

export function renderFilter(context: RenderContext): string {
  return `
    <div class="toolbar">
      <label for="front-filter">Frente</label>
      <select id="front-filter" data-filter>
        <option value="all" ${context.activeFilter === "all" ? "selected" : ""}>Todas as frentes</option>
        ${context.configs.map((config) => `<option value="${config.id}" ${context.activeFilter === config.id ? "selected" : ""}>${config.name}</option>`).join("")}
      </select>
    </div>
  `;
}

export function progressRow(label: string, value: number, max: number): string {
  const percent = Math.round((value / Math.max(max, 1)) * 100);
  return `
    <div class="progress-row">
      <div class="progress-label"><span>${label}</span><strong>${value}</strong></div>
      <div class="progress-bar"><span class="progress-fill" style="width:${percent}%"></span></div>
    </div>
  `;
}
