export type Coord2d = [number, number];
export type Coord3d = [number, number, number];

export type TileId = {zoom: number; x: number; y: number};
export type TileIdStr = `${number}/${number}/${number}`;
export type MapTileData = {
	id: TileIdStr;
	layers: Record<string, MapLayerData>;
};

export type MapLayerData = {
	name: string;
	linestrings: Coord3d[][];
	polygons: Coord3d[][];
};

export type RenderMaterial = {
	color: Coord3d;
};

export type RenderInput = {
	materials: Record<string, RenderMaterial>;
	objects: Record<
		string,
		{
			polylines: Coord3d[][];
			polygons: {indices: number[]; vertices: Coord3d[]};
		}
	>;
};
