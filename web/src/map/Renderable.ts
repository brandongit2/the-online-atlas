import {Object3D} from "./Object3D";

export class Renderable extends Object3D {
	geometry: Geometry;
	pipeline: Pipeline;

	constructor(geometry: Geometry, pipeline: Pipeline) {
		super();
		this.geometry = geometry;
		this.pipeline = pipeline;
	}

	draw(renderPass: GPURenderPassEncoder) {
		this.pipeline.bind(renderPass);
		this.geometry.bind(renderPass);
		renderPass.drawIndexed(this.geometry.indexBuffer.size / 2, 1, 0, 0, 0);
	}
}
