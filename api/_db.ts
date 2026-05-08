import { MongoClient, type Collection, type Document } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB ?? "ops_validation";
const recordsCollectionName = process.env.MONGODB_RECORDS_COLLECTION ?? "validation_records";

let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (!mongoUri) {
    throw new Error("MONGODB_URI não configurada.");
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(mongoUri);
    await cachedClient.connect();
  }

  return cachedClient;
}

export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
  const client = await getClient();
  return client.db(databaseName).collection<T>(collectionName);
}

export async function getRecordsCollection<T extends Document>(): Promise<Collection<T>> {
  return getCollection<T>(recordsCollectionName);
}
