import type { ModerationRecord } from "../types";
import client from "./client";

export interface HistoryQuery {
  page?: number;
  page_size?: number;
  verdict?: string;
  file_type?: string;
  batch_id?: string;
}

export async function listRecords(q: HistoryQuery = {}): Promise<ModerationRecord[]> {
  const { data } = await client.get<ModerationRecord[]>("/history/", { params: q });
  return data;
}

export interface HistoryStats {
  total: number;
  breakdown: Record<string, number>;
}

export async function getStats(): Promise<HistoryStats> {
  const { data } = await client.get<HistoryStats>("/history/stats");
  return data;
}
