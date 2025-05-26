/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable strict mode for production to avoid double rendering issues with PDF generation
  reactStrictMode: process.env.NODE_ENV === 'development',
  experimental: {
    // Enable SWC transpilation
    swcPlugins: [],
  },
  webpack: (config, { isServer }) => {
    // This is to ensure path aliases work correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      // Define your path aliases here
    };

    // Handle @react-pdf packages
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        canvas: false,
        process: false,
      };

      // Exclude PDF libraries from client-side bundle
      config.externals = [
        ...(config.externals || []),
        {
          '@react-pdf/renderer': 'commonjs @react-pdf/renderer',
          '@react-pdf/font': 'commonjs @react-pdf/font',
          '@react-pdf/layout': 'commonjs @react-pdf/layout',
          '@react-pdf/pdfkit': 'commonjs @react-pdf/pdfkit',
        },
      ];
    }

    return config;
  },
};

module.exports = nextConfig;
