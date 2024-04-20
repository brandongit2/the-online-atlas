import {clamp} from "lodash"

import {mapDims} from "./state"

const gpuAdapter = await navigator.gpu.requestAdapter()
if (!gpuAdapter) throw new Error(`No suitable GPUs found`)
const device = await gpuAdapter.requestDevice()
device.lost
	.then((info) => {
		if (info.reason !== `destroyed`) throw new Error(`GPU lost. Info: ${info.message}`)
	})
	.catch((error) => {
		throw error
	})

const canvas = document.getElementById(`map-canvas`) as HTMLCanvasElement
const canvasContext = canvas.getContext(`webgpu`)
if (!canvasContext) throw new Error(`WebGPU not supported.`)
const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
canvasContext.configure({
	device,
	format: presentationFormat,
})

const handleResize = () => {
	const mapWidth = clamp(window.innerWidth * devicePixelRatio, 1, device.limits.maxTextureDimension2D)
	const mapHeight = clamp(window.innerHeight * devicePixelRatio, 1, device.limits.maxTextureDimension2D)
	canvas.width = mapWidth
	canvas.height = mapHeight

	return device.createTexture({
		label: `depth texture`,
		size: mapDims,
		format: `depth24plus`,
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	})
}

let depthTexture: GPUTexture
depthTexture = handleResize()
addEventListener(`resize`, () => {
	const oldDepthTexture = depthTexture
	depthTexture = handleResize()
	oldDepthTexture.destroy()
})

const render = () => {
	const encoder = device.createCommandEncoder({label: `encoder`})
	const pass = encoder.beginRenderPass({
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
	})

	pass.end()
	const commandBuffer = encoder.finish()
	device.queue.submit([commandBuffer])

	requestAnimationFrame(render)
}
requestAnimationFrame(render)

export {}
