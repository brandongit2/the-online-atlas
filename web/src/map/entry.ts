import "./controls";
import {CubeGeometry} from "./entities/CubeGeometry";
import {FlatMaterial} from "./entities/FlatMaterial";
import {Mesh} from "./entities/Mesh";
import {Scene} from "./entities/Scene";
import * as windowUtils from "../utils/window-utils";
import {Vec3} from "@/math/Vec3";
import {renderPassDescriptor} from "@/utils/webgpu-utils";

const scene = new Scene();
scene.addChild(new Mesh(new CubeGeometry(), new FlatMaterial([1, 0, 0])).setPosition(new Vec3(0, 0, -5)));

// eslint-disable-next-line @typescript-eslint/require-await
const frameLoop = async () => {
	const hasResized = windowUtils.onFrame();
	if (hasResized) {
		renderPassDescriptor.depthStencilAttachment.view = windowUtils.depthTextureView;
		scene.updateAspectRatio();
	}

	scene.render();

	requestAnimationFrame(() => {
		frameLoop().catch((err) => {
			throw err;
		});
	});
};
requestAnimationFrame(() => {
	frameLoop().catch((err) => {
		throw err;
	});
});
