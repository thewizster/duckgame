import type { EcsWorld } from './EcsWorld';

/**
 * A system implements game logic by operating on entities that have
 * specific components. Systems are updated each frame by the ECS World.
 *
 * ```ts
 * class GravitySystem extends System {
 *   readonly name = 'gravity';
 *   readonly priority = 10; // lower = earlier
 *
 *   update(world: EcsWorld, dt: number) {
 *     for (const entity of world.query(Velocity, Transform)) {
 *       const vel = entity.get(Velocity)!;
 *       vel.vy += 450 * dt;
 *     }
 *   }
 * }
 * ```
 */
export abstract class System {
    /** Unique name for this system. */
    abstract readonly name: string;

    /** Update priority. Lower values run first. Default 0. */
    readonly priority: number = 0;

    /** Whether this system is active. */
    enabled: boolean = true;

    /** Called once when the system is added to the world. */
    init?(world: EcsWorld): void;

    /** Called every frame. */
    abstract update(world: EcsWorld, dt: number): void;

    /** Called when the system is removed from the world. */
    destroy?(world: EcsWorld): void;
}
