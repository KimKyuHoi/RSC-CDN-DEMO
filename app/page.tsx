import Link from 'next/link';

// 샘플 제품 데이터
const products = [
  { id: 1, name: 'Nike Air Max', price: 150, category: 'shoes' },
  { id: 2, name: 'Adidas Ultraboost', price: 180, category: 'shoes' },
  { id: 3, name: 'Classic T-Shirt', price: 30, category: 'clothing' },
  { id: 4, name: 'Denim Jacket', price: 90, category: 'clothing' },
];

export default function Home() {
  return (
    <div>
      <h1>🔬 RSC CDN Caching Demo</h1>

      <div className="debug-info">
        <h3>⚠️ 문제 재현 방법</h3>
        <ol>
          <li>브라우저 DevTools Network 탭을 열어주세요 (F12)</li>
          <li>
            아래 "Product 1" 링크를 클릭하고 <code>_rsc</code> 쿼리 파라미터를
            확인하세요
          </li>
          <li>뒤로가기 후, Categories → Shoes → Product 1로 이동해보세요</li>
          <li>
            <strong>
              같은 Product 1 페이지인데 <code>_rsc</code> 해시가 다릅니다!
            </strong>
          </li>
        </ol>
      </div>

      <h2 style={{ marginTop: '2rem' }}>모든 제품</h2>
      <div className="product-grid">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="product-card"
          >
            <h3>{product.name}</h3>
            <p>${product.price}</p>
          </Link>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>카테고리별 보기</h2>
      <ul>
        <li>
          <Link href="/categories/shoes">
            👟 Shoes ({products.filter((p) => p.category === 'shoes').length})
          </Link>
        </li>
        <li>
          <Link href="/categories/clothing">
            👕 Clothing (
            {products.filter((p) => p.category === 'clothing').length})
          </Link>
        </li>
      </ul>
    </div>
  );
}
