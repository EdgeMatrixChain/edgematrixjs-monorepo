module.exports = function (config) {
  config.set({
    frameworks: ['tap', 'karma-typescript'],
    files: ['./src/**/*.ts', './test/**/*.ts'],
    preprocessors: {
      '**/*.ts': ['karma-typescript'],
    },
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.json',
      bundlerOptions: {
        entrypoints: /\.spec\.ts$/,
        acornOptions: {
          ecmaVersion: 12,
        },
        transforms: [
          require('karma-typescript-es6-transform')({
            presets: [['@babel/preset-env', { targets: { chrome: '74' } }]],
          }),
        ],
      },
    },
    //inject buffer https://www.npmjs.com/package/karma-browserify
    browserify: {
      transform: ['browserify-alias'],
      debug: true,
      extensions: ['.js', '.jsx'],
      configure: function (bundle) {
        bundle.on('prebundle', function () {
          bundle.require('buffer/', { expose: 'buffer' });
        });
      },
    },
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: 1,
    browserNoActivityTimeout: 60000,
  });
};
