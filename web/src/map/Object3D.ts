import {type Coord3d} from "./types";

export class Object3D {
	position: Coord3d = [0, 0, 0];
	children: Object3D[] = [];
}
