import {DONT_SET_INITIAL_POSITION, Object3d} from "./Object3d";
import {device} from "../webgpu";
import {Mat4} from "@/math/Mat4";
import {Vec3} from "@/math/Vec3";
import {mapDims} from "@/utils/window-utils";

const fovX = 90;
const near = 0.1;
const far = 1000;

export class Camera extends Object3d {
	#cameraUniformBuffer = device.createBuffer({
		label: `camera uniform buffer`,
		size: 16 * 2 * Float32Array.BYTES_PER_ELEMENT, // Two 4x4 matrices
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	constructor(position = new Vec3()) {
		super(DONT_SET_INITIAL_POSITION);
		this.setPosition(position);
		this.setProjectionMatrix(Mat4.makePerspectiveMatrix(null, fovX, mapDims[0] / mapDims[1], near, far));
	}

	setPosition(vec: Vec3) {
		super.setPosition(vec);
		this.#viewMatrix = Mat4.fromTranslation(null, Vec3.scaleBy(null, vec, -1));
		device.queue.writeBuffer(
			this.#cameraUniformBuffer,
			16 * Float32Array.BYTES_PER_ELEMENT,
			new Float32Array(this.viewMatrix),
		);
		return this;
	}

	#projectionMatrix!: Mat4;
	get projectionMatrix() {
		return this.#projectionMatrix;
	}
	setProjectionMatrix(matrix: Mat4) {
		this.#projectionMatrix = matrix;
		device.queue.writeBuffer(this.#cameraUniformBuffer, 0, new Float32Array(this.#projectionMatrix));
	}

	#viewMatrix = new Mat4();
	get viewMatrix() {
		return this.#viewMatrix;
	}

	updateAspectRatio() {
		this.setProjectionMatrix(Mat4.makePerspectiveMatrix(null, fovX, mapDims[0] / mapDims[1], near, far));
	}

	static bindGroupLayout = device.createBindGroupLayout({
		label: `camera bind group layout`,
		entries: [
			{
				// `camera`
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {type: `uniform`},
			},
		],
	});

	bindGroup = device.createBindGroup({
		layout: Camera.bindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: {buffer: this.#cameraUniformBuffer},
			},
		],
	});
}
