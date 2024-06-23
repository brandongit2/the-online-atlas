import {type Quaternion} from "./Quaternion";
import {Vec3} from "@/math/Vec3";
import {tan_d} from "@/utils/math-utils";

// `Mat4Elements` is always in column-major order.
// prettier-ignore
type Mat4Elements = [
	number, number, number, number,
	number, number, number, number,
	number, number, number, number,
	number, number, number, number,
];

export class Mat4 {
	// Element indices here are in row-major order.
	e11!: number;
	e12!: number;
	e13!: number;
	e14!: number;
	e21!: number;
	e22!: number;
	e23!: number;
	e24!: number;
	e31!: number;
	e32!: number;
	e33!: number;
	e34!: number;
	e41!: number;
	e42!: number;
	e43!: number;
	e44!: number;

	constructor();
	constructor(a: Mat4);
	constructor(elements: Mat4Elements);
	constructor(v1: Vec3, v2: Vec3, v3: Vec3);
	// prettier-ignore
	constructor(
		e11: number, e12: number, e13: number, e14: number,
		e21: number, e22: number, e23: number, e24: number,
		e31: number, e32: number, e33: number, e34: number,
		e41: number, e42: number, e43: number, e44: number,
	);
	// prettier-ignore
	constructor(
		e11?: number | Mat4 | Mat4Elements | Vec3, e12?: number | Vec3, e13?: number | Vec3, e14?: number,
		e21?: number                             , e22?: number       , e23?: number       , e24?: number,
		e31?: number                             , e32?: number       , e33?: number       , e34?: number,
		e41?: number                             , e42?: number       , e43?: number       , e44?: number,
	) {
		if (e11 === undefined) this.set();
		else if (typeof e11 === `number`) {
			this.set(
				e11 , e12 as number, e13 as number, e14!,
				e21!, e22!         , e23!         , e24!,
				e31!, e32!         , e33!         , e34!,
				e41!, e42!         , e43!         , e44!,
			);
		}
		else if (e11 instanceof Mat4) this.set(e11);
		else if (e11 instanceof Vec3) this.set(e11, e12 as Vec3, e13 as Vec3);
		else this.set(e11);
	}

	set(): Mat4;
	set(a: Mat4): Mat4;
	set(elements: Mat4Elements): Mat4;
	set(v1: Vec3, v2: Vec3, v3: Vec3): Mat4;
	// prettier-ignore
	set(
		e11: number, e12: number, e13: number, e14: number,
		e21: number, e22: number, e23: number, e24: number,
		e31: number, e32: number, e33: number, e34: number,
		e41: number, e42: number, e43: number, e44: number,
	): Mat4;
	// prettier-ignore
	set (
		e11OrOthers?: number | Mat4 | Mat4Elements | Vec3, e12OrV2?: number | Vec3, e13OrV3?: number | Vec3, e14?: number,
		e21?: number                                     , e22?: number           , e23?: number           , e24?: number,
		e31?: number                                     , e32?: number           , e33?: number           , e34?: number,
		e41?: number                                     , e42?: number           , e43?: number           , e44?: number,
	) {
		if (e11OrOthers === undefined) {
			// prettier-ignore
			this.set(
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1,
			);
		}
		else if (e11OrOthers instanceof Mat4) {
			const m = e11OrOthers;
			// prettier-ignore
			{this.e11 = m.e11; this.e12 = m.e12; this.e13 = m.e13; this.e14 = m.e14;
			this.e21 = m.e21; this.e22 = m.e22; this.e23 = m.e23; this.e24 = m.e24;
			this.e31 = m.e31; this.e32 = m.e32; this.e33 = m.e33; this.e34 = m.e34;
			this.e41 = m.e41; this.e42 = m.e42; this.e43 = m.e43; this.e44 = m.e44;}
		} else if (Array.isArray(e11OrOthers)) {
			const e = e11OrOthers;
			// prettier-ignore
			{this.e11 = e[0];  this.e12 = e[4];  this.e13 = e[8];  this.e14 = e[12];
			this.e21 = e[1];  this.e22 = e[5];  this.e23 = e[9];  this.e24 = e[13];
			this.e31 = e[2];  this.e32 = e[6];  this.e33 = e[10]; this.e34 = e[14];
			this.e41 = e[3];  this.e42 = e[7];  this.e43 = e[11]; this.e44 = e[15];}
		} else if (e11OrOthers instanceof Vec3) {
			const v1 = e11OrOthers, v2 = e12OrV2 as Vec3, v3 = e13OrV3 as Vec3;
			// prettier-ignore
			{this.e11 = v1.x; this.e12 = v2.x; this.e13 = v3.x; this.e14 = 0;
			this.e21 = v1.y; this.e22 = v2.y; this.e23 = v3.y; this.e24 = 0;
			this.e31 = v1.z; this.e32 = v2.z; this.e33 = v3.z; this.e34 = 0;
			this.e41 = 0;    this.e42 = 0;    this.e43 = 0;    this.e44 = 1;}
			// prettier-ignore
		} else {
			this.e11 = e11OrOthers; this.e12 = e12OrV2 as number; this.e13 = e13OrV3 as number; this.e14 = e14!;
			this.e21 = e21!       ; this.e22 = e22!             ; this.e23 = e23!             ; this.e24 = e24!;
			this.e31 = e31!       ; this.e32 = e32!             ; this.e33 = e33!             ; this.e34 = e34!;
			this.e41 = e41!       ; this.e42 = e42!             ; this.e43 = e43!             ; this.e44 = e44!;
		}
		return this;
	}

	// Column-major order.
	toTuple() {
		// prettier-ignore
		return [
			this.e11, this.e21, this.e31, this.e41,
			this.e12, this.e22, this.e32, this.e42,
			this.e13, this.e23, this.e33, this.e43,
			this.e14, this.e24, this.e34, this.e44,
		] as Mat4Elements;
	}

	// prettier-ignore
	// This yields elements in column-major order, just like `Mat4Elements`.
	*[Symbol.iterator]() {
		yield this.e11; yield this.e21; yield this.e31; yield this.e41;
		yield this.e12; yield this.e22; yield this.e32; yield this.e42;
		yield this.e13; yield this.e23; yield this.e33; yield this.e43;
		yield this.e14; yield this.e24; yield this.e34; yield this.e44;
	}

	private static mulImpl = (m: Mat4, a: Mat4, b: Mat4) => {
		m.e11 = a.e11 * b.e11 + a.e12 * b.e21 + a.e13 * b.e31 + a.e14 * b.e41;
		m.e12 = a.e11 * b.e12 + a.e12 * b.e22 + a.e13 * b.e32 + a.e14 * b.e42;
		m.e13 = a.e11 * b.e13 + a.e12 * b.e23 + a.e13 * b.e33 + a.e14 * b.e43;
		m.e14 = a.e11 * b.e14 + a.e12 * b.e24 + a.e13 * b.e34 + a.e14 * b.e44;

		m.e21 = a.e21 * b.e11 + a.e22 * b.e21 + a.e23 * b.e31 + a.e24 * b.e41;
		m.e22 = a.e21 * b.e12 + a.e22 * b.e22 + a.e23 * b.e32 + a.e24 * b.e42;
		m.e23 = a.e21 * b.e13 + a.e22 * b.e23 + a.e23 * b.e33 + a.e24 * b.e43;
		m.e24 = a.e21 * b.e14 + a.e22 * b.e24 + a.e23 * b.e34 + a.e24 * b.e44;

		m.e31 = a.e31 * b.e11 + a.e32 * b.e21 + a.e33 * b.e31 + a.e34 * b.e41;
		m.e32 = a.e31 * b.e12 + a.e32 * b.e22 + a.e33 * b.e32 + a.e34 * b.e42;
		m.e33 = a.e31 * b.e13 + a.e32 * b.e23 + a.e33 * b.e33 + a.e34 * b.e43;
		m.e34 = a.e31 * b.e14 + a.e32 * b.e24 + a.e33 * b.e34 + a.e34 * b.e44;

		m.e41 = a.e41 * b.e11 + a.e42 * b.e21 + a.e43 * b.e31 + a.e44 * b.e41;
		m.e42 = a.e41 * b.e12 + a.e42 * b.e22 + a.e43 * b.e32 + a.e44 * b.e42;
		m.e43 = a.e41 * b.e13 + a.e42 * b.e23 + a.e43 * b.e33 + a.e44 * b.e43;
		m.e44 = a.e41 * b.e14 + a.e42 * b.e24 + a.e43 * b.e34 + a.e44 * b.e44;

		return m;
	};
	static multiply = (m: Mat4 | null, ...matrices: Mat4[]) => {
		m = m ?? new Mat4();
		if (matrices.length === 0) return m;

		m.set(matrices.at(-1)!);
		if (matrices.length === 1) return m;

		for (let i = matrices.length - 2; i >= 0; i--) {
			Mat4.mulImpl(swap, matrices[i]!, m);
			m.set(swap);
		}
		return m;
	};

	static extractBasis = (v1: Vec3, v2: Vec3, v3: Vec3, a: Mat4) => {
		v1.set(a.e11, a.e21, a.e31);
		v2.set(a.e12, a.e22, a.e32);
		v3.set(a.e13, a.e23, a.e33);
	};
	extractBasis = (v1: Vec3, v2: Vec3, v3: Vec3) => Mat4.extractBasis(v1, v2, v3, this);

	static lookAt = (m: Mat4 | null, eye: Vec3, target: Vec3, up: Vec3) => {
		m ??= new Mat4();

		const z = Vec3.subtract(null, eye, target).normalize();
		const x = Vec3.cross(null, up, z).normalize();
		const y = Vec3.cross(null, z, x).normalize();

		// prettier-ignore
		m.set(
			x.x, x.y, x.z, -Vec3.dot(x, eye),
			y.x, y.y, y.z, -Vec3.dot(y, eye),
			z.x, z.y, z.z, -Vec3.dot(z, eye),
			0  , 0  , 0  ,  1               ,
		);
		return m;
	};
	lookAt = (eye: Vec3, target: Vec3, up: Vec3) => Mat4.lookAt(this, eye, target, up);

	static makePerspective = (m: Mat4 | null, fovX: number, aspect: number, near: number, far: number) => {
		m = m ?? new Mat4();

		const t = tan_d(fovX / 2);
		const f = 1 / t;
		const r = 1 / (far - near);
		// prettier-ignore
		return m.set(
			f, 0         ,  0       , 0             ,
			0, f * aspect,  0       , 0             ,
			0, 0         ,  near * r, near * far * r,
			0, 0         , -1       , 0             ,
		);
	};
	makePerspective = (fovX: number, aspect: number, near: number, far: number) =>
		Mat4.makePerspective(this, fovX, aspect, near, far);

	static makeTransform = (m: Mat4 | null, translate: Vec3, rotate: Quaternion, scale: Vec3) => {
		m ??= new Mat4();

		// prettier-ignore
		const x = rotate.x, y = rotate.y, z = rotate.z, w = rotate.w;
		// prettier-ignore
		const x2 = x + x, y2 = y + y, z2 = z + z;
		// prettier-ignore
		const xx = x * x2, xy = x * y2, xz = x * z2;
		// prettier-ignore
		const yy = y * y2, yz = y * z2, zz = z * z2;
		// prettier-ignore
		const wx = w * x2, wy = w * y2, wz = w * z2;

		// prettier-ignore
		const sx = scale.x, sy = scale.y, sz = scale.z;

		// prettier-ignore
		return m.set(
			sx * (1 - yy - zz), sy * (xy - wz)    , sz * (xz + wy)    , translate.x,
			sx * (xy + wz)    , sy * (1 - xx - zz), sz * (yz - wx)    , translate.y,
			sx * (xz - wy)    , sy * (yz + wx)    , sz * (1 - xx - yy), translate.z,
			0                 , 0                 , 0                 , 1          ,
		);
	};

	static makeTranslation = (m: Mat4 | null, v: Vec3) => {
		m ??= new Mat4();
		// prettier-ignore
		return m.set(
			1, 0, 0, v.x,
			0, 1, 0, v.y,
			0, 0, 1, v.z,
			0, 0, 0, 1  ,
		);
	};
	makeTranslation = (v: Vec3) => Mat4.makeTranslation(this, v);

	static makeRotation = (m: Mat4 | null, q: Quaternion) => this.makeTransform(m, zeroVec, q, oneVec);
	makeRotation = (q: Quaternion) => Mat4.makeRotation(this, q);

	static makeScale = (m: Mat4 | null, v: Vec3) => {
		m ??= new Mat4();
		// prettier-ignore
		return m.set(
			v.x, 0  , 0  , 0,
			0  , v.y, 0  , 0,
			0  , 0  , v.z, 0,
			0  , 0  , 0  , 1,
		);
	};
	makeScale = (v: Vec3) => Mat4.makeScale(this, v);
}

// Certain operations necessitate a temporary matrix to store intermediate results.
const swap = new Mat4();

const zeroVec = new Vec3(0, 0, 0);
const oneVec = new Vec3(1, 1, 1);
