import invariant from "tiny-invariant";

import {type Geometry} from "./Geometry";
import {type Material} from "./Material";
import {Object3d} from "./Object3d";
import {device} from "../webgpu";

export class Mesh extends Object3d {
	meshBindGroup: GPUBindGroup;

	constructor(
		public geometry: Geometry,
		public material: Material,
	) {
		super();

		this.meshBindGroup = device.createBindGroup({
			layout: this.material.__proto.meshBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {buffer: this.modelMatrixUniformBuffer},
				},
			],
		});
	}

	draw(renderPassEncoder: GPURenderPassEncoder) {
		invariant(this.currentScene, `Mesh must be in a scene in order to draw`);

		renderPassEncoder.setPipeline(this.material.__proto.renderPipeline);
		renderPassEncoder.setBindGroup(0, this.currentScene.activeCamera.bindGroup);
		renderPassEncoder.setBindGroup(1, this.material.materialBindGroup);
		renderPassEncoder.setBindGroup(2, this.meshBindGroup);

		renderPassEncoder.setIndexBuffer(this.geometry.indexGpuBuffer, `uint32`);
		renderPassEncoder.setVertexBuffer(0, this.geometry.vertexGpuBuffer);

		renderPassEncoder.drawIndexed(this.geometry.indices.length);
	}
}
