export type MaterialClass = {
	renderPipeline: GPURenderPipeline;
	meshBindGroupLayout: GPUBindGroupLayout;
};

export type Material = {
	// A hack to make TypeScript aware of the instance's prototype.
	// When implementing `Material`, set `__proto` to be the class itself.
	// e.g.:
	// class FlatMaterial implements Material {
	//   __proto = FlatMaterial;
	// }
	__proto: MaterialClass;

	materialBindGroup: GPUBindGroup;
};
