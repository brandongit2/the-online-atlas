/** @type {import("eslint").Linter.BaseConfig} */
module.exports = {
	extends: `../.eslintrc.cjs`,
	overrides: [
		{
			files: [`./vite.config.ts`],
			parserOptions: {
				project: `./tsconfig.node.json`,
			},
		},
	],
};
