# RFC: Add `rscCacheStrategy` Option for CDN Caching

## Summary

This RFC proposes adding a new experimental configuration option `rscCacheStrategy` to help self-hosted Next.js applications achieve better CDN cache hit rates for RSC (React Server Components) payloads.

## Background

### The Problem

When a user navigates between pages using client-side navigation, Next.js requests RSC payload with a `_rsc` query parameter. This parameter is a hash computed from:

1. `Next-Router-Prefetch` header
2. `Next-Router-Segment-Prefetch` header
3. `Next-Router-State-Tree` header (current client location)
4. `Next-Url` header

Because the `Next-Router-State-Tree` includes the **user's current page location**, navigations to the same destination from different origins produce different `_rsc` hashes:

```
/ → /products/1         → ?_rsc=abc12
/categories/shoes → /products/1  → ?_rsc=xyz99
/cart → /products/1     → ?_rsc=def45
```

All three return **identical RSC payload**, but CDNs treat them as different resources.

### Impact

- Very low CDN cache hit rates for RSC requests
- Increased server load
- Higher latency for users
- Increased costs for self-hosted deployments

### Related Issues

- [#65335](https://github.com/vercel/next.js/issues/65335)
- [#59167](https://github.com/vercel/next.js/discussions/59167) (100+ 👍)

## Proposal

Add a new experimental configuration option:

```typescript
// next.config.js
module.exports = {
  experimental: {
    /**
     * Controls how the _rsc cache-busting parameter is computed.
     *
     * - 'default': Current behavior (includes router state tree)
     * - 'destination-based': Hash based only on destination URL
     * - 'none': No _rsc parameter (requires CDN/Middleware handling)
     */
    rscCacheStrategy: 'default' | 'destination-based' | 'none',
  },
};
```

### Option Details

#### `'default'` (Current Behavior)

No change. The `_rsc` hash is computed from all headers including router state tree.

**Pros:**

- Partial Rendering optimization works perfectly
- No breaking changes

**Cons:**

- Poor CDN cache hit rates

#### `'destination-based'`

The `_rsc` hash is computed only from the destination URL path, excluding the router state tree.

**Pros:**

- Same destination = same cache key
- Better CDN cache hit rates
- Partial Rendering still possible (server decides based on headers)

**Cons:**

- May cause some unnecessary full-page RSC responses
- Slight increase in payload size for some navigations

#### `'none'`

No `_rsc` parameter is added. The request URL is clean.

**Pros:**

- Maximum CDN cache hit rates
- Clean URLs

**Cons:**

- Requires CDN or Middleware to handle Vary header properly
- Partial Rendering entirely depends on header handling

## Implementation

### Files to Modify

1. **`packages/next/src/server/config-shared.ts`**

   - Add `rscCacheStrategy` to `ExperimentalConfig` interface

2. **`packages/next/src/server/config-schema.ts`**

   - Add validation schema for the new option

3. **`packages/next/src/shared/lib/router/utils/cache-busting-search-param.ts`**

   - Modify `computeCacheBustingSearchParam` to respect the new option

4. **`packages/next/src/client/components/router-reducer/fetch-server-response.ts`**
   - Pass configuration to hash computation

### Example Implementation

```typescript
// cache-busting-search-param.ts
export function computeCacheBustingSearchParam(
  prefetchHeader: '1' | '2' | '0' | undefined,
  segmentPrefetchHeader: string | string[] | undefined,
  stateTreeHeader: string | string[] | undefined,
  nextUrlHeader: string | string[] | undefined,
  strategy: 'default' | 'destination-based' | 'none' = 'default',
  destinationPath?: string
): string {
  if (strategy === 'none') {
    return '';
  }

  if (strategy === 'destination-based') {
    return hexHash(
      [
        prefetchHeader || '0',
        segmentPrefetchHeader || '0',
        destinationPath || '0',
      ].join(',')
    );
  }

  // Default behavior
  return hexHash(
    [
      prefetchHeader || '0',
      segmentPrefetchHeader || '0',
      stateTreeHeader || '0',
      nextUrlHeader || '0',
    ].join(',')
  );
}
```

## Alternatives Considered

### 1. CDN Configuration Only

Users can already work around this by configuring their CDN to ignore the `_rsc` parameter. However:

- Not all CDNs support this
- Requires per-CDN documentation
- Users may not know about this issue

### 2. Content-Based Hash (ETag)

Instead of hashing request parameters, hash the response content. This would provide perfect deduplication but:

- Requires significant server-side changes
- First request still goes to origin
- More complex implementation

## Migration

This is an opt-in experimental feature. No migration needed for existing users.

## Documentation

Add to:

- `docs/app/api-reference/next-config-js/rscCacheStrategy.mdx`
- `docs/app/building-your-application/caching.mdx` (CDN section)

## Testing

1. Unit tests for `computeCacheBustingSearchParam` with all strategy options
2. Integration tests verifying correct `_rsc` parameter behavior
3. E2E tests for navigation with CDN simulation

## Open Questions

1. Should `'destination-based'` include query parameters in the hash?
2. Should there be a warning when using `'none'` without proper CDN setup?
3. Should we also expose `validateRSCRequestHeaders` behavior changes?

---

**Author:** (Your Name)
**Date:** 2026-01-13
**Status:** Draft
