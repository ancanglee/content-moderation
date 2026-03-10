import type { Policy, PolicyCreateRequest, PolicyGenerateRequest } from "../types";
import client from "./client";

export async function listPolicies(): Promise<Policy[]> {
  const { data } = await client.get<Policy[]>("/policy/");
  return data;
}

export async function getPolicy(id: number): Promise<Policy> {
  const { data } = await client.get<Policy>(`/policy/${id}`);
  return data;
}

export async function generatePolicy(req: PolicyGenerateRequest) {
  const { data } = await client.post("/policy/generate", req);
  return data;
}

export async function createPolicy(req: PolicyCreateRequest): Promise<Policy> {
  const { data } = await client.post<Policy>("/policy/", req);
  return data;
}

export async function updatePolicy(
  id: number,
  req: { name?: string; description?: string; rules?: Record<string, unknown> }
): Promise<Policy> {
  const { data } = await client.put<Policy>(`/policy/${id}`, req);
  return data;
}

export async function regeneratePolicy(
  id: number,
  req: PolicyGenerateRequest
): Promise<Policy> {
  const { data } = await client.post<Policy>(`/policy/${id}/regenerate`, req, {
    timeout: 300_000,
  });
  return data;
}

export async function deletePolicy(id: number): Promise<void> {
  await client.delete(`/policy/${id}`);
}
