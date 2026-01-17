# PPR + _rsc 해시 고정 조합

## 핵심 아이디어

**PPR (Partial Prerendering)**과 **_rsc 해시 고정**을 함께 사용하면:
- ✅ Static Shell은 CDN에 효율적으로 캐싱
- ✅ Dynamic Holes는 매번 서버에서 새로 렌더링
- ✅ 캐시 중복 문제 해결

## 작동 원리

### 1. PPR 없이 해시 고정 (문제 있음)

```
/products/1?_rsc=1 (고정)
→ 전체 RSC Payload 캐싱 (Static + Dynamic 모두)
→ Dynamic 데이터도 캐싱됨 (문제!)
→ 재고 100개가 계속 표시됨
```

### 2. PPR + 해시 고정 (올바른 방법)

```tsx
// app/products/[id]/page.tsx
export const experimental_ppr = true;

export default function ProductPage() {
  return (
    <>
      {/* Static Shell - CDN 캐싱 */}
      <h1>Product Name</h1>
      <p>Price: $100</p>
      
      {/* Dynamic Hole - 캐싱 안 됨 */}
      <Suspense fallback={<Skeleton />}>
        <RealtimeStock /> {/* 매번 서버에서 렌더링 */}
      </Suspense>
    </>
  );
}
```

**요청 흐름:**

```
첫 요청: /products/1?_rsc=1
→ Static Shell 렌더링 + CDN 캐싱
→ Dynamic Hole 별도 스트림으로 전송 (캐싱 안 됨)

두 번째 요청: /products/1?_rsc=1
→ Static Shell: CDN HIT (즉시 반환)
→ Dynamic Hole: 서버에서 다시 렌더링 (최신 데이터)
```

## 실제 구현

### 1. Next.js 설정

```js
// next.config.js
module.exports = {
  experimental: {
    ppr: true,
  },
};
```

### 2. 페이지 레벨 활성화

```tsx
// app/products/[id]/page.tsx
export const experimental_ppr = true;

export default function ProductPage() {
  const product = getStaticProduct(); // 빌드 시 생성
  
  return (
    <>
      {/* Static Shell */}
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      <p>{product.description}</p>
      
      {/* Dynamic Hole */}
      <Suspense fallback={<div>재고 확인 중...</div>}>
        <RealtimeStock productId={product.id} />
      </Suspense>
    </>
  );
}

async function RealtimeStock({ productId }) {
  const stock = await fetchStock(productId, { 
    cache: 'no-store' // 매번 새로 fetch
  });
  
  return <div>현재 재고: {stock.count}개</div>;
}
```

### 3. CloudFront 설정

**Option A: Function으로 정규화**
```js
// cloudfront/normalize-rsc.js 사용
// _rsc 파라미터를 항상 "1"로 변경
```

**Option B: Cache Policy**
```json
// _rsc를 캐시 키에서 제외
// BUT: Dynamic Holes는 별도 메커니즘으로 처리됨
```

## PPR의 핵심 메커니즘

PPR은 단순히 Suspense만 사용하는 게 아닙니다:

1. **빌드 타임**
   - Static Shell을 미리 렌더링
   - Dynamic Holes 위치 표시

2. **런타임**
   - Static Shell을 즉시 전송 (캐시 가능)
   - Dynamic Holes는 **별도 요청**으로 처리
   - Suspense boundary에서 스트리밍

3. **캐싱 전략**
   - Static Shell: `Cache-Control: public, max-age=31536000`
   - Dynamic Holes: `Cache-Control: private, no-cache`

## 테스트 방법

1. **서버 렌더링 시간 확인**
   ```tsx
   async function RealtimeStock() {
     const time = new Date().toISOString();
     return <div>렌더링 시간: {time}</div>;
   }
   ```

2. **CloudFront 헤더 확인**
   ```bash
   curl -I https://your-domain.com/products/1?_rsc=1
   # x-cache: Hit from cloudfront (Static Shell)
   
   # Dynamic Hole은 별도 스트림으로 전송되므로
   # 브라우저 DevTools에서 확인 필요
   ```

3. **Network Waterfall 관찰**
   - Static Shell: 즉시 로드 (CDN)
   - Dynamic Holes: 1초 후 스트리밍 (서버)

## 장단점

### ✅ 장점

1. **캐시 효율 향상**
   - 같은 Shell을 모든 경로에서 재사용
   - CDN 스토리지 절약

2. **최신 데이터 보장**
   - Dynamic Holes는 항상 서버에서 렌더링
   - Invalidation 문제 없음

3. **빠른 초기 로드**
   - Static Shell 즉시 표시
   - UX 향상

### ⚠️ 단점

1. **Partial Rendering 비활성화**
   - 항상 전체 Shell 전송
   - 네트워크 트래픽 증가 (하지만 캐싱으로 상쇄)

2. **복잡한 구조**
   - Static/Dynamic 분리 필요
   - 개발자 인지 부담

3. **Next.js 버전 의존**
   - PPR은 experimental 기능
   - 변경 가능성 있음

## ⚠️ 중요: TanStack Query prefetch 함정

### 문제 시나리오

```tsx
// ❌ 이렇게 하면 안 됨!
export const experimental_ppr = true;

export default async function ProductPage() {
  const queryClient = new QueryClient();
  
  // prefetch: 데이터가 HTML에 포함됨!
  await queryClient.prefetchQuery({
    queryKey: ['stock'],
    queryFn: fetchStock
  });
  
  return (
    <Suspense>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientStock />
      </HydrationBoundary>
    </Suspense>
  );
}
```

**문제:**
1. `dehydrate(queryClient)` → 데이터가 HTML에 serialize됨
2. CDN 캐싱 → 오래된 데이터가 캐싱됨
3. Hydration → 오래된 데이터로 시작
4. `staleTime` 후 refetch → 깜빡임!

### ✅ 올바른 방법 1: Server Component만

```tsx
export const experimental_ppr = true;

export default function ProductPage() {
  return (
    <>
      <h1>Static Shell</h1>
      
      {/* Server Component - 매번 서버 렌더링 */}
      <Suspense fallback={<Skeleton />}>
        <ServerStock />
      </Suspense>
    </>
  );
}

async function ServerStock() {
  const stock = await fetchStock(); // 캐싱 안 됨
  return <div>재고: {stock}개</div>;
}
```

### ✅ 올바른 방법 2: Client Component만

```tsx
export const experimental_ppr = true;

export default function ProductPage() {
  return (
    <>
      <h1>Static Shell</h1>
      
      {/* Client Component - 클라이언트에서 fetch */}
      <Suspense fallback={<Skeleton />}>
        <ClientStock />
      </Suspense>
    </>
  );
}

'use client'
function ClientStock() {
  const { data } = useSuspenseQuery({
    queryKey: ['stock'],
    queryFn: fetchStock // 클라이언트에서 직접
  });
  return <div>재고: {data.stock}개</div>;
}
```

### 핵심 원칙

**CDN 환경에서:**
- ✅ Static 데이터 → Server Component → CDN 캐싱
- ✅ Dynamic 데이터 → Server Component (Suspense) 또는 Client Component
- ❌ prefetch + dehydrate → HTML에 데이터 포함 → CDN 문제!

## 결론

**PPR + _rsc 해시 고정**은 이론적으로 완벽한 조합이지만:

- ✅ E-commerce 제품 페이지 (Static 정보 + Dynamic 재고)
- ✅ 뉴스 기사 (Static 본문 + Dynamic 댓글)
- ✅ 대시보드 (Static 레이아웃 + Dynamic 차트)

**하지만 현실적으로:**
- Next.js 팀이 공식 지원하지 않음
- Vercel은 이미 최적화되어 있어 불필요
- Self-hosted 환경에서만 의미 있음

## 관련 이슈

- [#65335](https://github.com/vercel/next.js/issues/65335) - RSC CDN 캐싱 문제
- [PPR RFC](https://github.com/vercel/next.js/discussions/37452)
