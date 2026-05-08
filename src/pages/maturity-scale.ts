import { disciplineBadge, renderFilter, toneClassByLevel, type RenderContext } from "../lib/render";

export function renderMaturityScale(context: RenderContext): string {
  const selectedConfigs = context.activeFilter === "all" ? context.configs : [context.configById(context.activeFilter)];

  return `
    <section class="page active">
      <div class="page-header">
        <div>
          <h1 class="page-title">Régua de maturidade</h1>
          <p class="page-sub">Critérios objetivos e faixas de pontuação por frente.</p>
        </div>
        ${renderFilter(context)}
      </div>
      ${selectedConfigs.map((config) => `
        <div class="section-title">${disciplineBadge(context, config.id)}<h2>${config.name}</h2></div>
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
