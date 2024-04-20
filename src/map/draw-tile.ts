import {drawLines} from "./draw-lines"
import {drawPolygons} from "./draw-polygons"
import {store} from "./store"
import {type MapLayer, type MapTile} from "./types"
import {device} from "./webgpu"
import {dispatchToWorker} from "@/worker-pool"

const baseLineThickness = 0.008
const renderLayers: Array<{name: string; color: Float32Array}> = [
	{name: `water`, color: new Float32Array([0, 0, 1])},
	{name: `waterway`, color: new Float32Array([0, 0, 1])},
	{name: `admin`, color: new Float32Array([1, 1, 1])},
	{name: `building`, color: new Float32Array([1, 0.647, 0])},
	{name: `structure`, color: new Float32Array([1, 0.647, 0])},
	{name: `road`, color: new Float32Array([0.5, 0.5, 0.5])},
	{name: `motorway_junction`, color: new Float32Array([0.5, 0.5, 0.5])},
]

export const genMeshes = async (tile: MapTile) => {
	await Promise.all(
		renderLayers.map(async (renderLayer) => {
			const layer = tile.layers[renderLayer.name]
			if (!layer) return

			if (layer.linestrings.geometry.length > 0) {
				const {numIndices, indexBuffer, vertexBuffer, uvBuffer} = await dispatchToWorker(
					`linestringsToMesh`,
					{
						linestrings: layer.linestrings.geometry,
						viewPoint: [0, 0, 0],
						thickness: baseLineThickness * 2 ** -store.cameraZoom,
						indexBuffer: layer.linestrings.indexBuffer,
						vertexBuffer: layer.linestrings.vertexBuffer,
						uvBuffer: layer.linestrings.uvBuffer,
					},
					{
						transfer: [
							layer.linestrings.indexBuffer.buffer,
							layer.linestrings.vertexBuffer.buffer,
							layer.linestrings.uvBuffer.buffer,
						],
					},
				)
				layer.linestrings.numIndices = numIndices
				layer.linestrings.indexBuffer = indexBuffer
				layer.linestrings.vertexBuffer = vertexBuffer
				layer.linestrings.uvBuffer = uvBuffer

				if (!layer.linestrings.indexGpuBuffer)
					layer.linestrings.indexGpuBuffer = device.createBuffer({
						label: `layer ${layer.name} linestrings index buffer`,
						size: layer.linestrings.indexBuffer.byteLength,
						usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
					})
				if (!layer.linestrings.vertexGpuBuffer)
					layer.linestrings.vertexGpuBuffer = device.createBuffer({
						label: `layer ${layer.name} linestrings vertex buffer`,
						size: layer.linestrings.vertexBuffer.byteLength,
						usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
					})
				if (!layer.linestrings.uvGpuBuffer)
					layer.linestrings.uvGpuBuffer = device.createBuffer({
						label: `layer ${layer.name} linestrings UV buffer`,
						size: layer.linestrings.uvBuffer.byteLength,
						usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
					})

				device.queue.writeBuffer(layer.linestrings.indexGpuBuffer, 0, layer.linestrings.indexBuffer)
				device.queue.writeBuffer(layer.linestrings.vertexGpuBuffer, 0, layer.linestrings.vertexBuffer)
				device.queue.writeBuffer(layer.linestrings.uvGpuBuffer, 0, layer.linestrings.uvBuffer)
			}

			if (layer.polygons.geometry.length > 0) {
				layer.polygons.numIndices = 6
				if (!layer.polygons.indexGpuBuffer) {
					layer.polygons.indexGpuBuffer = device.createBuffer({
						label: `layer ${layer.name} polygons index buffer`,
						// size: layer.polygons.indexBuffer.byteLength,
						size: 6 * 4,
						usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
					})
					// device.queue.writeBuffer(layer.polygons.indexGpuBuffer, 0, layer.polygons.indexBuffer)
					device.queue.writeBuffer(layer.polygons.indexGpuBuffer, 0, new Uint32Array([0, 2, 1, 1, 2, 3]))
				}
				if (!layer.polygons.vertexGpuBuffer) {
					layer.polygons.vertexGpuBuffer = device.createBuffer({
						label: `layer ${layer.name} polygons vertex buffer`,
						// size: layer.polygons.vertexBuffer.byteLength,
						size: 12 * 4,
						usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
					})
					// device.queue.writeBuffer(layer.polygons.vertexGpuBuffer, 0, layer.polygons.vertexBuffer)
					device.queue.writeBuffer(
						layer.polygons.vertexGpuBuffer,
						0,
						new Float32Array([-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0]),
					)
				}
			}
		}),
	)
}

export const drawTile = (pass: GPURenderPassEncoder, tile: MapTile) => {
	for (const renderLayer of renderLayers) {
		const layer = tile.layers[renderLayer.name]
		if (layer) drawLayer(pass, renderLayer.color, layer)
	}
}

const drawLayer = (pass: GPURenderPassEncoder, color: Float32Array, layer: MapLayer) => {
	const linestrings = layer.linestrings
	if (linestrings.indexGpuBuffer && linestrings.vertexGpuBuffer && linestrings.uvGpuBuffer)
		drawLines(pass, color, {
			numIndices: linestrings.numIndices,
			indexGpuBuffer: linestrings.indexGpuBuffer,
			vertexGpuBuffer: linestrings.vertexGpuBuffer,
			uvGpuBuffer: linestrings.uvGpuBuffer,
		})

	const polygons = layer.polygons
	if (polygons.indexGpuBuffer && polygons.vertexGpuBuffer)
		drawPolygons(pass, color, {
			numIndices: polygons.numIndices,
			indexGpuBuffer: polygons.indexGpuBuffer,
			vertexGpuBuffer: polygons.vertexGpuBuffer,
		})
}
