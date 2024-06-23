import {clamp} from "lodash";
import {BehaviorSubject} from "rxjs";

import {canvas, device} from "../map/webgpu";

let hasResized = true;
export const mapDims = new BehaviorSubject<[number, number]>([
	window.innerWidth * devicePixelRatio,
	window.innerHeight * devicePixelRatio,
]);

// Returns true if the canvas has been resized
export const onFrame = () => {
	if (!hasResized) return;

	const mapWidth = clamp(window.innerWidth * devicePixelRatio, 1, device.limits.maxTextureDimension2D);
	const mapHeight = clamp(window.innerHeight * devicePixelRatio, 1, device.limits.maxTextureDimension2D);
	mapDims.next([mapWidth, mapHeight]);

	canvas.width = mapWidth;
	canvas.height = mapHeight;
	recreateDepthTexture();

	hasResized = false;
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
let depthTexture = createDepthTexture(mapDims.getValue());
export const depthTextureView = new BehaviorSubject(depthTexture.createView({label: `depth texture view`}));

export const recreateDepthTexture = () => {
	const oldDepthTexture = depthTexture;
	depthTexture = createDepthTexture(mapDims.getValue());
	depthTextureView.next(depthTexture.createView({label: `depth texture view`}));
	oldDepthTexture.destroy();
	return depthTextureView;
};
