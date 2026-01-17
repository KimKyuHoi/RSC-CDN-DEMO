import Link from 'next/link';

export default function CartPage() {
  // 간단한 장바구니 예시
  const cartItems = [{ id: 1, name: 'Nike Air Max', price: 150, quantity: 1 }];

  return (
    <div>
      <Link href="/">← 홈으로</Link>

      <h1 style={{ marginTop: '1rem' }}>🛒 장바구니</h1>

      <div className="debug-info">
        <h3>📍 현재 경로</h3>
        <p>
          <code>/cart</code>
        </p>
        <p>
          여기서 Product 1로 이동하면 또 다른 <code>_rsc</code> 해시가
          생성됩니다.
        </p>
      </div>

      <table
        style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>상품</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>가격</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>수량</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>
                <Link href={`/products/${item.id}`}>{item.name}</Link>
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                ${item.price}
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                {item.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>
        총액:{' '}
        <strong>
          $
          {cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}
        </strong>
      </p>
    </div>
  );
}
