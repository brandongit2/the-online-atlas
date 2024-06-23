import {clamp} from "lodash";
import {BehaviorSubject, combineLatest, filter, fromEvent, map} from "rxjs";

import {type PerspectiveCamera} from "./PerspectiveCamera";
import {canvas} from "../webgpu";
import {Mat4} from "@/math/Mat4";
import {Vec3} from "@/math/Vec3";
import {cos_d, sin_d, zoomToAltitude} from "@/utils/math-utils";
import {mapDims} from "@/utils/window-utils";

export class GlobeViewControls {
	lng = new BehaviorSubject(0);
	lat = new BehaviorSubject(0);

	zoom = new BehaviorSubject(0); // Map tile zoom level
	altitude = new BehaviorSubject(5);

	constructor(public camera: PerspectiveCamera) {
		combineLatest([this.zoom, camera.fovX])
			.pipe(map(([zoom, fovX]) => zoomToAltitude(zoom, fovX)))
			.subscribe(this.altitude);

		combineLatest([this.lng, this.lat, this.altitude])
			.pipe(
				map(([lng, lat, altitude]) => {
					const cosLat = cos_d(lat);
					const sinLat = sin_d(lat);
					const cosLng = cos_d(lng);
					const sinLng = sin_d(lng);

					const position = new Vec3(altitude * sinLng * cosLat, altitude * sinLat, altitude * cosLng * cosLat);
					const viewMatrix = Mat4.lookAt(null, position, new Vec3(), new Vec3(0, 1, 0));
					return {position, viewMatrix};
				}),
			)
			.subscribe(({position, viewMatrix}) => {
				this.camera.position.next(position);
				this.camera.viewMatrix.next(viewMatrix);
			});

		fromEvent<PointerEvent>(canvas, `pointermove`)
			.pipe(
				filter((event) => event.buttons === 1),
				map((event) => ({
					dx: event.movementX * devicePixelRatio,
					dy: event.movementY * devicePixelRatio,
				})),
			)
			.subscribe(this.onPointerMove);
		fromEvent<WheelEvent>(canvas, `wheel`)
			.pipe(
				map((event) => {
					event.preventDefault();
					return event.deltaY;
				}),
			)
			.subscribe(this.onWheel);
	}

	onPointerMove = ({dx, dy}: {dx: number; dy: number}) => {
		const fac = (1 / mapDims.getValue()[0]) * 360 * 2 ** -this.zoom.getValue();

		let newLng = this.lng.getValue() - dx * fac;
		if (newLng < -180) newLng += 360;
		else if (newLng > 180) newLng -= 360;
		this.lng.next(newLng);

		let newLat = this.lat.getValue() + dy * fac;
		newLat = clamp(newLat, -85, 85);
		this.lat.next(newLat);
	};

	onWheel = (deltaY: number) => {
		let newZoom = this.zoom.getValue() - deltaY / 70;
		newZoom = clamp(newZoom, 0, 18);
		this.zoom.next(newZoom);
	};
}
