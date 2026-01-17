import Link from 'next/link';

const products = [
  { id: 1, name: 'Nike Air Max', price: 150, category: 'shoes' },
  { id: 2, name: 'Adidas Ultraboost', price: 180, category: 'shoes' },
  { id: 3, name: 'Classic T-Shirt', price: 30, category: 'clothing' },
  { id: 4, name: 'Denim Jacket', price: 90, category: 'clothing' },
];

const categoryNames: Record<string, string> = {
  shoes: '👟 Shoes',
  clothing: '👕 Clothing',
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryProducts = products.filter((p) => p.category === slug);
  const categoryName = categoryNames[slug] || slug;

  return (
    <div>
      <Link href="/">← 홈으로</Link>

      <h1 style={{ marginTop: '1rem' }}>{categoryName}</h1>

      <div className="debug-info">
        <h3>📍 현재 경로</h3>
        <p>
          <code>/categories/{slug}</code>
        </p>
        <p>
          여기서 Product 페이지로 이동하면 <code>_rsc</code> 해시가 홈에서 갈
          때와 다릅니다.
        </p>
      </div>

      <div className="product-grid" style={{ marginTop: '1rem' }}>
        {categoryProducts.map((product) => (
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
    </div>
  );
}

export async function generateStaticParams() {
  return [{ slug: 'shoes' }, { slug: 'clothing' }];
}
