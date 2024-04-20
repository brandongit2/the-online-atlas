import {type Coord3d, type MapTile, type TileIdStr} from "./types"
import {altitudeToZoom, lngLatToWorld, zoomToAltitude} from "./util"
import {canvas, device} from "./webgpu"
import {Mat4} from "@/math/Mat4"
import {Vec3} from "@/math/Vec3"

export const tileCache = new Map<TileIdStr, MapTile | "pending">()

const createDepthTexture = (size: [number, number]) =>
	device.createTexture({
		label: `depth texture`,
		size,
		format: `depth24plus`,
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	})

export abstract class store {
	static #mapDims: [number, number] = [window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio]
	static #depthTexture = createDepthTexture(this.#mapDims)
	static get depthTexture() {
		return this.#depthTexture
	}
	static #depthTextureView = this.#depthTexture.createView({label: `depth texture view`})
	static get depthTextureView() {
		return this.#depthTextureView
	}
	static get mapDims() {
		return this.#mapDims
	}
	static set mapDims(mapDims) {
		this.#mapDims = mapDims
		canvas.width = mapDims[0]
		canvas.height = mapDims[1]

		const oldDepthTexture = this.#depthTexture
		this.#depthTexture = createDepthTexture(mapDims)
		this.#depthTextureView = this.#depthTexture.createView({label: `depth texture view`})
		oldDepthTexture.destroy()
	}

	static #fovX = 80
	static get fovX() {
		return this.#fovX
	}
	static set fovX(fovX) {
		this.#fovX = fovX
		this.#projectionMatrix.makePerspectiveMatrix(fovX, this.#mapDims[0] / this.#mapDims[1], 0.1, 1000)
		device.queue.writeBuffer(this.#projectionMatrixUniformBuffer, 0, new Float32Array(this.#projectionMatrix))
	}

	static #projectionMatrix = Mat4.makePerspectiveMatrix(
		null,
		this.#fovX,
		this.#mapDims[0] / this.#mapDims[1],
		0.1,
		1000,
	)
	static get projectionMatrix() {
		return this.#projectionMatrix
	}
	static set projectionMatrix(projectionMatrix) {
		this.#projectionMatrix = projectionMatrix
		device.queue.writeBuffer(this.#projectionMatrixUniformBuffer, 0, new Float32Array(this.#projectionMatrix))
	}
	static #projectionMatrixUniformBuffer = device.createBuffer({
		label: `projection matrix uniform buffer`,
		size: 16 * Float32Array.BYTES_PER_ELEMENT,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	static get projectionMatrixUniformBuffer() {
		return this.#projectionMatrixUniformBuffer
	}
	static {
		device.queue.writeBuffer(this.#projectionMatrixUniformBuffer, 0, new Float32Array(this.#projectionMatrix))
	}

	static #viewMatrix = new Mat4()
	static get viewMatrix() {
		return this.#viewMatrix
	}
	static set viewMatrix(viewMatrix) {
		this.#viewMatrix = viewMatrix
		device.queue.writeBuffer(this.#viewMatrixUniformBuffer, 0, new Float32Array(this.#viewMatrix))
	}
	static #viewMatrixUniformBuffer = device.createBuffer({
		label: `view matrix uniform buffer`,
		size: 16 * Float32Array.BYTES_PER_ELEMENT,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	static get viewMatrixUniformBuffer() {
		return this.#viewMatrixUniformBuffer
	}
	static {
		device.queue.writeBuffer(this.#viewMatrixUniformBuffer, 0, new Float32Array(this.#viewMatrix))
	}

	static cameraPos = {lng: 0, lat: 0, alt: zoomToAltitude(0, this.#fovX)} // Altitude in metres
	static #cameraZoom = altitudeToZoom(this.cameraPos.alt, this.#fovX)
	static get cameraZoom() {
		return this.#cameraZoom
	}
	static updateViewMatrix = () => {
		this.#cameraPosWorld = lngLatToWorld([this.cameraPos.lng, this.cameraPos.lat], this.cameraPos.alt)
		this.#viewMatrix.lookAt(new Vec3(this.#cameraPosWorld), new Vec3(0, 0, 0), new Vec3(0, 1, 0))
		device.queue.writeBuffer(this.#viewMatrixUniformBuffer, 0, new Float32Array(this.#viewMatrix))

		this.#cameraZoom = altitudeToZoom(this.cameraPos.alt, this.#fovX)
	}

	static #cameraPosWorld: Coord3d = [0, 0, 0]
	static get cameraPosWorld() {
		return this.#cameraPosWorld
	}
}
