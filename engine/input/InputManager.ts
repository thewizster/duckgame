import { Vector2 } from '../math/Vector2';

/**
 * Unified input manager supporting keyboard, mouse, touch, and
 * gamepad with action-based binding.
 *
 * Tracks pressed/released/held state per-frame so game code can
 * distinguish between "just pressed this frame" vs "held down".
 *
 * Action bindings let you map game actions to multiple physical inputs:
 * ```ts
 * input.bindAction('jump', ['Space', 'ArrowUp']);
 * input.bindAction('burst', ['ShiftLeft', 'ShiftRight']);
 * if (input.actionPressed('jump')) doJump();
 * if (input.actionHeld('burst'))   doBurst();
 * ```
 */

export interface MouseState {
    /** Position relative to canvas */
    position: Vector2;
    /** Position in world-space (set externally if using camera) */
    worldPosition: Vector2;
    /** Currently held buttons (0=left, 1=middle, 2=right) */
    buttons: Set<number>;
    /** Buttons pressed this frame */
    buttonsPressed: Set<number>;
    /** Buttons released this frame */
    buttonsReleased: Set<number>;
}

export interface TouchPoint {
    id: number;
    position: Vector2;
    startPosition: Vector2;
    delta: Vector2;
}

export class InputManager {
    // Keyboard state
    private held = new Set<string>();
    private pressed = new Set<string>();
    private released = new Set<string>();

    // Mouse state
    readonly mouse: MouseState = {
        position: Vector2.ZERO,
        worldPosition: Vector2.ZERO,
        buttons: new Set(),
        buttonsPressed: new Set(),
        buttonsReleased: new Set(),
    };

    // Touch state
    readonly touches = new Map<number, TouchPoint>();
    private touchStartedThisFrame = new Map<number, TouchPoint>();
    private touchEndedThisFrame = new Set<number>();

    // Action bindings
    private actionBindings = new Map<string, string[]>();
    private mouseActionBindings = new Map<string, number[]>();

    // Canvas reference for coordinate conversion
    private canvas: HTMLCanvasElement;
    private canvasWidth: number;
    private canvasHeight: number;

    // Prevent default for these keys (stops page scrolling etc.)
    private preventDefaultKeys = new Set<string>([
        'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab',
    ]);

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.setupListeners();
    }

    // ── Keyboard queries ───────────────────────────────────────

    /** True if key was pressed this frame (edge-triggered). */
    keyPressed(code: string): boolean { return this.pressed.has(code); }

    /** True if key is currently held down. */
    keyHeld(code: string): boolean { return this.held.has(code); }

    /** True if key was released this frame. */
    keyReleased(code: string): boolean { return this.released.has(code); }

    /** True if any key was pressed this frame. */
    anyKeyPressed(): boolean { return this.pressed.size > 0; }

    // ── Mouse queries ──────────────────────────────────────────

    /** True if mouse button was pressed this frame. */
    mousePressed(button: number = 0): boolean { return this.mouse.buttonsPressed.has(button); }

    /** True if mouse button is held. */
    mouseHeld(button: number = 0): boolean { return this.mouse.buttons.has(button); }

    /** True if mouse button was released this frame. */
    mouseReleased(button: number = 0): boolean { return this.mouse.buttonsReleased.has(button); }

    /** Mouse position relative to canvas logical coordinates. */
    get mousePosition(): Vector2 { return this.mouse.position; }

    // ── Touch queries ──────────────────────────────────────────

    /** Number of active touch points. */
    get touchCount(): number { return this.touches.size; }

    /** True if a new touch started this frame. */
    touchStarted(): boolean { return this.touchStartedThisFrame.size > 0; }

    /** True if a touch ended this frame. */
    touchEnded(): boolean { return this.touchEndedThisFrame.size > 0; }

    /** Get all active touch points. */
    getTouches(): TouchPoint[] { return Array.from(this.touches.values()); }

    // ── Action system ──────────────────────────────────────────

    /** Bind a named action to one or more keyboard codes. */
    bindAction(name: string, keys: string[]): this {
        this.actionBindings.set(name, keys);
        return this;
    }

    /** Bind a named action to mouse buttons. */
    bindMouseAction(name: string, buttons: number[]): this {
        this.mouseActionBindings.set(name, buttons);
        return this;
    }

    /** True if the action was triggered this frame. */
    actionPressed(name: string): boolean {
        const keys = this.actionBindings.get(name);
        if (keys) {
            for (const key of keys) {
                if (this.pressed.has(key)) return true;
            }
        }
        const buttons = this.mouseActionBindings.get(name);
        if (buttons) {
            for (const btn of buttons) {
                if (this.mouse.buttonsPressed.has(btn)) return true;
            }
        }
        return false;
    }

    /** True if the action is currently held. */
    actionHeld(name: string): boolean {
        const keys = this.actionBindings.get(name);
        if (keys) {
            for (const key of keys) {
                if (this.held.has(key)) return true;
            }
        }
        const buttons = this.mouseActionBindings.get(name);
        if (buttons) {
            for (const btn of buttons) {
                if (this.mouse.buttons.has(btn)) return true;
            }
        }
        return false;
    }

    /** True if the action was released this frame. */
    actionReleased(name: string): boolean {
        const keys = this.actionBindings.get(name);
        if (keys) {
            for (const key of keys) {
                if (this.released.has(key)) return true;
            }
        }
        const buttons = this.mouseActionBindings.get(name);
        if (buttons) {
            for (const btn of buttons) {
                if (this.mouse.buttonsReleased.has(btn)) return true;
            }
        }
        return false;
    }

    // ── Configuration ──────────────────────────────────────────

    /** Add a key code to the set that prevents default browser behaviour. */
    addPreventDefault(code: string): this {
        this.preventDefaultKeys.add(code);
        return this;
    }

    /** Remove all bindings and state. */
    clear(): void {
        this.held.clear();
        this.pressed.clear();
        this.released.clear();
        this.mouse.buttons.clear();
        this.mouse.buttonsPressed.clear();
        this.mouse.buttonsReleased.clear();
        this.touches.clear();
    }

    // ── Frame lifecycle (called by Engine) ─────────────────────

    /** @internal Clear per-frame edge-triggered state. Called at end of each frame. */
    endFrame(): void {
        this.pressed.clear();
        this.released.clear();
        this.mouse.buttonsPressed.clear();
        this.mouse.buttonsReleased.clear();
        this.touchStartedThisFrame.clear();
        this.touchEndedThisFrame.clear();
    }

    // ── Event wiring ───────────────────────────────────────────

    private setupListeners(): void {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (this.preventDefaultKeys.has(e.code)) e.preventDefault();
            if (!this.held.has(e.code)) {
                this.pressed.add(e.code);
            }
            this.held.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.held.delete(e.code);
            this.released.add(e.code);
        });

        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.position = this.canvasCoords(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.buttons.add(e.button);
            this.mouse.buttonsPressed.add(e.button);
            this.mouse.position = this.canvasCoords(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.buttons.delete(e.button);
            this.mouse.buttonsReleased.add(e.button);
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i]!;
                const pos = this.canvasCoords(t.clientX, t.clientY);
                const tp: TouchPoint = {
                    id: t.identifier,
                    position: pos,
                    startPosition: pos,
                    delta: Vector2.ZERO,
                };
                this.touches.set(t.identifier, tp);
                this.touchStartedThisFrame.set(t.identifier, tp);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i]!;
                const existing = this.touches.get(t.identifier);
                if (existing) {
                    const newPos = this.canvasCoords(t.clientX, t.clientY);
                    existing.delta = newPos.sub(existing.position);
                    existing.position = newPos;
                }
            }
        }, { passive: false });

        const touchEnd = (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i]!;
                this.touches.delete(t.identifier);
                this.touchEndedThisFrame.add(t.identifier);
            }
        };
        this.canvas.addEventListener('touchend', touchEnd);
        this.canvas.addEventListener('touchcancel', touchEnd);

        // Handle window blur — release everything
        window.addEventListener('blur', () => {
            for (const key of this.held) this.released.add(key);
            this.held.clear();
            this.mouse.buttons.clear();
        });
    }

    private canvasCoords(clientX: number, clientY: number): Vector2 {
        const rect = this.canvas.getBoundingClientRect();
        return new Vector2(
            (clientX - rect.left) * (this.canvasWidth / rect.width),
            (clientY - rect.top) * (this.canvasHeight / rect.height),
        );
    }
}
