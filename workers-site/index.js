import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event))
})

async function handleEvent(event) {
  try {
    // Try to get the asset from KV
    let response = await getAssetFromKV(event)

    // If the request is for the root path, serve index.html
    if (new URL(event.request.url).pathname === '/') {
      response = await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
      })
    }

    // Enable SPA routing by serving index.html for all HTML requests
    if (!response.ok && event.request.headers.get('accept').includes('text/html')) {
      response = await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
      })
    }

    // Add security headers
    response = new Response(response.body, { ...response })
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Feature-Policy', "camera 'none'; microphone 'none'")

    return response
  } catch (e) {
    // Fall back to serving index.html for SPA routing
    if (e.status === 404) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
        })
        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 200 })
      } catch (e) {}
    }
    return new Response(e.message || 'Error', { status: e.status || 500 })
  }
}