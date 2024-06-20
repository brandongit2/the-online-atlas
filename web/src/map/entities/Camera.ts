import {Object3d} from "./Object3d";
import {device} from "../webgpu";
import {Mat4} from "@/math/Mat4";
import {Vec3} from "@/math/Vec3";
import {mapDims} from "@/utils/window-utils";

export class Camera extends Object3d {
	#position = new Vec3();
	get position() {
		return this.#position;
	}
	set position(vec: Vec3) {
		this.#position = vec;
		this.viewMatrix = Mat4.lookAt(null, this.#position, new Vec3(), new Vec3(0, 1, 0));
	}

	constructor() {
		super();
		this.projectionMatrix = Mat4.makePerspectiveMatrix(null, 90, mapDims[1] / mapDims[0], 0.1, 1000);
		this.position = new Vec3(0, 0, 0);
	}

	#projectionMatrix!: Mat4;
	get projectionMatrix() {
		return this.#projectionMatrix;
	}
	set projectionMatrix(matrix) {
		this.#projectionMatrix = matrix;
		device.queue.writeBuffer(this.#projectionMatrixUniformBuffer, 0, new Float32Array(this.#projectionMatrix));
	}

	#viewMatrix!: Mat4;
	get viewMatrix() {
		return this.#viewMatrix;
	}
	set viewMatrix(matrix) {
		this.#viewMatrix = matrix;
		device.queue.writeBuffer(this.#viewMatrixUniformBuffer, 0, new Float32Array(this.#viewMatrix));
	}

	#projectionMatrixUniformBuffer = device.createBuffer({
		label: `projection matrix uniform buffer`,
		size: 16 * Float32Array.BYTES_PER_ELEMENT,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
	#viewMatrixUniformBuffer = device.createBuffer({
		label: `view matrix uniform buffer`,
		size: 16 * Float32Array.BYTES_PER_ELEMENT,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
}
