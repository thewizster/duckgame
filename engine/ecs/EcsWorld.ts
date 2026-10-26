import { Entity } from './Entity';
import { System } from './System';
import type { Component, ComponentClass } from './Component';

/**
 * The ECS World manages all entities and systems. It provides
 * entity creation, querying by component, and system lifecycle.
 *
 * ```ts
 * const world = new EcsWorld();
 * world.addSystem(new GravitySystem());
 * world.addSystem(new RenderSystem());
 *
 * const player = world.spawn('player')
 *   .add(new Transform(100, 200))
 *   .add(new Health(100));
 *
 * // In game loop:
 * world.update(dt);
 * ```
 */
export class EcsWorld {
    private entities: Entity[] = [];
    private systems: System[] = [];
    private systemsSorted = false;

    // ── Entity management ──────────────────────────────────────

    /** Create and register a new entity. */
    spawn(name: string = ''): Entity {
        const entity = new Entity(name);
        this.entities.push(entity);
        return entity;
    }

    /** Add an existing entity to the world. */
    addEntity(entity: Entity): void {
        this.entities.push(entity);
    }

    /** Remove an entity immediately. */
    removeEntity(entity: Entity): void {
        const idx = this.entities.indexOf(entity);
        if (idx !== -1) this.entities.splice(idx, 1);
    }

    /** Get all entities. */
    getEntities(): readonly Entity[] {
        return this.entities;
    }

    /** Find entity by name (first match). */
    findByName(name: string): Entity | undefined {
        return this.entities.find(e => e.name === name && !e.destroyed);
    }

    /** Find all entities with a given name. */
    findAllByName(name: string): Entity[] {
        return this.entities.filter(e => e.name === name && !e.destroyed);
    }

    /**
     * Query entities that have ALL of the specified component types.
     * Only returns active, non-destroyed entities.
     */
    query(...components: ComponentClass[]): Entity[] {
        return this.entities.filter(
            e => e.active && !e.destroyed && e.hasAll(...components),
        );
    }

    /**
     * Query and return the first matching entity's specific component.
     * Convenience for single-entity lookups.
     */
    queryOne<T extends Component>(cls: ComponentClass<T>): T | undefined {
        for (const entity of this.entities) {
            if (entity.active && !entity.destroyed && entity.has(cls)) {
                return entity.get(cls);
            }
        }
        return undefined;
    }

    /** Count entities matching the given component query. */
    count(...components: ComponentClass[]): number {
        let n = 0;
        for (const e of this.entities) {
            if (e.active && !e.destroyed && e.hasAll(...components)) n++;
        }
        return n;
    }

    // ── System management ──────────────────────────────────────

    /** Register a system. Systems are sorted by priority on the next update. */
    addSystem(system: System): this {
        this.systems.push(system);
        this.systemsSorted = false;
        system.init?.(this);
        return this;
    }

    /** Remove a system by instance or name. */
    removeSystem(systemOrName: System | string): void {
        const idx = typeof systemOrName === 'string'
            ? this.systems.findIndex(s => s.name === systemOrName)
            : this.systems.indexOf(systemOrName);
        if (idx !== -1) {
            this.systems[idx]!.destroy?.(this);
            this.systems.splice(idx, 1);
        }
    }

    /** Get a system by name. */
    getSystem<T extends System>(name: string): T | undefined {
        return this.systems.find(s => s.name === name) as T | undefined;
    }

    // ── Update loop ────────────────────────────────────────────

    /**
     * Update all systems and clean up destroyed entities.
     */
    update(dt: number): void {
        // Sort systems by priority if needed
        if (!this.systemsSorted) {
            this.systems.sort((a, b) => a.priority - b.priority);
            this.systemsSorted = true;
        }

        // Run enabled systems
        for (const system of this.systems) {
            if (system.enabled) {
                system.update(this, dt);
            }
        }

        // Remove destroyed entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            if (this.entities[i]!.destroyed) {
                this.entities.splice(i, 1);
            }
        }
    }

    /** Remove all entities and systems. */
    clear(): void {
        for (const system of this.systems) {
            system.destroy?.(this);
        }
        this.entities.length = 0;
        this.systems.length = 0;
    }
}
