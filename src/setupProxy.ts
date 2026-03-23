/* import { Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

module.exports = function(app: Application) {
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'https://test-api-wildlifenl.uu.nl',
      changeOrigin: true,  // Change the origin to match the target server
      secure: false,       // Disable SSL verification for development if the backend uses self-signed certs
    })
  );

  app.use(
    '/experiment',
    createProxyMiddleware({
      target: 'https://test-api-wildlifenl.uu.nl',
      changeOrigin: true,  // Change the origin to match the target server
      secure: false,       // Disable SSL verification for development if the backend uses self-signed certs
    })
  );

  app.use(
    '/livinglabs',
    createProxyMiddleware({
      target: 'https://test-api-wildlifenl.uu.nl',
      changeOrigin: true,  // Change the origin to match the target server
      secure: false,       // Disable SSL verification for development if the backend uses self-signed certs
    })
  );

  app.use(
    '/profile',
    createProxyMiddleware({
      target: 'https://test-api-wildlifenl.uu.nl',
      changeOrigin: true,  // Change the origin to match the target server
      secure: false,       // Disable SSL verification for development if the backend uses self-signed certs
    })
  );
};
*/
