import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["public/sw.js"],
  },
];

export default eslintConfig;
