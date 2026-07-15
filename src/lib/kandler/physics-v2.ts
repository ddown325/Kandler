// Kandler Physics Engine — rigid body, cloth, soft body, fluid, particles, collision.
import * as THREE from "three";

export interface RigidBody {
  id: string;
  mass: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  linearVelocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  force: THREE.Vector3;
  torque: THREE.Vector3;
  friction: number;
  restitution: number;
  isStatic: boolean;
  colliderType: "box" | "sphere" | "mesh";
  colliderSize: THREE.Vector3;
}

export class PhysicsWorld {
  bodies: Map<string, RigidBody> = new Map();
  gravity = new THREE.Vector3(0, -9.81, 0);
  fixedTimeStep = 1 / 60;
  maxSubSteps = 4;

  addBody(body: RigidBody): void {
    this.bodies.set(body.id, body);
  }

  removeBody(id: string): void {
    this.bodies.delete(id);
  }

  step(dt: number): void {
    const steps = Math.min(this.maxSubSteps, Math.ceil(dt / this.fixedTimeStep));
    const stepDt = dt / steps;
    for (let s = 0; s < steps; s++) {
      this.subStep(stepDt);
    }
  }

  private subStep(dt: number): void {
    for (const body of this.bodies.values()) {
      if (body.isStatic) continue;
      body.force.add(this.gravity.clone().multiplyScalar(body.mass));
      const accel = body.force.clone().divideScalar(body.mass);
      body.linearVelocity.add(accel.multiplyScalar(dt));
      body.linearVelocity.multiplyScalar(0.99);
      body.position.add(body.linearVelocity.clone().multiplyScalar(dt));
      const dq = new THREE.Quaternion(
        body.angularVelocity.x * dt * 0.5,
        body.angularVelocity.y * dt * 0.5,
        body.angularVelocity.z * dt * 0.5,
        0,
      );
      body.rotation.multiply(dq).normalize();
      body.force.set(0, 0, 0);
      body.torque.set(0, 0, 0);
      if (body.position.y < 0) {
        body.position.y = 0;
        body.linearVelocity.y *= -body.restitution;
      }
    }
    this.detectCollisions();
  }

  private detectCollisions(): void {
    const bodyList = Array.from(this.bodies.values());
    for (let i = 0; i < bodyList.length; i++) {
      for (let j = i + 1; j < bodyList.length; j++) {
        const a = bodyList[i];
        const b = bodyList[j];
        if (a.isStatic && b.isStatic) continue;
        if (a.colliderType === "sphere" && b.colliderType === "sphere") {
          const dist = a.position.distanceTo(b.position);
          const sumRadii = a.colliderSize.x + b.colliderSize.x;
          if (dist < sumRadii) {
            const normal = b.position.clone().sub(a.position).normalize();
            const overlap = sumRadii - dist;
            if (!a.isStatic) a.position.sub(normal.clone().multiplyScalar(overlap * 0.5));
            if (!b.isStatic) b.position.add(normal.clone().multiplyScalar(overlap * 0.5));
            const relVel = b.linearVelocity.clone().sub(a.linearVelocity);
            const velAlongNormal = relVel.dot(normal);
            if (velAlongNormal > 0) continue;
            const restitution = Math.min(a.restitution, b.restitution);
            const j = -(1 + restitution) * velAlongNormal / ((a.isStatic ? 0 : 1 / a.mass) + (b.isStatic ? 0 : 1 / b.mass));
            const impulse = normal.clone().multiplyScalar(j);
            if (!a.isStatic) a.linearVelocity.sub(impulse.clone().divideScalar(a.mass));
            if (!b.isStatic) b.linearVelocity.add(impulse.clone().divideScalar(b.mass));
          }
        }
      }
    }
  }

  applyForce(id: string, force: THREE.Vector3): void {
    const body = this.bodies.get(id);
    if (body) body.force.add(force);
  }

  applyImpulse(id: string, impulse: THREE.Vector3): void {
    const body = this.bodies.get(id);
    if (body && !body.isStatic) {
      body.linearVelocity.add(impulse.clone().divideScalar(body.mass));
    }
  }

  raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDist: number = 1000): { body: RigidBody; point: THREE.Vector3; dist: number } | null {
    let closest: { body: RigidBody; point: THREE.Vector3; dist: number } | null = null;
    const ray = new THREE.Ray(origin, direction.clone().normalize());
    for (const body of this.bodies.values()) {
      if (body.colliderType === "sphere") {
        const sphere = new THREE.Sphere(body.position, body.colliderSize.x);
        const point = new THREE.Vector3();
        if (ray.intersectSphere(sphere, point)) {
          const dist = origin.distanceTo(point);
          if (dist < maxDist && (!closest || dist < closest.dist)) {
            closest = { body, point, dist };
          }
        }
      } else if (body.colliderType === "box") {
        const box = new THREE.Box3(
          body.position.clone().sub(body.colliderSize.clone().multiplyScalar(0.5)),
          body.position.clone().add(body.colliderSize.clone().multiplyScalar(0.5)),
        );
        const point = new THREE.Vector3();
        if (ray.intersectBox(box, point)) {
          const dist = origin.distanceTo(point);
          if (dist < maxDist && (!closest || dist < closest.dist)) {
            closest = { body, point, dist };
          }
        }
      }
    }
    return closest;
  }
}

export interface ClothParticle {
  position: THREE.Vector3;
  oldPosition: THREE.Vector3;
  acceleration: THREE.Vector3;
  mass: number;
  pinned: boolean;
}

export interface ClothConstraint {
  a: number;
  b: number;
  restLength: number;
  stiffness: number;
}

export class ClothSimulation {
  particles: ClothParticle[] = [];
  constraints: ClothConstraint[] = [];
  gravity = new THREE.Vector3(0, -9.81, 0);
  wind = new THREE.Vector3(0, 0, 0);
  damping = 0.99;
  solverIterations = 5;

  init(width: number, height: number, spacing: number, origin: THREE.Vector3, mass: number = 1): void {
    this.particles = [];
    this.constraints = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = new THREE.Vector3(origin.x + x * spacing, origin.y, origin.z + y * spacing);
        this.particles.push({
          position: pos.clone(),
          oldPosition: pos.clone(),
          acceleration: new THREE.Vector3(),
          mass,
          pinned: false,
        });
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (x < width - 1) this.constraints.push({ a: i, b: i + 1, restLength: spacing, stiffness: 1 });
        if (y < height - 1) this.constraints.push({ a: i, b: i + width, restLength: spacing, stiffness: 1 });
        if (x < width - 1 && y < height - 1) {
          this.constraints.push({ a: i, b: i + width + 1, restLength: spacing * Math.SQRT2, stiffness: 0.5 });
          this.constraints.push({ a: i + 1, b: i + width, restLength: spacing * Math.SQRT2, stiffness: 0.5 });
        }
      }
    }
  }

  pin(index: number): void {
    if (this.particles[index]) this.particles[index].pinned = true;
  }

  pinTopRow(width: number): void {
    for (let x = 0; x < width; x++) this.pin(x);
  }

  step(dt: number): void {
    for (const p of this.particles) {
      if (p.pinned) continue;
      const temp = p.position.clone();
      const velocity = p.position.clone().sub(p.oldPosition).multiplyScalar(this.damping);
      p.position.add(velocity).add(p.acceleration.clone().multiplyScalar(dt * dt));
      p.position.add(this.gravity.clone().multiplyScalar(dt * dt));
      p.position.add(this.wind.clone().multiplyScalar(dt * dt));
      p.oldPosition.copy(temp);
      p.acceleration.set(0, 0, 0);
    }
    for (let iter = 0; iter < this.solverIterations; iter++) {
      for (const c of this.constraints) {
        const pa = this.particles[c.a];
        const pb = this.particles[c.b];
        const delta = pb.position.clone().sub(pa.position);
        const dist = delta.length();
        if (dist < 0.0001) continue;
        const diff = (dist - c.restLength) / dist;
        const offset = delta.multiplyScalar(0.5 * diff * c.stiffness);
        if (!pa.pinned) pa.position.add(offset);
        if (!pb.pinned) pb.position.sub(offset);
      }
      for (const p of this.particles) {
        if (p.pinned) continue;
        if (p.position.y < 0) p.position.y = 0;
      }
    }
  }

  toGeometry(width: number, height: number): THREE.BufferGeometry {
    const positions: number[] = [];
    const indices: number[] = [];
    for (const p of this.particles) {
      positions.push(p.position.x, p.position.y, p.position.z);
    }
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const i = y * width + x;
        indices.push(i, i + 1, i + width);
        indices.push(i + 1, i + width + 1, i + width);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }
}

export interface SoftBodyNode {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  force: THREE.Vector3;
  mass: number;
  pinned: boolean;
}

export interface SoftBodySpring {
  a: number;
  b: number;
  restLength: number;
  stiffness: number;
  damping: number;
}

export class SoftBodySimulation {
  nodes: SoftBodyNode[] = [];
  springs: SoftBodySpring[] = [];
  gravity = new THREE.Vector3(0, -9.81, 0);
  damping = 0.98;

  initFromGeometry(geo: THREE.BufferGeometry, stiffness: number = 0.5, damping: number = 0.1, mass: number = 1): void {
    const pos = geo.attributes.position;
    this.nodes = [];
    for (let i = 0; i < pos.count; i++) {
      this.nodes.push({
        position: new THREE.Vector3().fromBufferAttribute(pos, i),
        velocity: new THREE.Vector3(),
        force: new THREE.Vector3(),
        mass,
        pinned: false,
      });
    }
    this.springs = [];
    const indices = geo.index ? geo.index.array : null;
    const edgeSet = new Set<string>();
    const addSpring = (a: number, b: number) => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (edgeSet.has(key)) return;
      edgeSet.add(key);
      this.springs.push({
        a, b,
        restLength: this.nodes[a].position.distanceTo(this.nodes[b].position),
        stiffness,
        damping,
      });
    };
    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        addSpring(indices[i], indices[i + 1]);
        addSpring(indices[i + 1], indices[i + 2]);
        addSpring(indices[i + 2], indices[i]);
      }
    } else {
      for (let i = 0; i < pos.count; i += 3) {
        addSpring(i, i + 1);
        addSpring(i + 1, i + 2);
        addSpring(i + 2, i);
      }
    }
  }

  step(dt: number): void {
    for (const node of this.nodes) {
      node.force.set(0, 0, 0);
      if (!node.pinned) node.force.add(this.gravity.clone().multiplyScalar(node.mass));
    }
    for (const spring of this.springs) {
      const na = this.nodes[spring.a];
      const nb = this.nodes[spring.b];
      const delta = nb.position.clone().sub(na.position);
      const dist = delta.length();
      if (dist < 0.0001) continue;
      const dir = delta.normalize();
      const springForce = (dist - spring.restLength) * spring.stiffness;
      const relVel = nb.velocity.clone().sub(na.velocity);
      const dampForce = relVel.dot(dir) * spring.damping;
      const totalForce = dir.multiplyScalar(springForce + dampForce);
      na.force.add(totalForce);
      nb.force.sub(totalForce);
    }
    for (const node of this.nodes) {
      if (node.pinned) continue;
      const accel = node.force.clone().divideScalar(node.mass);
      node.velocity.add(accel.multiplyScalar(dt));
      node.velocity.multiplyScalar(this.damping);
      node.position.add(node.velocity.clone().multiplyScalar(dt));
      if (node.position.y < 0) {
        node.position.y = 0;
        node.velocity.y = -node.velocity.y * 0.5;
      }
    }
  }

  applyToGeometry(geo: THREE.BufferGeometry): void {
    const pos = geo.attributes.position;
    const positions = pos.array as Float32Array;
    for (let i = 0; i < this.nodes.length && i < pos.count; i++) {
      positions[i * 3] = this.nodes[i].position.x;
      positions[i * 3 + 1] = this.nodes[i].position.y;
      positions[i * 3 + 2] = this.nodes[i].position.z;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
}

export interface FluidParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  density: number;
  pressure: number;
  force: THREE.Vector3;
  mass: number;
  color: THREE.Color;
}

export class FluidSimulation {
  particles: FluidParticle[] = [];
  gravity = new THREE.Vector3(0, -9.81, 0);
  restDensity = 1000;
  gasConstant = 2000;
  viscosity = 0.1;
  h = 0.1;
  bounds: { min: THREE.Vector3; max: THREE.Vector3 };

  constructor(bounds?: { min: THREE.Vector3; max: THREE.Vector3 }) {
    this.bounds = bounds ?? { min: new THREE.Vector3(-5, 0, -5), max: new THREE.Vector3(5, 10, 5) };
  }

  spawn(position: THREE.Vector3, velocity: THREE.Vector3, color?: THREE.Color): void {
    this.particles.push({
      position: position.clone(),
      velocity: velocity.clone(),
      density: 0,
      pressure: 0,
      force: new THREE.Vector3(),
      mass: 0.02,
      color: color ?? new THREE.Color(0.2, 0.5, 0.9),
    });
  }

  spawnCube(origin: THREE.Vector3, size: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const pos = new THREE.Vector3(
        origin.x + Math.random() * size,
        origin.y + Math.random() * size,
        origin.z + Math.random() * size,
      );
      this.spawn(pos, new THREE.Vector3());
    }
  }

  step(dt: number): void {
    this.computeDensityAndPressure();
    this.computeForces();
    this.integrate(dt);
    this.handleBoundaries();
  }

  private computeDensityAndPressure(): void {
    for (const pi of this.particles) {
      pi.density = 0;
      for (const pj of this.particles) {
        const dist = pi.position.distanceTo(pj.position);
        if (dist < this.h) {
          const q = 1 - dist / this.h;
          pi.density += pj.mass * (315 / (64 * Math.PI * Math.pow(this.h, 9))) * q * q * q;
        }
      }
      pi.pressure = this.gasConstant * (pi.density - this.restDensity);
    }
  }

  private computeForces(): void {
    for (const pi of this.particles) {
      pi.force.set(0, 0, 0);
      pi.force.add(this.gravity.clone().multiplyScalar(pi.mass));
      for (const pj of this.particles) {
        if (pi === pj) continue;
        const dist = pi.position.distanceTo(pj.position);
        if (dist < this.h && dist > 0.0001) {
          const dir = pi.position.clone().sub(pj.position).normalize();
          const q = 1 - dist / this.h;
          const pressureForce = dir.multiplyScalar(
            -pj.mass * (pi.pressure + pj.pressure) / (2 * pj.density) *
            (45 / (Math.PI * Math.pow(this.h, 6))) * q * q,
          );
          pi.force.add(pressureForce);
          const viscosityForce = pj.velocity.clone().sub(pi.velocity).multiplyScalar(
            this.viscosity * pj.mass / pj.density *
            (45 / (Math.PI * Math.pow(this.h, 6))) * q,
          );
          pi.force.add(viscosityForce);
        }
      }
    }
  }

  private integrate(dt: number): void {
    for (const p of this.particles) {
      const accel = p.force.clone().divideScalar(p.density || 1);
      p.velocity.add(accel.multiplyScalar(dt));
      p.position.add(p.velocity.clone().multiplyScalar(dt));
    }
  }

  private handleBoundaries(): void {
    for (const p of this.particles) {
      if (p.position.x < this.bounds.min.x) { p.position.x = this.bounds.min.x; p.velocity.x *= -0.5; }
      if (p.position.x > this.bounds.max.x) { p.position.x = this.bounds.max.x; p.velocity.x *= -0.5; }
      if (p.position.y < this.bounds.min.y) { p.position.y = this.bounds.min.y; p.velocity.y *= -0.5; }
      if (p.position.y > this.bounds.max.y) { p.position.y = this.bounds.max.y; p.velocity.y *= -0.5; }
      if (p.position.z < this.bounds.min.z) { p.position.z = this.bounds.min.z; p.velocity.z *= -0.5; }
      if (p.position.z > this.bounds.max.z) { p.position.z = this.bounds.max.z; p.velocity.z *= -0.5; }
    }
  }

  toPoints(): THREE.Points {
    const positions: number[] = [];
    const colors: number[] = [];
    for (const p of this.particles) {
      positions.push(p.position.x, p.position.y, p.position.z);
      colors.push(p.color.r, p.color.g, p.color.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true });
    return new THREE.Points(geo, mat);
  }
}

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  active: boolean;
}

export class ParticleEmitter {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  spread: number = 0.1;
  rate: number = 100;
  speed: number = 5;
  life: number = 2;
  size: number = 0.1;
  mass: number = 1;
  color: THREE.Color;
  gravity: THREE.Vector3 = new THREE.Vector3(0, -9.81, 0);
  drag: number = 0.01;
  particles: Particle[] = [];
  maxParticles: number;
  accumulator: number = 0;

  constructor(position: THREE.Vector3 = new THREE.Vector3(), maxParticles: number = 1000) {
    this.position = position;
    this.direction = new THREE.Vector3(0, 1, 0);
    this.color = new THREE.Color(1, 1, 1);
    this.maxParticles = maxParticles;
  }

  emit(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        const idx = this.particles.findIndex(p => !p.active);
        if (idx === -1) return;
        this.particles.splice(idx, 1);
      }
      const pos = this.position.clone();
      pos.x += (Math.random() - 0.5) * this.spread;
      pos.y += (Math.random() - 0.5) * this.spread;
      pos.z += (Math.random() - 0.5) * this.spread;
      const dir = this.direction.clone();
      dir.x += (Math.random() - 0.5) * this.spread;
      dir.y += (Math.random() - 0.5) * this.spread;
      dir.z += (Math.random() - 0.5) * this.spread;
      dir.normalize();
      const vel = dir.multiplyScalar(this.speed + (Math.random() - 0.5) * this.speed * 0.5);
      const life = this.life + (Math.random() - 0.5) * this.life * 0.5;
      this.particles.push({
        position: pos,
        velocity: vel,
        life,
        maxLife: life,
        size: this.size + (Math.random() - 0.5) * this.size * 0.5,
        color: this.color.clone(),
        active: true,
      });
    }
  }

  step(dt: number): void {
    this.accumulator += dt * this.rate;
    while (this.accumulator >= 1) {
      this.emit(1);
      this.accumulator -= 1;
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.velocity.add(this.gravity.clone().multiplyScalar(dt));
      p.velocity.multiplyScalar(1 - this.drag * dt);
      p.position.add(p.velocity.clone().multiplyScalar(dt));
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this.particles.splice(i, 1);
      }
    }
  }

  toPoints(): THREE.Points {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    for (const p of this.particles) {
      if (!p.active) continue;
      positions.push(p.position.x, p.position.y, p.position.z);
      const lf = p.life / p.maxLife;
      colors.push(p.color.r * lf, p.color.g * lf, p.color.b * lf);
      sizes.push(p.size * lf);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({
      size: 0.1, vertexColors: true, transparent: true, opacity: 0.8,
      sizeAttenuation: true, blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }

  clear(): void {
    this.particles = [];
  }
}

export function sphereSphereCollision(
  cA: THREE.Vector3, rA: number, cB: THREE.Vector3, rB: number,
): { collision: boolean; normal: THREE.Vector3; depth: number } {
  const delta = cB.clone().sub(cA);
  const dist = delta.length();
  const sumRadii = rA + rB;
  if (dist >= sumRadii) return { collision: false, normal: new THREE.Vector3(), depth: 0 };
  const normal = dist > 0.0001 ? delta.normalize() : new THREE.Vector3(0, 1, 0);
  return { collision: true, normal, depth: sumRadii - dist };
}

export function raySphereIntersect(
  o: THREE.Vector3, d: THREE.Vector3, c: THREE.Vector3, r: number,
): number | null {
  const oc = o.clone().sub(c);
  const a = d.dot(d);
  const b = 2 * oc.dot(d);
  const cc = oc.dot(oc) - r * r;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 ? t : null;
}

export function rayBoxIntersect(
  o: THREE.Vector3, d: THREE.Vector3, min: THREE.Vector3, max: THREE.Vector3,
): number | null {
  let tmin = -Infinity, tmax = Infinity;
  for (let i = 0; i < 3; i++) {
    const oo = [o.x, o.y, o.z][i];
    const dd = [d.x, d.y, d.z][i];
    const mn = [min.x, min.y, min.z][i];
    const mx = [max.x, max.y, max.z][i];
    if (Math.abs(dd) < 0.0001) {
      if (oo < mn || oo > mx) return null;
    } else {
      const t1 = (mn - oo) / dd;
      const t2 = (mx - oo) / dd;
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    }
  }
  return tmax >= tmin ? (tmin >= 0 ? tmin : tmax >= 0 ? tmax : null) : null;
}

export function rayTriangleIntersect(
  o: THREE.Vector3, d: THREE.Vector3,
  v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3,
): number | null {
  const e1 = v1.clone().sub(v0);
  const e2 = v2.clone().sub(v0);
  const h = d.clone().cross(e2);
  const a = e1.dot(h);
  if (Math.abs(a) < 0.0001) return null;
  const f = 1 / a;
  const s = o.clone().sub(v0);
  const u = f * s.dot(h);
  if (u < 0 || u > 1) return null;
  const q = s.cross(e1);
  const v = f * d.dot(q);
  if (v < 0 || u + v > 1) return null;
  const t = f * e2.dot(q);
  return t >= 0 ? t : null;
}

export function rayMeshIntersect(
  o: THREE.Vector3, d: THREE.Vector3, geo: THREE.BufferGeometry,
): { distance: number; faceIndex: number; point: THREE.Vector3 } | null {
  const pos = geo.attributes.position;
  const indices = geo.index ? geo.index.array : null;
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  let closest: { distance: number; faceIndex: number; point: THREE.Vector3 } | null = null;
  const count = indices ? indices.length : pos.count;
  for (let i = 0, f = 0; i < count; i += 3, f++) {
    if (indices) {
      v0.fromBufferAttribute(pos, indices[i]);
      v1.fromBufferAttribute(pos, indices[i + 1]);
      v2.fromBufferAttribute(pos, indices[i + 2]);
    } else {
      v0.fromBufferAttribute(pos, i);
      v1.fromBufferAttribute(pos, i + 1);
      v2.fromBufferAttribute(pos, i + 2);
    }
    const t = rayTriangleIntersect(o, d, v0, v1, v2);
    if (t !== null && (!closest || t < closest.distance)) {
      const point = o.clone().add(d.clone().multiplyScalar(t));
      closest = { distance: t, faceIndex: f, point };
    }
  }
  return closest;
}

export class OceanSimulation {
  size: number;
  resolution: number;
  windDirection: THREE.Vector2;
  windSpeed: number;
  amplitude: number;
  time: number = 0;
  heights: Float32Array;
  normals: Float32Array;

  constructor(size: number = 100, resolution: number = 64) {
    this.size = size;
    this.resolution = resolution;
    this.windDirection = new THREE.Vector2(1, 0).normalize();
    this.windSpeed = 10;
    this.amplitude = 0.5;
    this.heights = new Float32Array(resolution * resolution);
    this.normals = new Float32Array(resolution * resolution * 3);
  }

  step(dt: number): void {
    this.time += dt;
    this.computeHeights();
    this.computeNormals();
  }

  private computeHeights(): void {
    const N = this.resolution;
    const size = this.size;
    const kScale = (2 * Math.PI) / size;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let h = 0;
        for (let m = 0; m < 8; m++) {
          const kx = kScale * m;
          const kz = kScale * m;
          const k = Math.sqrt(kx * kx + kz * kz);
          if (k < 0.001) continue;
          const omega = Math.sqrt(9.81 * k);
          const phase = kx * (x - N / 2) + kz * (y - N / 2) - omega * this.time;
          const Phillips = this.phillipsSpectrum(kx, kz, k);
          h += Math.cos(phase) * Math.sqrt(Phillips) * 2;
        }
        this.heights[y * N + x] = h * this.amplitude;
      }
    }
  }

  private phillipsSpectrum(kx: number, kz: number, k: number): number {
    const L = (this.windSpeed * this.windSpeed) / 9.81;
    const kDotW = kx * this.windDirection.x + kz * this.windDirection.y;
    const kDotW2 = kDotW * kDotW;
    if (kDotW2 < 0.0001) return 0;
    return Math.exp(-1 / (k * k * L * L)) / (k * k * k * k) * kDotW2;
  }

  private computeNormals(): void {
    const N = this.resolution;
    const spacing = this.size / N;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const idx = y * N + x;
        const hL = x > 0 ? this.heights[y * N + x - 1] : this.heights[idx];
        const hR = x < N - 1 ? this.heights[y * N + x + 1] : this.heights[idx];
        const hD = y > 0 ? this.heights[(y - 1) * N + x] : this.heights[idx];
        const hU = y < N - 1 ? this.heights[(y + 1) * N + x] : this.heights[idx];
        this.normals[idx * 3] = (hL - hR) / spacing;
        this.normals[idx * 3 + 1] = 2.0;
        this.normals[idx * 3 + 2] = (hD - hU) / spacing;
        const len = Math.sqrt(this.normals[idx * 3] ** 2 + 1 + this.normals[idx * 3 + 2] ** 2);
        this.normals[idx * 3] /= len;
        this.normals[idx * 3 + 1] /= len;
        this.normals[idx * 3 + 2] /= len;
      }
    }
  }

  toGeometry(): THREE.BufferGeometry {
    const N = this.resolution;
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const halfSize = this.size / 2;
    const spacing = this.size / N;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        positions.push(-halfSize + x * spacing, this.heights[y * N + x], -halfSize + y * spacing);
        normals.push(this.normals[(y * N + x) * 3], this.normals[(y * N + x) * 3 + 1], this.normals[(y * N + x) * 3 + 2]);
        uvs.push(x / N, y / N);
      }
    }
    for (let y = 0; y < N - 1; y++) {
      for (let x = 0; x < N - 1; x++) {
        const i = y * N + x;
        indices.push(i, i + N, i + 1);
        indices.push(i + 1, i + N, i + N + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }
}
