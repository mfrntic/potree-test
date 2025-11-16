import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Measurement } from './Measurement.js';
import { TextSprite } from '../utils/TextSprite.js';

/**
 * Radius (Circle) measurement
 * Measures radius defined by center point and edge point
 */
export class RadiusMeasurement extends Measurement {
  constructor(id) {
    super('radius', id);
    this.maxPoints = 2; // Center and edge point
  }

  /**
   * Add a point to the measurement
   * @param {THREE.Vector3} point - 3D point
   */
  addPoint(point) {
    if (this.points.length >= this.maxPoints) {
      console.warn('Radius measurement already has 2 points');
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
        return { radius: 0, diameter: 0, circumference: 0, area: 0 };
      }

      const center = this.points[0];
      const edge = this.points[1];

      const radius = center.distanceTo(edge);
      const diameter = radius * 2;
      const circumference = 2 * Math.PI * radius;
      const area = Math.PI * radius * radius;

      return {
        radius,
        diameter,
        circumference,
        area,
        center: center.clone(),
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

    // Center point (different color and larger)
    if (this.points.length >= 1) {
      const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
      const centerMarker = new THREE.Mesh(markerGeometry, centerMaterial);
      centerMarker.position.copy(this.points[0]);
      centerMarker.scale.set(1.3, 1.3, 1.3);
      scene.add(centerMarker);
      this.markers.push(centerMarker);
    }

    // Edge point
    if (this.points.length >= 2) {
      const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
      const edgeMarker = new THREE.Mesh(markerGeometry, edgeMaterial);
      edgeMarker.position.copy(this.points[1]);
      scene.add(edgeMarker);
      this.markers.push(edgeMarker);

      // Draw radius line using Line2
      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions([
        this.points[0].x, this.points[0].y, this.points[0].z,
        this.points[1].x, this.points[1].y, this.points[1].z
      ]);

      const lineMaterial = new LineMaterial({
        color: 0xff00ff,
        linewidth: 3,
        transparent: true,
        opacity: 0.9,
      });
      lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

      this.lines = new Line2(lineGeometry, lineMaterial);
      scene.add(this.lines);

      // Draw circle
      this._createCircle(scene);
    }
  }

  /**
   * Create circle visualization
   * @private
   */
  _createCircle(scene) {
    if (this.points.length < 2) return;

    const center = this.points[0];
    const edge = this.points[1];
    const radius = center.distanceTo(edge);

    // Create circle in the horizontal plane (XZ plane, since Y is up)
    const segments = 64;
    const circlePoints = [];

    // Get the direction from center to edge
    const toEdge = new THREE.Vector3().subVectors(edge, center);

    // Project onto XZ plane (horizontal)
    const radiusXZ = Math.sqrt(toEdge.x * toEdge.x + toEdge.z * toEdge.z);

    if (radiusXZ < 0.001) {
      // Edge is directly above/below center, use full 3D radius
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = center.x + radius * Math.cos(theta);
        const z = center.z + radius * Math.sin(theta);
        circlePoints.push(new THREE.Vector3(x, center.y, z));
      }
    } else {
      // Create circle in the plane containing center, edge, and vertical axis
      const angleOffset = Math.atan2(toEdge.z, toEdge.x);

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = center.x + radius * Math.cos(theta + angleOffset);
        const z = center.z + radius * Math.sin(theta + angleOffset);
        circlePoints.push(new THREE.Vector3(x, center.y, z));
      }
    }

    // Create circle geometry using Line2
    const circlePositions = [];
    for (const point of circlePoints) {
      circlePositions.push(point.x, point.y, point.z);
    }

    const circleGeometry = new LineGeometry();
    circleGeometry.setPositions(circlePositions);

    const circleMaterial = new LineMaterial({
      color: 0xff00ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.7,
    });
    circleMaterial.resolution.set(window.innerWidth, window.innerHeight);

    const circle = new Line2(circleGeometry, circleMaterial);
    scene.add(circle);
    this.labels.push(circle);

    // Add radius label at midpoint of radius line
    const result = this.getResult();
    const midpoint = new THREE.Vector3().addVectors(center, edge).multiplyScalar(0.5);

    const label = new TextSprite(`r: ${result.radius.toFixed(2)} m`);
    label.position.copy(midpoint);
    label.backgroundColor = 'rgba(255, 0, 255, 0.8)';

    // Fixed scale for consistent size
    label.scale.multiplyScalar(0.5);

    scene.add(label);
    this.labels.push(label);

    // Add circumference label at top of circle
    const circumLabel = new TextSprite(`C: ${result.circumference.toFixed(2)} m`);
    circumLabel.position.set(center.x, center.y + radius + 0.5, center.z);
    circumLabel.backgroundColor = 'rgba(255, 0, 255, 0.7)';

    // Fixed scale for consistent size
    circumLabel.scale.multiplyScalar(0.5);

    scene.add(circumLabel);
    this.labels.push(circumLabel);
  }
}
