import type { DisciplineConfig, DisciplineId, MaturityLevel, Severity } from "./types";

export const disciplineFiles: Record<DisciplineId, string> = {
  content: "/data/content.json",
  system: "/data/system.json",
  accessibility: "/data/accessibility.json",
};

export const severityLabels: Record<Severity, string> = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
};

export async function loadConfigs(): Promise<DisciplineConfig[]> {
  const configs = await Promise.all(
    Object.values(disciplineFiles).map(async (path) => {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`Não foi possível carregar ${path}`);
      }

      return response.json() as Promise<DisciplineConfig>;
    }),
  );

  return configs;
}

export function findMaturityLevel(config: DisciplineConfig, points: number): MaturityLevel {
  return config.maturity.levels.find((level) => points >= level.min && points <= level.max) ?? config.maturity.levels.at(-1)!;
}

export function maxMaturityPoints(config: DisciplineConfig): number {
  return config.maturity.checklist.reduce((total, criterion) => total + criterion.points, 0);
}
