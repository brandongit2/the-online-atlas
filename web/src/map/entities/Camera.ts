import {BehaviorSubject} from "rxjs";

import {Object3d} from "./Object3d";
import {device} from "../webgpu";
import {Mat4} from "@/math/Mat4";

export abstract class Camera extends Object3d {
	cameraUniformBuffer = device.createBuffer({
		label: `camera uniform buffer`,
		size: 16 * 2 * Float32Array.BYTES_PER_ELEMENT, // Two 4x4 matrices
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	projectionMatrix = new BehaviorSubject(new Mat4());
	viewMatrix = new BehaviorSubject(new Mat4());

	constructor() {
		super();
		this.projectionMatrix.subscribe((m) => {
			device.queue.writeBuffer(this.cameraUniformBuffer, 0, new Float32Array(m));
		});
		this.viewMatrix.subscribe((m) => {
			device.queue.writeBuffer(this.cameraUniformBuffer, 16 * Float32Array.BYTES_PER_ELEMENT, new Float32Array(m));
		});
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
				resource: {buffer: this.cameraUniformBuffer},
			},
		],
	});
}
