import {type Geometry} from "./Geometry";
import {Object3d} from "./Object3d";
import {type Mat4} from "@/math/Mat4";
import {type Vec3} from "@/math/Vec3";

export class Mesh extends Object3d {
	#position!: Vec3;
	get position() {
		return this.#position;
	}
	set position(position) {
		this.#position = position;
		this.modelMatrix = Mat4.fromTranslation(position);
	}

	modelMatrix!: Mat4;

	constructor(
		public geometry: Geometry,
		public position: Vec3,
	) {
		super();
	}
}
