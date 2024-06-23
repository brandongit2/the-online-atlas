import {BehaviorSubject} from "rxjs";

import {Camera} from "./Camera";
import {type Material} from "./Material";
import {type Coord3d} from "../types";
import {device, presentationFormat} from "../webgpu";

export class FlatMaterial implements Material {
	__proto = FlatMaterial;

	color: BehaviorSubject<Coord3d>;

	constructor(color: Coord3d) {
		this.color = new BehaviorSubject(color);
		this.color.subscribe((color) => {
			device.queue.writeBuffer(this.colorUniformBuffer, 0, new Float32Array(color));
		});
	}

	colorUniformBuffer = device.createBuffer({
		label: `flat material colour uniform buffer`,
		size: 3 * Float32Array.BYTES_PER_ELEMENT,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	static vertexShader = `
		struct Camera {
			projection: mat4x4f,
			view: mat4x4f,
		}

		@group(0) @binding(0) var<uniform> camera: Camera;
		@group(2) @binding(0) var<uniform> model: mat4x4f;

		@vertex fn vs(@location(0) vertex: vec3f) -> @builtin(position) vec4f {
			return camera.projection * camera.view * model * vec4f(vertex, 1.0);
		}
	`;

	static fragmentShader = `
		@group(1) @binding(0) var<uniform> color: vec3f;

		@fragment fn fs() -> @location(0) vec4f {
			return vec4f(color, 1.0);
		}
	`;

	static materialBindGroupLayout = device.createBindGroupLayout({
		label: `flat material material bind group layout`,
		entries: [
			{
				// `color`
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {type: `uniform`},
			},
		],
	});

	materialBindGroup = device.createBindGroup({
		label: `flat material material bind group`,
		layout: FlatMaterial.materialBindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: {buffer: this.colorUniformBuffer},
			},
		],
	});

	static meshBindGroupLayout = device.createBindGroupLayout({
		label: `flat material mesh bind group layout`,
		entries: [
			{
				// `model`
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {type: `uniform`},
			},
		],
	});

	static renderPipelineLayout = device.createPipelineLayout({
		label: `flat material render pipeline layout`,
		bindGroupLayouts: [Camera.bindGroupLayout, this.materialBindGroupLayout, this.meshBindGroupLayout],
	});

	static renderPipeline = device.createRenderPipeline({
		label: `flat material render pipeline`,
		layout: this.renderPipelineLayout,
		vertex: {
			module: device.createShaderModule({
				label: `flat material vertex shader`,
				code: this.vertexShader,
			}),
			entryPoint: `vs`,
			buffers: [
				{
					// `vertex`
					arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
					attributes: [{shaderLocation: 0, offset: 0, format: `float32x3`}],
				},
			],
		},
		fragment: {
			module: device.createShaderModule({
				label: `flat material fragment shader`,
				code: this.fragmentShader,
			}),
			entryPoint: `fs`,
			targets: [{format: presentationFormat}],
		},
		primitive: {
			cullMode: `back`,
		},
		depthStencil: {
			depthWriteEnabled: true,
			depthCompare: `greater`,
			format: `depth24plus`,
		},
	});
}
