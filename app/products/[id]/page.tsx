import Link from 'next/link';
import { Suspense } from 'react';

// PPR 적용 - Static Shell + Dynamic Holes
export const experimental_ppr = true;

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

  // 서버 렌더링 시간 추가 (캐싱 확인용)
  const serverTime = new Date().toISOString();

  return (
    <div>
      <div style={{ 
        padding: '0.5rem', 
        marginBottom: '1rem', 
        background: '#f0f0f0', 
        borderRadius: '4px',
        fontSize: '0.875rem'
      }}>
        🕐 서버 렌더링 시간: {serverTime}
        <br />
        <small>(이 시간이 매번 바뀌면 캐싱 안 됨 = 정상)</small>
      </div>
      <div className="product-grid">
        {related.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="product-card">
            <h4>{p.name}</h4>
            <p>${p.price}</p>
          </Link>
        ))}
      </div>
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
        <h3>✨ PPR + 해시 고정 테스트</h3>
        <p>
          <strong>Static Shell:</strong> 이 섹션(제품명, 가격, 설명)은 빌드 시 
          생성되어 CDN에 캐싱됩니다.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Dynamic Hole:</strong> 아래 추천 목록은 매번 서버에서 
          새로 렌더링되어 스트리밍됩니다. (캐싱되지 않음)
        </p>
        <p style={{ marginTop: '0.5rem', color: '#0070f3' }}>
          <strong>핵심:</strong> _rsc 해시를 고정해도 Dynamic Holes는 
          매번 새로 fetch됩니다!
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
