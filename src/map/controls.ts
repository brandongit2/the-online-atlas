import {clamp} from "lodash";

import {store} from "./store";
import {canvas} from "./webgpu";

canvas.addEventListener(`pointermove`, (event) => {
	if (event.buttons !== 1) return;

	const dx = event.movementX * devicePixelRatio;
	const dy = event.movementY * devicePixelRatio;

	const fac = (1 / store.mapDims[0]) * 360 * 2 ** -store.cameraZoom;
	let newLng = store.cameraPos.lng - dx * fac;
	if (newLng < -180) newLng += 360;
	else if (newLng > 180) newLng -= 360;

	store.cameraPos.lng = newLng;
	store.cameraPos.lat = clamp(store.cameraPos.lat + dy * fac, -85, 85);
});

canvas.addEventListener(`wheel`, (event) => {
	event.preventDefault();
	store.cameraZoom = clamp(store.cameraZoom - event.deltaY / 50, 0, 18);
});
