/**
 * High-performance particle system with configurable emitters.
 * Particles are simple value objects stored in flat arrays for cache efficiency.
 *
 * ```ts
 * const particles = new ParticleSystem();
 *
 * // Spawn a burst of particles
 * particles.emit({
 *   x: 400, y: 300,
 *   count: 20,
 *   speed: [1, 5],
 *   angle: [0, Math.PI * 2],
 *   life: [20, 40],
 *   colors: ['#ff6600', '#ffaa00', '#ffdd00'],
 *   size: [2, 5],
 *   gravity: 0.12,
 * });
 *
 * // In update:
 * particles.update();
 * // In draw:
 * particles.draw(ctx);
 * ```
 */

export interface EmitterConfig {
    /** World-space X position */
    x: number;
    /** World-space Y position */
    y: number;
    /** Number of particles to spawn */
    count: number;
    /** Speed range [min, max] */
    speed: [number, number];
    /** Angle range [min, max] in radians */
    angle?: [number, number];
    /** Lifetime range [min, max] in frames */
    life: [number, number];
    /** Possible colours (random pick per particle) */
    colors: string[];
    /** Size range [min, max] in pixels */
    size?: [number, number];
    /** Gravity applied per frame (default 0.12) */
    gravity?: number;
    /** Spread: random offset from x,y */
    spread?: [number, number];
    /** Fade out as life decreases (default true) */
    fadeOut?: boolean;
    /** Shrink as life decreases (default false) */
    shrink?: boolean;
}

interface Particle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    gravity: number;
    fadeOut: boolean;
    shrink: boolean;
}

export class ParticleSystem {
    private particles: Particle[] = [];

    /** Maximum particle count to prevent runaway effects */
    maxParticles: number = 2000;

    /** Current particle count */
    get count(): number { return this.particles.length; }

    /**
     * Emit a burst of particles from a configuration.
     */
    emit(config: EmitterConfig): void {
        const {
            x, y, count, speed, life, colors,
            angle = [0, Math.PI * 2],
            size = [2, 4],
            gravity = 0.12,
            spread = [0, 0],
            fadeOut = true,
            shrink = false,
        } = config;

        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;

            const a = angle[0] + Math.random() * (angle[1] - angle[0]);
            const s = speed[0] + Math.random() * (speed[1] - speed[0]);
            const l = Math.floor(life[0] + Math.random() * (life[1] - life[0]));

            this.particles.push({
                x: x + (Math.random() - 0.5) * spread[0],
                y: y + (Math.random() - 0.5) * spread[1],
                dx: Math.cos(a) * s,
                dy: Math.sin(a) * s,
                life: l,
                maxLife: l,
                color: colors[Math.floor(Math.random() * colors.length)]!,
                size: size[0] + Math.random() * (size[1] - size[0]),
                gravity,
                fadeOut,
                shrink,
            });
        }
    }

    /**
     * Spawn a single particle with explicit properties.
     */
    spawn(
        x: number, y: number,
        dx: number, dy: number,
        life: number, color: string, size: number,
        gravity: number = 0.12,
    ): void {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push({
            x, y, dx, dy,
            life, maxLife: life,
            color, size, gravity,
            fadeOut: true, shrink: false,
        });
    }

    /**
     * Update all particles (call once per frame).
     */
    update(): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]!;
            p.x += p.dx;
            p.y += p.dy;
            p.dy += p.gravity;
            p.life--;
            if (p.life <= 0) {
                // Swap-remove for performance
                this.particles[i] = this.particles[this.particles.length - 1]!;
                this.particles.pop();
            }
        }
    }

    /**
     * Draw all particles to a canvas context.
     */
    draw(ctx: CanvasRenderingContext2D): void {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]!;
            const t = p.life / p.maxLife;

            if (p.fadeOut) {
                ctx.globalAlpha = Math.max(0, t);
            }

            ctx.fillStyle = p.color;
            const s = p.shrink ? p.size * t : p.size;
            ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Draw particles with a camera offset applied.
     */
    drawWithOffset(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]!;
            const t = p.life / p.maxLife;

            if (p.fadeOut) {
                ctx.globalAlpha = Math.max(0, t);
            }

            ctx.fillStyle = p.color;
            const s = p.shrink ? p.size * t : p.size;
            ctx.fillRect(p.x - offsetX - s / 2, p.y - offsetY - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
    }

    /** Remove all particles. */
    clear(): void {
        this.particles.length = 0;
    }
}

// ── Pre-built emitter presets ──────────────────────────────

export const ParticlePresets = {
    splash(x: number, y: number, color: string = '#5ab4ff'): EmitterConfig {
        return {
            x, y, count: 10,
            speed: [1.5, 5],
            angle: [Math.PI, Math.PI * 2],
            life: [18, 36],
            colors: [color],
            size: [2, 5],
            gravity: 0.12,
        };
    },

    explosion(x: number, y: number): EmitterConfig {
        return {
            x, y, count: 16,
            speed: [1, 6],
            angle: [0, Math.PI * 2],
            life: [22, 44],
            colors: ['#ff6600', '#ffaa00', '#ffdd00', '#ff3300', '#ffffff'],
            size: [2, 6],
            gravity: 0.12,
        };
    },

    feathers(x: number, y: number): EmitterConfig {
        return {
            x, y, count: 7,
            speed: [1, 5],
            angle: [0, Math.PI * 2],
            life: [28, 56],
            colors: ['#f5c842', '#c89820', '#f0e040', '#a07010'],
            size: [3, 6],
            gravity: 0.08,
        };
    },

    collectGlow(x: number, y: number): EmitterConfig {
        return {
            x, y, count: 8,
            speed: [3, 3],
            angle: [0, Math.PI * 2],
            life: [18, 24],
            colors: ['#ffe066'],
            size: [3, 3],
            gravity: 0,
        };
    },

    burst(x: number, y: number): EmitterConfig {
        return {
            x, y, count: 10,
            speed: [1, 4],
            angle: [Math.PI * 0.5, Math.PI * 1.5],
            life: [14, 24],
            colors: ['#88ccff'],
            size: [3, 6],
            gravity: -0.05,
            spread: [20, 20],
        };
    },

    snow(screenWidth: number): EmitterConfig {
        return {
            x: Math.random() * screenWidth, y: -4,
            count: 1,
            speed: [1, 3],
            angle: [Math.PI * 0.4, Math.PI * 0.6],
            life: [180, 300],
            colors: ['#e8f4ff'],
            size: [2, 3],
            gravity: 0,
        };
    },

    ember(screenWidth: number, screenHeight: number): EmitterConfig {
        return {
            x: Math.random() * screenWidth, y: screenHeight,
            count: 1,
            speed: [1.2, 3.2],
            angle: [-Math.PI * 0.8, -Math.PI * 0.2],
            life: [50, 110],
            colors: ['#ff6600', '#ffaa00'],
            size: [2, 2],
            gravity: -0.02,
        };
    },
} as const;
