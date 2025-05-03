// export class TextureMap {
//     private map = new Map<number, Texture>();
//     private maxTextures: number = 16;
//     private minId: number = 0;

//     constructor() {
//         for (let i = this.minId; i < this.maxTextures; i++) {
//             this.map.set(i, null!);
//         }
//     }

//     loadTexture(newTexture: Texture) {
//         newTexture.load();
//     }

//     assign(program: WebGLProgram, newTexture: Texture) {
//         let longestInUse: Texture = newTexture;

//         for (let [id, texture] of this.map) {
//             if (!texture) {
//                 this.map.set(id, newTexture);
//                 newTexture.setId(id);
//                 newTexture.startTimeInUse();
//                 newTexture.assign(program);
//                 return;
//             }

//             if (texture.getTimeInUse()! > longestInUse.getTimeInUse()!) {
//                 longestInUse = texture;
//             }
//         }

//         this.map.set(longestInUse.getId(), newTexture);
//         newTexture.setId(longestInUse.getId());
//         newTexture.startTimeInUse();
//         longestInUse.resetId();
//         longestInUse.resetTimeInUse();

//         newTexture.assign(program);
//     }
// }
// TODO use uniform API instead of texture API to assign textures to programs

export class TextureLoader { // TODO improve

    private gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext) {this.gl = gl}

    load(textureUrl: string) {
        let textureObject = this.gl.createTexture();
        let image = new Image();
        image.src = textureUrl;

        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, textureObject);
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        };

        return textureObject;
    }

    assign(uniformLocation: WebGLUniformLocation, textureObject: WebGLTexture, id: number) {
        this.gl.activeTexture(this.gl.TEXTURE0 + id);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureObject);
        this.gl.uniform1i(uniformLocation, id);
    }

}