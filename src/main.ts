import "./styles/styles.scss";
import { findMaturityLevel, loadConfigs } from "./lib/config";
import { icon, type FilterId, type PageId, type RenderContext } from "./lib/render";
import { createRecord, loadRecords, type FormState } from "./lib/state";
import type { DisciplineConfig, DisciplineId, ValidationRecord } from "./lib/types";
import { renderDashboard } from "./pages/dashboard";
import { renderDesigners } from "./pages/designers";
import { renderHistory } from "./pages/history";
import { renderMaturityScale } from "./pages/maturity-scale";
import { renderNewValidation } from "./pages/new-validation";
import { renderTaxonomy } from "./pages/taxonomy";

const app = document.querySelector<HTMLDivElement>("#app")!;
let configs: DisciplineConfig[] = [];
let records: ValidationRecord[] = [];
let activePage: PageId = "nova";
let activeFilter: FilterId = "all";
let form: FormState;

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

function renderContext(): RenderContext {
  return {
    configs,
    records,
    activeFilter,
    form,
    currentConfig,
    configById,
    filteredRecords,
    maturityPoints,
  };
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
  const context = renderContext();

  const pages: Record<PageId, (context: RenderContext) => string> = {
    nova: renderNewValidation,
    historico: renderHistory,
    dashboard: renderDashboard,
    designers: renderDesigners,
    taxonomia: renderTaxonomy,
    regua: renderMaturityScale,
  };

  main.innerHTML = pages[activePage](context);
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

async function saveValidation(): Promise<void> {
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

  const record = await createRecord({
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

  records.push(record);
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
    void saveValidation().catch((error: Error) => window.alert(error.message));
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
  .then(async (loadedConfigs) => {
    configs = loadedConfigs;

    try {
      records = await loadRecords();
    } catch (error) {
      records = [];
      console.warn(error);
    }

    resetForm("content");
    render();
  })
  .catch((error: Error) => {
    app.innerHTML = `<div class="fatal-error"><strong>Erro ao iniciar</strong><p>${error.message}</p></div>`;
  });
