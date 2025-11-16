import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Measurement } from './Measurement.js';
import { TextSprite } from '../utils/TextSprite.js';

/**
 * Angle measurement
 * Measures angle between three points (vertex at second point)
 */
export class AngleMeasurement extends Measurement {
  constructor(id) {
    super('angle', id);
    this.maxPoints = 3; // Angle measurement requires exactly 3 points
  }

  /**
   * Add a point to the measurement
   * @param {THREE.Vector3} point - 3D point
   */
  addPoint(point) {
    if (this.points.length >= this.maxPoints) {
      console.warn('Angle measurement already has 3 points');
      return;
    }

    this.points.push(point.clone());
    this.update();

    // Auto-finish when 3 points are added
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
      if (this.points.length < 3) {
        return { angleDegrees: 0, angleRadians: 0 };
      }

      const p1 = this.points[0]; // First point
      const p2 = this.points[1]; // Vertex (middle point)
      const p3 = this.points[2]; // Third point

      // Create vectors from vertex to the two other points
      const v1 = new THREE.Vector3().subVectors(p1, p2);
      const v2 = new THREE.Vector3().subVectors(p3, p2);

      // Calculate angle using dot product
      const angleRadians = v1.angleTo(v2);
      const angleDegrees = THREE.MathUtils.radToDeg(angleRadians);

      return {
        angleDegrees,
        angleRadians,
        vertex: p2.clone(),
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
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(point);
      scene.add(marker);
      this.markers.push(marker);

      // Make the vertex (middle point) slightly larger
      if (i === 1 && this.points.length >= 2) {
        marker.scale.set(1.5, 1.5, 1.5);
      }
    }

    // Draw lines connecting the points using Line2
    if (this.points.length >= 2) {
      // Line from p1 to vertex (p2)
      const line1Geometry = new LineGeometry();
      line1Geometry.setPositions([
        this.points[0].x, this.points[0].y, this.points[0].z,
        this.points[1].x, this.points[1].y, this.points[1].z
      ]);

      const lineMaterial = new LineMaterial({
        color: 0xffaa00,
        linewidth: 3,
        transparent: true,
        opacity: 0.9,
      });
      lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

      const line1 = new Line2(line1Geometry, lineMaterial);
      scene.add(line1);
      this.lines = line1;

      if (this.points.length === 3) {
        // Line from vertex (p2) to p3
        const line2Geometry = new LineGeometry();
        line2Geometry.setPositions([
          this.points[1].x, this.points[1].y, this.points[1].z,
          this.points[2].x, this.points[2].y, this.points[2].z
        ]);

        const line2Material = new LineMaterial({
          color: 0xffaa00,
          linewidth: 3,
          transparent: true,
          opacity: 0.9,
        });
        line2Material.resolution.set(window.innerWidth, window.innerHeight);

        const line2 = new Line2(line2Geometry, line2Material);
        scene.add(line2);
        this.labels.push(line2);

        // Draw angle arc
        this._createAngleArc(scene);
      }
    }
  }

  /**
   * Create visual arc showing the angle
   * @private
   */
  _createAngleArc(scene) {
    if (this.points.length < 3) return;

    const p1 = this.points[0];
    const vertex = this.points[1];
    const p3 = this.points[2];

    // Create vectors from vertex
    const v1 = new THREE.Vector3().subVectors(p1, vertex).normalize();
    const v2 = new THREE.Vector3().subVectors(p3, vertex).normalize();

    // Calculate angle
    const angle = v1.angleTo(v2);

    // Create arc
    const arcRadius = 0.5; // Fixed radius for the arc
    const segments = 32;
    const arcPoints = [];

    // Get rotation axis (perpendicular to both vectors)
    const axis = new THREE.Vector3().crossVectors(v1, v2).normalize();

    // Create arc points by rotating v1 towards v2
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const currentAngle = angle * t;

      const point = v1.clone()
        .applyAxisAngle(axis, currentAngle)
        .multiplyScalar(arcRadius)
        .add(vertex);

      arcPoints.push(point);
    }

    // Create arc line using Line2
    const arcPositions = [];
    for (const point of arcPoints) {
      arcPositions.push(point.x, point.y, point.z);
    }

    const arcGeometry = new LineGeometry();
    arcGeometry.setPositions(arcPositions);

    const arcMaterial = new LineMaterial({
      color: 0xffaa00,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });
    arcMaterial.resolution.set(window.innerWidth, window.innerHeight);

    const arc = new Line2(arcGeometry, arcMaterial);
    scene.add(arc);
    this.labels.push(arc);

    // Add angle label near the arc
    const result = this.getResult();
    const label = new TextSprite(`${result.angleDegrees.toFixed(1)}°`);

    // Position label along the bisector of the angle
    const bisector = new THREE.Vector3()
      .addVectors(v1, v2)
      .normalize()
      .multiplyScalar(arcRadius * 1.5)
      .add(vertex);

    label.position.copy(bisector);
    label.backgroundColor = 'rgba(255, 170, 0, 0.8)';

    // Fixed scale for consistent size
    label.scale.multiplyScalar(0.5);

    scene.add(label);
    this.labels.push(label);
  }
}
