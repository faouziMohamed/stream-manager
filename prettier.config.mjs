import base from './prettier.base.json' with { type: 'json' };

/** @type {import('prettier').Config} */
const config = {
  ...base,
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
