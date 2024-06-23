import {type Camera} from "./Camera";
import {Mesh} from "./Mesh";
import {type Object3d} from "./Object3d";
import {canvasContext, device} from "../webgpu";
import {renderPassDescriptor} from "@/utils/webgpu-utils";

export class Scene {
	children: Object3d[] = [];
	activeCamera: Camera;

	constructor(camera: Camera) {
		this.addChild(camera);
		this.activeCamera = camera;
	}

	addChild(child: Object3d) {
		this.children.push(child);
		child.currentScene = this;
		child.onAddToScene(this);
	}

	render() {
		renderPassDescriptor.colorAttachments[0]!.view = canvasContext
			.getCurrentTexture()
			.createView({label: `colour texture view`});
		const encoder = device.createCommandEncoder({label: `command encoder`});
		const renderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);

		this.children.forEach((child) => {
			if (child instanceof Mesh) child.draw(renderPassEncoder);
		});

		renderPassEncoder.end();
		device.queue.submit([encoder.finish()]);
	}
}
