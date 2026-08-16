export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export async function apiFetch(
  path,
  options = {},
  fallbackMessage = '요청에 실패했습니다.',
) {
  const response = await fetch(`${API_BASE_URL}${path}`, options); //주소 합치기
  const body = await response.json(); //json으로 파싱하기

  if (!body.success) {
    //성공 여부 확인하기
    const error = new Error(
      (typeof body.error === 'string' ? body.error : body.error?.message) ||
        fallbackMessage,
    );
    error.code = body.error?.code;
    throw error;
  }

  return body.data; //데이터 뽑아서 반환하기
}
