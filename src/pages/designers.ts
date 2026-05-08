import { findMaturityLevel } from "../lib/config";
import { escapeHtml, icon, renderFilter, toneClassByLevel, type RenderContext } from "../lib/render";
import type { DisciplineConfig, ValidationRecord } from "../lib/types";

export function renderDesigners(context: RenderContext): string {
  const scopedRecords = context.filteredRecords();
  const designers = [...new Set(context.records.map((record) => record.designer))].sort();

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Por designer</h1>
          <p class="page-sub">Histórico individual com notas independentes para Content, System e Acessibilidade.</p>
        </div>
        ${renderFilter(context)}
      </div>
      ${!scopedRecords.length ? `<div class="empty-state">${icon("users")}Nenhum designer para este filtro</div>` : designers.map((designer) => renderDesignerCard(context, designer)).join("")}
    </section>
  `;
}

function renderDesignerCard(context: RenderContext, designer: string): string {
  const designerRecords = context.records.filter((record) => record.designer === designer);
  const initials = designer.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);

  return `
    <article class="designer-card">
      <div class="designer-header">
        <span class="avatar">${initials}</span>
        <div>
          <h2>${escapeHtml(designer)}</h2>
          <p>${designerRecords.length} validações registradas</p>
        </div>
      </div>
      <div class="front-summary-grid">
        ${context.configs.map((config) => renderDesignerFrontSummary(config, designerRecords.filter((record) => record.disciplineId === config.id))).join("")}
      </div>
    </article>
  `;
}

function renderDesignerFrontSummary(config: DisciplineConfig, designerRecords: ValidationRecord[]): string {
  if (!designerRecords.length) {
    return `<div class="front-summary"><span>${config.shortName}</span><strong>-</strong><small>Sem validações</small></div>`;
  }

  const average = designerRecords.reduce((total, record) => total + record.maturityPoints, 0) / designerRecords.length;
  const level = findMaturityLevel(config, Math.round(average));

  return `
    <div class="front-summary ${toneClassByLevel[level.id]}">
      <span>${config.shortName}</span>
      <strong>${average.toFixed(1)} pts</strong>
      <small>${level.label} em ${designerRecords.length} validação(ões)</small>
    </div>
  `;
}
