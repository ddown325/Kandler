/**
 * Kandler — 3D Transform Gizmo (Three.js native)
 * Renders proper Blender-style transform manipulators directly in the 3D scene:
 *   - Move: 3 colored axis arrows + center free-move handle
 *   - Rotate: 3 colored rings
 *   - Scale: 3 colored box handles + center uniform-scale handle
 *
 * The gizmo is rendered as Three.js objects (not HTML overlay) so it
 * respects depth, lighting, and camera orientation naturally.
 *
 * Made by Kantasu.
 */
import * as THREE from "three";

export type GizmoMode = "move" | "rotate" | "scale";

interface GizmoObjects {
  group: THREE.Group;
  arrows: THREE.Mesh[];     // 3 axis arrows (move)
  rings: THREE.Mesh[];      // 3 rotation rings (rotate)
  boxes: THREE.Mesh[];      // 3 scale boxes (scale)
  center: THREE.Mesh;       // center handle (free move / uniform scale)
  hitTargets: THREE.Object3D[]; // all pickable objects
}

const AXIS_COLORS = {
  x: 0xe08a3c,  // orange (Kandler's X axis color)
  y: 0x4caf50,  // green
  z: 0x5b9bd5,  // blue
};

export class TransformGizmo {
  private objects: GizmoObjects;
  private scene: THREE.Scene;
  private mode: GizmoMode = "move";
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private visible = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.objects = this.build();
    this.scene.add(this.objects.group);
    this.setMode("move");
    this.setVisible(false);
  }

  private build(): GizmoObjects {
    const group = new THREE.Group();
    const arrows: THREE.Mesh[] = [];
    const rings: THREE.Mesh[] = [];
    const boxes: THREE.Mesh[] = [];
    const hitTargets: THREE.Object3D[] = [];

    const axes: ("x" | "y" | "z")[] = ["x", "y", "z"];

    for (const axis of axes) {
      const color = AXIS_COLORS[axis];

      // --- Move: arrow shaft + cone tip ---
      const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
      const shaftMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.userData.axis = axis;
      shaft.userData.type = "move";

      const tipGeo = new THREE.ConeGeometry(0.08, 0.2, 12);
      const tipMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.userData.axis = axis;
      tip.userData.type = "move";

      // Position shaft and tip along the correct axis
      if (axis === "x") {
        shaft.rotation.z = -Math.PI / 2; shaft.position.x = 0.5;
        tip.rotation.z = -Math.PI / 2; tip.position.x = 1.1;
      } else if (axis === "y") {
        shaft.position.y = 0.5;
        tip.position.y = 1.1;
      } else {
        shaft.rotation.x = Math.PI / 2; shaft.position.z = 0.5;
        tip.rotation.x = Math.PI / 2; tip.position.z = 1.1;
      }

      // Invisible larger hit area for easier clicking
      const hitGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.userData.axis = axis;
      hit.userData.type = "move";
      if (axis === "x") { hit.rotation.z = -Math.PI / 2; hit.position.x = 0.6; }
      else if (axis === "y") { hit.position.y = 0.6; }
      else { hit.rotation.x = Math.PI / 2; hit.position.z = 0.6; }

      const arrowGroup = new THREE.Group();
      arrowGroup.add(shaft, tip, hit);
      arrowGroup.userData.axis = axis;
      group.add(arrowGroup);
      arrows.push(shaft);
      hitTargets.push(hit);

      // --- Rotate: torus ring ---
      const ringGeo = new THREE.TorusGeometry(0.8, 0.025, 8, 48);
      const ringMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.userData.axis = axis;
      ring.userData.type = "rotate";
      if (axis === "x") ring.rotation.y = Math.PI / 2;
      else if (axis === "y") ring.rotation.x = Math.PI / 2;
      // z is default orientation

      // Invisible hit torus (thicker)
      const ringHitGeo = new THREE.TorusGeometry(0.8, 0.1, 6, 32);
      const ringHitMat = new THREE.MeshBasicMaterial({ visible: false });
      const ringHit = new THREE.Mesh(ringHitGeo, ringHitMat);
      ringHit.userData.axis = axis;
      ringHit.userData.type = "rotate";
      if (axis === "x") ringHit.rotation.y = Math.PI / 2;
      else if (axis === "y") ringHit.rotation.x = Math.PI / 2;

      group.add(ring, ringHit);
      rings.push(ring);
      hitTargets.push(ringHit);

      // --- Scale: small box at end of axis ---
      const boxGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const boxMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.userData.axis = axis;
      box.userData.type = "scale";
      if (axis === "x") box.position.x = 1.0;
      else if (axis === "y") box.position.y = 1.0;
      else box.position.z = 1.0;

      // Scale axis line (thin)
      const scaleLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        axis === "x" ? new THREE.Vector3(1, 0, 0) : axis === "y" ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1),
      ]);
      const scaleLineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5, depthTest: false });
      const scaleLine = new THREE.Line(scaleLineGeo, scaleLineMat);
      scaleLine.userData.axis = axis;
      scaleLine.userData.type = "scale";

      // Invisible hit for scale
      const scaleHitGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
      const scaleHitMat = new THREE.MeshBasicMaterial({ visible: false });
      const scaleHit = new THREE.Mesh(scaleHitGeo, scaleHitMat);
      scaleHit.userData.axis = axis;
      scaleHit.userData.type = "scale";
      if (axis === "x") scaleHit.position.x = 1.0;
      else if (axis === "y") scaleHit.position.y = 1.0;
      else scaleHit.position.z = 1.0;

      group.add(box, scaleLine, scaleHit);
      boxes.push(box);
      hitTargets.push(scaleHit);
    }

    // --- Center handle (free move / uniform scale) ---
    const centerGeo = new THREE.SphereGeometry(0.1, 16, 12);
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.8 });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.userData.axis = "free";
    center.userData.type = "center";
    group.add(center);
    hitTargets.push(center);

    // Render on top
    group.renderOrder = 999;

    return { group, arrows, rings, boxes, center, hitTargets };
  }

  setMode(mode: GizmoMode) {
    this.mode = mode;
    // Show/hide based on mode
    this.objects.arrows.forEach(a => a.visible = mode === "move");
    this.objects.rings.forEach(r => r.visible = mode === "rotate");
    this.objects.boxes.forEach(b => b.visible = mode === "scale");
    this.objects.center.visible = true;
    // Also show/hide the hit targets
    for (const target of this.objects.hitTargets) {
      const type = target.userData.type;
      if (type === "move") target.visible = mode === "move";
      else if (type === "rotate") target.visible = mode === "rotate";
      else if (type === "scale") target.visible = mode === "scale";
    }
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.objects.group.visible = visible;
  }

  setPosition(pos: THREE.Vector3) {
    this.targetPosition.copy(pos);
    this.objects.group.position.copy(pos);
  }

  /** Raycast against gizmo hit targets. Returns { axis, type } or null. */
  pick(raycaster: THREE.Raycaster): { axis: string; type: string } | null {
    if (!this.visible) return null;
    const hits = raycaster.intersectObjects(this.objects.hitTargets, false);
    if (hits.length === 0) return null;
    const hit = hits[0];
    return { axis: hit.object.userData.axis, type: hit.object.userData.type };
  }

  getHitTargets(): THREE.Object3D[] {
    return this.objects.hitTargets;
  }

  dispose() {
    this.scene.remove(this.objects.group);
    this.objects.group.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) obj.material.dispose();
      }
    });
  }
}
