/**
 * Toast notification system for in-game popups (achievements, biome
 * transitions, pickups, etc.). Renders as stacked cards in the corner.
 *
 * ```ts
 * const toasts = new ToastManager();
 * toasts.show('ACHIEVEMENT: First Splash', 'Complete your first run', 3.5);
 * // In draw:
 * toasts.update(dt);
 * toasts.draw(ctx, screenWidth);
 * ```
 */

export interface ToastConfig {
    /** Primary text */
    text: string;
    /** Secondary text (smaller, below primary) */
    sub?: string;
    /** Duration in seconds */
    duration?: number;
    /** Background colour */
    bgColor?: string;
    /** Border colour */
    borderColor?: string;
    /** Text colour */
    textColor?: string;
}

interface ActiveToast extends Required<Omit<ToastConfig, 'sub'>> {
    sub: string;
    timer: number;
    maxTimer: number;
}

export class ToastManager {
    private toasts: ActiveToast[] = [];
    maxVisible: number = 5;

    /** Show a toast notification. */
    show(text: string, sub?: string, duration: number = 3.5): void {
        this.toasts.push({
            text,
            sub: sub ?? '',
            duration,
            timer: duration,
            maxTimer: duration,
            bgColor: 'rgba(15,15,35,0.92)',
            borderColor: '#ffe066',
            textColor: '#ffe066',
        });
    }

    /** Show a toast with full configuration. */
    showConfig(config: ToastConfig): void {
        const duration = config.duration ?? 3.5;
        this.toasts.push({
            text: config.text,
            sub: config.sub ?? '',
            duration,
            timer: duration,
            maxTimer: duration,
            bgColor: config.bgColor ?? 'rgba(15,15,35,0.92)',
            borderColor: config.borderColor ?? '#ffe066',
            textColor: config.textColor ?? '#ffe066',
        });
    }

    /** Update toast timers. Call once per frame. */
    update(dt: number): void {
        for (let i = this.toasts.length - 1; i >= 0; i--) {
            this.toasts[i]!.timer -= dt;
            if (this.toasts[i]!.timer <= 0) {
                this.toasts.splice(i, 1);
            }
        }
    }

    /** Draw toasts in the top-right corner. */
    draw(
        ctx: CanvasRenderingContext2D,
        screenWidth: number,
        startY: number = 52,
    ): void {
        const visible = this.toasts.slice(-this.maxVisible);

        for (let i = 0; i < visible.length; i++) {
            const t = visible[i]!;
            const alpha = Math.min(1, t.timer / 0.5);

            ctx.save();
            ctx.globalAlpha = alpha;

            // Measure text width for dynamic sizing
            ctx.font = 'bold 12px Courier New';
            const tw = ctx.measureText(t.text).width + 24;
            const th = t.sub ? 40 : 26;
            const tx = screenWidth - tw - 10;
            const ty = startY + i * (th + 6);

            // Background
            ctx.fillStyle = t.bgColor;
            ctx.fillRect(tx, ty, tw, th);

            // Border
            ctx.strokeStyle = t.borderColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tx, ty, tw, th);

            // Primary text
            ctx.font = 'bold 12px Courier New';
            ctx.fillStyle = t.textColor;
            ctx.textAlign = 'right';
            ctx.fillText(t.text, screenWidth - 20, ty + 17);

            // Sub text
            if (t.sub) {
                ctx.font = '10px Courier New';
                ctx.fillStyle = '#8888aa';
                ctx.fillText(t.sub, screenWidth - 20, ty + 32);
            }

            ctx.restore();
        }

        ctx.textAlign = 'left';
    }

    /** Number of active toasts. */
    get count(): number { return this.toasts.length; }

    /** Clear all toasts. */
    clear(): void { this.toasts.length = 0; }
}
