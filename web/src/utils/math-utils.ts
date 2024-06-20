import {type Coord2d, type Coord3d, type TileId, type TileIdStr} from "@/map/types";

export const {abs, cos, log, PI, sin, tan} = Math;

export const degToRad = (a: number) => a * (PI / 180);
export const radToDeg = (a: number) => a * (180 / Math.PI);

export const log2 = (x: number) => log(x) / log(2);
export const roughEq = (a: number, b: number, epsilon = 1e-6) => abs(a - b) < epsilon;
export const tan_d = (a: number) => tan(degToRad(a));

///// Map math /////

// Altitude in Earth radii, zoom ∈ ℝ.
// Defined such that when zoom = 0, the z=0 plane across the width of the screen has a width equal to the Earth's circumference.
export const altitudeToZoom = (altitude: number, fovX: number) => -log2((altitude / PI) * tan_d(fovX / 2));
export const zoomToAltitude = (zoom: number, fovX: number) => (PI / tan_d(fovX / 2)) * 2 ** -zoom;

export const tileIdFromStr = (tileId: TileIdStr) => {
	const [zoom, x, y] = tileId.split(`/`).map(Number) as [number, number, number];
	return {zoom, x, y};
};
export const tileIdToStr = (tileId: TileId): TileIdStr => `${tileId.zoom}/${tileId.x}/${tileId.y}`;

///// Coordinate conversions /////

export const tileLocalCoordToMercator = (coord: Coord2d, extent: number, tileId: TileId): Coord2d => {
	const [tileLocalX, tileLocalY] = coord;
	const {zoom, x, y} = tileId;
	const tileCount = 2 ** zoom;
	const mercatorX = (tileLocalX / extent + x) / tileCount;
	const mercatorY = (tileLocalY / extent + y) / tileCount;
	return [mercatorX, mercatorY];
};

export const mercatorToLngLat = (point: Coord2d): Coord2d => {
	const [x, y] = point;
	const lambda = 2 * Math.PI * x - Math.PI;
	const phi = 2 * Math.atan(Math.exp(Math.PI - 2 * Math.PI * y)) - Math.PI / 2;
	return [radToDeg(lambda), radToDeg(phi)];
};

export const lngLatToWorld = (lngLat: Coord2d, radius = 1): Coord3d => {
	const lng = degToRad(lngLat[0]);
	const lat = degToRad(lngLat[1]);

	const cosLat = Math.cos(lat);
	const sinLat = Math.sin(lat);
	const cosLng = Math.cos(lng);
	const sinLng = Math.sin(lng);

	return [cosLat * sinLng * radius, sinLat * radius, cosLat * cosLng * radius];
};

export const tileLocalCoordToWorld = (coord: Coord2d, extent: number, tileId: TileId, radius = 1): Coord3d =>
	lngLatToWorld(mercatorToLngLat(tileLocalCoordToMercator(coord, extent, tileId)), radius);

export const mercatorToWorld = (point: Coord2d): Coord3d => lngLatToWorld(mercatorToLngLat(point));
