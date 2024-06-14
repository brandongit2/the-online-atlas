import {clamp} from "lodash";

import "./controls";
import {getTilesInView} from "./get-tiles-in-view";
import {store, tileCache} from "./store";
import {type Coord3d, type RenderInput} from "./types";
import {tileIdToStr} from "./util";
import {canvas, canvasContext, device} from "./webgpu";
import {dispatchToWorker} from "@/worker-pool";
import {type FetchTileReturn} from "@/workers/fetch-tile";

const materials: Array<{name: string; color: Coord3d}> = [
	{name: `water`, color: [0, 0, 1]},
	{name: `waterway`, color: [0, 0, 1]},
	{name: `admin`, color: [1, 1, 1]},
	{name: `building`, color: [1, 0.647, 0]},
	{name: `structure`, color: [1, 0.647, 0]},
	{name: `road`, color: [0.5, 0.5, 0.5]},
	{name: `motorway_junction`, color: [0.5, 0.5, 0.5]},
];

let hasResized = true;
const frameLoop = async () => {
	// Window resizing logic
	if (hasResized) {
		const mapWidth = clamp(window.innerWidth * devicePixelRatio, 1, device.limits.maxTextureDimension2D);
		const mapHeight = clamp(window.innerHeight * devicePixelRatio, 1, device.limits.maxTextureDimension2D);
		store.mapDims = [mapWidth, mapHeight];

		renderPassDescriptor.depthStencilAttachment.view = store.depthTextureView;
		hasResized = false;
	}

	store.updateViewMatrix();

	const tilesInView = getTilesInView();
	const tilesToRender: FetchTileReturn[] = [];
	for (const tileId of tilesInView) {
		const tileIdStr = tileIdToStr(tileId);
		const tile = tileCache.get(tileIdStr);
		if (tile === `pending`) continue;
		if (tile) {
			tilesToRender.push(tile);
		} else {
			tileCache.set(tileIdStr, `pending`);
			dispatchToWorker(`fetchTile`, {id: tileIdStr})
				.then((tile) => {
					tileCache.set(tileIdStr, tile);
				})
				.catch((err) => {
					throw err;
				});
		}
	}

	const layers: FetchTileReturn = {};
	for (const tile of tilesToRender) {
		for (const layerName in tile) {
			const layer = tile[layerName]!;
			if (!layers[layerName]) {
				layers[layerName] = {polylines: [], polygons: {indices: [], vertices: []}};
			}
			layers[layerName]!.polylines.push(...layer.polylines);
			layers[layerName]!.polygons.indices.push(...layer.polygons.indices);
			layers[layerName]!.polygons.vertices.push(...layer.polygons.vertices);
		}
	}

	render({
		materials,
		objects: layers,
	});

	requestAnimationFrame(() => {
		frameLoop().catch((err) => {
			throw err;
		});
	});
};
requestAnimationFrame(() => {
	frameLoop().catch((err) => {
		throw err;
	});
});

const renderPassDescriptor = {
	label: `render pass`,
	colorAttachments: [
		{
			view: canvasContext.getCurrentTexture().createView({label: `colour texture view`}),
			clearValue: [0, 0, 0, 1],
			loadOp: `clear`,
			storeOp: `store`,
		},
	],
	depthStencilAttachment: {
		view: store.depthTextureView,
		depthClearValue: 0,
		depthLoadOp: `clear`,
		depthStoreOp: `store`,
	},
} satisfies GPURenderPassDescriptor;

const render = (data: RenderInput) => {
	const encoder = device.createCommandEncoder({label: `encoder`});
	renderPassDescriptor.colorAttachments[0]!.view = canvasContext
		.getCurrentTexture()
		.createView({label: `colour texture view`});
	const pass = encoder.beginRenderPass(renderPassDescriptor);

	for (const materialName in data.objects) {
		const material = data.materials[materialName]!;
		const object = data.objects[materialName]!;

		pass.setPipeline;
	}

	pass.end();
	const commandBuffer = encoder.finish();
	device.queue.submit([commandBuffer]);
};

const resizeObserver = new ResizeObserver(() => {
	hasResized = true;
});
resizeObserver.observe(canvas);
