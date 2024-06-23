import {CubeGeometry} from "./entities/CubeGeometry";
import {FlatMaterial} from "./entities/FlatMaterial";
import {GlobeViewControls} from "./entities/GlobeViewControls";
import {Mesh} from "./entities/Mesh";
import {PerspectiveCamera} from "./entities/PerspectiveCamera";
import {Scene} from "./entities/Scene";
import * as windowUtils from "../utils/window-utils";

const camera = new PerspectiveCamera();
new GlobeViewControls(camera);
const scene = new Scene(camera);
const mesh = new Mesh(new CubeGeometry(), new FlatMaterial([1, 0, 0]));
scene.addChild(mesh);

// eslint-disable-next-line @typescript-eslint/require-await
const frameLoop = async () => {
	windowUtils.onFrame();

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
