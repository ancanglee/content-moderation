// --- 策略 ---
export interface Policy {
  id: number;
  name: string;
  description: string;
  rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PolicyGenerateRequest {
  industry: string;
  content_types: string[];
  additional_requirements: string;
}

export interface PolicyCreateRequest {
  name: string;
  description: string;
  rules: Record<string, unknown>;
}

// 策略规则中的审核类别结构
export interface PolicyCategory {
  name: string;
  description: string;
  severity_levels: {
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
  examples: string[];
  action: "PASS" | "REVIEW" | "FAIL";
}

// 策略规则的完整结构
export interface PolicyRules {
  policy_name: string;
  description: string;
  categories: PolicyCategory[];
  general_guidelines: string[];
}

// --- 审核 ---
export interface ModerationResultData {
  verdict: "PASS" | "FAIL" | "REVIEW";
  confidence: number;
  categories: CategoryDetail[];
  summary: string;
  raw_response?: string;
}

export interface CategoryDetail {
  category: string;
  severity: string;
  detail: string;
}

export interface ModerationRecord {
  id: number;
  file_name: string;
  file_type: string;
  policy_id: number | null;
  result: ModerationResultData;
  status: string;
  batch_id: string | null;
  created_at: string;
}

// --- 批量处理 ---
export interface BatchRequest {
  s3_bucket: string;
  s3_prefix: string;
  policy_id: number | null;
}

export interface BatchStatus {
  id: string;
  s3_prefix: string;
  policy_id: number | null;
  total_files: number;
  processed_files: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

// --- WebSocket 消息 ---
export interface BatchProgressMessage {
  type: "progress" | "result" | "complete" | "error";
  batch_id: string;
  processed: number;
  total: number;
  file_name?: string;
  result?: ModerationResultData;
  error?: string;
}
