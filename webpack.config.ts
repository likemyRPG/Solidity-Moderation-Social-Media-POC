import * as webpack from 'webpack';

const config: any = {
  webpack: {
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
  },
};

export default config;
