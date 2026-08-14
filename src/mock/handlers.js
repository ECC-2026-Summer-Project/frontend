import { http, HttpResponse } from 'msw';

const existingUsers = [
  {
    user_id: 'invest_lover',
    password: 'abcd1234',
    passwordChangedAt: '2026-03-12T00:00:00.000Z',
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
    passwordChangedAt: '2026-03-12T00:00:00.000Z',
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

/**
 * 문자열을 시드로 하는 결정적 난수 생성기를 돌려줍니다.
 * 호출할 때마다 0~1 사이의 값을 반환하며, 같은 시드면 항상 같은 순서로 값을 뱉습니다.
 * (주식창 상세 탭들의 실시간 데이터 API가 아직 없어 stockId 기반 더미 데이터에 사용)
 */
function createSeededRandom(seedStr) {
  let seed = 0;
  for (const ch of seedStr) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed % 1000) / 1000;
  };
}

// stockId -> 기업정보 탭 전용 추가 정보 (mockStocks에는 없는 필드)
const companyInfoExtra = {
  '005930': {
    description:
      '삼성전자는 반도체, 스마트폰, 가전 등을 생산하는 국내 최대 전자기업으로, 메모리 반도체와 모바일 사업을 중심으로 글로벌 시장을 선도하고 있습니다.',
    ceo: '한종희',
    listedAt: '1975-06-11',
    fiscalMonthEnd: '12월',
  },
  '000660': {
    description:
      'SK하이닉스는 D램과 낸드플래시 등 메모리 반도체를 전문으로 생산하는 기업으로, AI 서버향 고대역폭 메모리(HBM) 시장에서 두각을 나타내고 있습니다.',
    ceo: '곽노정',
    listedAt: '1996-12-26',
    fiscalMonthEnd: '12월',
  },
  '035420': {
    description:
      'NAVER는 검색, 커머스, 콘텐츠, 핀테크 등 다양한 인터넷 서비스를 제공하는 국내 대표 IT 플랫폼 기업입니다.',
    ceo: '최수연',
    listedAt: '2008-11-28',
    fiscalMonthEnd: '12월',
  },
};

/** companyInfoExtra에 없는 종목(신규 추가 종목 등)을 위한 폴백 정보 */
function getCompanyInfoExtra(stockId) {
  return (
    companyInfoExtra[stockId] || {
      description: '기업 개요 정보가 아직 등록되지 않았습니다.',
      ceo: '-',
      listedAt: '-',
      fiscalMonthEnd: '12월',
    }
  );
}

// user_id -> 레포트 (아직 레포트가 없는 사용자는 키가 없음 -> 404 REPORT_NOT_GENERATED)
const mockReports = {
  invest_lover: {
    reportId: 1,
    createdAt: '2026-08-09T16:30:00',

    investmentStyle: {
      type: '군중심리형',
      score: 88,
      description:
        '추천 종목에 적극적으로 반응하고 비교적 빠르게 투자 판단을 내리는 성향을 보였습니다.',
    },

    investmentSummary: {
      totalReturnRate: 18.4,
      totalPurchaseAmount: 3000000,
      totalEvaluationAmount: 3552000,
      totalProfitLoss: 552000,
      totalTradeCount: 12,
    },

    triggerSensitivity: {
      aiRecommendationScore: 42,
      surgingStockScore: 65,
      newsInformationScore: 88,
    },

    behaviorAnalysis: {
      buyCount: 7,
      sellCount: 5,
      viewedNewsCount: 4,
      aiRecommendedPurchaseCount: 3,
    },

    bestPerformingStock: {
      stockId: '086520',
      stockName: '에코프로',
      returnRate: 24.1,
    },

    worstPerformingStock: {
      stockId: '000660',
      stockName: '테슬라',
      returnRate: -9.3,
    },

    feedback:
      '추천 종목에 비교적 민감하게 반응하는 성향을 보였습니다. 투자 전에 뉴스나 기업 정보를 한 번 더 확인하는 습관을 들여보세요.',
  },
};

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
  // 실제 백엔드 스펙 기준: 요청/응답 모두 camelCase(userId), 에러는 문자열.
  http.post('/api/users/login', async ({ request }) => {
    const body = await request.json();
    const { userId, password } = body;

    const foundUser = existingUsers.find((user) => user.user_id === userId);

    // 아이디가 없거나, 있어도 비밀번호가 다르면 → 둘 다 같은 에러로 처리 (보안 원칙)
    // 탈퇴(soft delete)된 계정도 동일한 에러로 처리해 탈퇴 여부가 노출되지 않게 함
    if (!foundUser || foundUser.password !== password || foundUser.deletedAt) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: '아이디 또는 비밀번호가 올바르지 않습니다.',
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          userId: foundUser.user_id,
          accessToken: `fake-access-jwt-token-${foundUser.user_id}`,
          refreshToken: `fake-refresh-jwt-token-${foundUser.user_id}`,
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

  //비밀번호 변경-------------------------------------------------------------------
  http.patch('/api/users/me/password', async ({ request }) => {
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
    const { currentPassword, newPassword } = body;

    if (foundUser.password !== currentPassword) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_PASSWORD',
            message: '현재 비밀번호가 일치하지 않습니다.',
          },
        },
        { status: 401 },
      );
    }

    foundUser.password = newPassword;
    foundUser.passwordChangedAt = new Date().toISOString();

    return HttpResponse.json(
      {
        success: true,
        data: { passwordChangedAt: foundUser.passwordChangedAt },
        error: null,
      },
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
  // (별도 API 없이 /api/stocks 목록 + 아래 차트/호가 데이터를 축약해 클라이언트에서 구성)

  //차트----------------------------------------------------------------------
  http.get('/api/stocks/:stockId/chart', ({ request, params }) => {
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

    const url = new URL(request.url);
    const interval = url.searchParams.get('interval') || '1일';
    const range = url.searchParams.get('range') || '1일';

    const rand = createSeededRandom(`${stockId}-chart-${interval}-${range}`);
    const trend = stock.changeRate >= 0 ? 1 : -1;
    const candleCount = 30;
    let price = stock.currentPrice * (1 - trend * 0.05);
    const candles = [];
    for (let i = 0; i < candleCount; i += 1) {
      const open = price;
      const drift = trend * stock.currentPrice * 0.002 * rand();
      const noise = (rand() - 0.5) * stock.currentPrice * 0.01;
      const close = Math.max(1, open + drift + noise);
      const high = Math.max(open, close) + rand() * stock.currentPrice * 0.004;
      const low = Math.max(
        1,
        Math.min(open, close) - rand() * stock.currentPrice * 0.004,
      );
      candles.push({
        time: i,
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
      });
      price = close;
    }

    return HttpResponse.json(
      { success: true, data: { interval, range, candles } },
      { status: 200 },
    );
  }),

  //호가----------------------------------------------------------------------
  http.get('/api/stocks/:stockId/orderbook', ({ request, params }) => {
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

    const tick =
      stock.currentPrice >= 100000
        ? 1000
        : stock.currentPrice >= 10000
          ? 100
          : 10;
    const rand = createSeededRandom(`${stockId}-orderbook`);
    const nextQuantity = () => Math.round(rand() * 900) + 100;

    // 호가창 위쪽일수록(=현재가에서 멀수록) 먼저 나열
    const asks = [5, 4, 3, 2, 1].map((step) => ({
      price: stock.currentPrice + tick * step,
      quantity: nextQuantity(),
    }));
    const bids = [1, 2, 3, 4, 5].map((step) => ({
      price: stock.currentPrice - tick * step,
      quantity: nextQuantity(),
    }));

    return HttpResponse.json(
      {
        success: true,
        data: { currentPrice: stock.currentPrice, asks, bids },
      },
      { status: 200 },
    );
  }),

  //체결----------------------------------------------------------------------
  http.get('/api/stocks/:stockId/trades', ({ request, params }) => {
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

    const tick =
      stock.currentPrice >= 100000
        ? 1000
        : stock.currentPrice >= 10000
          ? 100
          : 10;
    const rand = createSeededRandom(`${stockId}-trades`);

    let price = stock.currentPrice;
    let time = new Date();
    const trades = Array.from({ length: 20 }, () => {
      price += Math.round((rand() - 0.5) * 2) * tick;
      price = Math.max(tick, price);
      time = new Date(time.getTime() - (Math.round(rand() * 40) + 5) * 1000);
      return {
        time: time.toTimeString().slice(0, 8),
        price,
        quantity: Math.round(rand() * 20) + 1,
        side: rand() > 0.5 ? 'BUY' : 'SELL',
      };
    });

    return HttpResponse.json(
      { success: true, data: { trades } },
      { status: 200 },
    );
  }),

  //배당----------------------------------------------------------------------
  http.get('/api/stocks/:stockId/dividends', ({ request, params }) => {
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

    const rand = createSeededRandom(`${stockId}-dividends`);
    const dividendPerShare = Math.round((rand() * 1500 + 200) / 50) * 50;
    const dividendYield = Number(
      (((dividendPerShare * 4) / stock.currentPrice) * 100).toFixed(1),
    );
    const payoutRatio = Number((rand() * 30 + 5).toFixed(1));

    const history = [0, 1, 2, 3].map((i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i * 3);
      return {
        paidAt: date.toISOString().slice(0, 10),
        dividendPerShare,
        yield: dividendYield,
      };
    });

    return HttpResponse.json(
      {
        success: true,
        data: { dividendYield, dividendPerShare, payoutRatio, history },
      },
      { status: 200 },
    );
  }),

  //기업정보-------------------------------------------------------------------
  http.get('/api/stocks/:stockId/company-info', ({ request, params }) => {
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

    return HttpResponse.json(
      {
        success: true,
        data: {
          stockId: stock.stockId,
          name: stock.name,
          sector: stock.sector,
          market: stock.market,
          ...getCompanyInfoExtra(stockId),
        },
      },
      { status: 200 },
    );
  }),

  //==================================레포트================================================
  //레포트 조회-------------------------------------------------------------------
  http.get('/api/reports/:reportId', ({ request, params }) => {
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

    const { reportId } = params;
    const report = mockReports[tokenInfo.user_id];

    if (!report || String(report.reportId) !== String(reportId)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'REPORT_NOT_GENERATED',
            message: '생성된 레포트가 없습니다.',
          },
        },
        { status: 404 },
      );
    }

    return HttpResponse.json(
      { success: true, data: report },
      { status: 200 },
    );
  }),
];
