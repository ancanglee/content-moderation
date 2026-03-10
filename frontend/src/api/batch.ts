import type { BatchRequest, BatchStatus } from "../types";
import client from "./client";

export async function startBatch(req: BatchRequest): Promise<{ batch_id: string }> {
  const { data } = await client.post<{ batch_id: string }>("/batch/start", req);
  return data;
}

export async function listBatches(): Promise<BatchStatus[]> {
  const { data } = await client.get<BatchStatus[]>("/batch/");
  return data;
}

export async function getBatch(batchId: string): Promise<BatchStatus> {
  const { data } = await client.get<BatchStatus>(`/batch/${batchId}`);
  return data;
}
