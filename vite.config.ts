import react from "@vitejs/plugin-react-swc"
import {defineConfig} from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	server: {
		headers: {
			// Required for `SharedArrayBuffer`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
			"Cross-Origin-Opener-Policy": `same-origin`,
			"Cross-Origin-Embedder-Policy": `require-corp`,
		},
	},
})
