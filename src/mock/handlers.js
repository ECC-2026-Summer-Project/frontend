import { http, HttpResponse } from 'msw';

const existingUsers = [
  { user_id: 'invest_lover', password: 'abcd1234' },
  { user_id: 'test1234', password: '12345678' },
];

export const handlers = [
  http.post('/api/users/signup', async ({ request }) => {
    const body = await request.json();
    const { user_id, password } = body;
    if (!user_id || !password) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '비밀번호는 8자 이상이어야 합니다.',
          },
        },
        { status: 400 },
      );
    }
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
    if (!foundUser || foundUser.password !== password) {
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
          accessToken: 'fake-access-jwt-token',
          refreshToken: 'fake-refresh-jwt-token',
          expiresIn: 3600,
          user_id: foundUser.user_id,
        },
        error: null,
      },
      { status: 200 },
    );
  }),
];
