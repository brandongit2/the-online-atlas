import {Camera} from "./Camera";
import {Geometry} from "./Geometry";
import {GraphNode} from "./GraphNode";
import {type Object3d} from "./Object3d";
import {canvasContext, device, presentationFormat} from "../webgpu";
import {renderPassDescriptor} from "@/utils/webgpu-utils";

export class Scene extends GraphNode {
	#activeCamera = new Camera();
	get activeCamera() {
		return this.#activeCamera;
	}
	set activeCamera(camera: Camera) {
		this.#activeCamera = camera;
	}

	addChild(child: Object3d) {
		super.addChild(child);
		child.currentScene = this;
	}

	render() {
		renderPassDescriptor.colorAttachments[0]!.view = canvasContext
			.getCurrentTexture()
			.createView({label: `colour texture view`});
		const encoder = device.createCommandEncoder({label: `command encoder`});
		const renderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);

		renderPassEncoder.setPipeline(renderPipeline);

		const renderChildren = (object: GraphNode) => {
			object.children.forEach((child) => {
				if (child instanceof Geometry) {
					renderPassEncoder.setIndexBuffer(child.indexGpuBuffer, `uint32`);
					renderPassEncoder.setVertexBuffer(0, child.vertexGpuBuffer);
				}
				renderChildren(child);
			});
		};
		renderChildren(this);

		renderPassEncoder.end();
		device.queue.submit([encoder.finish()]);
	}
}

const vertexShader = `
	struct Camera {
		projection: mat4x4f;
		view: mat4x4f;
	}

	@group(0) @binding(0) var<uniform> camera: Camera;
	@group(0) @binding(1) var<uniform> model: mat4x4f;

	@vertex fn vs(@location(0) vertex: vec3f) -> @builtin(position) vec4f {
		return camera.projection * camera.view * model * vec4f(vertex, 1.0);
	}
`;

const fragmentShader = `
	@group(0) @binding(2) var<uniform> color: vec3f;

	@fragment fn fs() -> @location(0) vec4f {
		return vec4f(color, 1.0);
	}
`;

const bindGroupLayout = device.createBindGroupLayout({
	label: `bind group layout`,
	entries: [
		{
			// `camera`
			binding: 0,
			visibility: GPUShaderStage.VERTEX,
			buffer: {type: `uniform`},
		},
		{
			// `model`
			binding: 1,
			visibility: GPUShaderStage.VERTEX,
			buffer: {type: `uniform`},
		},
		{
			// `color`
			binding: 2,
			visibility: GPUShaderStage.FRAGMENT,
			buffer: {type: `uniform`},
		},
	],
});

const renderPipelineLayout = device.createPipelineLayout({
	label: `pipeline layout`,
	bindGroupLayouts: [bindGroupLayout],
});

const renderPipeline = device.createRenderPipeline({
	label: `render pipeline`,
	layout: renderPipelineLayout,
	vertex: {
		module: device.createShaderModule({
			label: `vertex shader`,
			code: vertexShader,
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
			label: `fragment shader`,
			code: fragmentShader,
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
