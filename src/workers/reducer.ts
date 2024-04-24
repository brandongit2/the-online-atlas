import {type Promisable} from "type-fest"

import {fetchTile, type FetchTileArgs, type FetchTileReturn} from "./fetch-tile"
import {linestringsToMesh, type LinestringsToMeshArgs, type LinestringsToMeshReturn} from "./linestrings-to-mesh"

export type WorkerActions = {
	fetchTile: {
		args: FetchTileArgs
		return: FetchTileReturn
	}
	linestringsToMesh: {
		args: LinestringsToMeshArgs
		return: LinestringsToMeshReturn
	}
}
export type ActionNames = keyof WorkerActions
const workerActors: {
	[K in ActionNames]: (args: WorkerActions[K]["args"], abortSignal: AbortSignal) => Promisable<void>
} = {
	fetchTile,
	linestringsToMesh,
}

onmessage = <ActionName extends ActionNames>(
	event: MessageEvent<{action: ActionName; args: WorkerActions[ActionName]["args"]} | `abort`>,
) => {
	const abortController = new AbortController()
	if (event.data === `abort`) {
		abortController.abort()
		return
	}

	const {action, args} = event.data
	Promise.resolve(workerActors[action](args, abortController.signal)).catch((err) => {
		throw err
	})
}
