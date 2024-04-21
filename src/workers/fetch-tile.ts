import {VectorTile, VectorTileFeature} from "@mapbox/vector-tile"
import earcut from "earcut"
import Pbf from "pbf"
import wretch from "wretch"
import AbortAddon from "wretch/addons/abort"
// eslint-disable-next-line import/no-named-as-default -- `QueryStringAddon` in this import is an interface, not what we want
import QueryStringAddon from "wretch/addons/queryString"

import {MAPBOX_ACCESS_TOKEN} from "@/env"
import {type Coord2d, type MapFeature, type MapLayer, type MapTile, type TileIdStr} from "@/map/types"
import {tileIdFromStr, groupByTwos, mercatorToWorld, roughEq, tileLocalCoordToMercator} from "@/map/util"

export type FetchTileArgs = {
	id: TileIdStr
}

export type FetchTileReturn = MapTile

export const fetchTile = async ({id}: FetchTileArgs, abortSignal: AbortSignal) => {
	const {zoom, x, y} = tileIdFromStr(id)

	const data = await wretch(`https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${zoom}/${x}/${y}.mvt`)
		.addon(AbortAddon())
		.addon(QueryStringAddon)
		.options({signal: abortSignal})
		.query({access_token: MAPBOX_ACCESS_TOKEN})
		.get()
		.arrayBuffer()
		.catch((err) => {
			if (err instanceof DOMException && err.name === `AbortError`) return null
			// throw err
		})
	if (!data) {
		postMessage({id, layers: {}})
		return
	}

	const tileData = new VectorTile(new Pbf(data))
	const layers: Record<string, MapLayer> = {}
	for (const name in tileData.layers) {
		const layer = tileData.layers[name]!

		const features: MapFeature[] = []
		const linestrings: Coord2d[][] = []
		const polygons: Coord2d[][] = []
		for (let i = 0; i < layer.length; i++) {
			const feature = layer.feature(i)
			if (feature.type !== 2 && feature.type !== 3) continue

			const geometry = feature
				.loadGeometry()
				.map((shape) =>
					shape.map((coord) => tileLocalCoordToMercator([coord.x, coord.y], feature.extent, {zoom, x, y})),
				)
			if (feature.type === 2) linestrings.push(...geometry)
			if (feature.type === 3) polygons.push(...geometry)

			features.push({
				id: feature.id,
				extent: feature.extent,
				type: VectorTileFeature.types[feature.type],
				geometry,
			})
		}

		const numLinestringVertices = linestrings.reduce((acc, linestring) => acc + linestring.length, 0)
		const {indices: polygonIndices, vertices: polygonVertices} = processPolygons(polygons)
		layers[name] = {
			name: layer.name,
			features,

			linestrings: {
				geometry: linestrings.map((linestring) => linestring.map((coord) => mercatorToWorld(coord))),

				// The actual linestring mesh generation is done in the render loop since it changes along with the camera zoom. Here we just allocate the buffers.
				numIndices: 0,
				indexBuffer: new Uint32Array(numLinestringVertices * 15), // 15 = <max # triangles generated per corner, 5> * <3 vertices per triangle>
				vertexBuffer: new Float32Array(numLinestringVertices * 21), // 21 = <max # vertices generated per corner, 7> * <3 coords per vertex>
				uvBuffer: new Float32Array(numLinestringVertices * 14), // 14 = <max # vertices generated per corner, 7> * <2 coords per UV>
			},
			polygons: {
				geometry: polygons.map((polygon) => polygon.map((coord) => mercatorToWorld(coord))),

				numIndices: polygonIndices.length,
				indexBuffer: new Uint32Array(polygonIndices),
				vertexBuffer: new Float32Array(polygonVertices),
			},
		}
	}

	postMessage({id, layers} satisfies FetchTileReturn)
}

const processPolygons = (polygons: Coord2d[][]) => {
	const indices: number[] = []
	const vertices: number[] = []

	const featurePolygons = classifyRings(polygons)
	for (let polygon of featurePolygons) {
		const polygonVertices = polygon.flat(2)
		let i = 0
		const holeIndices = polygon
			.map((ring) => {
				const holeIndex = i
				i += ring.length
				return holeIndex
			})
			.slice(1)

		let polygonIndices = earcut(polygonVertices, holeIndices)

		// In transforming from Mercator coord to world space, the vertical axis is flipped. So that this doesn't mess with
		// the winding order, we reverse the order of every triangle's vertices.
		for (let i = 0; i < polygonIndices.length; i += 3) {
			;[polygonIndices[i], polygonIndices[i + 2]] = [polygonIndices[i + 2]!, polygonIndices[i]!]
		}

		indices.push(...polygonIndices.map((index) => index + vertices.length / 3))
		vertices.push(...groupByTwos(polygonVertices).flatMap((coord) => mercatorToWorld(coord)))
	}

	return {indices, vertices}
}

const classifyRings = (rings: Coord2d[][]) => {
	if (rings.length <= 1) return [rings]

	let polygons: Coord2d[][][] = []
	let currentPolygon: Coord2d[][] = []
	for (const ring of rings) {
		let area = signedArea(ring)

		if (roughEq(area, 0)) continue
		if (area > 0) {
			if (currentPolygon.length > 0) polygons.push(currentPolygon)
			currentPolygon = [ring]
		} else {
			currentPolygon.push(ring)
		}
	}
	if (polygons.at(-1)! !== currentPolygon) polygons.push(currentPolygon)

	return polygons
}

const signedArea = (ring: Coord2d[]) => {
	let area = 0
	for (let i = 0; i < ring.length; i++) {
		const [x1, y1] = ring[i]!
		const [x2, y2] = ring[(i + 1) % ring.length]!

		area += x1 * y2 - x2 * y1
	}

	return area / 2
}
