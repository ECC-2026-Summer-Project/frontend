import { authHeader, apiFetch } from './client';

export async function getReport(token, reportId) {
  const data = await apiFetch(`/api/reports/${reportId}`, {
    headers: authHeader(token),
  });
  return data;
}
