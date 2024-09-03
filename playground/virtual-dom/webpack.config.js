const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    app: [
      path.resolve(__dirname, "build/output.js"),
      path.resolve(__dirname, "build/simple-react.js"),
    ],
  },
  output: {
    filename: "app.bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "build/output.html"),
      inject: false,
      templateParameters: {
        scriptSrc: "app.bundle.js",
      },
    }),
  ],
};
