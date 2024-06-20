import {GraphNode} from "./GraphNode";
import {type Scene} from "./Scene";
import {Mat4} from "@/math/Mat4";
import {Quaternion} from "@/math/Quaternion";
import {Vec3} from "@/math/Vec3";

export abstract class Object3d extends GraphNode {
	abstract position: Vec3;
	rotation = new Quaternion();
	scale = new Vec3(1, 1, 1);
	parent: Object3d | null = null;
	children: Object3d[] = [];
	modelMatrix = new Mat4();

	#currentScene: Scene | null = null;
	get currentScene() {
		return this.#currentScene;
	}
	set currentScene(scene) {
		this.#currentScene = scene;
		this.children.forEach((child) => {
			child.currentScene = scene;
		});
	}

	addChild(child: Object3d) {
		super.addChild(child);
		child.currentScene = this.currentScene;
	}

	removeChild(child: Object3d) {
		super.removeChild(child);
		child.currentScene = null;
	}
}
