// Import types and utilities from webpack if needed
import * as webpack from 'webpack';
import path from 'path';

// This empty export statement will change the file context to a module
export {};

module.exports = {
  webpack: {
    alias: {
        contracts: path.resolve(__dirname, 'src/contracts/')
      },
    configure: (webpackConfig: any, { env, paths }: { env: string; paths: any }) => {
      webpackConfig.resolve.fallback = {
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url/')
      };

      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      return webpackConfig;
    }
  }
};
