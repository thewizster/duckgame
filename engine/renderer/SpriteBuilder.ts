/**
 * Declarative pixel-art sprite builder. Define sprites as a grid of colour
 * values and render them to canvas at any scale. Sprites are cached to
 * off-screen canvases for fast repeated drawing.
 *
 * ```ts
 * const duckSprite = new SpriteBuilder(8, 8)
 *   .row('..YYYY..')
 *   .row('.YYYYYY.')
 *   .row('YYEYYYY.')
 *   .row('YYYYYOOO')
 *   .row('.YYYYYY.')
 *   .row('..YYYY..')
 *   .row('.OO..OO.')
 *   .row('.OO..OO.')
 *   .palette({ Y: '#f5c842', E: '#111111', O: '#e07820', '.': '' })
 *   .build(4);  // 4x scale
 *
 * ctx.drawImage(duckSprite, x, y);
 * ```
 */
export class SpriteBuilder {
    private rows: string[] = [];
    private colors: Record<string, string> = {};
    private w: number;
    private h: number;

    constructor(width: number, height: number) {
        this.w = width;
        this.h = height;
    }

    /** Add a row of pixel characters. Length must match width. */
    row(pixels: string): this {
        this.rows.push(pixels);
        return this;
    }

    /** Set the palette mapping characters to CSS colours. Empty string = transparent. */
    palette(map: Record<string, string>): this {
        this.colors = { ...this.colors, ...map };
        return this;
    }

    /** Define the sprite from a multi-line string (rows separated by newlines). */
    fromString(data: string): this {
        this.rows = data.split('\n').filter(r => r.length > 0);
        if (this.rows.length > 0) {
            this.w = this.rows[0]!.length;
            this.h = this.rows.length;
        }
        return this;
    }

    /**
     * Build the sprite into an off-screen canvas at the given scale.
     * Returns an HTMLCanvasElement that can be drawn with ctx.drawImage().
     */
    build(scale: number = 1): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = this.w * scale;
        canvas.height = this.h * scale;
        const ctx = canvas.getContext('2d')!;

        for (let y = 0; y < this.rows.length && y < this.h; y++) {
            const row = this.rows[y]!;
            for (let x = 0; x < row.length && x < this.w; x++) {
                const char = row[x]!;
                const color = this.colors[char];
                if (!color) continue; // transparent
                ctx.fillStyle = color;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        return canvas;
    }

    /** Build and return an ImageBitmap (async, better GPU performance). */
    async buildBitmap(scale: number = 1): Promise<ImageBitmap> {
        const canvas = this.build(scale);
        return createImageBitmap(canvas);
    }
}

/**
 * Sprite animation: a sequence of frames with timing.
 */
export interface SpriteFrame {
    image: HTMLCanvasElement | HTMLImageElement | ImageBitmap;
    duration: number; // seconds per frame
}

export class SpriteAnimation {
    private frames: SpriteFrame[];
    private elapsed: number = 0;
    private _frameIndex: number = 0;
    loop: boolean = true;

    constructor(frames: SpriteFrame[]) {
        this.frames = frames;
    }

    /** Build from uniform-duration frames. */
    static uniform(
        images: (HTMLCanvasElement | HTMLImageElement | ImageBitmap)[],
        frameDuration: number,
    ): SpriteAnimation {
        return new SpriteAnimation(
            images.map(image => ({ image, duration: frameDuration })),
        );
    }

    get frameIndex(): number { return this._frameIndex; }
    get currentFrame(): SpriteFrame { return this.frames[this._frameIndex]!; }
    get image(): HTMLCanvasElement | HTMLImageElement | ImageBitmap { return this.currentFrame.image; }
    get finished(): boolean { return !this.loop && this._frameIndex >= this.frames.length - 1; }

    /** Advance the animation by dt seconds. */
    update(dt: number): void {
        if (this.frames.length === 0) return;
        this.elapsed += dt;

        while (this.elapsed >= this.currentFrame.duration) {
            this.elapsed -= this.currentFrame.duration;
            if (this._frameIndex < this.frames.length - 1) {
                this._frameIndex++;
            } else if (this.loop) {
                this._frameIndex = 0;
            }
        }
    }

    /** Reset to the first frame. */
    reset(): void {
        this._frameIndex = 0;
        this.elapsed = 0;
    }
}

/**
 * Sprite sheet: extract frames from a grid-based sprite sheet image.
 */
export function extractFrames(
    image: HTMLImageElement | HTMLCanvasElement,
    frameWidth: number,
    frameHeight: number,
    count?: number,
): HTMLCanvasElement[] {
    const cols = Math.floor(image.width / frameWidth);
    const rows = Math.floor(image.height / frameHeight);
    const total = count ?? cols * rows;
    const frames: HTMLCanvasElement[] = [];

    for (let i = 0; i < total; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        if (row >= rows) break;

        const canvas = document.createElement('canvas');
        canvas.width = frameWidth;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(
            image,
            col * frameWidth, row * frameHeight, frameWidth, frameHeight,
            0, 0, frameWidth, frameHeight,
        );
        frames.push(canvas);
    }

    return frames;
}
