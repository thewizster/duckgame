import { Camera } from './Camera';
import { Rect } from '../math/Rect';

/**
 * Canvas 2D rendering wrapper providing convenience methods for
 * common game-rendering operations: shapes, text, gradients, screen
 * effects, and camera integration.
 *
 * Does not own the canvas — it wraps the 2D context and adds
 * game-oriented helpers on top.
 *
 * ```ts
 * const renderer = new Renderer(canvas);
 * renderer.clear('#1a1a40');
 * renderer.applyCamera(camera);
 * renderer.fillRect(100, 200, 50, 14, '#8B4513');
 * renderer.restoreCamera();
 * renderer.fillText('Score: 100', 10, 20, '16px Courier New', '#fff');
 * ```
 */
export class Renderer {
    readonly ctx: CanvasRenderingContext2D;
    readonly canvas: HTMLCanvasElement;
    readonly width: number;
    readonly height: number;

    private cameraApplied = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    // ── Clear / fill ───────────────────────────────────────────

    /** Clear the entire canvas with a solid colour. */
    clear(color?: string): void {
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    // ── Camera integration ─────────────────────────────────────

    /** Apply camera transform. Call restoreCamera() when done drawing world objects. */
    applyCamera(camera: Camera): void {
        camera.applyToContext(this.ctx);
        this.cameraApplied = true;
    }

    /** Restore the context after camera transform. */
    restoreCamera(): void {
        if (this.cameraApplied) {
            this.ctx.restore();
            this.cameraApplied = false;
        }
    }

    // ── Primitive drawing ──────────────────────────────────────

    fillRect(x: number, y: number, w: number, h: number, color: string): void {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }

    strokeRect(x: number, y: number, w: number, h: number, color: string, lineWidth: number = 1): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(x, y, w, h);
    }

    fillCircle(cx: number, cy: number, radius: number, color: string): void {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    strokeCircle(cx: number, cy: number, radius: number, color: string, lineWidth: number = 1): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    line(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth: number = 1): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    // ── Gradients ──────────────────────────────────────────────

    /** Fill a rectangle with a vertical linear gradient. */
    fillGradientV(
        x: number, y: number, w: number, h: number,
        colorTop: string, colorBottom: string,
    ): void {
        const grd = this.ctx.createLinearGradient(x, y, x, y + h);
        grd.addColorStop(0, colorTop);
        grd.addColorStop(1, colorBottom);
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(x, y, w, h);
    }

    /** Fill a rectangle with a horizontal linear gradient. */
    fillGradientH(
        x: number, y: number, w: number, h: number,
        colorLeft: string, colorRight: string,
    ): void {
        const grd = this.ctx.createLinearGradient(x, y, x + w, y);
        grd.addColorStop(0, colorLeft);
        grd.addColorStop(1, colorRight);
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(x, y, w, h);
    }

    /** Fill a rectangle with a multi-stop gradient. */
    fillGradient(
        x: number, y: number, w: number, h: number,
        stops: [number, string][],
        vertical: boolean = true,
    ): void {
        const grd = vertical
            ? this.ctx.createLinearGradient(x, y, x, y + h)
            : this.ctx.createLinearGradient(x, y, x + w, y);
        for (const [stop, color] of stops) {
            grd.addColorStop(stop, color);
        }
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(x, y, w, h);
    }

    // ── Wave line (for water/lava surfaces) ────────────────────

    /**
     * Draw an animated wave line across the screen width.
     * Great for water surfaces, lava, etc.
     */
    waveLine(
        y: number,
        amplitude: number,
        frequency: number,
        phase: number,
        color: string,
        lineWidth: number = 3,
        stepSize: number = 3,
    ): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        for (let x = 0; x <= this.width; x += stepSize) {
            const wy = y + Math.sin((x + phase) * frequency) * amplitude;
            if (x === 0) this.ctx.moveTo(x, wy);
            else this.ctx.lineTo(x, wy);
        }
        this.ctx.stroke();
    }

    // ── Text ───────────────────────────────────────────────────

    fillText(
        text: string,
        x: number,
        y: number,
        font: string = '14px Courier New',
        color: string = '#ffffff',
        align: CanvasTextAlign = 'left',
    ): void {
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    }

    /** Draw text with a drop shadow. */
    fillTextShadow(
        text: string,
        x: number,
        y: number,
        font: string,
        color: string,
        shadowColor: string = '#000000',
        shadowOffset: number = 2,
        align: CanvasTextAlign = 'left',
    ): void {
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillText(text, x + shadowOffset, y + shadowOffset);
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }

    /** Word-wrap text within a max width. */
    wrapText(
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number,
        font: string = '14px Courier New',
        color: string = '#ffffff',
        align: CanvasTextAlign = 'center',
    ): number {
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;

        const words = text.split(' ');
        let line = '';
        let linesDrawn = 0;

        for (let i = 0; i < words.length; i++) {
            const test = line + words[i] + ' ';
            if (this.ctx.measureText(test).width > maxWidth && line !== '') {
                this.ctx.fillText(line.trim(), x, y);
                line = words[i] + ' ';
                y += lineHeight;
                linesDrawn++;
            } else {
                line = test;
            }
        }
        if (line.trim()) {
            this.ctx.fillText(line.trim(), x, y);
            linesDrawn++;
        }
        return linesDrawn;
    }

    /** Measure text width with the given font. */
    measureText(text: string, font: string = '14px Courier New'): number {
        this.ctx.font = font;
        return this.ctx.measureText(text).width;
    }

    // ── Images / sprites ───────────────────────────────────────

    drawImage(
        image: CanvasImageSource,
        x: number,
        y: number,
        w?: number,
        h?: number,
    ): void {
        if (w !== undefined && h !== undefined) {
            this.ctx.drawImage(image, x, y, w, h);
        } else {
            this.ctx.drawImage(image, x, y);
        }
    }

    /** Draw an image flipped horizontally. */
    drawImageFlipped(
        image: CanvasImageSource,
        x: number,
        y: number,
        w: number,
        h: number,
    ): void {
        this.ctx.save();
        this.ctx.translate(x + w, y);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(image, 0, 0, w, h);
        this.ctx.restore();
    }

    // ── Alpha / compositing ────────────────────────────────────

    setAlpha(alpha: number): void {
        this.ctx.globalAlpha = alpha;
    }

    resetAlpha(): void {
        this.ctx.globalAlpha = 1;
    }

    /** Draw a full-screen colour overlay (for fades, death screens, etc.) */
    overlay(color: string): void {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // ── State management ───────────────────────────────────────

    save(): void { this.ctx.save(); }
    restore(): void { this.ctx.restore(); }

    /** Draw a rounded rectangle panel (useful for UI cards, menus). */
    panel(
        x: number, y: number, w: number, h: number,
        bgColor: string,
        borderColor?: string,
        borderWidth: number = 1,
        radius: number = 0,
    ): void {
        this.ctx.fillStyle = bgColor;
        if (radius > 0) {
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, w, h, radius);
            this.ctx.fill();
            if (borderColor) {
                this.ctx.strokeStyle = borderColor;
                this.ctx.lineWidth = borderWidth;
                this.ctx.stroke();
            }
        } else {
            this.ctx.fillRect(x, y, w, h);
            if (borderColor) {
                this.ctx.strokeStyle = borderColor;
                this.ctx.lineWidth = borderWidth;
                this.ctx.strokeRect(x, y, w, h);
            }
        }
    }

    /** Check whether a world-space rect is visible on screen through a camera. */
    isVisible(rect: Rect, camera: Camera): boolean {
        return camera.isVisible(rect);
    }
}
