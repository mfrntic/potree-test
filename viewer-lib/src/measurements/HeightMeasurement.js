import * as THREE from 'three';
import { Measurement } from './Measurement.js';

/**
 * Height measurement
 * Measures vertical (Z) difference between two points
 */
export class HeightMeasurement extends Measurement {
  constructor(id) {
    super('height', id);
    this.maxPoints = 2; // Height measurement requires exactly 2 points
  }

  /**
   * Add a point to the measurement
   * @param {THREE.Vector3} point - 3D point
   */
  addPoint(point) {
    if (this.points.length >= this.maxPoints) {
      console.warn('Height measurement already has 2 points');
      return;
    }

    this.points.push(point.clone());
    this.update();

    // Auto-finish when 2 points are added
    if (this.points.length === this.maxPoints) {
      this.finish();
    }
  }

  /**
   * Update the measurement visualization
   */
  update() {
    // Visualization update handled in createVisuals
  }

  /**
   * Get the measurement result
   */
  getResult() {
    if (this.points.length < 2) {
      return { deltaZ: 0, distance3D: 0 };
    }

    const p1 = this.points[0];
    const p2 = this.points[1];

    const deltaZ = Math.abs(p2.z - p1.z);
    const distance3D = p1.distanceTo(p2);

    return {
      deltaZ,
      distance3D,
    };
  }

  /**
   * Create visual representation in the scene
   * @param {THREE.Scene} scene - Three.js scene
   */
  createVisuals(scene) {
    // Clear existing visuals
    this.clear(scene);

    if (this.points.length === 0) return;

    // Create sphere markers for each point
    const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    for (const point of this.points) {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(point);
      scene.add(marker);
      this.markers.push(marker);
    }

    // If we have 2 points, draw vertical line showing height difference
    if (this.points.length === 2) {
      const p1 = this.points[0];
      const p2 = this.points[1];

      // Create vertical line from p1 to p2 (projected vertically)
      const verticalPoints = [
        new THREE.Vector3(p1.x, p1.y, p1.z),
        new THREE.Vector3(p1.x, p1.y, p2.z)
      ];

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(verticalPoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 2,
        dashSize: 0.1,
        gapSize: 0.05,
      });
      lineMaterial.transparent = true;
      lineMaterial.opacity = 0.8;

      this.lines = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(this.lines);

      // Also draw connection line between actual points
      const connectionGeometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const connectionMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 1,
        transparent: true,
        opacity: 0.5,
      });
      const connectionLine = new THREE.Line(connectionGeometry, connectionMaterial);
      scene.add(connectionLine);
      this.labels.push(connectionLine); // Store in labels array for cleanup
    }
  }
}
