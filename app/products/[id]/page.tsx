import Link from 'next/link';
import { Suspense } from 'react';

// 동적 페이지 설정 제거 - 이제 정적으로 생성되어 캐싱됨
// export const dynamic = 'force-dynamic';

// 샘플 제품 데이터 (실제 앱에서는 DB에서 가져옴)
const products = [
  {
    id: 1,
    name: 'Nike Air Max',
    price: 150,
    category: 'shoes',
    description: '최고의 편안함',
  },
  {
    id: 2,
    name: 'Adidas Ultraboost',
    price: 180,
    category: 'shoes',
    description: '러닝에 최적화',
  },
  {
    id: 3,
    name: 'Classic T-Shirt',
    price: 30,
    category: 'clothing',
    description: '데일리 룩',
  },
  {
    id: 4,
    name: 'Denim Jacket',
    price: 90,
    category: 'clothing',
    description: '빈티지 스타일',
  },
];

async function Recommendations({
  category,
  currentId,
}: {
  category: string;
  currentId: number;
}) {
  // 동적 서버 작업을 시뮬레이션 (1초 대기)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const related = products.filter(
    (p) => p.category === category && p.id !== currentId,
  );

  return (
    <div className="product-grid">
      {related.map((p) => (
        <Link key={p.id} href={`/products/${p.id}`} className="product-card">
          <h4>{p.name}</h4>
          <p>${p.price}</p>
        </Link>
      ))}
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = products.find((p) => p.id === parseInt(id));

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <Link href="/">← 홈으로</Link>

      <div className="debug-info" style={{ marginTop: '1rem' }}>
        <h3>✨ PPR (Partial Prerendering) 적용됨</h3>
        <p>
          이제 이 페이지의 <strong>'껍데기(Shell)'</strong>는 정적으로
          캐시됩니다. 어떤 경로로 오든 껍데기는 즉시 로드되며, 아래 추천 목록만
          동적으로 채워집니다.
        </p>
        <p style={{ marginTop: '0.5rem', color: '#0070f3' }}>
          <strong>결과:</strong> 유입 경로와 상관없이 CDN에서 최상위 레이아웃을
          즉시 서빙합니다.
        </p>
      </div>

      <h1 style={{ marginTop: '2rem' }}>{product.name}</h1>
      <p style={{ fontSize: '1.5rem', color: '#0070f3' }}>${product.price}</p>
      <p>{product.description}</p>

      <h3 style={{ marginTop: '2rem' }}>관련 상품 (Dynamic Hole)</h3>
      <Suspense
        fallback={
          <div className="loading-placeholder">추천 목록을 불러오는 중...</div>
        }
      >
        <Recommendations category={product.category} currentId={product.id} />
      </Suspense>
    </div>
  );
}

// 빌드 시 정적 생성
export async function generateStaticParams() {
  return products.map((product) => ({
    id: String(product.id),
  }));
}
