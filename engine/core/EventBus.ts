/**
 * Type-safe publish / subscribe event bus.
 *
 * Usage:
 * ```ts
 * type Events = {
 *   'player:hit':  { damage: number };
 *   'level:start': { level: number };
 * };
 * const bus = new EventBus<Events>();
 * bus.on('player:hit', e => console.log(e.damage));
 * bus.emit('player:hit', { damage: 25 });
 * ```
 */
export type EventHandler<T> = (data: T) => void;

export class EventBus<EventMap extends Record<string, unknown> = Record<string, unknown>> {
    private listeners = new Map<keyof EventMap, Set<EventHandler<never>>>();
    private onceSet = new WeakSet<EventHandler<never>>();

    /** Subscribe to an event. Returns an unsubscribe function. */
    on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(handler as EventHandler<never>);
        return () => { set!.delete(handler as EventHandler<never>); };
    }

    /** Subscribe to an event, auto-unsubscribe after the first call. */
    once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
        this.onceSet.add(handler as EventHandler<never>);
        return this.on(event, handler);
    }

    /** Emit an event to all subscribers. */
    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
        const set = this.listeners.get(event);
        if (!set) return;
        for (const handler of set) {
            (handler as EventHandler<EventMap[K]>)(data);
            if (this.onceSet.has(handler)) {
                set.delete(handler);
                this.onceSet.delete(handler);
            }
        }
    }

    /** Remove all listeners for a specific event, or all events if no key given. */
    off<K extends keyof EventMap>(event?: K): void {
        if (event !== undefined) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /** Number of listeners for a given event. */
    listenerCount<K extends keyof EventMap>(event: K): number {
        return this.listeners.get(event)?.size ?? 0;
    }
}
