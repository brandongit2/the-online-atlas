///// WebGPU setup /////

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

export {}
