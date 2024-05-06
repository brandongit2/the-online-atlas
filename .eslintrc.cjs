module.exports = {
	root: true,
	extends: [`eslint:recommended`, `plugin:import/recommended`],
	rules: {
		"import/no-anonymous-default-export": `warn`,
		"import/no-cycle": `error`,
		"import/no-duplicates": `error`,
		"import/order": [
			`warn`,
			{
				groups: [
					[`builtin`, `external`],
					[`object`, `unknown`, `type`],
					[`internal`, `parent`, `index`, `sibling`],
				],
				pathGroups: [{pattern: `{@/**,@rust-lib}`, group: `parent`}],
				pathGroupsExcludedImportTypes: [`type`],
				"newlines-between": `always`,
				alphabetize: {order: `asc`, caseInsensitive: true},
				warnOnUnassignedImports: true,
			},
		],
		"no-console": [`warn`, {allow: [`info`, `warn`, `error`]}],
		"no-constant-condition": [`error`, {checkLoops: false}],
		"no-debugger": `warn`,
		"no-empty": [`warn`, {allowEmptyCatch: true}],
		"no-extra-semi": `off`,
		"no-mixed-spaces-and-tabs": [`warn`, `smart-tabs`],
		"no-unused-vars": [`warn`, {ignoreRestSiblings: true, args: `all`}],
		quotes: [`warn`, `backtick`],
	},
	overrides: [
		{
			files: [`**/*.ts`, `**/*.tsx`],
			extends: [
				`plugin:@typescript-eslint/recommended-type-checked`,
				`plugin:@typescript-eslint/stylistic-type-checked`,
				`plugin:import/typescript`,
			],
			plugins: [`@typescript-eslint`],
			parser: `@typescript-eslint/parser`,
			parserOptions: {
				project: true,
				tsconfigRootDir: __dirname,
				ecmaVersion: `latest`,
			},
			settings: {
				"import/resolver": {
					node: true,
					typescript: true,
				},
			},
			rules: {
				"@typescript-eslint/array-type": [`warn`, {default: `array-simple`}],
				"@typescript-eslint/consistent-type-definitions": [`warn`, `type`],
				"@typescript-eslint/consistent-type-imports": [`warn`, {fixStyle: `inline-type-imports`}],
				"@typescript-eslint/no-empty-function": `warn`,
				"@typescript-eslint/no-unnecessary-condition": `warn`,
				"@typescript-eslint/no-unnecessary-type-assertion": `warn`,
				"@typescript-eslint/no-unused-vars": [`warn`, {ignoreRestSiblings: true, args: `all`}],
				"@typescript-eslint/quotes": [`warn`, `backtick`],
				"@typescript-eslint/require-await": `warn`,
				"import/consistent-type-specifier-style": [`warn`, `prefer-inline`],
				"prefer-const": `off`,
				quotes: `off`,
			},
		},
		{
			files: [`**/*.jsx`, `**/*.tsx`],
			extends: [`plugin:react/jsx-runtime`],
			settings: {
				react: {version: `detect`},
			},
			rules: {
				"react/button-has-type": `warn`,
				"react/display-name": `warn`,
				"react/jsx-boolean-value": `warn`,
				"react/jsx-curly-brace-presence": `warn`,
				"react/jsx-no-useless-fragment": [`warn`, {allowExpressions: true}],
				"react/no-unescaped-entities": `warn`,
				"react/no-unused-prop-types": `warn`,
			},
		},
		{
			files: [`./*.cjs`, `./vite.config.ts`],
			env: {node: true},
			parserOptions: {
				project: `./tsconfig.node.json`,
			},
		},
	],
};
