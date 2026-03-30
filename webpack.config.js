const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: {
      'src/scripts/background': './src/scripts/background.ts',
      'src/scripts/content-script': './src/scripts/content-script.ts',
      'src/scripts/devtools': './src/scripts/devtools.ts',
      'src/ui/popup': './src/ui/popup.ts',
      'src/ui/devtools-panel': './src/ui/devtools-panel.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    devtool: isProd ? false : 'cheap-module-source-map',
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'src/ui/popup.html', to: 'src/ui/popup.html' },
          { from: 'src/ui/popup.css', to: 'src/ui/popup.css' },
          { from: 'src/ui/devtools-panel.html', to: 'src/ui/devtools-panel.html' },
          { from: 'src/scripts/devtools.html', to: 'src/scripts/devtools.html' },
          { from: 'assets', to: 'assets' },
        ],
      }),
    ],
    optimization: {
      minimize: isProd,
      splitChunks: false,
    },
  };
};
