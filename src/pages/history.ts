import { disciplineBadge, escapeHtml, icon, maturityPill, renderFilter, type RenderContext } from "../lib/render";

export function renderHistory(context: RenderContext): string {
  const scopedRecords = context.filteredRecords();

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Histórico de validações</h1>
          <p class="page-sub">Todas as validações registradas com filtro por frente.</p>
        </div>
        ${renderFilter(context)}
      </div>
      ${!scopedRecords.length ? `<div class="empty-state">${icon("database-off")}Nenhuma validação registrada para este filtro</div>` : `
        <div class="table-wrap"><table>
          <thead><tr><th>Data</th><th>Frente</th><th>Designer</th><th>Jornada</th><th>Link</th><th>Rodada</th><th>Maturidade</th><th>Erros</th><th>Evitáveis</th><th>Críticos</th></tr></thead>
          <tbody>
            ${scopedRecords.slice().reverse().map((record) => {
              const config = context.configById(record.disciplineId);
              const avoidable = record.errors.filter((error) => error.avoidable).length;
              const critical = record.errors.filter((error) => error.severity === "critico").length;
              return `
                <tr>
                  <td class="muted-cell">${record.date}</td>
                  <td>${disciplineBadge(context, record.disciplineId)}</td>
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
