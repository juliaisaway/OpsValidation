import { disciplineBadge, renderFilter, severityBadge, type RenderContext } from "../lib/render";

export function renderTaxonomy(context: RenderContext): string {
  const selectedConfigs = context.activeFilter === "all" ? context.configs : [context.configById(context.activeFilter)];

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Taxonomia de erros</h1>
          <p class="page-sub">Categorias e tipos de erro definidos em arquivos JSON por frente.</p>
        </div>
        ${renderFilter(context)}
      </div>
      ${selectedConfigs.map((config) => `
        <div class="section-title">${disciplineBadge(context, config.id)}<h2>${config.name}</h2></div>
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
