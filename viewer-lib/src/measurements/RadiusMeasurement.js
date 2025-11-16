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
    if (this.points.length === 0) return;

    // Update or create markers
    this._updateMarkers(scene);

    // Update or create lines and circle
    if (this.points.length >= 2) {
      this._updateRadiusLine(scene);
      this._updateCircle(scene);
    }
  }

  /**
   * Update marker spheres (reuse existing or create new)
   * @private
   */
  _updateMarkers(scene) {
    const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });

    // Center point (larger)
    if (this.points.length >= 1) {
      if (this.markers.length < 1) {
        const centerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        centerMarker.renderOrder = 2;
        centerMarker.scale.set(1.3, 1.3, 1.3);
        scene.add(centerMarker);
        this.markers.push(centerMarker);
      }
      this.markers[0].position.copy(this.points[0]);
    }

    // Edge point
    if (this.points.length >= 2) {
      if (this.markers.length < 2) {
        const edgeMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        edgeMarker.renderOrder = 2;
        scene.add(edgeMarker);
        this.markers.push(edgeMarker);
      }
      this.markers[1].position.copy(this.points[1]);
    }
  }

  /**
   * Update radius line (reuse existing or create new)
   * @private
   */
  _updateRadiusLine(scene) {
    if (!this.lines) {
      const lineGeometry = new LineGeometry();
      const lineMaterial = new LineMaterial({
        color: 0xff00ff,
        linewidth: 3,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        transparent: true,
        opacity: 0.9,
        depthTest: true,
        depthWrite: true,
      });
      this.lines = new Line2(lineGeometry, lineMaterial);
      this.lines.renderOrder = 1;
      scene.add(this.lines);
    }

    // Update radius line positions
    const positions = [
      this.points[0].x, this.points[0].y, this.points[0].z,
      this.points[1].x, this.points[1].y, this.points[1].z
    ];
    this.lines.geometry.setPositions(positions);
    this.lines.computeLineDistances();
    this.lines.geometry.computeBoundingSphere();
  }

  /**
   * Update circle visualization (reuse existing or create new)
   * @private
   */
  _updateCircle(scene) {
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

    // Create circle positions array
    const circlePositions = [];
    for (const point of circlePoints) {
      circlePositions.push(point.x, point.y, point.z);
    }

    // Find or create circle line
    let circle = this.labels.find(l => l.isLine && l.userData && l.userData.isCircle);

    if (!circle) {
      const circleGeometry = new THREE.BufferGeometry();
      const circleMaterial = new THREE.LineBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.7,
      });
      circle = new THREE.Line(circleGeometry, circleMaterial);
      circle.renderOrder = 1;
      circle.userData.isCircle = true;
      scene.add(circle);
      this.labels.push(circle);

      // Initialize with empty positions
      circle.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
    }

    // Check if we need to update circle positions (circle has segments+1 points = 65)
    const circleAttr = circle.geometry.getAttribute('position');
    const circleNeedsUpdate = !circleAttr || circleAttr.count !== circlePoints.length;

    if (circleNeedsUpdate) {
      // Update circle positions
      const circlePositionsArray = new Float32Array(circlePositions);
      circle.geometry.setAttribute('position', new THREE.BufferAttribute(circlePositionsArray, 3));
      circle.geometry.computeBoundingSphere();
    }

    // Update labels
    const result = this.getResult();
    const midpoint = new THREE.Vector3().addVectors(center, edge).multiplyScalar(0.5);

    // Find or create radius label
    let radiusLabel = this.labels.find(l => l.material && l.material.map && l.userData && l.userData.isRadiusLabel);

    if (!radiusLabel) {
      radiusLabel = new TextSprite(`r: ${result.radius.toFixed(2)} m`);
      radiusLabel.renderOrder = 3;
      radiusLabel.backgroundColor = 'rgba(255, 0, 255, 0.8)';
      radiusLabel.scale.multiplyScalar(0.5);
      radiusLabel.userData.isRadiusLabel = true;
      scene.add(radiusLabel);
      this.labels.push(radiusLabel);
    }

    radiusLabel.text = `r: ${result.radius.toFixed(2)} m`;
    radiusLabel.position.copy(midpoint);

    // Find or create circumference label
    let circumLabel = this.labels.find(l => l.material && l.material.map && l.userData && l.userData.isCircumLabel);

    if (!circumLabel) {
      circumLabel = new TextSprite(`C: ${result.circumference.toFixed(2)} m`);
      circumLabel.renderOrder = 3;
      circumLabel.backgroundColor = 'rgba(255, 0, 255, 0.7)';
      circumLabel.scale.multiplyScalar(0.5);
      circumLabel.userData.isCircumLabel = true;
      scene.add(circumLabel);
      this.labels.push(circumLabel);
    }

    circumLabel.text = `C: ${result.circumference.toFixed(2)} m`;
    circumLabel.position.set(center.x, center.y + radius + 0.5, center.z);
  }
}
