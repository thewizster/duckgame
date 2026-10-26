/**
 * Base class for all components. A component is a pure data container
 * attached to an entity. Systems read/write component data to implement
 * game logic.
 *
 * ```ts
 * class Health extends Component {
 *   hp = 100;
 *   maxHp = 100;
 * }
 *
 * class Velocity extends Component {
 *   vx = 0;
 *   vy = 0;
 * }
 * ```
 */
export abstract class Component {
    /** Whether this component is active (inactive components are skipped by systems) */
    enabled: boolean = true;
}

/**
 * Component class constructor type — used for type-safe component queries.
 */
export type ComponentClass<T extends Component = Component> = new (...args: never[]) => T;
