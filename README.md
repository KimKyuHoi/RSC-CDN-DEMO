# RSC CDN Caching Demo

Next.js App Router에서 `_rsc` 쿼리 파라미터로 인한 CDN 캐시 분리 문제를 재현하는 예시 프로젝트입니다.

## 문제 설명

클라이언트 사이드 네비게이션 시, Next.js는 RSC payload를 요청할 때 `_rsc` 쿼리 파라미터를 추가합니다.
이 해시는 **사용자의 현재 위치(출발지)**를 기반으로 계산됩니다.

```
/ → /products/1         → ?_rsc=abc12
/categories/shoes → /products/1  → ?_rsc=xyz99
/cart → /products/1     → ?_rsc=def45
```

**모두 같은 제품 페이지 데이터를 반환하지만, CDN은 이를 별개의 리소스로 인식합니다.**

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 모드
npm run dev

# 또는 프로덕션 빌드 후 실행
npm run build
npm run start
```

## 문제 재현 단계

1. http://localhost:3000 접속
2. 브라우저 DevTools Network 탭 열기 (F12)
3. "Nike Air Max" 클릭 → Network에서 `_rsc` 파라미터 확인
4. 뒤로가기
5. "Shoes" 카테고리 클릭 → "Nike Air Max" 클릭
6. **다른 `_rsc` 해시 확인!**

## 해결책

### 1. CDN에서 `_rsc` 파라미터 무시

`cloudfront/` 폴더의 설정 예제를 참고하세요.

### 2. Next.js 설정 (제안 중)

```javascript
// next.config.js
module.exports = {
  experimental: {
    rscCacheStrategy: 'destination-based', // 향후 지원 예정
  },
};
```

## 관련 이슈

- [#65335](https://github.com/vercel/next.js/issues/65335)
- [#59167](https://github.com/vercel/next.js/discussions/59167)
