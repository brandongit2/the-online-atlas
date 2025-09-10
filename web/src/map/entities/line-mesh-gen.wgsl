struct InputVertex {
	p: u32,
	position: vec3f,
};

struct LineProperties {
	face_normal: vec3f,
	half_thickness: f32,
}

@group(0) @binding(0) var<storage, read> input_buffer: array<InputVertex>;
@group(1) @binding(0) var<storage, write> vertex_output_buffer: array<vec3f>;
@group(1) @binding(1) var<storage, write> index_output_buffer: array<u32>;
@group(2) @binding(0) var<uniform> line_properties: LineProperties;

@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) global_id: u32) {
	let input_vertex = input_buffer[global_id];
	let class = (input_vertex.p >> 24) & 0xff;
	let dest = input_vertex.p & 0xffffff;
	
	let prev_vertex = input_buffer[global_id - 1].position;
	let current_vertex = input_vertex.position;
	let next_vertex = input_buffer[global_id + 1].position;

	let face_normal = select(
		line_properties.face_normal,
		current_vertex,
		line_properties.face_normal == vec3f(0.0),
	);
	let half_thickness = line_properties.half_thickness;

	let from_prev = normalize(current_vertex - prev_vertex);
	let to_next = normalize(next_vertex - current_vertex);

	let primary_prev_normal = normalize(cross(from_prev, face_normal));
	let primary_prev_normal_scaled = primary_prev_normal * half_thickness;
	let primary_next_normal = normalize(cross(to_next, face_normal));
	let primary_next_normal_scaled = primary_next_normal * half_thickness;

	if (class == 0 || class == 1) {
		let cap_extension: vec3f;
		let normal: vec3f;
		if (class == 0) {
			cap_extension = primary_next_normal_scaled;
			normal = primary_next_normal_scaled;
		} else {
			cap_extension = primary_prev_normal_scaled;
			normal = primary_prev_normal_scaled;
		}

		const indices = select(array(2, 3, 0, 1), array(0, 1, 2, 3), class == 0);
		vertex_output_buffer[dest + indices[0]] = current_vertex + cap_extension + normal;
		vertex_output_buffer[dest + indices[1]] = current_vertex + cap_extension - normal;
		vertex_output_buffer[dest + indices[2]] = current_vertex + normal;
		vertex_output_buffer[dest + indices[3]] = current_vertex - normal;

		let i = dest;
		index_output_buffer[0] = i + 0;
		index_output_buffer[1] = i + 3;
		index_output_buffer[2] = i + 1;
		index_output_buffer[3] = i + 0;
		index_output_buffer[4] = i + 2;
		index_output_buffer[5] = i + 3;
	} else {
		// For classes 2 and 3
		let miter_direction = normalize(primary_prev_normal + primary_next_normal) * select(-1.0, 1.0, class == 2);
		let miter_length = 1.0 / dot(primary_prev_normal, primary_miter_direction);
		let miter = miter_direction * miter_length * half_thickness;

		// For classes 4 and 5
		let extension_from_prev = from_prev * half_thickness;
		let extension_from_next = to_next * -half_thickness;

		let v0 = current_vertex + primary_prev_normal_scaled;
		let v1 = current_vertex - primary_prev_normal_scaled;
		let v2 = current_vertex;
		let v3 = current_vertex + primary_next_normal_scaled;
		let v4 = current_vertex - primary_next_normal_scaled;
		let v5 = current_vertex + miter;
		let v6 = select(v1, v0, class == 4) + extension_from_prev;
		let v7 = select(v4, v3, class == 4) + extension_from_next;

		// Using 9 as placeholder for unused index
		const indices = select(
			array(0, 1, 2, 3, 4, 5, 6),
			array(0, 1, 2, 3, 9, 4, 5),
			class == 2 || class == 3,
		);
		vertex_output_buffer[indices[0]] = v0;
		vertex_output_buffer[indices[1]] = v1;
		vertex_output_buffer[indices[2]] = v2;
		vertex_output_buffer[indices[3]] = select(v6, v5, class == 2 || class == 3);
		if (class == 4 || class == 5) vertex_output_buffer[indices[4]] = v7;
		vertex_output_buffer[indices[5]] = v3;
		vertex_output_buffer[indices[6]] = v4;
	}
}
