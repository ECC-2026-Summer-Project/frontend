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

// invest_lover 데모 계정이 reportId 1번을 이미 쓰고 있어 2번부터 발급
let reportIdSeq = 2;

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
// 필드명은 실제 백엔드 StockInfoResponse(industry, listedDate, per, employees ...)에 맞춥니다.
const companyInfoExtra = {
  '005930': {
    description:
      '삼성전자는 반도체, 스마트폰, 가전 등을 생산하는 국내 최대 전자기업으로, 메모리 반도체와 모바일 사업을 중심으로 글로벌 시장을 선도하고 있습니다.',
    ceo: '한종희',
    listedDate: '1975-06-11',
    per: 15.2,
    employees: 120000,
  },
  '000660': {
    description:
      'SK하이닉스는 D램과 낸드플래시 등 메모리 반도체를 전문으로 생산하는 기업으로, AI 서버향 고대역폭 메모리(HBM) 시장에서 두각을 나타내고 있습니다.',
    ceo: '곽노정',
    listedDate: '1996-12-26',
    per: 22.4,
    employees: 32000,
  },
  '035420': {
    description:
      'NAVER는 검색, 커머스, 콘텐츠, 핀테크 등 다양한 인터넷 서비스를 제공하는 국내 대표 IT 플랫폼 기업입니다.',
    ceo: '최수연',
    listedDate: '2008-11-28',
    per: 28.7,
    employees: 4700,
  },
};

/** companyInfoExtra에 없는 종목(신규 추가 종목 등)을 위한 폴백 정보 */
function getCompanyInfoExtra(stockId) {
  return (
    companyInfoExtra[stockId] || {
      description: '기업 개요 정보가 아직 등록되지 않았습니다.',
      ceo: '-',
      listedDate: null,
      per: null,
      employees: null,
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

// 실시간 뉴스 목록 (실제 백엔드는 수집된 뉴스를 내려주지만, mock은 고정 더미)
const mockNews = [
  {
    newsId: 1,
    title: '에코프로, 2분기 실적 시장 기대치 상회… 주가 강세',
    content:
      '에코프로가 2분기 영업이익이 전년 동기 대비 크게 늘며 시장 컨센서스를 웃돌았다. 증권가에서는 하반기 양극재 출하량 증가와 판가 안정화에 힘입어 실적 개선세가 이어질 것으로 내다봤다.',
    publishedAt: '2026-08-27T09:10:00',
  },
  {
    newsId: 2,
    title: '삼성전자, HBM 신규 공급 계약 임박 보도',
    content:
      '삼성전자가 주요 고객사와 차세대 고대역폭메모리(HBM) 공급 계약 체결을 눈앞에 두고 있다는 보도가 나왔다. 회사 측은 "고객사와 관련해 확인해줄 수 없다"는 입장이다.',
    publishedAt: '2026-08-27T08:40:00',
  },
  {
    newsId: 3,
    title: '美 연준 인사 "금리 인하 신중해야"… 위험자산 변동성 확대',
    content:
      '미국 연방준비제도 고위 인사가 물가 둔화 흐름이 확인되기 전까지 금리 인하에 신중해야 한다고 발언하면서 글로벌 증시가 출렁였다. 국내 증시도 외국인 매도세가 이어지며 약세를 보였다.',
    publishedAt: '2026-08-27T07:55:00',
  },
  {
    newsId: 4,
    title: '2차전지 관련주, 정책 기대감에 동반 상승',
    content:
      '정부가 이차전지 산업 지원 방안을 검토 중이라는 소식에 관련주가 일제히 강세를 나타냈다. 다만 일부 종목은 단기 급등에 따른 차익 실현 매물도 함께 출회됐다.',
    publishedAt: '2026-08-27T07:20:00',
  },
];

// user_id -> 상세 화면을 연(=열람이 시작된) 뉴스 ID 집합. views(체류시간) 기록 전 검증용.
const newsViewStarted = {};

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
    const { userId, password } = body;
    if (existingUsers.some((user) => user.user_id === userId)) {
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
      user_id: userId,
      password,
      balance: 10000000,
      holdings: [],
      watchlist: [],
    }); // 객체로 저장
    return HttpResponse.json(
      { success: true, data: { userId }, error: null },
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

  //로그아웃-------------------------------------------------------------------
  http.post('/api/users/logout', async ({ request }) => {
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

    // 재사용 방지: accessToken 무효화 (refreshToken도 실제로는 서버 DB에서 폐기해야 함)
    invalidatedTokens.add(tokenInfo.token);

    return HttpResponse.json(
      { success: true, data: { loggedOut: true }, error: null },
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
  // 실제 백엔드 경로: PATCH /api/users/password (주의: /me 가 붙지 않음)
  http.patch('/api/users/password', async ({ request }) => {
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
        volume: Math.round(stock.volume * (0.02 + rand() * 0.03)),
      });
      price = close;
    }

    // 실제 백엔드(StockController)는 { interval, range }로 감싸지 않고
    // 캔들 배열을 data로 그대로 내려줍니다. mock도 동일한 형태로 맞춥니다.
    return HttpResponse.json(
      { success: true, data: candles },
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

    // 실제 백엔드(StockController)는 { trades }로 감싸지 않고
    // 체결 내역 배열을 data로 그대로 내려줍니다. mock도 동일한 형태로 맞춥니다.
    return HttpResponse.json({ success: true, data: trades }, { status: 200 });
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
    const currentYear = new Date().getFullYear();

    // 실제 백엔드(StockController)는 요약 객체가 아니라
    // 연도별 배당 내역 배열({ year, amountPerShare, yieldRate }[])을 data로 그대로 내려줍니다.
    const history = [0, 1, 2, 3].map((i) => {
      const amountPerShare = Math.round((rand() * 1500 + 200) / 50) * 50;
      const yieldRate = Number(
        (((amountPerShare * 4) / stock.currentPrice) * 100).toFixed(1),
      );
      return { year: currentYear - i, amountPerShare, yieldRate };
    });

    return HttpResponse.json({ success: true, data: history }, { status: 200 });
  }),

  //기업정보-------------------------------------------------------------------
  // 실제 백엔드(StockController)는 GET /api/stocks/:stockId/info 로 노출합니다.
  http.get('/api/stocks/:stockId/info', ({ request, params }) => {
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
          industry: stock.sector,
          marketCap: stock.marketCap,
          dividendYield: 0,
          ...getCompanyInfoExtra(stockId),
        },
      },
      { status: 200 },
    );
  }),

  //==================================레포트================================================
  //레포트 생성-------------------------------------------------------------------
  // 실제 백엔드는 UserActionLog/TradeHistory를 집계해 계산하지만,
  // mock은 화면 확인용으로 간단한 더미 값을 채워 넣습니다.
  http.post('/api/reports', ({ request }) => {
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

    const reportId = reportIdSeq++;
    const createdAt = new Date().toISOString();

    mockReports[tokenInfo.user_id] = {
      reportId,
      createdAt,

      investmentStyle: {
        type: '신중추종형',
        score: 60,
        description:
          '추천을 참고하면서도 정보를 충분히 확인한 뒤 투자하는 성향을 보였습니다.',
      },

      investmentSummary: {
        totalReturnRate: 0,
        totalPurchaseAmount: 0,
        totalEvaluationAmount: 0,
        totalProfitLoss: 0,
        totalTradeCount: 0,
      },

      triggerSensitivity: {
        aiRecommendationScore: 0,
        surgingStockScore: 0,
        newsInformationScore: 0,
      },

      behaviorAnalysis: {
        buyCount: 0,
        sellCount: 0,
        viewedNewsCount: 0,
        aiRecommendedPurchaseCount: 0,
      },

      bestPerformingStock: { stockId: null, stockName: '-', returnRate: 0 },
      worstPerformingStock: { stockId: null, stockName: '-', returnRate: 0 },

      feedback:
        '투자 전 충분한 정보를 확인하고 자신만의 기준에 따라 판단해 보세요.',
    };

    return HttpResponse.json(
      { success: true, data: { reportId, createdAt }, error: null },
      { status: 201 },
    );
  }),

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

  //==================================뉴스================================================
  //뉴스 목록 조회-------------------------------------------------------------------
  http.get('/api/news', ({ request }) => {
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
    const excludeParam = url.searchParams.get('excludeNewsIds');
    const excludeIds = excludeParam
      ? excludeParam.split(',').map((id) => Number(id.trim()))
      : [];

    const items = mockNews
      .filter((item) => !excludeIds.includes(item.newsId))
      .map(({ newsId, title }) => ({ newsId, title }));

    return HttpResponse.json({ success: true, data: items }, { status: 200 });
  }),

  //뉴스 상세 조회-------------------------------------------------------------------
  http.get('/api/news/:newsId', ({ request, params }) => {
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

    const newsId = Number(params.newsId);
    const found = mockNews.find((item) => item.newsId === newsId);
    if (!found) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NEWS_NOT_FOUND', message: '존재하지 않는 뉴스입니다.' },
        },
        { status: 404 },
      );
    }

    // 상세를 조회하면 열람이 시작된 것으로 보고, 이후 views(체류시간) 기록을 허용합니다.
    (newsViewStarted[tokenInfo.user_id] ??= new Set()).add(newsId);

    return HttpResponse.json({ success: true, data: found }, { status: 200 });
  }),

  //뉴스 열람 시간 기록-------------------------------------------------------------------
  http.post('/api/news/:newsId/views', async ({ request, params }) => {
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

    const newsId = Number(params.newsId);
    const found = mockNews.find((item) => item.newsId === newsId);
    if (!found) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NEWS_NOT_FOUND', message: '존재하지 않는 뉴스입니다.' },
        },
        { status: 404 },
      );
    }

    if (!newsViewStarted[tokenInfo.user_id]?.has(newsId)) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NEWS_VIEW_NOT_STARTED',
            message: '뉴스 열람이 시작되지 않았습니다.',
          },
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({ success: true, data: null }, { status: 200 });
  }),
];
