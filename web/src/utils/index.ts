import {type Coord2d} from "../map/types";

export const groupByTwos = (arr: number[]) => {
	if (arr.length % 2 !== 0) throw new Error(`Array must have an even number of elements.`);

	const coordArray: Coord2d[] = [];
	for (let i = 0; i < arr.length; i += 2) {
		coordArray.push([arr[i]!, arr[i + 1]!]);
	}
	return coordArray;
};
