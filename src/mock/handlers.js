import { http, HttpResponse } from 'msw';

const existingUsers = [
  {
    user_id: 'invest_lover',
    password: 'abcd1234',
    balance: 10000000,
    holdings: [],
    watchlist: [
      { stockId: '005930', addedAt: '2024-07-20T10:00:00Z' },
      { stockId: '035420', addedAt: '2024-07-21T09:30:00Z' },
    ],
  },
  {
    user_id: 'test1234',
    password: '12345678',
    balance: 10000000,
    holdings: [],
    watchlist: [],
  },
];

const mockStocks = [
  {
    stockId: '005930',
    name: '삼성전자',
    market: 'KOSPI',
    sector: '전기전자',
    currentPrice: 71500,
    changeRate: 1.42,
    changeAmount: 1000,
    volume: 12345678,
    marketCap: 427000000000000,
  },
  {
    stockId: '000660',
    name: 'SK하이닉스',
    market: 'KOSPI',
    sector: '전기전자',
    currentPrice: 132000,
    changeRate: -0.75,
    changeAmount: -1000,
    volume: 3456789,
    marketCap: 96000000000000,
  },
  {
    stockId: '035420',
    name: 'NAVER',
    market: 'KOSPI',
    sector: '서비스업',
    currentPrice: 185000,
    changeRate: 2.21,
    changeAmount: 4000,
    volume: 987654,
    marketCap: 30000000000000,
  },
];

let orderIdSeq = 501;
const mockOrders = [];

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
  //회원가입-------------------------------------------------------------------
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
    existingUsers.push({
      user_id,
      password,
      balance: 10000000,
      holdings: [],
      watchlist: [],
    }); // 객체로 저장
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

  // 로그인-------------------------------------------------------------------
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

  //회원탈퇴-------------------------------------------------------------------
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

  //==================================주식창================================================
  //기업리스트-------------------------------------------------------------------
  http.get('/api/stocks', ({ request }) => {
    const tokenInfo = getUserIdFromToken(request);
    if (!tokenInfo) {
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

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const sector = url.searchParams.get('sector');
    const sort = url.searchParams.get('sort'); // price | changeRate | volume
    const order = url.searchParams.get('order') || 'desc'; // asc | desc
    const page = Number(url.searchParams.get('page')) || 1;
    const size = Number(url.searchParams.get('size')) || 20;

    const validSorts = ['price', 'changeRate', 'volume'];
    if (sort && !validSorts.includes(sort)) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_SORT',
            message: 'sort 값이 올바르지 않습니다.',
          },
        },
        { status: 400 },
      );
    }

    let result = [...mockStocks];

    if (keyword) {
      result = result.filter((stock) => stock.name.includes(keyword));
    }
    if (sector) {
      result = result.filter((stock) => stock.sector === sector);
    }
    if (sort) {
      const sortKey = sort === 'price' ? 'currentPrice' : sort;
      result.sort((a, b) =>
        order === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey],
      );
    }

    const total = result.length;
    const start = (page - 1) * size;
    const paged = result.slice(start, start + size);

    return HttpResponse.json(
      { success: true, data: paged, total, page, pageSize: size, error: null },
      { status: 200 },
    );
  }),

  //매수/매도 화면-------------------------------------------------------------------
  http.post('/api/orders', async ({ request }) => {
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
    const { stockId, side, orderType, quantity, price } = body;

    const stock = mockStocks.find((s) => s.stockId === stockId);
    if (!stock) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'STOCK_NOT_FOUND',
            message: '존재하지 않는 종목입니다.',
          },
        },
        { status: 404 },
      );
    }

    // 시장가는 현재가로 즉시 체결, 지정가는 body의 price를 그대로 사용
    const orderPrice = orderType === 'MARKET' ? stock.currentPrice : price;
    const totalAmount = orderPrice * quantity;

    const holding = foundUser.holdings.find((h) => h.stockId === stockId);

    if (side === 'BUY' && foundUser.balance < totalAmount) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: '잔액이 부족합니다.',
          },
        },
        { status: 400 },
      );
    }

    if (side === 'SELL' && (!holding || holding.quantity < quantity)) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INSUFFICIENT_HOLDINGS',
            message: '보유 수량이 부족합니다.',
          },
        },
        { status: 400 },
      );
    }

    // 시장가만 즉시 체결(FILLED), 지정가는 대기(PENDING) 상태로 두고 잔액/보유량 반영 안함
    const status = orderType === 'MARKET' ? 'FILLED' : 'PENDING';

    if (status === 'FILLED') {
      if (side === 'BUY') {
        foundUser.balance -= totalAmount;
        if (holding) holding.quantity += quantity;
        else foundUser.holdings.push({ stockId, quantity });
      } else {
        foundUser.balance += totalAmount;
        holding.quantity -= quantity;
      }
    }

    const newOrder = {
      orderId: String(orderIdSeq++),
      stockId,
      stockName: stock.name,
      side,
      orderType,
      quantity,
      price: orderPrice,
      totalAmount,
      status,
      createdAt: new Date().toISOString(),
    };
    mockOrders.push(newOrder);

    return HttpResponse.json(
      { success: true, data: newOrder, error: null },
      { status: 200 },
    );
  }),

  //관심 종목 추가-------------------------------------------------------------------
  http.post('/api/watchlist/:stockId', ({ request, params }) => {
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

    const { stockId } = params;
    const stock = mockStocks.find((s) => s.stockId === stockId);

    if (!stock) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'STOCK_NOT_FOUND',
            message: '존재하지 않는 종목입니다.',
          },
        },
        { status: 404 },
      );
    }

    const alreadyAdded = foundUser.watchlist.some(
      (item) => item.stockId === stockId,
    );
    if (alreadyAdded) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'ALREADY_IN_WATCHLIST',
            message: '이미 관심 종목에 추가되어 있습니다.',
          },
        },
        { status: 409 },
      );
    }

    const addedAt = new Date().toISOString();
    foundUser.watchlist.push({ stockId, addedAt });

    return HttpResponse.json(
      {
        success: true,
        message: '관심 종목에 추가되었습니다.',
        data: { stockId: stock.stockId, name: stock.name, addedAt },
      },
      { status: 201 },
    );
  }),

  //관심 종목 삭제-------------------------------------------------------------------
  http.delete('/api/watchlist/:stockId', ({ request, params }) => {
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

    const { stockId } = params;
    const index = foundUser.watchlist.findIndex(
      (item) => item.stockId === stockId,
    );

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_IN_WATCHLIST',
            message: '관심 종목에 없는 종목입니다.',
          },
        },
        { status: 404 },
      );
    }

    foundUser.watchlist.splice(index, 1);

    return HttpResponse.json(
      {
        success: true,
        message: '관심 종목에서 삭제되었습니다.',
        data: { stockId },
      },
      { status: 200 },
    );
  }),
  //=======================================주식창-기업별 주식창===========================================
  //요약----------------------------------------------------------------------

  //차트----------------------------------------------------------------------
  //호가----------------------------------------------------------------------
  //체결----------------------------------------------------------------------
  //배당----------------------------------------------------------------------
  //기업정보-------------------------------------------------------------------
];
