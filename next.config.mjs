/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/files/**',
      },
      {
        protocol: 'https',
        hostname: '*.backblazeb2.com',
      },
    ],
  },

  // Suppress Fast Refresh logs in development
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Suppress Turbopack hot reloader console logs
        config.infrastructureLogging = {
          level: 'error', // Only show errors, hide info/warn logs
        };

        // Suppress specific webpack dev middleware logs
        config.stats = 'errors-only';

        // Suppress hot module replacement logs
        config.watchOptions = {
          ...config.watchOptions,
          ignored: /node_modules/,
        };

        // Suppress performance hints and other webpack logs
        config.performance = false;

        // Disable webpack bundle analyzer
        config.optimization = {
          ...config.optimization,
          splitChunks: false,
        };
      }
      return config;
    },

    // Suppress Next.js build logs during development
    logging: {
      fetches: {
        fullUrl: false,
      },
    },

    // Experimental features to reduce logging
    experimental: {
      logging: {
        level: 'error',
        fullUrl: false,
      },
      // Disable turbopack specific logging
      turbopack: {
        logging: 'off',
      },
    },

    // Disable on-demand entries logging
    onDemandEntries: {
      maxInactiveAge: 60 * 1000,
      pagesBufferLength: 5,
    },
  }),
};

export default nextConfig;
