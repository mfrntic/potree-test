import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Measurement } from './Measurement.js';
import { TextSprite } from '../utils/TextSprite.js';

/**
 * Volume measurement (Sphere/Ellipsoid)
 * Measures volume of a sphere defined by center and radius points
 * Based on Potree's SphereVolume implementation
 */
export class VolumeMeasurement extends Measurement {
  constructor(id) {
    super('volume', id);
    this.maxPoints = 2; // Center and radius point
    this.scale = new THREE.Vector3(1, 1, 1); // Ellipsoid radii (rx, ry, rz)
  }

  /**
   * Add a point to the measurement
   * @param {THREE.Vector3} point - 3D point
   */
  addPoint(point) {
    if (this.points.length >= this.maxPoints) {
      console.warn('Volume measurement already has 2 points');
      return;
    }

    this.points.push(point.clone());

    // When second point is added, calculate initial radius
    if (this.points.length === 2) {
      const center = this.points[0];
      const radiusPoint = this.points[1];
      const radius = center.distanceTo(radiusPoint);

      // Set uniform scale (sphere)
      this.scale.set(radius, radius, radius);
    }

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
   * Uses ellipsoid volume formula: V = (4/3) * π * rx * ry * rz
   * For a sphere (rx = ry = rz = r): V = (4/3) * π * r³
   */
  getResult() {
    return this._getCachedResult(() => {
      if (this.points.length < 2) {
        return { volume: 0, radius: 0, surfaceArea: 0 };
      }

      const rx = this.scale.x;
      const ry = this.scale.y;
      const rz = this.scale.z;

      // Ellipsoid volume formula (see https://en.wikipedia.org/wiki/Ellipsoid#Volume)
      const volume = (4 / 3) * Math.PI * rx * ry * rz;

      // For a perfect sphere, calculate surface area
      const avgRadius = (rx + ry + rz) / 3;
      const surfaceArea = 4 * Math.PI * avgRadius * avgRadius;

      return {
        volume,
        radius: avgRadius,
        radii: { rx, ry, rz },
        surfaceArea,
        center: this.points[0].clone(),
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

    // Create sphere markers for points
    const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);

    // Center point (different color and larger)
    if (this.points.length >= 1) {
      const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const centerMarker = new THREE.Mesh(markerGeometry, centerMaterial);
      centerMarker.position.copy(this.points[0]);
      centerMarker.scale.set(1.5, 1.5, 1.5);
      scene.add(centerMarker);
      this.markers.push(centerMarker);
    }

    // Radius point
    if (this.points.length >= 2) {
      const radiusMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const radiusMarker = new THREE.Mesh(markerGeometry, radiusMaterial);
      radiusMarker.position.copy(this.points[1]);
      scene.add(radiusMarker);
      this.markers.push(radiusMarker);

      // Draw radius line using Line2
      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions([
        this.points[0].x, this.points[0].y, this.points[0].z,
        this.points[1].x, this.points[1].y, this.points[1].z
      ]);

      const lineMaterial = new LineMaterial({
        color: 0x00ffff,
        linewidth: 3,
        transparent: true,
        opacity: 0.9,
      });
      lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

      this.lines = new Line2(lineGeometry, lineMaterial);
      scene.add(this.lines);

      // Draw sphere wireframe
      this._createSphereWireframe(scene);
    }
  }

  /**
   * Create sphere/ellipsoid wireframe visualization
   * Based on Potree's SphereVolume wireframe
   * @private
   */
  _createSphereWireframe(scene) {
    if (this.points.length < 2) return;

    const center = this.points[0];
    const rx = this.scale.x;
    const ry = this.scale.y;
    const rz = this.scale.z;

    // Create wireframe similar to Potree's SphereVolume
    const frameGeometry = new THREE.BufferGeometry();
    const framePositions = [];

    // Number of segments for circles
    const segments = 32;
    const latitudes = 8; // Horizontal rings
    const longitudes = 5; // Vertical segments

    // Create horizontal rings (latitude lines) at different Y heights
    for (let i = 0; i < latitudes; i++) {
      const lat = ((i / latitudes) - 0.5) * Math.PI; // -π/2 to π/2
      const yPos = ry * Math.sin(lat);
      const radiusAtLat = Math.cos(lat);

      for (let j = 0; j <= segments; j++) {
        const lon = (j / segments) * Math.PI * 2;
        const x = center.x + rx * radiusAtLat * Math.cos(lon);
        const y = center.y + yPos;
        const z = center.z + rz * radiusAtLat * Math.sin(lon);
        framePositions.push(x, y, z);
      }
    }

    // Create vertical segments (longitude lines)
    for (let i = 0; i < longitudes; i++) {
      const lon = (i / longitudes) * Math.PI * 2;

      for (let j = 0; j <= segments; j++) {
        const lat = ((j / segments) - 0.5) * Math.PI;
        const x = center.x + rx * Math.cos(lat) * Math.cos(lon);
        const y = center.y + ry * Math.sin(lat);
        const z = center.z + rz * Math.cos(lat) * Math.sin(lon);
        framePositions.push(x, y, z);
      }
    }

    frameGeometry.setAttribute('position',
      new THREE.Float32BufferAttribute(framePositions, 3)
    );

    const frameMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
    });

    const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
    scene.add(frame);
    this.labels.push(frame);

    // Also add a semi-transparent sphere mesh
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(center);
    sphere.scale.set(rx, ry, rz);
    scene.add(sphere);
    this.labels.push(sphere);

    // Add volume label at top of sphere
    const result = this.getResult();
    const label = new TextSprite(`V: ${result.volume.toFixed(2)} m³`);

    label.position.set(
      center.x,
      center.y + ry + 0.5,
      center.z
    );
    label.backgroundColor = 'rgba(0, 255, 255, 0.8)';

    // Fixed scale for consistent size
    label.scale.multiplyScalar(0.5);

    scene.add(label);
    this.labels.push(label);

    // Add radius label
    const radiusLabel = new TextSprite(`r: ${result.radius.toFixed(2)} m`);
    const radiusPos = new THREE.Vector3().addVectors(center, this.points[1]).multiplyScalar(0.5);
    radiusLabel.position.copy(radiusPos);
    radiusLabel.backgroundColor = 'rgba(0, 255, 255, 0.7)';

    // Fixed scale for consistent size
    radiusLabel.scale.multiplyScalar(0.5);

    scene.add(radiusLabel);
    this.labels.push(radiusLabel);
  }
}
