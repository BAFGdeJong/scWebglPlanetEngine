export class TextureMap {
    private map = new Map<number, Texture>();
    private maxTextures: number = 16;
    private minId: number = 0;

    constructor() {
        for (let i = this.minId; i < this.maxTextures; i++) {
            this.map.set(i, null!);
        }
    }

    loadTexture(newTexture: Texture) {
        newTexture.load();
    }

    assign(program: WebGLProgram, newTexture: Texture) {
        let longestInUse: Texture = newTexture;

        for (let [id, texture] of this.map) {
            if (!texture) {
                this.map.set(id, newTexture);
                newTexture.setId(id);
                newTexture.startTimeInUse();
                newTexture.assign(program);
                return;
            }

            if (texture.getTimeInUse()! > longestInUse.getTimeInUse()!) {
                longestInUse = texture;
            }
        }

        this.map.set(longestInUse.getId(), newTexture);
        newTexture.setId(longestInUse.getId());
        newTexture.startTimeInUse();
        longestInUse.resetId();
        longestInUse.resetTimeInUse();

        newTexture.assign(program);
    }
}

export class Texture {
    private gl: WebGL2RenderingContext;
    private uniformName: string;
    private url: string;
    private id: number;
    private location: WebGLUniformLocation | null;
    private programsUsing: WebGLProgram[];
    private timeInUse: number | null = null;
    private textureObject: WebGLTexture | null = null;

    constructor(gl: WebGL2RenderingContext, uniformName: string, url: string) {
        this.gl = gl;
        this.uniformName = uniformName;
        this.url = url;
        this.id = -1;
        this.location = null;
        this.programsUsing = [];
    }

    getTimeInUse() {
        return this.timeInUse;
    }

    startTimeInUse() {
        this.timeInUse = performance.now();
    }

    resetTimeInUse() {
        this.timeInUse = -1;
    }

    getId() {
        return this.id;
    }

    setId(id: number) {
        this.id = id;
    }

    resetId() {
        this.id = -1;
    }

    load() {
        this.textureObject = this.gl.createTexture();
        const image = new Image();
        image.src = this.url;

        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureObject);
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        };
    }

    assign(program: WebGLProgram) {
        if (!this.textureObject) {
            console.warn(`Texture for ${this.uniformName} not loaded yet.`);
            return;
        }

        this.location = this.gl.getUniformLocation(program, this.uniformName);
        this.gl.activeTexture(this.gl.TEXTURE0 + this.id);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureObject);
        this.gl.uniform1i(this.location, this.id);
        this.programsUsing.push(program);
    }

}