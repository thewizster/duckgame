import { Component, type ComponentClass } from './Component';

let entityIdCounter = 0;

/**
 * An entity is a unique ID with a bag of components.
 * Entities have no logic — all behaviour comes from Systems.
 *
 * ```ts
 * const player = new Entity('player');
 * player.add(new Transform(100, 200));
 * player.add(new Health(100));
 *
 * const hp = player.get(Health);
 * if (hp) hp.hp -= 25;
 * ```
 */
export class Entity {
    readonly id: number;
    readonly name: string;
    active: boolean = true;
    private components = new Map<Function, Component>();
    private _destroyed = false;

    constructor(name: string = '') {
        this.id = entityIdCounter++;
        this.name = name;
    }

    /** Add a component instance. Only one component of each class per entity. */
    add<T extends Component>(component: T): this {
        this.components.set(component.constructor, component);
        return this;
    }

    /** Get a component by its class, or undefined if not present. */
    get<T extends Component>(cls: ComponentClass<T>): T | undefined {
        return this.components.get(cls) as T | undefined;
    }

    /** Check if this entity has a component of the given class. */
    has(cls: ComponentClass): boolean {
        return this.components.has(cls);
    }

    /** Check if this entity has ALL of the given component classes. */
    hasAll(...classes: ComponentClass[]): boolean {
        return classes.every(cls => this.components.has(cls));
    }

    /** Remove a component by class. */
    remove(cls: ComponentClass): boolean {
        return this.components.delete(cls);
    }

    /** Get all components on this entity. */
    getAll(): Component[] {
        return Array.from(this.components.values());
    }

    /** Mark this entity for destruction. The World will remove it next update. */
    destroy(): void {
        this._destroyed = true;
        this.active = false;
    }

    get destroyed(): boolean {
        return this._destroyed;
    }
}
