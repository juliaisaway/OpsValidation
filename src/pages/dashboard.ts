import { severityLabels } from "../lib/config";
import { icon, progressRow, renderFilter, severityBadge, type RenderContext } from "../lib/render";
import type { ValidationRecord } from "../lib/types";

export function renderDashboard(context: RenderContext): string {
  const scopedRecords = context.filteredRecords();

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard de métricas</h1>
          <p class="page-sub">Visão geral por frente ou consolidada.</p>
        </div>
        ${renderFilter(context)}
      </div>
      ${!scopedRecords.length ? `<div class="empty-state">${icon("chart-bar")}Registre validações para ver as métricas</div>` : renderDashboardContent(context, scopedRecords)}
    </section>
  `;
}

function renderDashboardContent(context: RenderContext, scopedRecords: ValidationRecord[]): string {
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
        ${context.configs.map((config) => progressRow(config.name, scopedRecords.filter((record) => record.disciplineId === config.id).length, scopedRecords.length)).join("")}
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
