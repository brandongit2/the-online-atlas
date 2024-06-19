import {clamp} from "lodash";

import {canvas, device} from "./webgpu";

let hasResized = true;
let mapDims: [number, number] = [window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio];

// Returns true if the canvas has been resized
export const onFrame = () => {
	if (!hasResized) return false;

	const mapWidth = clamp(window.innerWidth * devicePixelRatio, 1, device.limits.maxTextureDimension2D);
	const mapHeight = clamp(window.innerHeight * devicePixelRatio, 1, device.limits.maxTextureDimension2D);
	mapDims = [mapWidth, mapHeight];

	canvas.width = mapWidth;
	canvas.height = mapHeight;
	recreateDepthTexture();

	hasResized = false;
	return true;
};

const resizeObserver = new ResizeObserver(() => {
	hasResized = true;
});
resizeObserver.observe(canvas);

const createDepthTexture = (size: [number, number]) =>
	device.createTexture({
		label: `depth texture`,
		size,
		format: `depth24plus`,
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	});
let depthTexture = createDepthTexture(mapDims);
export let depthTextureView = depthTexture.createView({label: `depth texture view`});

export const recreateDepthTexture = () => {
	const oldDepthTexture = depthTexture;
	depthTexture = createDepthTexture(mapDims);
	depthTextureView = depthTexture.createView({label: `depth texture view`});
	oldDepthTexture.destroy();
	return depthTextureView;
};
