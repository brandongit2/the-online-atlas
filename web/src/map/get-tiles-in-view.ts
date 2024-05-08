import {floor} from "lodash";

import {type TileId} from "./types";
import {store} from "@/map/store";
import {altitudeToZoom, tileLocalCoordToWorld} from "@/map/util";
import {Mat4} from "@/math/Mat4";
import {Vec3} from "@/math/Vec3";

export const getTilesInView = () => {
	const tilesInView: TileId[] = [];
	const stack: TileId[] = [{zoom: 0, x: 0, y: 0}];
	while (stack.length > 0) {
		const tileId = stack.pop()!;

		if (isTileInView(tileId)) {
			let zoom = floor(altitudeToZoom(store.cameraPos.alt, store.fovX));
			if (tileId.zoom >= zoom) tilesInView.push(tileId);
			else
				stack.push(
					{zoom: tileId.zoom + 1, x: tileId.x * 2, y: tileId.y * 2},
					{zoom: tileId.zoom + 1, x: tileId.x * 2 + 1, y: tileId.y * 2},
					{zoom: tileId.zoom + 1, x: tileId.x * 2, y: tileId.y * 2 + 1},
					{zoom: tileId.zoom + 1, x: tileId.x * 2 + 1, y: tileId.y * 2 + 1},
				);
		}
	}
	return tilesInView;
};

// Calculate the bounding sphere of a tile then check if it's in view (frustum–sphere intersection).
// Also check if the tile is on the near or far side of the globe.
const isTileInView = (tileId: TileId) => {
	const {projectionMatrix, viewMatrix} = store;
	const m = Mat4.multiply(null, projectionMatrix, viewMatrix);

	// Each plane is defined by a normal (x,y,z) and a distance (w) from the origin.
	// prettier-ignore
	let planes: Array<[number, number, number, number]> = [
		[m._41 - m._11, m._42 - m._12, m._43 - m._13, m._44 - m._14], // left
		[m._41 + m._11, m._42 + m._12, m._43 + m._13, m._44 + m._14], // right
		[m._41 + m._21, m._42 + m._22, m._43 + m._23, m._44 + m._24], // top
		[m._41 - m._21, m._42 - m._22, m._43 - m._23, m._44 - m._24], // bottom
		[m._41 - m._31, m._42 - m._32, m._43 - m._33, m._44 - m._34], // near
		[m._31        , m._32        , m._33        , m._34        ], // far
	]
	// Normalize the planes
	planes = planes.map(([x, y, z, w]) => {
		const length = Math.sqrt(x * x + y * y + z * z);
		return [x / length, y / length, z / length, w / length];
	});

	let tileCenter: Vec3;
	if (tileId.zoom === 0) tileCenter = new Vec3(0, 0, 0);
	else tileCenter = new Vec3(tileLocalCoordToWorld([0.5, 0.5], 1, tileId));

	// This is used as the radius of the bounding sphere of the tile.
	let farthestCornerDist: number;
	if (tileId.zoom === 0) farthestCornerDist = 1;
	else {
		const northwestCorner = new Vec3(tileLocalCoordToWorld([0, 0], 1, tileId));
		const northwestCornerDist = northwestCorner.distanceTo(tileCenter);
		const northeastCorner = new Vec3(tileLocalCoordToWorld([1, 0], 1, tileId));
		const northeastCornerDist = northeastCorner.distanceTo(tileCenter);
		const southwestCorner = new Vec3(tileLocalCoordToWorld([0, 1], 1, tileId));
		const southwestCornerDist = southwestCorner.distanceTo(tileCenter);
		const southeastCorner = new Vec3(tileLocalCoordToWorld([1, 1], 1, tileId));
		const southeastCornerDist = southeastCorner.distanceTo(tileCenter);
		farthestCornerDist = Math.max(northwestCornerDist, northeastCornerDist, southwestCornerDist, southeastCornerDist);
	}

	let doesBoundingSphereIntersectFrustum = true;
	for (const plane of planes) {
		const distance = Vec3.dot(new Vec3(plane[0], plane[1], plane[2]), tileCenter) + plane[3];
		if (distance < -farthestCornerDist) doesBoundingSphereIntersectFrustum = false;
	}

	// Check if the tile is on the near side of the globe. This check only needs to be done for low zoom levels since we
	// work through tiles recursively, from big to small. This sort of acts as an early return; by eliminating tiles on
	// the other side of the glibe early, we automatically don't need to check their children. I start the check at zoom
	// level 2 because tiles at that zoom level are the first to be not super distorted (making the math difficult). I end
	// at zoom level 5 because the visible tiles at that zoom level don't curve enough to warrant this check anymore.
	if (tileId.zoom >= 2 && tileId.zoom <= 5) {
		const isTileOnGlobeNearSide = Vec3.dot(tileCenter, new Vec3(store.cameraPosWorld)) > 0;
		if (!isTileOnGlobeNearSide) return false;
	}

	return doesBoundingSphereIntersectFrustum;
};
