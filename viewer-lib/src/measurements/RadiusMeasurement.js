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
   * @param {Object} point - Point object {position: Vector3}
   */
  addPoint(point) {
    if (this.points.length >= this.maxPoints) {
      console.warn('Radius measurement already has 2 points');
      return;
    }

    // Use base class addPoint which handles wrapping Vector3 in object
    super.addPoint(point);

    // When second point is added, create all geometry ONCE
    if (this.points.length === this.maxPoints) {
      this._createCircleGeometry();
      this.finish();
    }
  }

  /**
   * Update the measurement visualization (called every frame like Potree)
   */
  update() {
    if (this.points.length === 0) return;

    // Update markers
    this._updateMarkers();

    // Update lines if we have 2 points
    if (this.points.length >= 2) {
      this._updateRadiusLine();
      // Update labels every frame
      this._updateLabels();
    }
  }

  /**
   * Get the measurement result (cached to prevent jitter)
   */
  getResult() {
    return this._getCachedResult(() => {
      if (this.points.length < 2) {
        return { radius: 0, diameter: 0, circumference: 0, area: 0 };
      }

      const center = this.points[0].position;
      const edge = this.points[1].position;

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
   * Create visual representation in the scene (called once when first point is added)
   * @param {THREE.Scene} scene - Three.js scene
   */
  createVisuals(scene) {
    // Store scene reference for later updates
    this.scene = scene;

    // Initial update will create all visuals
    this.update();
  }

  /**
   * Update marker spheres (reuse existing or create new)
   * @private
   */
  _updateMarkers() {
    if (!this.scene) return;
    const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });

    // Center point (larger)
    if (this.points.length >= 1) {
      if (this.markers.length < 1) {
        const centerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        centerMarker.renderOrder = 2;
        centerMarker.scale.set(1.3, 1.3, 1.3);
        this.scene.add(centerMarker);
        this.markers.push(centerMarker);
      }
      this.markers[0].position.copy(this.points[0].position);
    }

    // Edge point
    if (this.points.length >= 2) {
      if (this.markers.length < 2) {
        const edgeMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        edgeMarker.renderOrder = 2;
        this.scene.add(edgeMarker);
        this.markers.push(edgeMarker);
      }
      this.markers[1].position.copy(this.points[1].position);
    }
  }

  /**
   * Update radius line (reuse existing or create new)
   * Following Potree's EXACT approach: position line at start point, use relative coords
   * @private
   */
  _updateRadiusLine() {
    if (!this.scene) return;
    const p1 = this.points[0].position;
    const p2 = this.points[1].position;

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
      this.scene.add(this.lines);
    }

    // CRITICAL: Position line at p1, use relative coords for p2
    this.lines.position.copy(p1);
    const positions = [
      0, 0, 0,                           // p1 (origin)
      p2.x - p1.x, p2.y - p1.y, p2.z - p1.z  // p2 relative to p1
    ];
    this.lines.geometry.setPositions(positions);
    this.lines.computeLineDistances();
    this.lines.geometry.computeBoundingSphere();
  }

  /**
   * Create circle geometry and labels (called once when second point is added)
   * @private
   */
  _createCircleGeometry() {
    if (!this.scene) return;
    if (this.points.length < 2) return;

    const center = this.points[0].position;
    const edge = this.points[1].position;
    const radius = center.distanceTo(edge);
    const result = this.getResult();

    // Create circle geometry ONCE - using THREE.CircleGeometry like Potree
    // CircleGeometry creates a circle in XY plane by default
    const circleGeometry = new THREE.CircleGeometry(1, 64); // radius 1, will be scaled
    // Convert to line by extracting edge vertices
    const positions = [];
    const posAttr = circleGeometry.getAttribute('position');
    for (let i = 1; i < posAttr.count; i++) { // Skip center vertex (index 0)
      positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    }
    // Close the circle
    positions.push(posAttr.getX(1), posAttr.getY(1), posAttr.getZ(1));

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const circleMaterial = new THREE.LineBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.7,
    });
    const circle = new THREE.Line(lineGeometry, circleMaterial);
    circle.renderOrder = 1;
    circle.userData.isCircle = true;

    // Position at center and scale by radius
    circle.position.copy(center);
    circle.scale.set(radius, radius, radius);

    // Rotate circle to be in horizontal plane (XZ) with normal pointing up (Y)
    // First rotate to XZ plane (CircleGeometry is in XY, rotate -90° around X)
    circle.rotation.x = -Math.PI / 2;

    // Then rotate around Y axis to align with the radius direction in XZ plane
    const radiusVec = new THREE.Vector3().subVectors(edge, center);
    const angleY = Math.atan2(radiusVec.x, radiusVec.z); // Angle in XZ plane
    circle.rotation.y = angleY;

    this.scene.add(circle);
    this.labels.push(circle);

    // Create labels ONCE at the same time as circle
    const midpoint = new THREE.Vector3().addVectors(center, edge).multiplyScalar(0.5);

    // Create radius label
    const radiusLabel = new TextSprite(`r: ${result.radius.toFixed(2)} m`);
    radiusLabel.position.copy(midpoint);
    radiusLabel.renderOrder = 3;
    radiusLabel.backgroundColor = 'rgba(255, 0, 255, 0.8)';
    radiusLabel.scale.multiplyScalar(0.3);
    radiusLabel.userData.isRadiusLabel = true;
    this.scene.add(radiusLabel);
    this.labels.push(radiusLabel);

    // Create circumference label
    const circumLabel = new TextSprite(`C: ${result.circumference.toFixed(2)} m`);
    circumLabel.position.set(center.x, center.y + radius + 0.5, center.z);
    circumLabel.renderOrder = 3;
    circumLabel.backgroundColor = 'rgba(255, 0, 255, 0.7)';
    circumLabel.scale.multiplyScalar(0.3);
    circumLabel.userData.isCircumLabel = true;
    this.scene.add(circumLabel);
    this.labels.push(circumLabel);
  }

  /**
   * Update labels (called every frame to update text)
   * @private
   */
  _updateLabels() {
    if (!this.scene) return;
    if (this.points.length < 2) return;

    const center = this.points[0].position;
    const edge = this.points[1].position;
    const result = this.getResult();
    const radius = center.distanceTo(edge);
    const midpoint = new THREE.Vector3().addVectors(center, edge).multiplyScalar(0.5);

    // Find or create radius label
    let radiusLabel = this.labels.find(l => l.material && l.material.map && l.userData && l.userData.isRadiusLabel);

    if (!radiusLabel) {
      radiusLabel = new TextSprite(`r: ${result.radius.toFixed(2)} m`);
      radiusLabel.renderOrder = 3;
      radiusLabel.backgroundColor = 'rgba(255, 0, 255, 0.8)';
      radiusLabel.scale.multiplyScalar(0.3);
      radiusLabel.userData.isRadiusLabel = true;
      this.scene.add(radiusLabel);
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
      circumLabel.scale.multiplyScalar(0.3);
      circumLabel.userData.isCircumLabel = true;
      this.scene.add(circumLabel);
      this.labels.push(circumLabel);
    }

    circumLabel.text = `C: ${result.circumference.toFixed(2)} m`;
    circumLabel.position.set(center.x, center.y + radius + 0.5, center.z);
  }
}
