import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Measurement } from './Measurement.js';
import { TextSprite } from '../utils/TextSprite.js';

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
   * Get the measurement result (cached to prevent jitter)
   */
  getResult() {
    return this._getCachedResult(() => {
      if (this.points.length < 2) {
        return { distanceTotal: 0 };
      }

      let totalDistance = 0;
      for (let i = 0; i < this.points.length - 1; i++) {
        totalDistance += this.points[i].distanceTo(this.points[i + 1]);
      }

      return { distanceTotal: totalDistance };
    });
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
    const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    for (const point of this.points) {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(point);
      scene.add(marker);
      this.markers.push(marker);
    }

    // Create lines connecting the points using Line2 for proper thickness
    if (this.points.length >= 2) {
      // Flatten points array for LineGeometry
      const positions = [];
      for (const point of this.points) {
        positions.push(point.x, point.y, point.z);
      }

      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions(positions);

      const lineMaterial = new LineMaterial({
        color: 0xff0000,
        linewidth: 3,
        transparent: true,
        opacity: 0.9,
      });
      lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

      this.lines = new Line2(lineGeometry, lineMaterial);
      scene.add(this.lines);

      // Add labels for each segment
      for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i + 1];
        const distance = p1.distanceTo(p2);

        // Create label at midpoint
        const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const label = new TextSprite(`${distance.toFixed(2)} m`);
        label.position.copy(midpoint);

        // Fixed scale for consistent size
        label.scale.multiplyScalar(0.5);

        scene.add(label);
        this.labels.push(label);
      }

      // Add total distance label at the end
      if (this.finished && this.points.length > 2) {
        const result = this.getResult();
        const lastPoint = this.points[this.points.length - 1];

        const totalLabel = new TextSprite(`Total: ${result.distanceTotal.toFixed(2)} m`);
        totalLabel.position.set(
          lastPoint.x,
          lastPoint.y + 0.5,
          lastPoint.z
        );
        totalLabel.backgroundColor = 'rgba(255, 0, 0, 0.8)';

        // Fixed scale for consistent size
        totalLabel.scale.multiplyScalar(0.6);

        scene.add(totalLabel);
        this.labels.push(totalLabel);
      }
    }
  }
}
