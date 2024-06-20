import {type Geometry} from "./Geometry";
import {Object3d} from "./Object3d";
import {type Vec3} from "@/math/Vec3";

export class Mesh extends Object3d {
	constructor(
		public geometry: Geometry,
		public position: Vec3,
	) {
		super();
	}
}
