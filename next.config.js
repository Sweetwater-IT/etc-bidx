/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode for production to avoid double rendering issues with PDF generation
  reactStrictMode: process.env.NODE_ENV === 'development',
  
  // Path aliases are already configured in tsconfig.json
  // Next.js automatically reads them from there
  
  // Configure SWC (Next.js built-in compiler) to handle JSX and TypeScript
  // This replaces the need for @babel/preset-react and @babel/preset-typescript
  compiler: {
    // Enable React features
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    emotion: false, // Set to true if you're using emotion
  },
  
  // Handle transpilation of PDF libraries
  transpilePackages: [
    '@react-pdf/renderer',
    '@react-pdf/render',
    '@react-pdf/types',
    '@react-pdf/layout',
    '@react-pdf/textkit',
    '@react-pdf/pdfkit',
    '@react-pdf/stylesheet',
    '@react-pdf/font',
  ],
  
  // Webpack configuration for handling PDF libraries and other special cases
  webpack: (config, { isServer }) => {
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
