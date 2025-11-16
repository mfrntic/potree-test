import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Measurement } from './Measurement.js';
import { TextSprite } from '../utils/TextSprite.js';

/**
 * Height measurement
 * Measures vertical (Y) difference between two points
 * NOTE: Y axis is up in our coordinate system (point cloud is rotated)
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
   * Get the measurement result (cached to prevent jitter)
   */
  getResult() {
    return this._getCachedResult(() => {
      if (this.points.length < 2) {
        return { deltaY: 0, height: 0, distance3D: 0 };
      }

      const p1 = this.points[0];
      const p2 = this.points[1];

      // Y is up in our coordinate system (after point cloud rotation)
      const deltaY = Math.abs(p2.y - p1.y);
      const distance3D = p1.distanceTo(p2);

      return {
        deltaY,       // Vertical difference (height)
        height: deltaY, // Alias for clarity
        distance3D,   // 3D distance between points
      };
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

      // Create vertical line (along Y axis - up direction) using Line2 for proper thickness
      const verticalStart = new THREE.Vector3(p1.x, p1.y, p1.z);
      const verticalEnd = new THREE.Vector3(p1.x, p2.y, p1.z);

      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions([
        verticalStart.x, verticalStart.y, verticalStart.z,
        verticalEnd.x, verticalEnd.y, verticalEnd.z
      ]);

      const lineMaterial = new LineMaterial({
        color: 0x00ff00,
        linewidth: 3, // in pixels
        transparent: true,
        opacity: 0.9,
      });

      // Important: LineMaterial needs resolution for proper rendering
      lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

      this.lines = new Line2(lineGeometry, lineMaterial);
      scene.add(this.lines);

      // Also draw connection line between actual points (thinner, dashed look)
      const connectionGeometry = new LineGeometry();
      connectionGeometry.setPositions([
        p1.x, p1.y, p1.z,
        p2.x, p2.y, p2.z
      ]);

      const connectionMaterial = new LineMaterial({
        color: 0xff0000, // Red for 3D distance
        linewidth: 2,
        transparent: true,
        opacity: 0.6,
        dashed: true,
        dashSize: 0.3,
        gapSize: 0.15,
      });
      connectionMaterial.resolution.set(window.innerWidth, window.innerHeight);

      const connectionLine = new Line2(connectionGeometry, connectionMaterial);
      scene.add(connectionLine);
      this.labels.push(connectionLine); // Store in labels array for cleanup

      // Add text label showing the height
      const result = this.getResult();
      const label = new TextSprite(`${result.height.toFixed(2)} m`);

      // Position label at midpoint of vertical line
      label.position.set(
        p1.x,
        (p1.y + p2.y) / 2,
        p1.z
      );

      // Fixed scale for consistent size
      label.scale.multiplyScalar(0.5);

      scene.add(label);
      this.labels.push(label);
    }
  }
}
