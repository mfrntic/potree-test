import * as THREE from 'three';
import { Measurement } from './Measurement.js';

/**
 * Distance measurement (polyline)
 * Measures total distance along connected points
 */
export class DistanceMeasurement extends Measurement {
  constructor(id) {
    super('distance', id);
  }

  /**
   * Update the measurement visualization
   */
  update() {
    // This is a simplified implementation
    // In a full implementation, you would create visual markers and lines
  }

  /**
   * Get the measurement result
   */
  getResult() {
    if (this.points.length < 2) {
      return { distanceTotal: 0 };
    }

    let totalDistance = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      totalDistance += this.points[i].distanceTo(this.points[i + 1]);
    }

    return { distanceTotal: totalDistance };
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
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    for (const point of this.points) {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(point);
      scene.add(marker);
      this.markers.push(marker);
    }

    // Create lines connecting the points
    if (this.points.length >= 2) {
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(this.points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
      });
      this.lines = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(this.lines);
    }
  }
}
