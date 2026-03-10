import type { ModerationResultData } from "../types";
import client from "./client";

export interface ModerationResponse {
  record_id: number;
  file_name: string;
  file_type: string;
  result: ModerationResultData;
}

export async function uploadAndModerate(
  file: File,
  policyId?: number | null
): Promise<ModerationResponse> {
  const form = new FormData();
  form.append("file", file);
  if (policyId) {
    form.append("policy_id", String(policyId));
  }
  const { data } = await client.post<ModerationResponse>("/moderation/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300_000,
  });
  return data;
}
