import { getRecordsCollection } from "./_db.js";
import type { DisciplineId, MaturityLevel, PracticeArea, Severity, ValidationErrorEntry, ValidationRecord } from "../src/lib/types";

interface ApiRequest {
  method?: string;
  body: unknown;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(payload: unknown): void;
  };
}

interface ValidationRecordDocument extends Omit<ValidationRecord, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

type NewValidationRecordPayload = Omit<ValidationRecord, "id">;

const allowedDisciplineIds = new Set<DisciplineId>(["content", "system", "accessibility"]);
const allowedPracticeAreas = new Set<PracticeArea>([
  "App Vivo",
  "Vivo Empresas",
  "Portais & E-comm",
  "Evolução",
  "Design Horizontal",
]);
const allowedMaturityLevels = new Set<MaturityLevel["id"]>(["alta", "media", "baixa"]);
const allowedSeverities = new Set<Severity>(["critico", "alto", "medio", "baixo"]);

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  try {
    if (request.method === "GET") {
      await listRecords(response);
      return;
    }

    if (request.method === "POST") {
      await createRecord(request, response);
      return;
    }

    response.setHeader("Allow", "GET, POST");
    response.status(405).json({ error: "Método não permitido." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    response.status(500).json({ error: message });
  }
}

async function listRecords(response: ApiResponse): Promise<void> {
  const collection = await getRecordsCollection<ValidationRecordDocument>();
  const records = await collection.find({}).sort({ createdAt: -1 }).limit(500).toArray();

  response.status(200).json({
    records: records.map((record) => ({
      id: record._id.toHexString(),
      disciplineId: record.disciplineId,
      designer: record.designer,
      practiceArea: record.practiceArea,
      journey: record.journey,
      journeyLink: record.journeyLink,
      round: record.round,
      date: record.date,
      checkedCriteria: record.checkedCriteria,
      maturityPoints: record.maturityPoints,
      maturityLevel: record.maturityLevel,
      errors: record.errors,
    })),
  });
}

async function createRecord(request: ApiRequest, response: ApiResponse): Promise<void> {
  const payload = normalizeRecordPayload(request.body);
  const collection = await getRecordsCollection<ValidationRecordDocument>();
  const now = new Date();
  const document: ValidationRecordDocument = {
    ...payload,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(document);

  response.status(201).json({
    record: {
      id: result.insertedId.toHexString(),
      ...payload,
    },
  });
}

function normalizeRecordPayload(body: unknown): NewValidationRecordPayload {
  if (!isRecordPayload(body)) {
    throw new Error("Payload de validação inválido.");
  }

  return {
    disciplineId: body.disciplineId,
    designer: body.designer.trim(),
    practiceArea: body.practiceArea,
    journey: body.journey.trim(),
    journeyLink: body.journeyLink.trim(),
    round: body.round,
    date: body.date,
    checkedCriteria: body.checkedCriteria,
    maturityPoints: body.maturityPoints,
    maturityLevel: body.maturityLevel,
    errors: body.errors.map((error) => ({
      categoryId: error.categoryId.trim(),
      categoryLabel: error.categoryLabel.trim(),
      errorId: error.errorId.trim(),
      name: error.name.trim(),
      severity: error.severity,
      avoidable: error.avoidable,
      note: error.note.trim(),
    })),
  };
}

function isRecordPayload(value: unknown): value is NewValidationRecordPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as NewValidationRecordPayload;

  return (
    allowedDisciplineIds.has(payload.disciplineId) &&
    typeof payload.designer === "string" &&
    payload.designer.trim().length > 0 &&
    allowedPracticeAreas.has(payload.practiceArea) &&
    typeof payload.journey === "string" &&
    payload.journey.trim().length > 0 &&
    typeof payload.journeyLink === "string" &&
    Number.isInteger(payload.round) &&
    payload.round >= 1 &&
    payload.round <= 3 &&
    typeof payload.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(payload.date) &&
    Array.isArray(payload.checkedCriteria) &&
    payload.checkedCriteria.every((criterion) => typeof criterion === "string") &&
    Number.isInteger(payload.maturityPoints) &&
    allowedMaturityLevels.has(payload.maturityLevel) &&
    Array.isArray(payload.errors) &&
    payload.errors.length > 0 &&
    payload.errors.every(isValidationError)
  );
}

function isValidationError(value: unknown): value is ValidationErrorEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const error = value as ValidationErrorEntry;

  return (
    typeof error.categoryId === "string" &&
    typeof error.categoryLabel === "string" &&
    typeof error.errorId === "string" &&
    typeof error.name === "string" &&
    allowedSeverities.has(error.severity) &&
    typeof error.avoidable === "boolean" &&
    typeof error.note === "string"
  );
}
