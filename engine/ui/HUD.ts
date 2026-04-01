/**
 * HUD (Heads-Up Display) system for managing on-screen game UI elements
 * like health bars, counters, and status icons — all rendered to canvas
 * (no DOM dependency).
 *
 * ```ts
 * const hud = new HUD();
 * hud.addBar('hp', { x: 10, y: 10, width: 200, height: 20 });
 * hud.addCounter('score', { x: 10, y: 40, prefix: 'Score: ' });
 * hud.setBar('hp', 75, 100);
 * hud.setCounter('score', 1250);
 * hud.draw(ctx);
 * ```
 */

export interface BarConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    bgColor?: string;
    fgColor?: string;
    /** Colour thresholds: below this % use this colour */
    thresholds?: { percent: number; color: string }[];
    borderColor?: string;
    borderWidth?: number;
    label?: string;
    labelFont?: string;
    labelColor?: string;
}

export interface CounterConfig {
    x: number;
    y: number;
    prefix?: string;
    suffix?: string;
    font?: string;
    color?: string;
    align?: CanvasTextAlign;
}

export interface IconRowConfig {
    x: number;
    y: number;
    spacing?: number;
    font?: string;
    color?: string;
}

interface BarState extends BarConfig {
    value: number;
    max: number;
}

interface CounterState extends CounterConfig {
    value: number | string;
}

interface IconRowState extends IconRowConfig {
    icons: string[];
}

export class HUD {
    private bars = new Map<string, BarState>();
    private counters = new Map<string, CounterState>();
    private iconRows = new Map<string, IconRowState>();
    visible: boolean = true;

    // ── Bars ───────────────────────────────────────────────────

    addBar(id: string, config: BarConfig): void {
        this.bars.set(id, {
            ...config,
            bgColor: config.bgColor ?? 'rgba(0,0,0,0.5)',
            fgColor: config.fgColor ?? '#2ecc71',
            borderColor: config.borderColor ?? '#333',
            borderWidth: config.borderWidth ?? 1,
            value: 100,
            max: 100,
        });
    }

    setBar(id: string, value: number, max?: number): void {
        const bar = this.bars.get(id);
        if (!bar) return;
        bar.value = value;
        if (max !== undefined) bar.max = max;
    }

    // ── Counters ───────────────────────────────────────────────

    addCounter(id: string, config: CounterConfig): void {
        this.counters.set(id, {
            ...config,
            font: config.font ?? '14px Courier New',
            color: config.color ?? '#ffffff',
            align: config.align ?? 'left',
            prefix: config.prefix ?? '',
            suffix: config.suffix ?? '',
            value: 0,
        });
    }

    setCounter(id: string, value: number | string): void {
        const counter = this.counters.get(id);
        if (counter) counter.value = value;
    }

    // ── Icon rows ──────────────────────────────────────────────

    addIconRow(id: string, config: IconRowConfig): void {
        this.iconRows.set(id, {
            ...config,
            spacing: config.spacing ?? 4,
            font: config.font ?? '16px Courier New',
            color: config.color ?? '#ffffff',
            icons: [],
        });
    }

    setIcons(id: string, icons: string[]): void {
        const row = this.iconRows.get(id);
        if (row) row.icons = icons;
    }

    // ── Drawing ────────────────────────────────────────────────

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.visible) return;

        // Draw bars
        for (const bar of this.bars.values()) {
            const pct = bar.max > 0 ? Math.max(0, bar.value / bar.max) : 0;

            // Background
            ctx.fillStyle = bar.bgColor!;
            ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

            // Determine colour based on thresholds
            let fgColor = bar.fgColor!;
            if (bar.thresholds) {
                for (const t of bar.thresholds) {
                    if (pct * 100 <= t.percent) {
                        fgColor = t.color;
                        break;
                    }
                }
            }

            // Foreground
            ctx.fillStyle = fgColor;
            ctx.fillRect(bar.x, bar.y, bar.width * pct, bar.height);

            // Border
            if (bar.borderWidth! > 0) {
                ctx.strokeStyle = bar.borderColor!;
                ctx.lineWidth = bar.borderWidth!;
                ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);
            }

            // Label
            if (bar.label) {
                ctx.font = bar.labelFont ?? '12px Courier New';
                ctx.fillStyle = bar.labelColor ?? '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(bar.label, bar.x + bar.width / 2, bar.y + bar.height / 2 + 4);
            }
        }

        // Draw counters
        for (const counter of this.counters.values()) {
            ctx.font = counter.font!;
            ctx.fillStyle = counter.color!;
            ctx.textAlign = counter.align!;
            ctx.fillText(
                `${counter.prefix}${counter.value}${counter.suffix}`,
                counter.x, counter.y,
            );
        }

        // Draw icon rows
        for (const row of this.iconRows.values()) {
            ctx.font = row.font!;
            ctx.fillStyle = row.color!;
            ctx.textAlign = 'left';
            let x = row.x;
            for (const icon of row.icons) {
                ctx.fillText(icon, x, row.y);
                x += ctx.measureText(icon).width + row.spacing!;
            }
        }

        ctx.textAlign = 'left';
    }

    /** Remove all HUD elements. */
    clear(): void {
        this.bars.clear();
        this.counters.clear();
        this.iconRows.clear();
    }
}
