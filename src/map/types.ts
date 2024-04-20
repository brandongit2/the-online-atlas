export type Coord2d = [number, number]
export type Coord3d = [number, number, number]

export type TileId = {zoom: number; x: number; y: number}
export type TileIdStr = `${number}/${number}/${number}`
export type MapTile = {
	id: TileIdStr
	layers: Record<string, MapLayer>
}

export type MapLayer = {
	name: string
	features: MapFeature[]

	linestrings: {
		geometry: Coord3d[][]
		numIndices: number
		indexBuffer: Uint32Array
		indexGpuBuffer?: GPUBuffer
		vertexBuffer: Float32Array
		vertexGpuBuffer?: GPUBuffer
		uvBuffer: Float32Array
		uvGpuBuffer?: GPUBuffer
	}
	polygons: {
		geometry: Coord3d[][]
		numIndices: number
		indexBuffer: Uint32Array
		indexGpuBuffer?: GPUBuffer
		vertexBuffer: Float32Array
		vertexGpuBuffer?: GPUBuffer
	}
}

export type MapFeature = {
	id: number
	extent: number
	type: "LineString" | "Polygon"
	geometry: Coord2d[][]
}
