/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-definitions */

type Vec3 = never;
type Quaternion = never;

interface GraphNode {
	parent: GraphNode | null;
	children: GraphNode[];
}

interface Scene extends GraphNode {
	parent: null;
}

interface Object3d extends GraphNode {
	translation: Vec3;
	rotation: Quaternion;
	scale: Vec3;
}

interface Geometry {
	indices: Uint32Array;
	vertices: Float32Array;
}

interface Material {
	color: Vec3;
}

interface Mesh extends Object3d {
	geometry: Geometry;
	material: Material;
}

// More concrete stuff

type BoxGeometry = Geometry;

interface PointLight extends Object3d {
	color: Vec3;
	intensity: number;
}
