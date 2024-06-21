export type Geometry = {
	vertices: number[];
	vertexGpuBuffer: GPUBuffer;

	indices: number[];
	indexGpuBuffer: GPUBuffer;
};
