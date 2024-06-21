import {Camera} from "./Camera";
import {GraphNode} from "./GraphNode";
import {Mesh} from "./Mesh";
import {type Object3d} from "./Object3d";
import {canvasContext, device} from "../webgpu";
import {renderPassDescriptor} from "@/utils/webgpu-utils";

export class Scene extends GraphNode {
	#activeCamera = new Camera();
	get activeCamera() {
		return this.#activeCamera;
	}
	setActiveCamera(camera: Camera) {
		this.#activeCamera = camera;
	}

	addChild(child: Object3d) {
		super.addChild(child);
		child.setCurrentScene(this);
	}

	render() {
		renderPassDescriptor.colorAttachments[0]!.view = canvasContext
			.getCurrentTexture()
			.createView({label: `colour texture view`});
		const encoder = device.createCommandEncoder({label: `command encoder`});
		const renderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);

		// traverse the scene graph and, for all lines, call their `genMeshes()` method
		// ^ store the mesh data (vertex, index, uv) in GPU buffers
		//
		// OR lines get

		const renderChildren = (object: GraphNode) => {
			object.children.forEach((child) => {
				// todo: call pre-draw
				if (child instanceof Mesh) child.draw(renderPassEncoder);
				renderChildren(child);
			});
		};
		renderChildren(this);

		renderPassEncoder.end();
		device.queue.submit([encoder.finish()]);
	}

	updateAspectRatio() {
		this.#activeCamera.updateAspectRatio();
	}
}
