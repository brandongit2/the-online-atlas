import {drawTile, genMeshes} from "./draw-tile"
import {getTilesInView} from "./get-tiles-in-view"
import {store, tileCache} from "./store"
import {type MapTile} from "./types"
import {tileIdToStr} from "./util"
import {canvasContext, depthTexture, device} from "./webgpu"
import {dispatchToWorker} from "@/worker-pool"

const frameLoop = async () => {
	store.updateViewMatrix()

	const tilesInView = getTilesInView()
	const tilesToRender: MapTile[] = []
	for (const tileId of tilesInView) {
		const tileIdStr = tileIdToStr(tileId)
		const tile = tileCache.get(tileIdStr)
		if (tile && tile !== `pending`) {
			tilesToRender.push(tile)
		} else {
			tileCache.set(tileIdStr, `pending`)
			dispatchToWorker(`fetchTile`, {id: tileIdStr})
				.then((tile) => {
					tileCache.set(tileIdStr, tile)
				})
				.catch((err) => {
					throw err
				})
		}
	}
	await Promise.all(
		tilesToRender.map(async (tile) => {
			await genMeshes(tile)
		}),
	)

	render(tilesToRender)

	requestAnimationFrame(() => {
		frameLoop().catch((err) => {
			throw err
		})
	})
}
requestAnimationFrame(() => {
	frameLoop().catch((err) => {
		throw err
	})
})

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
		view: depthTexture.createView({label: `depth texture view`}),
		depthClearValue: 0,
		depthLoadOp: `clear`,
		depthStoreOp: `store`,
	},
} satisfies GPURenderPassDescriptor

const render = (tiles: MapTile[]) => {
	const encoder = device.createCommandEncoder({label: `encoder`})
	renderPassDescriptor.colorAttachments[0]!.view = canvasContext
		.getCurrentTexture()
		.createView({label: `colour texture view`})
	const pass = encoder.beginRenderPass(renderPassDescriptor)

	tiles.forEach((tile) => {
		drawTile(pass, tile)
	})

	pass.end()
	const commandBuffer = encoder.finish()
	device.queue.submit([commandBuffer])
}
