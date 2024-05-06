import react from "@vitejs/plugin-react-swc";
import {defineConfig} from "vite";
import wasm from "vite-plugin-wasm";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [react(), tsconfigPaths(), wasm()],

	build: {
		target: `esnext`,
	},
	server: {
		headers: {
			// Required for `SharedArrayBuffer`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
			"Cross-Origin-Opener-Policy": `same-origin`,
			"Cross-Origin-Embedder-Policy": `require-corp`,
		},
	},
	worker: {
		plugins: () => [tsconfigPaths()],
	},
});
