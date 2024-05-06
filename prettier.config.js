/** @type {import("prettier").Options} */
const config = {
	printWidth: 120,
	tabWidth: 2,
	useTabs: true,
	semi: true,
	singleQuote: false,
	bracketSpacing: false,
	plugins: [`prettier-plugin-tailwindcss`],
};

export default config;
