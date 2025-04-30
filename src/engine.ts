'use strict';

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

class Color {
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

function planetEngine({
    texturePlanetUrl = 'null',
    texturePlanetIsCompressed = false,
    textureCloudUrl = 'null',
    textureCloudIsCompressed = false,
    textureBackgroundUrl = 'null',
    textureBackgroundIsCompressed = false,
    textureAtmosphereUrl = 'null',
    textureAtmosphereIsCompressed = false,
    textureGlowUrl = 'null',
    textureGlowIsCompressed = false,

    // Planet rotation information
    rotation = 0.0,
    tilt = 0.0,
    pitch = 0.0,

    // Planet color information
    planetColor = new Color(0.0, 0.0, 0.0, 1.0),

    // Planet atmosphere information
    atmosphereColor = new Color(0.0, 0.0, 0.0, 1.0),
    atmosphereThickness = 0.0,
    atmosphereThicknessMin = 0.0,   

    // Planet clouds information
    cloudColor = new Color(0.0, 0.0, 0.0, 0.0),
    cloudRotation = 0.0,

    // Light information
    lightPosition = [0.0, 0.0, 1.0],

    // Planet geometry information
    subdivisions = 28, 
    radius = 1,

    // Camera information
    cameraDistance = 1.0,

    // textureCloudsUrl,
    // sunColor,
    // sunSize,
    // sunPosition,
    // sunIntensity,
    // sunDistance,

}) {

    const EPSILON = 0.000001;
    const rads = Math.PI / 180
    let ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;

    function setMatrixArrayType(type: any) {
        ARRAY_TYPE = type;
    }

    function equals(a: any, b: any) {
        return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
    }

    function radians(degrees: any) {
        return degrees * rads;
    }

    function createMat4() {
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

    function identity(out: number[]) {
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

    function multiply(out: any, a: any, b: any) {

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

    function rotate(out: any, a: any, rad: any, axis: any) {
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

    function rotateZ(out: any, a: any, rad: any) {
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

    function scale(out: any, a: any, v: any) {
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

    function lookAt(out: any, eye: any, center: any, up: any) {
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

    function ortho(out: any, left: any, right: any, bottom: any, top: any, near: any, far: any) {
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

    function perspective(out: any, fovy: any, aspect: any, near: any, far: any) {
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

    function perspectiveFromFieldOfView(out: any, fov: any, near: any, far: any) {
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

    function translate(out: any, a: any, v: any) {
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

    function rotateY(out: any, a: any, rad: any) {
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

    function rotateX(out: any, a: any, rad: any) {
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

    // Create sphere geometry
    function createSphere(subdivisions: number, radius: number) {
        const positions = [];
        const normals = [];
        const texCoords = [];
        const indices = [];

        for (let lat = 0; lat <= subdivisions; lat++) {
            const theta = (lat * Math.PI) / subdivisions; // Latitude angle (0 to π)
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= subdivisions; lon++) {
                const phi = (lon * 2 * Math.PI) / subdivisions; // Longitude angle (0 to 2π)
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                // Calculate vertex position
                const x = radius * cosPhi * sinTheta;
                const y = radius * cosTheta;
                const z = radius * sinPhi * sinTheta;

                // Calculate normal (same as position normalized)
                const nx = cosPhi * sinTheta;
                const ny = cosTheta;
                const nz = sinPhi * sinTheta;

                // Calculate texture coordinates
                const u = lon / subdivisions;
                var v = lat / subdivisions;
                if (lat === 0 || lat === subdivisions) {
                    // Apply a small offset at the poles to avoid exact overlap
                    v += 0.0001; // You can fine-tune this small value
                }

                positions.push(x, y, z);
                normals.push(nx, ny, nz);
                texCoords.push(u, v);
            }
        }

        // Generate indices
        for (let lat = 0; lat < subdivisions; lat++) {
            for (let lon = 0; lon < subdivisions; lon++) {
                const first = lat * (subdivisions + 1) + lon;
                const second = first + subdivisions + 1;

                // Add triangles for the current quad
                indices.push(first, first + 1, second);
                indices.push(second, first + 1, second + 1);
            }
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            texCoords: new Float32Array(texCoords),
            indices: new Uint16Array(indices),
        };
    }

    function createRing(innerRadius: number, outerRadius: number, segments: number) {
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

    // Load texture
    function loadTexture(gl: WebGL2RenderingContext, glProgram: any, uniformName: string, url: string, textureId: number) {
        let texture = gl.createTexture();
        let image = new Image();

        image.src = url;

        image.onload = function() {
            gl.activeTexture(gl.TEXTURE0 + textureId);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);

            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        };

        let location = gl.getUniformLocation(glProgram, uniformName);
        return {id: textureId, location, texture};
    }

    function assignTexture(gl: WebGL2RenderingContext, id: number, location: WebGLUniformLocation) {
        gl.uniform1i(location, id);
    }

    // Minimal rendering setup for createSphere
    let canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    document.body.appendChild(canvas);

    let gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) {
        console.error('WebGL2 not supported');
    }

    gl = gl!

    gl.viewport(0, 0, canvas.width, canvas.height);

    // Vertex shader
    let vertexShaderSource = `#version 300 es
    #pragma vscode_glsllint_stage: vert
    
    in vec3 aPosition;
    in vec2 aTexCoord;
    in vec3 aNormal;
    out vec3 vNormal;
    out vec3 vPosition;
    out vec2 vTexCoord;
    uniform mat4 uTotalProjectionMatrix;
    uniform vec3 uSphereTranslation;
    uniform mat4 uModelMatrix;

    void main() {
        vNormal = aNormal;
        
        // Apply translation and transformation to get the world position
        vec3 translatedPosition = aPosition + uSphereTranslation;
        vec4 worldPosition = uModelMatrix * vec4(translatedPosition, 1.0);  // Transform to world space
        
        vPosition = worldPosition.xyz;  // Pass the world position to the fragment shader
        
        vTexCoord = aTexCoord;
        gl_Position = uTotalProjectionMatrix * uModelMatrix * vec4(translatedPosition, 1.0);
    }`;

    // Fragment shader
    let fragmentShaderSource = `#version 300 es
    #pragma vscode_glsllint_stage: frag
    precision highp float;

    in vec2 vTexCoord;
    in vec3 vPosition;
    in vec3 vNormal;

    uniform sampler2D uTexture;
    uniform sampler2D uTextureCloud;
    uniform float uTime; // Time uniform for animation
    uniform float uCloudRotation; // Speed of cloud movement
    uniform float uRotation;
    uniform vec4 uCloudColor;
    uniform vec4 uPlanetColor;

    // Spotlight uniforms
    uniform vec3 uLightPosition;
    uniform vec3 uLightDirection;
    uniform float uLightInnerCutoff;
    uniform float uLightOuterCutoff;

    out vec4 fragColor;

    void main() {
        // === Planet & Cloud Texture Blending ===
        vec2 planetTexCoord = vec2(vTexCoord.x, vTexCoord.y) + vec2(uTime * uRotation, 0.0);
        vec4 tempPlanetColor = texture(uTexture, planetTexCoord);
        vec4 planetColor = tempPlanetColor * uPlanetColor;

        vec2 cloudTexCoord = vTexCoord + (uTime * vec2(uCloudRotation * 0.09, 0.0));
        vec4 tempCloudColor = texture(uTextureCloud, cloudTexCoord);
        vec4 cloudColor = tempCloudColor * uCloudColor;

        vec4 blendedColor = mix(planetColor, cloudColor, cloudColor.a);

        // === Spotlight Lighting ===
        vec3 offset = uLightPosition - vPosition;
        vec3 surfaceToLight = normalize(offset);
        vec3 lightToSurface = -surfaceToLight;

        float diffuse = max(0.0, dot(surfaceToLight, normalize(vNormal)));
        float angleToSurface = acos(dot(lightToSurface, normalize(uLightDirection)));
        float spot = smoothstep(uLightOuterCutoff, uLightInnerCutoff, angleToSurface);

        float brightness = diffuse * spot;

        // Final color with lighting applied
        fragColor = blendedColor * spot;
        fragColor.a = 1.0;
    }`;

    let backgroundVertexShaderSource = `#version 300 es
    #pragma vscode_glsllint_stage: vert

    in vec2 aPosition;
    in vec2 aTexCoord;
    
    out vec2 vTexCoord;

    void main() {
        vTexCoord = aTexCoord;
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;

    let backgroundFragmentShaderSource = `#version 300 es
    #pragma vscode_glsllint_stage: frag

    precision highp float;

    uniform sampler2D uTexture;
    in vec2 vTexCoord;

    out vec4 fragColor;

    void main() {
        fragColor = texture(uTexture, vTexCoord);
    }`;

    let atmosphereVertexShaderSource = `#version 300 es
    #pragma vscode_glsllint_stage: vert

    in vec3 aPosition;
    in vec3 aNormal;

    uniform mat4 uModelMatrix;
    uniform vec3 uSphereTranslation;
    uniform mat4 uViewProjectionMatrix;

    out vec3 vPosition;
    out vec3 vNormal;

    void main() {
        vNormal = mat3(uModelMatrix) * aNormal; // Transform normal to world space

        vec3 translatedPosition = aPosition + uSphereTranslation;
        vec4 worldPosition = uModelMatrix * vec4(translatedPosition, 1.0);

        vPosition = worldPosition.xyz; // World-space position

        gl_Position = uViewProjectionMatrix * vec4(vPosition, 1.0);
    }`;

    let atmosphereFragmentShaderSource = `#version 300 es
    #pragma vscode_glsllint_stage: frag

    precision highp float;

    in vec3 vPosition;
    in vec3 vNormal;

    // uniform vec3 uLightPosition; // Light source position
    uniform vec3 uPlanetCenter;  // Planet's center position
    uniform vec3 uAtmosphereColor; // Atmosphere color
    uniform float uAtmosphereRadius; // Outer radius of the atmosphere
    uniform float uPlanetRadius; // Radius of the planet

    out vec4 fragColor;

    void main() {
        // Calculate normalized direction vectors
        // vec3 lightDir = normalize(uLightPosition - vPosition);
        vec3 viewDir = normalize(vPosition - uPlanetCenter);
        vec3 normal = normalize(vNormal);

        // Calculate the distance from the planet's center
        float dist = length(vPosition - uPlanetCenter);

        // Atmosphere falloff based on distance
        float atmosphereFactor = smoothstep(uPlanetRadius, uAtmosphereRadius, dist);

        // Light scattering effect
        // float scattering = max(dot(normal, lightDir), 0.0);

        // Combine scattering and atmosphere falloff
        vec3 atmosphereColor = uAtmosphereColor * atmosphereFactor;

        // Additive blending for glow effect
        fragColor = vec4(atmosphereColor, atmosphereFactor * 0.5); // Adjust alpha for transparency
        fragColor = vec4(1.0, 0.0, 1.0, 1.0); // Set alpha to 1.0 for full opacity
    }`;

    // Compile shaders
    function compileShader(gl: WebGL2RenderingContext, source: string, type: GLenum) {
        let shader = gl.createShader(type);
        if (!shader) throw new Error(`Unable to create shader, ${source} failed.`);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            // console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            // gl.deleteShader(shader);
            throw new Error(`Unable to create shader, ${source} failed. ` + gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    //wip

    // if (texturePlanetIsCompressed) {
    //     const ext = gl.getExtension('WEBGL_compressed_texture_s3tc');
    //     const texture = loadTexture(gl, texturePlanetUrl);
    //     gl.activeTexture(gl.TEXTURE0);
    //     gl.bindTexture(gl.TEXTURE_2D, texture);
    //     const textureLocation = gl.getUniformLocation(program, 'uTexture');
    //     gl.uniform1i(textureLocation, 0);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    //     gl.texImage2D(gl.TEXTURE_2D, 0, ext.COMPRESSED_RGBA_S3TC_DXT1_EXT, 1, 1, 0, ext.COMPRESSED_RGBA_S3TC_DXT1_EXT, ext.UNSIGNED_BYTE, null);
    // }

    // Bind the clouds texture


    // Bind and setup atmosphere texture
    // const atmosphereTexture = loadTexture(gl, textureAtmosphereUrl);
    // gl.activeTexture(gl.TEXTURE2);
    // gl.bindTexture(gl.TEXTURE_2D, atmosphereTexture);

    // Bind and setup lighting

    function createProgram(gl: WebGL2RenderingContext, vertexShader: string, fragmentShader: string) {
        let vertex_Shader = compileShader(gl, vertexShader, gl.VERTEX_SHADER);
        let fragment_Shader = compileShader(gl, fragmentShader, gl.FRAGMENT_SHADER);

        let program = gl.createProgram();
        gl.attachShader(program, vertex_Shader);
        gl.attachShader(program, fragment_Shader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
        }

        return program;
    }

    function planetProgram(gl: WebGL2RenderingContext, vertexShader: string, fragmentShader: string) {
        let program = createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(program);

        // Create sphere geometry
        let sphere = createSphere(subdivisions, radius);

        // Create buffers
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);

        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

        // Update attribute for texture coordinates
        let texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sphere.texCoords, gl.STATIC_DRAW);

        // Set up attribute
        let positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        // Set up attribute for texture coordinates
        let texCoordAttributeLocation = gl.getAttribLocation(program, 'aTexCoord');
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        let texture = loadTexture(gl, program, 'uTexture', texturePlanetUrl, 0);
        assignTexture(gl, texture.id, texture.location!); // TODO error handling
        let planetColorLocation = gl.getUniformLocation(program, 'uPlanetColor');
        gl.uniform4fv(planetColorLocation, planetColor.get_normalized_rgba());

        let textureCloud = loadTexture(gl, program, 'uTextureCloud', textureCloudUrl, 1);
        assignTexture(gl, textureCloud.id, textureCloud.location!); // TODO error handling
        let cloudRotationLocation = gl.getUniformLocation(program, 'uCloudRotation');
        gl.uniform1f(cloudRotationLocation, cloudRotation * Math.PI / 180);
        let cloudColorLocation = gl.getUniformLocation(program, 'uCloudColor');
        gl.uniform4fv(cloudColorLocation, cloudColor.get_normalized_rgba());

        let lightPositionLocation = gl.getUniformLocation(program, 'uLightPosition');
        let lightDirectionLocation = gl.getUniformLocation(program, 'uLightDirection');
        let lightInnerLocation = gl.getUniformLocation(program, 'uLightInnerCutoff');
        let lightOuterLocation = gl.getUniformLocation(program, 'uLightOuterCutoff');

        gl.uniform3fv(lightPositionLocation, lightPosition);        // Example light position
        gl.uniform3fv(lightDirectionLocation, [0.0, 0.0, 1.0]);       // Example direction
        gl.uniform1f(lightInnerLocation, radians(40.0));         // Inner cone angle in radians
        gl.uniform1f(lightOuterLocation, radians(85.0));         // Outer cone angle in radians

        let rotationLocation = gl.getUniformLocation(program, 'uRotation');

        return {
            program: program,
            sphere: sphere,
            positionBuffer: positionBuffer,
            indexBuffer: indexBuffer,
            positionAttributeLocation: positionAttributeLocation,
            texCoordAttributeLocation: texCoordAttributeLocation,
            texture: texture,
            textureCloud: textureCloud,
            planetColorLocation: planetColorLocation,
            cloudRotationLocation: cloudRotationLocation,
            cloudColorLocation: cloudColorLocation,
            lightPositionLocation: lightPositionLocation,
            lightDirectionLocation: lightDirectionLocation,
            lightInnerLocation: lightInnerLocation,
            lightOuterLocation: lightOuterLocation,
            rotationLocation: rotationLocation,
        }

    }

    function atmosphereProgram(gl: any, current_program: any, vertexShader: any, fragmentShader: any) {
        let program = createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(program);

        let atmosphereRadius = 1.05; // Slightly larger than the planet
        let atmosphereSphere = createSphere(subdivisions, atmosphereRadius);
    
        // Create buffers for the atmosphere sphere
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, atmosphereSphere.positions, gl.STATIC_DRAW);
    
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, atmosphereSphere.indices, gl.STATIC_DRAW);
    
        // let lightPositionLocation = gl.getUniformLocation(atmosphereProgram, 'uLightPosition');
        let planetCenterLocation = gl.getUniformLocation(program, 'uPlanetCenter');
        let atmosphereColorLocation = gl.getUniformLocation(program, 'uAtmosphereColor');
        let atmosphereRadiusLocation = gl.getUniformLocation(program, 'uAtmosphereRadius');
        let planetRadiusLocation = gl.getUniformLocation(program, 'uPlanetRadius');
    
        // gl.uniform3fv(lightPositionLocation, lightPosition);
        gl.uniform3fv(planetCenterLocation, [0.0, 0.0, 0.0]); // Assuming planet is at origin
        gl.uniform3fv(atmosphereColorLocation, [0.4, 0.7, 1.0]); // Light blue atmosphere
        gl.uniform1f(atmosphereRadiusLocation, atmosphereRadius);
        gl.uniform1f(planetRadiusLocation, radius);
    
        gl.useProgram(current_program);
    
        return {
            program: program,
            positionBuffer: positionBuffer,
            indexBuffer: indexBuffer,
            // lightPositionLocation,
            planetCenterLocation,
            atmosphereColorLocation,
            atmosphereRadiusLocation,
            planetRadiusLocation,
            atmosphereSphere,
            atmosphereRadius,
        };
    }

    function backgroundProgram(gl: any, current_program: any, fragmentShaderSource: any, vertexShaderSource: any) {
        const quadVertices = new Float32Array([
            // x, y,   u, v
            -1, -1,   0, 0,
             1, -1,   1, 0,
            -1,  1,   0, 1,
             1,  1,   1, 1,
        ]);

        const bgVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bgVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

        const bgVertexShader = compileShader(gl, backgroundVertexShaderSource, gl.VERTEX_SHADER);
        const bgFragmentShader = compileShader(gl, backgroundFragmentShaderSource, gl.FRAGMENT_SHADER);
        const bgProgram = gl.createProgram();
        gl.attachShader(bgProgram, bgVertexShader);
        gl.attachShader(bgProgram, bgFragmentShader);
        gl.linkProgram(bgProgram);

        if (!gl.getProgramParameter(bgProgram, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(bgProgram);
            throw `Could not compile WebGL program. \n\n${info}`;
        }

        gl.useProgram(bgProgram);

        let aBackPositionLocation = gl.getAttribLocation(bgProgram, "aPosition");
        let aBackTexCoordLocation = gl.getAttribLocation(bgProgram, "aTexCoord");

        let backgroundTexture = loadTexture(gl, bgProgram, 'uTexture', textureBackgroundUrl, 14);
        assignTexture(gl, backgroundTexture.id, backgroundTexture.location!); // TODO error handling

        gl.useProgram(current_program);

        return {
            program: bgProgram,
            bgVertexBuffer: bgVBO,
            backgroundTexture: backgroundTexture,
            aPositionLocation: aBackPositionLocation,
            aTexCoordLocation: aBackTexCoordLocation
          };
    }

    let program = planetProgram(gl, vertexShaderSource, fragmentShaderSource);
    // let atmosphereProg = atmosphereProgram(gl, program.program, atmosphereFragmentShaderSource, atmosphereVertexShaderSource);
    let bgProgram = backgroundProgram(gl, program.program, backgroundFragmentShaderSource, backgroundVertexShaderSource);

    // function drawBackground(gl, current_program, bgProg) {
    //     gl.disable(gl.DEPTH_TEST);
    //     gl.disable(gl.BLEND)
    //     gl.depthMask(false);

    //     gl.useProgram(bgProg.program);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, bgProg.bgVertexBuffer);
    //     gl.vertexAttribPointer(bgProg.aPositionLocation, 2, gl.FLOAT, false, 16, 0);
    //     gl.enableVertexAttribArray(bgProg.aPositionLocation);
    //     gl.vertexAttribPointer(bgProg.aTexCoordLocation, 2, gl.FLOAT, false, 16, 8);
    //     gl.enableVertexAttribArray(bgProg.aTexCoordLocation);

    //     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    //     gl.useProgram(current_program);
    //     gl.enable(gl.DEPTH_TEST);
    //     gl.depthMask(true);
    //     gl.enable(gl.BLEND);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    //     gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    //     gl.enableVertexAttribArray(positionAttributeLocation);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    //     gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    //     gl.enableVertexAttribArray(texCoordAttributeLocation);

    // }

    function clearCanvas(gl: WebGL2RenderingContext) {
        // Clear the canvas and depth buffer
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    const camera = {
        position: [0, 0, cameraDistance], // Camera positioned along the negative Z-axis
        rotation: [0, 0, 0]   // No initial rotation
    };

    // Set up uniform
    const totalProjectionMatrixLocation = gl.getUniformLocation(program.program, 'uTotalProjectionMatrix');
    const modelMatrixLocation = gl.getUniformLocation(program.program, 'uModelMatrix');

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for glow
    gl.enable(gl.CULL_FACE);

    // Add time uniform to the render loop
    const timeLocation = gl.getUniformLocation(program.program, 'uTime');
    let startTime = performance.now();

    const sphereTranslationLocation = gl.getUniformLocation(program.program, 'uSphereTranslation');
    let sphereTranslation = [0.0, 0.0, 0.0]; // Initial position
    let fov = Math.PI * 0.25

    // function tick(time: number) {
    //     render(gl, time);
    //     requestAnimationFrame(tick);
    // }

    function render(gl: WebGL2RenderingContext) {

        clearCanvas(gl);

        // drawBackground(program.program, bgProgram);

        let currentTime = (performance.now() - startTime) / 1000;
        gl.uniform1f(timeLocation, currentTime);

        // May want to modify canvas dimensions later, thus is in render loop.
        let projectionMatrix = createMat4();
        perspective(projectionMatrix, fov, canvas.width / canvas.height, 0.00001, 100);
        
        let viewMatrix = createMat4();
        lookAt(viewMatrix, camera.position, [0, 0, 0], [0, 1, 0]);

        let pv = createMat4();
        multiply(pv, projectionMatrix, viewMatrix);
    
        let modelMatrix = createMat4();

        // Create individual rotation matrices
        let rotationZ = createMat4();
        let rotationY = createMat4();
        let rotationX = createMat4();
        
        rotateZ(rotationZ, rotationZ, tilt * rads); // Apply tilt
        
        rotateY(rotationY, rotationY, currentTime * ((rotation * rads) * 0.7)); // Spin
        rotateX(rotationX, rotationX, pitch * rads); // Optional pitch
        
        // Combine rotations
        let tempMatrix = createMat4();
        multiply(tempMatrix, rotationZ, rotationY);     // First tilt, then spin around tilted Y
        multiply(modelMatrix, tempMatrix, rotationX);   // Then pitch around X if needed

        // translate(modelMatrix, modelMatrix, [0, 0, 0]);

        // Set the final model matrix for the planet (including rotation and translation)
        gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    
        // Set the total projection matrix (projection * view)
        gl.uniformMatrix4fv(totalProjectionMatrixLocation, false, pv);
    
        // Bind the index buffer and draw the sphere
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program.indexBuffer);
        gl.drawElements(gl.TRIANGLES, program.sphere.indices.length, gl.UNSIGNED_SHORT, 0);

        // // Use the atmosphere shader program
        // gl.useProgram(atmosphereProg.program);

        // // Set atmosphere-specific uniforms
        // // gl.uniform3fv(atmosphereProg.lightPositionLocation, lightPosition);
        // gl.uniform3fv(atmosphereProg.planetCenterLocation, [0.0, 0.0, 0.0]); // Assuming planet is at origin
        // gl.uniform3fv(atmosphereProg.atmosphereColorLocation, atmosphereColor.get_normalized_rgb());
        // gl.uniform1f(atmosphereProg.atmosphereRadiusLocation, 1.2); // Slightly larger than the planet
        // gl.uniform1f(atmosphereProg.planetRadiusLocation, radius);
        // gl.uniform3fv(sphereTranslationLocation, sphereTranslation); // Set the translation for the atmosphere

        // // Bind the atmosphere sphere buffers
        // gl.bindBuffer(gl.ARRAY_BUFFER, atmosphereProg.positionBuffer);
        // gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(positionAttributeLocation);

        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, atmosphereProg.indexBuffer);

        // // Render the atmosphere sphere
        // gl.drawElements(gl.TRIANGLES, atmosphereProg.atmosphereSphere.indices.length, gl.UNSIGNED_SHORT, 0);

        // Continue rendering
        requestAnimationFrame(render.bind(null, gl));
    }
    render(gl);
}

planetEngine({
    // Planet texturing information
    texturePlanetUrl: '../textures/arid.jpg',
    texturePlanetIsCompressed: false,
    textureCloudUrl: '../textures/clouds_banded01.png',
    textureCloudIsCompressed: false,
    textureBackgroundUrl: '../textures/background2.jpg',
    textureBackgroundIsCompressed: false,
    textureAtmosphereUrl: '',
    textureAtmosphereIsCompressed: false,
    textureGlowUrl: '',
    textureGlowIsCompressed: false,

    // Planet rotation information
    rotation: 30.0,
    tilt: 30.0, // Degrees
    pitch: 45.0, // Degrees

    // Planet color information
    planetColor: new Color(255,255,255,255),

    // Planet atmosphere information
    atmosphereColor: new Color(0, 0, 0, 0),
    atmosphereThickness: 0.0,
    atmosphereThicknessMin: 0.0,

    // Planet clouds information
    cloudColor: new Color(235,240,250,225),
    cloudRotation: 5,

    // Lighting information
    lightPosition: [0,1.0,0],

    // Planet geometry information
    subdivisions: 32,
    radius: 1.0,

    // Camera information
    cameraDistance: 3,

}); // Compression wip
