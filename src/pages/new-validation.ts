import { findMaturityLevel, maxMaturityPoints } from "../lib/config";
import { escapeHtml, icon, severityBadge, toneClassByLevel, type RenderContext } from "../lib/render";
import type { DisciplineConfig } from "../lib/types";

export function renderNewValidation(context: RenderContext): string {
  const config = context.currentConfig();
  const points = context.maturityPoints(config);
  const maxPoints = maxMaturityPoints(config);
  const level = findMaturityLevel(config, points);
  const percent = maxPoints ? Math.round((points / maxPoints) * 100) : 0;

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Nova validação</h1>
          <p class="page-sub">Selecione uma frente, registre o contexto e valide a entrega pelo checklist e pela taxonomia do time.</p>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">Frente de validação</h2>
        <div class="front-grid">
          ${context.configs.map((item) => `
            <button class="front-option ${item.id === context.form.disciplineId ? "active" : ""}" data-discipline="${item.id}">
              <span>${item.shortName}</span>
              <strong>${item.name}</strong>
              <small>${item.description}</small>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">Contexto da entrega</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="designer">Designer responsável</label>
            <input type="text" id="designer" data-form-field="designer" value="${escapeHtml(context.form.designer)}" placeholder="Nome do designer" />
          </div>
          <div class="form-group">
            <label for="journey">Jornada / produto</label>
            <input type="text" id="journey" data-form-field="journey" value="${escapeHtml(context.form.journey)}" placeholder="Ex: Fatura digital - Vivo Fibra" />
          </div>
          <div class="form-group form-group-full">
            <label for="journey-link">Link da Jornada</label>
            <input type="url" id="journey-link" data-form-field="journeyLink" value="${escapeHtml(context.form.journeyLink)}" placeholder="https://www.figma.com/proto/..." />
          </div>
          <div class="form-group">
            <label for="round">Rodada de validação</label>
            <select id="round" data-form-field="round">
              <option value="1" ${context.form.round === 1 ? "selected" : ""}>1a rodada</option>
              <option value="2" ${context.form.round === 2 ? "selected" : ""}>2a rodada</option>
              <option value="3" ${context.form.round === 3 ? "selected" : ""}>3a rodada ou mais</option>
            </select>
          </div>
          <div class="form-group">
            <label for="date">Data</label>
            <input type="date" id="date" data-form-field="date" value="${escapeHtml(context.form.date)}" />
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">Índice de maturidade</h2>
        <p class="helper-text">Marque os critérios observáveis presentes nesta entrega. O nível é calculado automaticamente pela pontuação.</p>
        <div class="checklist-grid">
          ${config.maturity.checklist.map((criterion) => `
            <button class="check-item ${context.form.checkedCriteria.has(criterion.id) ? "checked" : ""}" data-criterion="${criterion.id}">
              <span class="check-box">${icon("check")}</span>
              <span class="check-text">${criterion.text}</span>
              <span class="check-pts">+${criterion.points}</span>
            </button>
          `).join("")}
        </div>
        <div class="mat-meter ${toneClassByLevel[level.id]}">
          <div class="mat-meter-label">${level.label}</div>
          <div class="mat-meter-bar"><span class="mat-meter-fill" style="width:${percent}%"></span></div>
          <div class="mat-meter-pts">${points} / ${maxPoints} pts</div>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">Adicionar erro</h2>
        <p class="helper-text">Selecione o tipo de erro. A gravidade vem da configuração mantida por cada frente.</p>
        <div class="cat-tab-row">
          ${config.taxonomy.map((category) => `<button class="cat-tab ${category.id === context.form.selectedCategoryId ? "active" : ""}" data-category="${category.id}">${category.label}</button>`).join("")}
        </div>
        ${renderErrorTypeList(context, config)}
        <div class="form-group spaced">
          <label for="error-note">Contexto / observação</label>
          <textarea id="error-note" data-form-field="errorNote" placeholder="Ex: tela de confirmação de pagamento, fluxo de segunda via...">${escapeHtml(context.form.errorNote)}</textarea>
        </div>
        <div class="inline-actions">
          <button class="btn btn-outline" data-action="add-error">${icon("plus")}Adicionar erro</button>
          <div class="selected-preview">${renderSelectedError(context, config)}</div>
        </div>
      </div>

      ${renderCurrentErrors(context)}

      <div class="btn-row">
        <button class="btn btn-primary" data-action="save">${icon("check")}Finalizar validação</button>
        <button class="btn btn-outline" data-action="clear">Limpar</button>
        <span class="save-msg" id="save-msg">${icon("circle-check")}Validação salva</span>
      </div>
    </section>
  `;
}

function renderErrorTypeList(context: RenderContext, config: DisciplineConfig): string {
  const category = config.taxonomy.find((item) => item.id === context.form.selectedCategoryId) ?? config.taxonomy[0];

  return `
    <div class="error-type-grid">
      ${category.errors.map((error) => `
        <button class="error-type-item ${context.form.selectedErrorId === error.id ? "selected" : ""}" data-error="${error.id}">
          <span class="error-type-name">${error.name}</span>
          ${error.avoidable ? `<span class="error-avoidable-tag">${icon("alert-triangle")}Evitável</span>` : ""}
          ${severityBadge(error.severity)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderSelectedError(context: RenderContext, config: DisciplineConfig): string {
  const category = config.taxonomy.find((item) => item.id === context.form.selectedCategoryId);
  const error = category?.errors.find((item) => item.id === context.form.selectedErrorId);

  if (!error) {
    return "Selecione um tipo acima";
  }

  return `<span>${error.name}</span>${severityBadge(error.severity)}`;
}

function renderCurrentErrors(context: RenderContext): string {
  if (!context.form.errors.length) {
    return `<div class="empty-state">${icon("file-check")}Nenhum erro adicionado ainda</div>`;
  }

  return `
    <div class="error-list">
      ${context.form.errors.map((error, index) => `
        <div class="error-item">
          <div class="error-item-header">
            ${severityBadge(error.severity)}
            <span class="badge badge-cat">${error.categoryLabel}</span>
            <strong>${error.name}</strong>
            ${error.avoidable ? `<span class="badge badge-evitavel">${icon("alert-triangle")}Evitável</span>` : ""}
            <button class="btn btn-danger" data-remove-error="${index}" aria-label="Remover erro">${icon("trash")}</button>
          </div>
          ${error.note ? `<p class="error-item-desc">${escapeHtml(error.note)}</p>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}
