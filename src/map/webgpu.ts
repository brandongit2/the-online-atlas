///// WebGPU setup /////

import {clamp} from "lodash"

const maybeGpuAdapter = await navigator.gpu.requestAdapter()
if (!maybeGpuAdapter) throw new Error(`No suitable GPUs found`)
export const gpuAdapter = maybeGpuAdapter
export const device = await gpuAdapter.requestDevice()
device.lost
	.then((info) => {
		if (info.reason !== `destroyed`) throw new Error(`GPU lost. Info: ${info.message}`)
	})
	.catch((error) => {
		throw error
	})

export const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

///// Canvas setup /////

export const canvas = document.getElementById(`map-canvas`) as HTMLCanvasElement
const maybeCanvasContext = canvas.getContext(`webgpu`)
if (!maybeCanvasContext) throw new Error(`WebGPU not supported.`)
export const canvasContext = maybeCanvasContext
canvasContext.configure({
	device,
	format: presentationFormat,
})

export let mapDims: [number, number] = [window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio]
const handleResize = () => {
	const mapWidth = clamp(window.innerWidth * devicePixelRatio, 1, device.limits.maxTextureDimension2D)
	const mapHeight = clamp(window.innerHeight * devicePixelRatio, 1, device.limits.maxTextureDimension2D)
	canvas.width = mapWidth
	canvas.height = mapHeight
	mapDims[0] = mapWidth
	mapDims[1] = mapHeight

	return device.createTexture({
		label: `depth texture`,
		size: mapDims,
		format: `depth24plus`,
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	})
}

export let depthTexture: GPUTexture
depthTexture = handleResize()
addEventListener(`resize`, () => {
	const oldDepthTexture = depthTexture
	depthTexture = handleResize()
	oldDepthTexture.destroy()
})

export {}
