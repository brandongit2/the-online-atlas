import {GraphNode} from "./GraphNode";
import {type Scene} from "./Scene";
import {device} from "../webgpu";
import {Mat4} from "@/math/Mat4";
import {Quaternion} from "@/math/Quaternion";
import {Vec3} from "@/math/Vec3";

export const DONT_SET_INITIAL_POSITION = Symbol(`DONT_SET_INITIAL_POSITION`);

export abstract class Object3d extends GraphNode {
	constructor(position: Vec3 | typeof DONT_SET_INITIAL_POSITION = new Vec3()) {
		super();
		if (position !== DONT_SET_INITIAL_POSITION) this.setPosition(position);
	}

	parent: Object3d | null = null;
	children: Object3d[] = [];

	#position = new Vec3();
	get position() {
		return this.#position;
	}
	setPosition(vec: Vec3) {
		this.#position = vec;
		this.setModelMatrix(Mat4.fromTranslation(null, vec));
		return this;
	}

	// todo: make `rotation` and `scale` do something
	rotation = new Quaternion();
	scale = new Vec3(1, 1, 1);

	#modelMatrix = new Mat4();
	get modelMatrix() {
		return this.#modelMatrix;
	}
	setModelMatrix(matrix: Mat4) {
		this.#modelMatrix = matrix;
		device.queue.writeBuffer(this.#modelMatrixUniformBuffer, 0, new Float32Array(matrix));
	}
	#modelMatrixUniformBuffer = device.createBuffer({
		label: `model matrix uniform buffer`,
		size: 16 * Float32Array.BYTES_PER_ELEMENT,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
	get modelMatrixUniformBuffer() {
		return this.#modelMatrixUniformBuffer;
	}

	#currentScene: Scene | null = null;
	get currentScene() {
		return this.#currentScene;
	}
	setCurrentScene(scene: Scene | null) {
		this.#currentScene = scene;
		this.children.forEach((child) => {
			child.setCurrentScene(scene);
		});
	}

	addChild(child: Object3d) {
		super.addChild(child);
		child.setCurrentScene(this.currentScene);
	}

	removeChild(child: Object3d) {
		super.removeChild(child);
		child.setCurrentScene(null);
	}
}
