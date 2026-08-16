import { authHeader, apiFetch } from './client';

export async function getReport(token, reportId) {
  return apiFetch(`/api/reports/${reportId}`, {
    headers: authHeader(token),
  });
}
