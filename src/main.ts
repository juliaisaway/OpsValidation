import "./styles/styles.scss";
import { findMaturityLevel, loadConfigs, maxMaturityPoints, severityLabels } from "./lib/config";
import { loadRecords, saveRecords, type FormState } from "./lib/state";
import type { DisciplineConfig, DisciplineId, MaturityLevel, ValidationErrorEntry, ValidationRecord } from "./lib/types";

type PageId = "nova" | "historico" | "dashboard" | "designers" | "taxonomia" | "regua";
type FilterId = DisciplineId | "all";

const app = document.querySelector<HTMLDivElement>("#app")!;
let configs: DisciplineConfig[] = [];
let records: ValidationRecord[] = loadRecords();
let activePage: PageId = "nova";
let activeFilter: FilterId = "all";
let form: FormState;

const toneClassByLevel: Record<MaturityLevel["id"], string> = {
  alta: "tone-success",
  media: "tone-warning",
  baixa: "tone-danger",
};

function currentConfig(): DisciplineConfig {
  return configs.find((config) => config.id === form.disciplineId) ?? configs[0];
}

function configById(id: DisciplineId): DisciplineConfig {
  return configs.find((config) => config.id === id)!;
}

function filteredRecords(): ValidationRecord[] {
  return activeFilter === "all" ? records : records.filter((record) => record.disciplineId === activeFilter);
}

function maturityPoints(config: DisciplineConfig): number {
  return config.maturity.checklist
    .filter((criterion) => form.checkedCriteria.has(criterion.id))
    .reduce((total, criterion) => total + criterion.points, 0);
}

function resetForm(disciplineId: DisciplineId = form?.disciplineId ?? "content"): void {
  const config = configs.find((item) => item.id === disciplineId) ?? configs[0];

  form = {
    disciplineId: config.id,
    checkedCriteria: new Set(),
    selectedCategoryId: config.taxonomy[0]?.id ?? "",
    selectedErrorId: null,
    errors: [],
  };
}

function icon(name: string): string {
  return `<i class="ti ti-${name}"></i>`;
}

function escapeHtml(value: string): string {
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

function severityBadge(severity: string): string {
  return `<span class="badge severity-${severity}">${severityLabels[severity as keyof typeof severityLabels]}</span>`;
}

function maturityPill(config: DisciplineConfig, levelId: MaturityLevel["id"], points: number): string {
  const level = config.maturity.levels.find((item) => item.id === levelId) ?? config.maturity.levels.at(-1)!;
  return `<span class="mat-pill ${toneClassByLevel[level.id]}">${level.label} <span>${points} pts</span></span>`;
}

function disciplineBadge(id: DisciplineId): string {
  const config = configById(id);
  return `<span class="badge badge-front">${config.shortName}</span>`;
}

function renderShell(): void {
  app.innerHTML = `
    <div class="shell">
      <nav class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo"><span class="sidebar-logo-dot"></span>Ops Validation</div>
          <div class="sidebar-sub">Content, System e Acessibilidade</div>
        </div>
        <div class="nav-section">Validação</div>
        ${navItem("nova", "plus", "Nova validação")}
        ${navItem("historico", "list", "Histórico")}
        <div class="nav-section">Métricas</div>
        ${navItem("dashboard", "chart-bar", "Dashboard")}
        ${navItem("designers", "users", "Por designer")}
        <div class="nav-section">Referência</div>
        ${navItem("taxonomia", "tag", "Taxonomia")}
        ${navItem("regua", "ruler", "Régua")}
      </nav>
      <main class="main" id="main-content"></main>
    </div>
  `;
}

function navItem(page: PageId, iconName: string, label: string): string {
  return `<button class="nav-item ${activePage === page ? "active" : ""}" data-page="${page}">${icon(iconName)}${label}</button>`;
}

function render(): void {
  renderShell();
  const main = document.querySelector<HTMLDivElement>("#main-content")!;

  const pages: Record<PageId, () => string> = {
    nova: renderNewValidation,
    historico: renderHistory,
    dashboard: renderDashboard,
    designers: renderDesigners,
    taxonomia: renderTaxonomy,
    regua: renderMaturityScale,
  };

  main.innerHTML = pages[activePage]();
}

function renderFilter(): string {
  return `
    <div class="toolbar">
      <label for="front-filter">Frente</label>
      <select id="front-filter" data-filter>
        <option value="all" ${activeFilter === "all" ? "selected" : ""}>Todas as frentes</option>
        ${configs.map((config) => `<option value="${config.id}" ${activeFilter === config.id ? "selected" : ""}>${config.name}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderNewValidation(): string {
  const config = currentConfig();
  const points = maturityPoints(config);
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
          ${configs.map((item) => `
            <button class="front-option ${item.id === form.disciplineId ? "active" : ""}" data-discipline="${item.id}">
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
            <input type="text" id="designer" placeholder="Nome do designer" />
          </div>
          <div class="form-group">
            <label for="journey">Jornada / produto</label>
            <input type="text" id="journey" placeholder="Ex: Fatura digital - Vivo Fibra" />
          </div>
          <div class="form-group form-group-full">
            <label for="journey-link">Link da Jornada</label>
            <input type="url" id="journey-link" placeholder="https://www.figma.com/proto/..." />
          </div>
          <div class="form-group">
            <label for="round">Rodada de validação</label>
            <select id="round">
              <option value="1">1a rodada</option>
              <option value="2">2a rodada</option>
              <option value="3">3a rodada ou mais</option>
            </select>
          </div>
          <div class="form-group">
            <label for="date">Data</label>
            <input type="date" id="date" />
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">Índice de maturidade</h2>
        <p class="helper-text">Marque os critérios observáveis presentes nesta entrega. O nível é calculado automaticamente pela pontuação.</p>
        <div class="checklist-grid">
          ${config.maturity.checklist.map((criterion) => `
            <button class="check-item ${form.checkedCriteria.has(criterion.id) ? "checked" : ""}" data-criterion="${criterion.id}">
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
          ${config.taxonomy.map((category) => `<button class="cat-tab ${category.id === form.selectedCategoryId ? "active" : ""}" data-category="${category.id}">${category.label}</button>`).join("")}
        </div>
        ${renderErrorTypeList(config)}
        <div class="form-group spaced">
          <label for="error-note">Contexto / observação</label>
          <textarea id="error-note" placeholder="Ex: tela de confirmação de pagamento, fluxo de segunda via..."></textarea>
        </div>
        <div class="inline-actions">
          <button class="btn btn-outline" data-action="add-error">${icon("plus")}Adicionar erro</button>
          <div class="selected-preview">${renderSelectedError(config)}</div>
        </div>
      </div>

      ${renderCurrentErrors()}

      <div class="btn-row">
        <button class="btn btn-primary" data-action="save">${icon("check")}Finalizar validação</button>
        <button class="btn btn-outline" data-action="clear">Limpar</button>
        <span class="save-msg" id="save-msg">${icon("circle-check")}Validação salva</span>
      </div>
    </section>
  `;
}

function renderErrorTypeList(config: DisciplineConfig): string {
  const category = config.taxonomy.find((item) => item.id === form.selectedCategoryId) ?? config.taxonomy[0];

  return `
    <div class="error-type-grid">
      ${category.errors.map((error) => `
        <button class="error-type-item ${form.selectedErrorId === error.id ? "selected" : ""}" data-error="${error.id}">
          <span class="error-type-name">${error.name}</span>
          ${error.avoidable ? `<span class="error-avoidable-tag">${icon("alert-triangle")}Evitável</span>` : ""}
          ${severityBadge(error.severity)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderSelectedError(config: DisciplineConfig): string {
  const category = config.taxonomy.find((item) => item.id === form.selectedCategoryId);
  const error = category?.errors.find((item) => item.id === form.selectedErrorId);

  if (!error) {
    return "Selecione um tipo acima";
  }

  return `<span>${error.name}</span>${severityBadge(error.severity)}`;
}

function renderCurrentErrors(): string {
  if (!form.errors.length) {
    return `<div class="empty-state">${icon("file-check")}Nenhum erro adicionado ainda</div>`;
  }

  return `
    <div class="error-list">
      ${form.errors.map((error, index) => `
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

function renderHistory(): string {
  const scopedRecords = filteredRecords();

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Histórico de validações</h1>
          <p class="page-sub">Todas as validações registradas com filtro por frente.</p>
        </div>
        ${renderFilter()}
      </div>
      ${!scopedRecords.length ? `<div class="empty-state">${icon("database-off")}Nenhuma validação registrada para este filtro</div>` : `
        <div class="table-wrap"><table>
          <thead><tr><th>Data</th><th>Frente</th><th>Designer</th><th>Jornada</th><th>Link</th><th>Rodada</th><th>Maturidade</th><th>Erros</th><th>Evitáveis</th><th>Críticos</th></tr></thead>
          <tbody>
            ${scopedRecords.slice().reverse().map((record) => {
              const config = configById(record.disciplineId);
              const avoidable = record.errors.filter((error) => error.avoidable).length;
              const critical = record.errors.filter((error) => error.severity === "critico").length;
              return `
                <tr>
                  <td class="muted-cell">${record.date}</td>
                  <td>${disciplineBadge(record.disciplineId)}</td>
                  <td><strong>${escapeHtml(record.designer)}</strong></td>
                  <td>${escapeHtml(record.journey)}</td>
                  <td>${record.journeyLink ? `<a class="table-link" href="${escapeHtml(record.journeyLink)}" target="_blank" rel="noreferrer">${icon("external-link")}Abrir</a>` : `<span class="muted-cell">-</span>`}</td>
                  <td>${record.round}a</td>
                  <td>${maturityPill(config, record.maturityLevel, record.maturityPoints)}</td>
                  <td>${record.errors.length}</td>
                  <td>${avoidable ? `<span class="badge badge-evitavel">${avoidable}</span>` : `<span class="muted-cell">-</span>`}</td>
                  <td>${critical ? `<span class="badge severity-critico">${critical}</span>` : `<span class="muted-cell">-</span>`}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table></div>
      `}
    </section>
  `;
}

function renderDashboard(): string {
  const scopedRecords = filteredRecords();

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard de métricas</h1>
          <p class="page-sub">Visão geral por frente ou consolidada.</p>
        </div>
        ${renderFilter()}
      </div>
      ${!scopedRecords.length ? `<div class="empty-state">${icon("chart-bar")}Registre validações para ver as métricas</div>` : renderDashboardContent(scopedRecords)}
    </section>
  `;
}

function renderDashboardContent(scopedRecords: ValidationRecord[]): string {
  const allErrors = scopedRecords.flatMap((record) => record.errors);
  const avoidable = allErrors.filter((error) => error.avoidable).length;
  const firstRound = scopedRecords.filter((record) => record.round === 1).length;
  const rework = scopedRecords.filter((record) => record.round > 1).length;
  const critical = allErrors.filter((error) => error.severity === "critico").length;
  const topErrors = Object.values(
    allErrors.reduce<Record<string, { name: string; category: string; severity: string; total: number }>>((acc, error) => {
      const key = `${error.categoryId}|${error.errorId}`;
      acc[key] = { name: error.name, category: error.categoryLabel, severity: error.severity, total: (acc[key]?.total ?? 0) + 1 };
      return acc;
    }, {}),
  ).sort((a, b) => b.total - a.total).slice(0, 5);

  return `
    <div class="metric-grid">
      <div class="metric-card"><span class="metric-label">Validações</span><strong class="metric-value">${scopedRecords.length}</strong></div>
      <div class="metric-card"><span class="metric-label">Aprovação 1a rodada</span><strong class="metric-value">${Math.round((firstRound / scopedRecords.length) * 100)}%</strong><span class="metric-sub">${firstRound} de ${scopedRecords.length}</span></div>
      <div class="metric-card"><span class="metric-label">Erros evitáveis</span><strong class="metric-value metric-danger">${allErrors.length ? Math.round((avoidable / allErrors.length) * 100) : 0}%</strong><span class="metric-sub">${avoidable} de ${allErrors.length}</span></div>
      <div class="metric-card"><span class="metric-label">Críticos</span><strong class="metric-value">${critical}</strong><span class="metric-sub">${rework} entregas com retrabalho</span></div>
    </div>
    <div class="two-col">
      <div class="card">
        <h2 class="card-title">Validações por frente</h2>
        ${configs.map((config) => progressRow(config.name, scopedRecords.filter((record) => record.disciplineId === config.id).length, scopedRecords.length)).join("")}
      </div>
      <div class="card">
        <h2 class="card-title">Erros por gravidade</h2>
        ${(["critico", "alto", "medio", "baixo"] as const).map((severity) => progressRow(severityLabels[severity], allErrors.filter((error) => error.severity === severity).length, Math.max(allErrors.length, 1))).join("")}
      </div>
    </div>
    <div class="card">
      <h2 class="card-title">Erros mais frequentes</h2>
      ${topErrors.length ? topErrors.map((error, index) => `
        <div class="rank-row">
          <span>${index + 1}</span>
          <strong>${error.name}</strong>
          <em>${error.category}</em>
          ${severityBadge(error.severity)}
          <b>${error.total}x</b>
        </div>
      `).join("") : `<span class="muted-cell">Sem erros registrados</span>`}
    </div>
  `;
}

function progressRow(label: string, value: number, max: number): string {
  const percent = Math.round((value / Math.max(max, 1)) * 100);
  return `
    <div class="progress-row">
      <div class="progress-label"><span>${label}</span><strong>${value}</strong></div>
      <div class="progress-bar"><span class="progress-fill" style="width:${percent}%"></span></div>
    </div>
  `;
}

function renderDesigners(): string {
  const scopedRecords = filteredRecords();
  const designers = [...new Set(records.map((record) => record.designer))].sort();

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Por designer</h1>
          <p class="page-sub">Histórico individual com notas independentes para Content, System e Acessibilidade.</p>
        </div>
        ${renderFilter()}
      </div>
      ${!scopedRecords.length ? `<div class="empty-state">${icon("users")}Nenhum designer para este filtro</div>` : designers.map(renderDesignerCard).join("")}
    </section>
  `;
}

function renderDesignerCard(designer: string): string {
  const designerRecords = records.filter((record) => record.designer === designer);
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
        ${configs.map((config) => renderDesignerFrontSummary(config, designerRecords.filter((record) => record.disciplineId === config.id))).join("")}
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

function renderTaxonomy(): string {
  const selectedConfigs = activeFilter === "all" ? configs : [configById(activeFilter)];

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Taxonomia de erros</h1>
          <p class="page-sub">Categorias e tipos de erro definidos em arquivos JSON por frente.</p>
        </div>
        ${renderFilter()}
      </div>
      ${selectedConfigs.map((config) => `
        <div class="section-title">${disciplineBadge(config.id)}<h2>${config.name}</h2></div>
        ${config.taxonomy.map((category) => `
          <div class="card">
            <h3 class="card-title">${category.label}</h3>
            <div class="table-wrap"><table>
              <thead><tr><th>Tipo de erro</th><th>Gravidade</th><th>Evitável</th></tr></thead>
              <tbody>
                ${category.errors.map((error) => `
                  <tr>
                    <td>${error.name}</td>
                    <td>${severityBadge(error.severity)}</td>
                    <td>${error.avoidable ? `<span class="badge badge-evitavel">Sim</span>` : `<span class="muted-cell">-</span>`}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table></div>
          </div>
        `).join("")}
      `).join("")}
    </section>
  `;
}

function renderMaturityScale(): string {
  const selectedConfigs = activeFilter === "all" ? configs : [configById(activeFilter)];

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Régua de maturidade</h1>
          <p class="page-sub">Critérios objetivos e faixas de pontuação por frente.</p>
        </div>
        ${renderFilter()}
      </div>
      ${selectedConfigs.map((config) => `
        <div class="section-title">${disciplineBadge(config.id)}<h2>${config.name}</h2></div>
        <div class="scale-grid">
          ${config.maturity.levels.map((level) => `
            <div class="regua-card ${toneClassByLevel[level.id]}">
              <h3>${level.label}</h3>
              <p>${level.min} a ${level.max} pontos</p>
            </div>
          `).join("")}
        </div>
        <div class="card">
          <h3 class="card-title">Checklist</h3>
          ${config.maturity.checklist.map((criterion) => `
            <div class="criterion-row"><span>${criterion.text}</span><strong>+${criterion.points} pts</strong></div>
          `).join("")}
        </div>
      `).join("")}
    </section>
  `;
}

function addError(): void {
  const config = currentConfig();
  const category = config.taxonomy.find((item) => item.id === form.selectedCategoryId);
  const error = category?.errors.find((item) => item.id === form.selectedErrorId);

  if (!category || !error) {
    window.alert("Selecione um tipo de erro.");
    return;
  }

  const note = document.querySelector<HTMLTextAreaElement>("#error-note")?.value.trim() ?? "";

  form.errors.push({
    categoryId: category.id,
    categoryLabel: category.label,
    errorId: error.id,
    name: error.name,
    severity: error.severity,
    avoidable: error.avoidable,
    note,
  });
  form.selectedErrorId = null;
  render();
}

function saveValidation(): void {
  const designer = document.querySelector<HTMLInputElement>("#designer")?.value.trim() ?? "";
  const journey = document.querySelector<HTMLInputElement>("#journey")?.value.trim() ?? "";
  const journeyLink = document.querySelector<HTMLInputElement>("#journey-link")?.value.trim() ?? "";
  const round = Number(document.querySelector<HTMLSelectElement>("#round")?.value ?? 1);
  const date = document.querySelector<HTMLInputElement>("#date")?.value || new Date().toISOString().slice(0, 10);

  if (!designer || !journey) {
    window.alert("Preencha o nome do designer e a jornada.");
    return;
  }

  if (!form.errors.length) {
    window.alert("Adicione ao menos um erro antes de finalizar.");
    return;
  }

  const config = currentConfig();
  const points = maturityPoints(config);
  const level = findMaturityLevel(config, points);

  records.push({
    id: Date.now(),
    disciplineId: config.id,
    designer,
    journey,
    journeyLink,
    round,
    date,
    checkedCriteria: [...form.checkedCriteria],
    maturityPoints: points,
    maturityLevel: level.id,
    errors: [...form.errors],
  });

  saveRecords(records);
  resetForm(config.id);
  render();
  document.querySelector<HTMLElement>("#save-msg")?.classList.add("visible");
}

app.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const pageButton = target.closest<HTMLElement>("[data-page]");
  const disciplineButton = target.closest<HTMLElement>("[data-discipline]");
  const criterionButton = target.closest<HTMLElement>("[data-criterion]");
  const categoryButton = target.closest<HTMLElement>("[data-category]");
  const errorButton = target.closest<HTMLElement>("[data-error]");
  const actionButton = target.closest<HTMLElement>("[data-action]");
  const removeButton = target.closest<HTMLElement>("[data-remove-error]");

  if (pageButton) {
    activePage = pageButton.dataset.page as PageId;
    render();
  } else if (disciplineButton) {
    resetForm(disciplineButton.dataset.discipline as DisciplineId);
    render();
  } else if (criterionButton) {
    const id = criterionButton.dataset.criterion!;
    form.checkedCriteria.has(id) ? form.checkedCriteria.delete(id) : form.checkedCriteria.add(id);
    render();
  } else if (categoryButton) {
    form.selectedCategoryId = categoryButton.dataset.category!;
    form.selectedErrorId = null;
    render();
  } else if (errorButton) {
    form.selectedErrorId = errorButton.dataset.error!;
    render();
  } else if (removeButton) {
    form.errors.splice(Number(removeButton.dataset.removeError), 1);
    render();
  } else if (actionButton?.dataset.action === "add-error") {
    addError();
  } else if (actionButton?.dataset.action === "save") {
    saveValidation();
  } else if (actionButton?.dataset.action === "clear") {
    resetForm(form.disciplineId);
    render();
  }
});

app.addEventListener("change", (event) => {
  const target = event.target as HTMLSelectElement;

  if (target.matches("[data-filter]")) {
    activeFilter = target.value as FilterId;
    render();
  }
});

loadConfigs()
  .then((loadedConfigs) => {
    configs = loadedConfigs;
    resetForm("content");
    render();
  })
  .catch((error: Error) => {
    app.innerHTML = `<div class="fatal-error"><strong>Erro ao iniciar</strong><p>${error.message}</p></div>`;
  });
