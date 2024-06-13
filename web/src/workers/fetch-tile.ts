import {VectorTile} from "@mapbox/vector-tile";
import earcut from "earcut";
import Pbf from "pbf";
import wretch from "wretch";
import AbortAddon from "wretch/addons/abort";
// eslint-disable-next-line import/no-named-as-default -- `QueryStringAddon` in this import is an interface, not what we want
import QueryStringAddon from "wretch/addons/queryString";

import {MAPBOX_ACCESS_TOKEN} from "@/env";
import {type Coord2d, type Coord3d, type TileIdStr} from "@/map/types";
import {
	tileIdFromStr,
	groupByTwos,
	mercatorToWorld,
	roughEq,
	tileLocalCoordToMercator,
	tileLocalCoordToWorld,
} from "@/map/util";

export type FetchTileArgs = {
	id: TileIdStr;
};

export type FetchTileReturn = Record<
	string,
	{
		polylines: Coord3d[][];
		polygons: {indices: number[]; vertices: Coord3d[]};
	}
>;

export const fetchTile = async ({id}: FetchTileArgs, abortSignal: AbortSignal) => {
	const {zoom, x, y} = tileIdFromStr(id);

	const data = await wretch(`https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${zoom}/${x}/${y}.mvt`)
		.addon(AbortAddon())
		.addon(QueryStringAddon)
		.options({signal: abortSignal})
		.query({access_token: MAPBOX_ACCESS_TOKEN})
		.get()
		.arrayBuffer()
		.catch((err) => {
			if (err instanceof DOMException && err.name === `AbortError`) return null;
		});
	if (!data) {
		postMessage({id, layers: {}});
		return;
	}

	const tileData = new VectorTile(new Pbf(data));
	const layers: FetchTileReturn = {};
	for (const name in tileData.layers) {
		const layer = tileData.layers[name]!;

		layers[name] = {polylines: [], polygons: {indices: [], vertices: []}};

		const polygons: Coord2d[][] = [];
		for (let i = 0; i < layer.length; i++) {
			const feature = layer.feature(i);
			if (feature.type !== 2 && feature.type !== 3) continue;

			if (feature.type === 2) {
				layers[name]!.polylines.push(
					...feature
						.loadGeometry()
						.map((shape) =>
							shape.map((coord) => tileLocalCoordToWorld([coord.x, coord.y], feature.extent, {zoom, x, y})),
						),
				);
			}
			if (feature.type === 3) {
				polygons.push(
					...feature
						.loadGeometry()
						.map((shape) =>
							shape.map((coord) => tileLocalCoordToMercator([coord.x, coord.y], feature.extent, {zoom, x, y})),
						),
				);
			}
		}

		layers[name]!.polygons = processPolygons(polygons);
	}

	postMessage(layers satisfies FetchTileReturn);
};

// Earcuts the polygons and transforms the coordinates from Mercator to world space.
const processPolygons = (polygons: Coord2d[][]) => {
	const indices: number[] = [];
	const vertices: Coord3d[] = [];

	const featurePolygons = classifyRings(polygons);
	for (let polygon of featurePolygons) {
		const polygonVertices = polygon.flat(2);
		let i = 0;
		const holeIndices = polygon
			.map((ring) => {
				const holeIndex = i;
				i += ring.length;
				return holeIndex;
			})
			.slice(1);

		let polygonIndices = earcut(polygonVertices, holeIndices);

		// In transforming from Mercator coord to world space, the vertical axis is flipped. So that this doesn't mess with
		// the winding order, we reverse the order of every triangle's vertices.
		for (let i = 0; i < polygonIndices.length; i += 3) {
			[polygonIndices[i], polygonIndices[i + 2]] = [polygonIndices[i + 2]!, polygonIndices[i]!];
		}

		indices.push(...polygonIndices.map((index) => index + vertices.length / 3));
		vertices.push(...groupByTwos(polygonVertices).map((coord) => mercatorToWorld(coord)));
	}

	return {indices, vertices};
};

const classifyRings = (rings: Coord2d[][]) => {
	if (rings.length <= 1) return [rings];

	let polygons: Coord2d[][][] = [];
	let currentPolygon: Coord2d[][] = [];
	for (const ring of rings) {
		let area = signedArea(ring);

		if (roughEq(area, 0)) continue;
		if (area > 0) {
			if (currentPolygon.length > 0) polygons.push(currentPolygon);
			currentPolygon = [ring];
		} else {
			currentPolygon.push(ring);
		}
	}
	if (polygons.at(-1)! !== currentPolygon) polygons.push(currentPolygon);

	return polygons;
};

const signedArea = (ring: Coord2d[]) => {
	let area = 0;
	for (let i = 0; i < ring.length; i++) {
		const [x1, y1] = ring[i]!;
		const [x2, y2] = ring[(i + 1) % ring.length]!;

		area += x1 * y2 - x2 * y1;
	}

	return area / 2;
};
