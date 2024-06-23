import {BehaviorSubject, combineLatest, map} from "rxjs";

import {Camera} from "./Camera";
import {Mat4} from "@/math/Mat4";
import {mapDims} from "@/utils/window-utils";

export class PerspectiveCamera extends Camera {
	fovX = new BehaviorSubject(90);
	near = new BehaviorSubject(0.1);
	far = new BehaviorSubject(1000);

	constructor() {
		super();
		combineLatest([this.fovX, mapDims, this.near, this.far])
			.pipe(map(([fovX, mapDims, near, far]) => Mat4.makePerspective(null, fovX, mapDims[0] / mapDims[1], near, far)))
			.subscribe(this.projectionMatrix);
	}
}
