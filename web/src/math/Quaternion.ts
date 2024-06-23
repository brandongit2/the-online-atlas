import {type Vec3} from "@/math/Vec3";

export class Quaternion {
	#x!: number;
	#y!: number;
	#z!: number;
	#w!: number;

	constructor();
	constructor(x: number, y: number, z: number, w: number);
	constructor(x?: number, y?: number, z?: number, w?: number) {
		if (x === undefined) this.set();
		else this.set(x, y!, z!, w!);
	}

	set: {
		(): Quaternion;
		(x: number, y: number, z: number, w: number): Quaternion;
	} = (x?: number, y?: number, z?: number, w?: number) => {
		if (x === undefined) {
			this.#x = 1;
			this.#y = 0;
			this.#z = 0;
			this.#w = 0;
		} else {
			this.#x = x;
			this.#y = y!;
			this.#z = z!;
			this.#w = w!;
		}
		return this;
	};

	get x() {
		return this.#x;
	}
	get y() {
		return this.#y;
	}
	get z() {
		return this.#z;
	}
	get w() {
		return this.#w;
	}

	static fromAxisAngle = (axis: Vec3, angle: number) => {
		const halfAngle = angle / 2;
		const s = Math.sin(halfAngle);
		return new Quaternion(axis.x * s, axis.y * s, axis.z * s, Math.cos(halfAngle));
	};
}
