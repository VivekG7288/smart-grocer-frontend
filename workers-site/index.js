export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Serve static assets from the dist directory
    try {
      // Security headers to add to all responses
      const securityHeaders = {
        'X-XSS-Protection': '1; mode=block',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Feature-Policy': "camera 'none'; microphone 'none'",
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
      };

      // Try to serve the requested file from the assets
      let response = await env.ASSETS.fetch(request);

      // For SPA routing, serve index.html for any HTML request that doesn't find a file
      if (!response.ok && request.headers.get('accept')?.includes('text/html')) {
        response = await env.ASSETS.fetch(`${url.origin}/index.html`);
      }

      // Add security headers to the response
      const newResponse = new Response(response.body, response);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });

      return newResponse;
    } catch (e) {
      return new Response('Not Found', { status: 404 });
    }
  },
};