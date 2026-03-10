import type { ModerationRecord } from "../types";
import client from "./client";

export interface UploadResponse {
  record_id: number;
  file_name: string;
  file_type: string;
  status: string;
}

/** 上传文件，立即返回记录 ID（审核在后台异步进行） */
export async function uploadFile(
  file: File,
  policyId?: number | null
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  if (policyId) {
    form.append("policy_id", String(policyId));
  }
  const { data } = await client.post<UploadResponse>("/moderation/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
  });
  return data;
}

/** 轮询获取审核结果 */
export async function getModerationResult(recordId: number): Promise<ModerationRecord> {
  const { data } = await client.get<ModerationRecord>(`/moderation/${recordId}`);
  return data;
}

/** 轮询直到审核完成或失败，返回最终结果 */
export function pollModerationResult(
  recordId: number,
  onProgress?: (record: ModerationRecord) => void,
  intervalMs = 3000,
): { promise: Promise<ModerationRecord>; cancel: () => void } {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout>;

  const cancel = () => { cancelled = true; clearTimeout(timer); };

  const promise = new Promise<ModerationRecord>((resolve, reject) => {
    const poll = async () => {
      if (cancelled) { reject(new Error("已取消")); return; }
      try {
        const record = await getModerationResult(recordId);
        onProgress?.(record);
        if (record.status === "completed" || record.status === "failed") {
          resolve(record);
        } else {
          timer = setTimeout(poll, intervalMs);
        }
      } catch (err) {
        reject(err);
      }
    };
    poll();
  });

  return { promise, cancel };
}
