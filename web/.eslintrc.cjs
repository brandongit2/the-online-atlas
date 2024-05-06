const path = require(`path`);

/** @type {import("eslint").Linter.Config} */
module.exports = {
	extends: `../.eslintrc.cjs`,
	overrides: [
		{
			files: [`./vite.config.ts`],
			parserOptions: {
				project: path.resolve(__dirname, `./tsconfig.node.json`),
			},
		},
	],
};
