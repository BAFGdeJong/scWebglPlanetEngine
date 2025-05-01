/* Copyright (c) 2015-2021, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

// Some mathematical functions are derived from the JavaScript library glMatrix.
// For copyright details, please refer to the above license notice.
// The library can be found at: https://github.com/toji/gl-matrix

export const EPSILON = 0.000001;
export const rads = Math.PI / 180

export let ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;

export function setMatrixArrayType(type: any) {
    ARRAY_TYPE = type;
}

export function equals(a: any, b: any) {
    return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}

export function radians(degrees: any) {
    return degrees * rads;
}

export function createMat4() {
    let out = new ARRAY_TYPE(16);
    if (ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
    }
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
}

export function identity(out: number[]) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

export function multiply(out: any, a: any, b: any) {

    let a00 = a[0],
    
        a01 = a[1],
    
        a02 = a[2],
    
        a03 = a[3];
    
    let a10 = a[4],
    
        a11 = a[5],
    
        a12 = a[6],
    
        a13 = a[7];
    
    let a20 = a[8],
    
        a21 = a[9],
    
        a22 = a[10],
    
        a23 = a[11];
    
    let a30 = a[12],
    
        a31 = a[13],
    
        a32 = a[14],
    
        a33 = a[15];
    
    // Cache only the current line of the second matrix
    
    let b0 = b[0],
    
        b1 = b[1],
    
        b2 = b[2],
    
        b3 = b[3];
    
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    
    b0 = b[4];
    
    b1 = b[5];
    
    b2 = b[6];
    
    b3 = b[7];
    
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    
    b0 = b[8];
    
    b1 = b[9];
    
    b2 = b[10];
    
    b3 = b[11];
    
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    
    b0 = b[12];
    
    b1 = b[13];
    
    b2 = b[14];
    
    b3 = b[15];
    
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    
    return out;
    
    }

export function rotate(out: any, a: any, rad: any, axis: any) {
    let x = axis[0],
        y = axis[1],
        z = axis[2];
    let len = Math.sqrt(x * x + y * y + z * z);
    let s, c, t;
    let a00, a01, a02, a03;
    let a10, a11, a12, a13;
    let a20, a21, a22, a23;
    let b00, b01, b02;
    let b10, b11, b12;
    let b20, b21, b22;

    if (len < EPSILON) {
        return null;
    }

    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) {
        // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
}

export function rotateZ(out: any, a: any, rad: any) {
    let s = Math.sin(rad);
    let c = Math.cos(rad);
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a03 = a[3];
    let a10 = a[4];
    let a11 = a[5];
    let a12 = a[6];
    let a13 = a[7];

    if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
}

export function scale(out: any, a: any, v: any) {
    let x = v[0],
    y = v[1],
    z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
}

export function lookAt(out: any, eye: any, center: any, up: any) {
    let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
    let eyex = eye[0];
    let eyey = eye[1];
    let eyez = eye[2];
    let upx = up[0];
    let upy = up[1];
    let upz = up[2];
    let centerx = center[0];
    let centery = center[1];
    let centerz = center[2];

    if (
        Math.abs(eyex - centerx) < EPSILON &&
        Math.abs(eyey - centery) < EPSILON &&
        Math.abs(eyez - centerz) < EPSILON
    ) {
        return identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
}

export function ortho(out: any, left: any, right: any, bottom: any, top: any, near: any, far: any) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
}

export function perspective(out: any, fovy: any, aspect: any, near: any, far: any) {
    const f = 1.0 / Math.tan(fovy / 2);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
    const nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
    } else {
    out[10] = -1;
    out[14] = -2 * near;
    }
    return out;
}

export function perspectiveFromFieldOfView(out: any, fov: any, near: any, far: any) {
    let upTan = Math.tan((fov.upDegrees * Math.PI) / 180.0);
    let downTan = Math.tan((fov.downDegrees * Math.PI) / 180.0);
    let leftTan = Math.tan((fov.leftDegrees * Math.PI) / 180.0);
    let rightTan = Math.tan((fov.rightDegrees * Math.PI) / 180.0);
    let xScale = 2.0 / (leftTan + rightTan);
    let yScale = 2.0 / (upTan + downTan);

    out[0] = xScale;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    out[4] = 0.0;
    out[5] = yScale;
    out[6] = 0.0;
    out[7] = 0.0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = (upTan - downTan) * yScale * 0.5;
    out[10] = far / (near - far);
    out[11] = -1.0;
    out[12] = 0.0;
    out[13] = 0.0;
    out[14] = (far * near) / (near - far);
    out[15] = 0.0;
    return out;
}

export function translate(out: any, a: any, v: any) {
    let x = v[0],
    y = v[1],
    z = v[2];
    let a00, a01, a02, a03;
    let a10, a11, a12, a13;
    let a20, a21, a22, a23;

    if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;

    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
}

export function rotateY(out: any, a: any, rad: any) {
    let s = Math.sin(rad);
    let c = Math.cos(rad);
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a03 = a[3];
    let a20 = a[8];
    let a21 = a[9];
    let a22 = a[10];
    let a23 = a[11];

    if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
}

export function rotateX(out: any, a: any, rad: any) {
    let s = Math.sin(rad);
    let c = Math.cos(rad);
    let a10 = a[4];
    let a11 = a[5];
    let a12 = a[6];
    let a13 = a[7];
    let a20 = a[8];
    let a21 = a[9];
    let a22 = a[10];
    let a23 = a[11];

    if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
}

export function createSphere(subdivisions: number, radius: number) {
    const positions = [];
    const normals = [];
    const texCoords = [];
    const indices = [];
    const normalLines = [];

    for (let lat = 0; lat <= subdivisions; lat++) {
        const theta = (lat * Math.PI) / subdivisions;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= subdivisions; lon++) {
            const phi = (lon * 2 * Math.PI) / subdivisions;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = radius * cosPhi * sinTheta;
            const y = radius * cosTheta;
            const z = radius * sinPhi * sinTheta;

            const length = Math.sqrt(x * x + y * y + z * z);
            normals.push(x / length, y / length, z / length);

            const u = lon / subdivisions;
            let v = lat / subdivisions;
            if (lat === 0 || lat === subdivisions) {
                v += 0.0001;
            }

            positions.push(x, y, z);
            texCoords.push(u, v);
        }
    }

    // Generate indices
    for (let lat = 0; lat < subdivisions; lat++) {
        for (let lon = 0; lon < subdivisions; lon++) {
            const first = lat * (subdivisions + 1) + lon;
            const second = first + subdivisions + 1;

            indices.push(first, first + 1, second);
            indices.push(second, first + 1, second + 1);
        }
    }

    for (let i = 0; i < positions.length; i += 3) {
        const px = positions[i];
        const py = positions[i + 1];
        const pz = positions[i + 2];

        const nx = normals[i];
        const ny = normals[i + 1];
        const nz = normals[i + 2];

        normalLines.push(px, py, pz);
        normalLines.push(px + nx * 0.1, py + ny * 0.1, pz + nz * 0.1);
    }

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texCoords: new Float32Array(texCoords),
        indices: new Uint16Array(indices),
        normalLines: new Float32Array(normalLines),
    };
}

export function createRing(innerRadius: number, outerRadius: number, segments: number) {
    const vertices = [];
    const texCoords = [];
    const indices = [];
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * 2 * Math.PI;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
    
        const xOuter = outerRadius * cos;
        const yOuter = outerRadius * sin;
        const xInner = innerRadius * cos;
        const yInner = innerRadius * sin;
    
        vertices.push(xOuter, yOuter, 0.0);
        vertices.push(xInner, yInner, 0.0);
    
        texCoords.push((cos + 1) / 2, (sin + 1) / 2); // map from [-1,1] to [0,1]
        texCoords.push((cos + 1) / 2, (sin + 1) / 2);
    }
    
    for (let i = 0; i < segments; i++) {
        const first = i * 2;
        const second = first + 1;
        const third = first + 2;
        const fourth = first + 3;
    
        indices.push(first, second, third);
        indices.push(second, fourth, third);
    }
    
    return {
        vertices: new Float32Array(vertices),
        texCoords: new Float32Array(texCoords),
        indices: new Uint16Array(indices),
    };
}

export class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b:number, a:number=0.0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    get_normalized_rgba() {
        return [this.r / 255, this.g / 255, this.b / 255, this.a / 255];
    }

    get_rgba() {
        return [this.r, this.g, this.b, this.a];
    }

    get_normalized_rgb() {
        return [this.r / 255, this.g / 255, this.b / 255];
    }

    get_rgb() {
        return [this.r, this.g, this.b];
    }

}