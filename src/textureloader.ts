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
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        };

        return textureObject;
    }
}