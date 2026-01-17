import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RSC CDN Caching Demo',
  description: 'Demonstrating _rsc query parameter caching issues',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            padding: '1rem',
            background: '#f0f0f0',
            marginBottom: '1rem',
            display: 'flex',
            gap: '1rem',
          }}
        >
          <a href="/">🏠 Home</a>
          <a href="/categories/shoes">👟 Shoes</a>
          <a href="/categories/clothing">👕 Clothing</a>
          <a href="/cart">🛒 Cart</a>
        </nav>
        <main style={{ padding: '1rem' }}>{children}</main>
      </body>
    </html>
  );
}
