export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export async function apiFetch(
  path,
  options = {},
  fallbackMessage = '요청에 실패했습니다.',
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include', // cross-origin 요청에도 세션 쿠키(JSESSIONID) 포함
    ...options,
  }); //주소 합치기

  let body;
  try {
    body = await response.json(); //json으로 파싱하기
  } catch {
    // 서버가 JSON이 아닌 응답(예: 401 시 text/plain "Invalid Token")을 줄 때
    // 파싱 에러가 그대로 노출되지 않도록 안전하게 처리
    throw new Error(fallbackMessage);
  }

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
