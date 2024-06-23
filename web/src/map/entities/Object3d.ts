import {BehaviorSubject, combineLatest, map} from "rxjs";

import {type Scene} from "./Scene";
import {device} from "../webgpu";
import {Mat4} from "@/math/Mat4";
import {Quaternion} from "@/math/Quaternion";
import {Vec3} from "@/math/Vec3";

export abstract class Object3d {
	currentScene: Scene | null = null;

	position = new BehaviorSubject(new Vec3());
	rotation = new BehaviorSubject(new Quaternion());
	scale = new BehaviorSubject(new Vec3(1, 1, 1));

	modelMatrixUniformBuffer = device.createBuffer({
		label: `model matrix uniform buffer`,
		size: 16 * Float32Array.BYTES_PER_ELEMENT,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
	modelMatrix = new BehaviorSubject(new Mat4());

	constructor() {
		combineLatest([this.position, this.rotation, this.scale])
			.pipe(
				map(([position, rotation, scale]) => {
					const m = Mat4.makeTransform(null, position, rotation, scale);
					device.queue.writeBuffer(this.modelMatrixUniformBuffer, 0, new Float32Array(m));
					return m;
				}),
			)
			.subscribe(this.modelMatrix);
	}

	///// Hooks /////

	/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
	onAddToScene(scene: Scene) {}
	onRemoveFromScene(scene: Scene) {}
	/* eslint-enable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
}
