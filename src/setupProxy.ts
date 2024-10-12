import { Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

module.exports = function(app: Application) {
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl',
      changeOrigin: true,  // Change the origin to match the target server
      secure: false,       // Disable SSL verification for development if the backend uses self-signed certs
    })
  );

  app.use(
    '/experiment',
    createProxyMiddleware({
      target: 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl',
      changeOrigin: true,  // Change the origin to match the target server
      secure: false,       // Disable SSL verification for development if the backend uses self-signed certs
    })
  );

  app.use(
    '/livinglabs',
    createProxyMiddleware({
      target: 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl',
      changeOrigin: true,  // Change the origin to match the target server
      secure: false,       // Disable SSL verification for development if the backend uses self-signed certs
    })
  );

  app.use(
    '/profile',
    createProxyMiddleware({
      target: 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl',
      changeOrigin: true,  // Change the origin to match the target server
      secure: false,       // Disable SSL verification for development if the backend uses self-signed certs
    })
  );
};