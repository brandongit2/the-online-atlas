import {type Coord3d} from "@/map/types";
import {Vec3} from "@/math/Vec3";

export type LinestringsToMeshArgs = {
	linestrings: Coord3d[][];
	viewPoint: Coord3d;
	thickness: number;
	indexBuffer: Uint32Array;
	vertexBuffer: Float32Array;
	uvBuffer: Float32Array;
};

export type LinestringsToMeshReturn = {
	numIndices: number;
	indexBuffer: Uint32Array;
	vertexBuffer: Float32Array;
	uvBuffer: Float32Array;
};

// Pre-allocate a bunch of `Vec3`s to avoid creating and destroying them all the time
const vs = Array.from({length: 13}, () => new Vec3());
const v0 = vs[0]!,
	v1 = vs[1]!,
	v2 = vs[2]!,
	v3 = vs[3]!,
	v4 = vs[4]!,
	v5 = vs[5]!,
	v6 = vs[6]!,
	v7 = vs[7]!,
	v8 = vs[8]!,
	v9 = vs[9]!,
	v10 = vs[10]!,
	v11 = vs[11]!,
	v12 = vs[12]!;

export const linestringsToMesh = ({
	linestrings,
	viewPoint,
	thickness,
	indexBuffer,
	vertexBuffer,
	uvBuffer,
}: LinestringsToMeshArgs) => {
	const viewPointVec3 = new Vec3(viewPoint);
	const is: [number, number, number] = [0, 0, 0]; // Indices index (`ii`), vertices index (`vi`), UVs index (`ui`)
	for (const linestring of linestrings) {
		const linestringAsVec3s = linestring.map((v) => new Vec3(v));
		linestringToMesh(indexBuffer, vertexBuffer, uvBuffer, is, linestringAsVec3s, viewPointVec3, thickness);
	}

	postMessage({numIndices: is[0], indexBuffer, vertexBuffer, uvBuffer} satisfies LinestringsToMeshReturn, {
		transfer: [indexBuffer.buffer, vertexBuffer.buffer, uvBuffer.buffer],
	});
};

const linestringToMesh = (
	indexBuffer: Uint32Array,
	vertexBuffer: Float32Array,
	uvBuffer: Float32Array,
	is: [number, number, number],
	linestring: Vec3[],
	viewPoint: Vec3,
	thickness: number,
) => {
	const halfThickness = thickness / 2;

	let oldToNext: Vec3 | undefined;
	for (let i = 0; i < linestring.length; i++) {
		const prevVertex = linestring[i - 1];
		const currentVertex = linestring[i]!;
		const nextVertex = linestring[i + 1];

		const faceDirection = viewPoint.equals(v0.set(0, 0, 0))
			? Vec3.normalize(v0, currentVertex)
			: Vec3.normalize(v0, viewPoint);

		if (prevVertex && nextVertex) {
			const fromPrev = oldToNext ? v1.set(oldToNext) : Vec3.subtract(v1, currentVertex, prevVertex).normalize();
			const toNext = Vec3.subtract(v3, nextVertex, currentVertex).normalize();
			oldToNext = v2.set(toNext);

			const primaryPrevNormal = Vec3.cross(v4, fromPrev, faceDirection);
			const primaryNextNormal = Vec3.cross(v5, toNext, faceDirection);
			const primaryPrevNormalScaled = Vec3.scaleBy(v6, primaryPrevNormal, halfThickness);
			const primaryNextNormalScaled = Vec3.scaleBy(v7, primaryNextNormal, halfThickness);

			const isPrimarySideOut = Vec3.dot(fromPrev, primaryNextNormal) > 0;

			// Rect for previous segment
			let vs = is[1] / 3;
			// prettier-ignore
			indexBuffer.set([
				vs +  0,
				vs +  1,
				vs + -1,
				vs +  0,
				vs + -1,
				vs + -2,
			], is[0]);
			is[0] += 6;

			const primaryMiterDirection = Vec3.add(v8, primaryPrevNormal, primaryNextNormal);
			const m = Vec3.lengthOf(primaryMiterDirection);
			if (m < 0.05) {
				// Mitre will be too long; just cap it off

				const extensionFromPrev = Vec3.scaleBy(v8, fromPrev, halfThickness).add(primaryPrevNormalScaled);
				const extensionFromNext = Vec3.scaleBy(v9, toNext, -halfThickness).add(primaryNextNormalScaled);

				// Rect for cap
				vs = is[1] / 3;
				if (isPrimarySideOut)
					// prettier-ignore
					indexBuffer.set([
						vs + 0,
						vs + 5,
						vs + 2,
						vs + 0,
						vs + 4,
						vs + 5,
						vs + 0,
						vs + 3,
						vs + 4,
					], is[0]);
				else
					// prettier-ignore
					indexBuffer.set([
						vs + 2,
						vs + 6,
						vs + 1,
						vs + 1,
						vs + 6,
						vs + 3,
						vs + 1,
						vs + 3,
						vs + 4,
					], is[0]);
				is[0] += 9;

				vertexBuffer.set(
					[
						...Vec3.add(v10, currentVertex, primaryPrevNormalScaled),
						...Vec3.subtract(v10, currentVertex, primaryPrevNormalScaled),
						...currentVertex,
						...Vec3.add(v10, currentVertex, extensionFromPrev),
						...Vec3.add(v10, currentVertex, extensionFromNext),
						...Vec3.add(v10, currentVertex, primaryNextNormalScaled),
						...Vec3.subtract(v10, currentVertex, primaryNextNormalScaled),
					],
					is[1],
				);
				is[1] += 7 * 3;

				// The basis vectors for UV space are u = `fromPrev` and v = `-primaryPrevNormal`.
				const uPrimaryPrevNormal = 0;
				const vPrimaryPrevNormal = -1;
				const uPrimaryNextNormal = Vec3.dot(primaryNextNormal, fromPrev);
				const vPrimaryNextNormal = -Vec3.dot(primaryNextNormal, primaryPrevNormal);
				uvBuffer.set(
					// prettier-ignore
					[
						uPrimaryPrevNormal, vPrimaryPrevNormal,
						-uPrimaryPrevNormal, -vPrimaryPrevNormal,
						0, 0,
						1, -1,
						Vec3.dot(extensionFromNext, fromPrev) / halfThickness, -Vec3.dot(extensionFromNext, primaryPrevNormal) / halfThickness,
						uPrimaryNextNormal, vPrimaryNextNormal,
						-uPrimaryNextNormal, -vPrimaryNextNormal,
					],
					is[2],
				);
				is[2] += 7 * 2;

				continue;
			}
			Vec3.scaleBy(primaryMiterDirection, primaryMiterDirection, 1 / m);

			const primaryMiterNormal = Vec3.cross(v9, primaryMiterDirection, faceDirection);

			let miterLength = 1 / Vec3.dot(primaryPrevNormal, primaryMiterDirection);
			if (!isPrimarySideOut) miterLength *= -1;
			const outerMiter = Vec3.scaleBy(v10, primaryMiterDirection, miterLength);
			const outerMiterScaled = Vec3.scaleBy(v11, outerMiter, halfThickness);

			// Rect for mitre
			vs = is[1] / 3;
			if (isPrimarySideOut)
				// prettier-ignore
				indexBuffer.set([
					vs + 2,
					vs + 0,
					vs + 3,
					vs + 2,
					vs + 3,
					vs + 4,
				], is[0]);
			else
				// prettier-ignore
				indexBuffer.set([
					vs + 2,
					vs + 3,
					vs + 1,
					vs + 2,
					vs + 5,
					vs + 3,
				], is[0]);
			is[0] += 6;

			vertexBuffer.set(
				[
					...Vec3.add(v12, currentVertex, primaryPrevNormalScaled),
					...Vec3.subtract(v12, currentVertex, primaryPrevNormalScaled),
					...currentVertex,
					...Vec3.add(v12, currentVertex, outerMiterScaled),
					...Vec3.add(v12, currentVertex, primaryNextNormalScaled),
					...Vec3.subtract(v12, currentVertex, primaryNextNormalScaled),
				],
				is[1],
			);
			is[1] += 6 * 3;

			// The basis vectors for UV space are u = `primaryMiterDirection` and v = `primaryMiterNormal`.
			const uPrimaryPrevNormal = Vec3.dot(primaryPrevNormal, primaryMiterDirection);
			const vPrimaryPrevNormal = Vec3.dot(primaryPrevNormal, primaryMiterNormal);
			const uPrimaryNextNormal = Vec3.dot(primaryNextNormal, primaryMiterDirection);
			const vPrimaryNextNormal = Vec3.dot(primaryNextNormal, primaryMiterNormal);
			uvBuffer.set(
				// prettier-ignore
				[
					uPrimaryPrevNormal, vPrimaryPrevNormal,
					-uPrimaryPrevNormal, -vPrimaryPrevNormal,
					0, 0,
					Vec3.dot(outerMiter, primaryMiterDirection), Vec3.dot(outerMiter, primaryMiterNormal),
					uPrimaryNextNormal, vPrimaryNextNormal,
					-uPrimaryNextNormal, -vPrimaryNextNormal,
				],
				is[2],
			);
			is[2] += 6 * 2;
		} else if (prevVertex) {
			const fromPrev = oldToNext ? v1.set(oldToNext) : Vec3.subtract(v1, currentVertex, prevVertex).normalize();

			const primaryPrevNormal = Vec3.cross(v2, fromPrev, faceDirection);
			const primaryPrevNormalScaled = Vec3.scaleBy(v2, primaryPrevNormal, halfThickness);

			const extension = Vec3.scaleBy(v3, fromPrev, halfThickness);
			const currentVertexExtended = Vec3.add(v3, currentVertex, extension);

			const vi = is[1] / 3;
			// prettier-ignore
			indexBuffer.set([
				vi + 0, vi + -1, vi + -2, vi + 0, vi + 1, vi + -1, // Rect for previous segment
				vi + 0, vi +  3, vi +  1, vi + 0, vi + 2, vi +  3, // Rect for cap extension
			], is[0]);
			is[0] += 12;
			vertexBuffer.set(
				[
					...Vec3.add(v4, currentVertex, primaryPrevNormalScaled),
					...Vec3.subtract(v4, currentVertex, primaryPrevNormalScaled),
					...Vec3.add(v4, currentVertexExtended, primaryPrevNormalScaled),
					...Vec3.subtract(v4, currentVertexExtended, primaryPrevNormalScaled),
				],
				is[1],
			);
			is[1] += 4 * 3;
			uvBuffer.set([1, 0, -1, 0, 1, 1, -1, 1], is[2]);
			is[2] += 4 * 2;
		} else if (nextVertex) {
			const toNext = Vec3.subtract(v1, nextVertex, currentVertex).normalize();
			oldToNext = v2.set(toNext);

			const primaryNextNormal = Vec3.cross(v3, toNext, faceDirection);
			const primaryNextNormalScaled = Vec3.scaleBy(v3, primaryNextNormal, halfThickness);

			const extension = Vec3.scaleBy(v4, toNext, -halfThickness);
			const currentVertexExtended = Vec3.add(v4, currentVertex, extension);

			const vi = is[1] / 3;
			// prettier-ignore
			indexBuffer.set([
				vi + 0,
				vi + 3,
				vi + 1,
				vi + 0,
				vi + 2,
				vi + 3,
			], is[0]);
			is[0] += 6;
			vertexBuffer.set(
				[
					...Vec3.add(v5, currentVertexExtended, primaryNextNormalScaled),
					...Vec3.subtract(v5, currentVertexExtended, primaryNextNormalScaled),
					...Vec3.add(v5, currentVertex, primaryNextNormalScaled),
					...Vec3.subtract(v5, currentVertex, primaryNextNormalScaled),
				],
				is[1],
			);
			is[1] += 4 * 3;
			uvBuffer.set([1, -1, -1, -1, 1, 0, -1, 0], is[2]);
			is[2] += 4 * 2;
		} else {
			const axis = v1.set(0, halfThickness, 0);
			const radius1 = Vec3.cross(v2, faceDirection, axis);
			const radius2 = Vec3.cross(v3, faceDirection, radius1);
			const extrusion1 = Vec3.add(v4, currentVertex, radius1);
			const extrusion2 = Vec3.subtract(v5, currentVertex, radius1);

			const vi = is[1] / 3;
			// prettier-ignore
			indexBuffer.set([
				vi + 0,
				vi + 3,
				vi + 2,
				vi + 0,
				vi + 1,
				vi + 3,
			], is[0]);
			is[0] += 6;
			vertexBuffer.set(
				[
					...Vec3.add(v6, extrusion1, radius2),
					...Vec3.add(v6, extrusion2, radius2),
					...Vec3.subtract(v6, extrusion1, radius2),
					...Vec3.subtract(v6, extrusion2, radius2),
				],
				is[1],
			);
			is[1] += 4 * 3;
			uvBuffer.set([1, 1, -1, 1, 1, -1, -1, -1], is[2]);
			is[2] += 4 * 2;
		}
	}
};
