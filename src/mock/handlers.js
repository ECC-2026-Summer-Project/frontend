import { http, HttpResponse } from 'msw';

const existingUsers = [
  { user_id: 'invest_lover', password: 'abcd1234' },
  { user_id: 'test1234', password: '12345678' },
];

// 탈퇴 등으로 무효화된 토큰 목록 (재사용 방지)
const invalidatedTokens = new Set();

const getUserIdFromToken = (request) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token || invalidatedTokens.has(token)) return null;
  return { token, user_id: token.replace('fake-access-jwt-token-', '') };
};

export const handlers = [
  //==================================Signup================================================
  //회원가입
  http.post('/api/users/signup', async ({ request }) => {
    const body = await request.json();
    const { user_id, password } = body;
    if (existingUsers.some((user) => user.user_id === user_id)) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'DUPLICATE_USER_ID',
            message: '이미 사용중인 아이디입니다.',
          },
        },
        { status: 409 },
      );
    }
    existingUsers.push({ user_id, password }); // 객체로 저장
    return HttpResponse.json(
      { success: true, data: { user_id }, error: null },
      { status: 201 },
    );
  }),

  //아이디 중복 확인
  http.get('/api/users/check-id', async ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (existingUsers.some((user) => user.user_id === userId)) {
      return HttpResponse.json({
        success: true,
        data: { available: false },
        error: null,
      });
    } else {
      return HttpResponse.json({
        success: true,
        data: { available: true },
        error: null,
      });
    }
  }),

  // 로그인
  http.post('/api/users/login', async ({ request }) => {
    const body = await request.json();
    const { user_id, password } = body;

    const foundUser = existingUsers.find((user) => user.user_id === user_id);

    // 아이디가 없거나, 있어도 비밀번호가 다르면 → 둘 다 같은 에러로 처리 (보안 원칙)
    // 탈퇴(soft delete)된 계정도 동일한 에러로 처리해 탈퇴 여부가 노출되지 않게 함
    if (!foundUser || foundUser.password !== password || foundUser.deletedAt) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '아이디 또는 비밀번호가 일치하지 않습니다.',
          },
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          accessToken: `fake-access-jwt-token-${foundUser.user_id}`,
          refreshToken: `fake-refresh-jwt-token-${foundUser.user_id}`,
          expiresIn: 3600,
          user_id: foundUser.user_id,
        },
        error: null,
      },
      { status: 200 },
    );
  }),

  //회원탈퇴
  http.delete('/api/users/me', async ({ request }) => {
    const tokenInfo = getUserIdFromToken(request);
    const foundUser = existingUsers.find(
      (user) => user.user_id === tokenInfo?.user_id,
    );

    if (!tokenInfo || !foundUser) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증 정보가 유효하지 않습니다.',
          },
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { password } = body;

    if (foundUser.password !== password) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_PASSWORD',
            message: '비밀번호가 일치하지 않습니다.',
          },
        },
        { status: 401 },
      );
    }

    // soft delete: row는 유지하고 deletedAt만 채워 세션/거래/리포트 연관 데이터 보존
    foundUser.deletedAt = new Date().toISOString();

    // 탈퇴 즉시 현재 accessToken 무효화 (재사용 방지)
    invalidatedTokens.add(tokenInfo.token);

    return HttpResponse.json(
      { success: true, data: { deleted: true }, error: null },
      { status: 200 },
    );
  }),
];
