import {floor} from "lodash"

import {type TileId} from "./types"
import {store} from "@/map/store"
import {altitudeToZoom} from "@/map/util"

export const getTilesInView = () => {
	const tilesInView: TileId[] = []
	const stack: TileId[] = [{zoom: 0, x: 0, y: 0}]
	while (stack.length > 0) {
		const tileId = stack.pop()!

		if (isTileInView(tileId)) {
			if (tileId.zoom >= floor(altitudeToZoom(store.cameraPos.alt, store.fovX))) tilesInView.push(tileId)
			else
				stack.push(
					{zoom: tileId.zoom + 1, x: tileId.x * 2, y: tileId.y * 2},
					{zoom: tileId.zoom + 1, x: tileId.x * 2 + 1, y: tileId.y * 2},
					{zoom: tileId.zoom + 1, x: tileId.x * 2, y: tileId.y * 2 + 1},
					{zoom: tileId.zoom + 1, x: tileId.x * 2 + 1, y: tileId.y * 2 + 1},
				)
		}
	}
	return tilesInView
}

const isTileInView = (tileId: TileId) => {
	if (tileId.zoom < 3) return true
	if (tileId.zoom === 3 && (tileId.x % 2 === 0) != (tileId.y % 2 === 0)) return true
	if (tileId.zoom === 4 && (tileId.x % 2 === 0) != (tileId.y % 2 === 0)) return true
	if (tileId.zoom === 5 && (tileId.x % 2 === 0) != (tileId.y % 2 === 0)) return true
	return false
}
