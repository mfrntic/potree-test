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
    if (this.points.length === 0) return;

    // Update or create markers
    this._updateMarkers(scene);

    // Update or create lines and sphere
    if (this.points.length >= 2) {
      this._updateRadiusLine(scene);
      this._updateSphereWireframe(scene);
    }
  }

  /**
   * Update marker spheres (reuse existing or create new)
   * @private
   */
  _updateMarkers(scene) {
    const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    // Center point (larger)
    if (this.points.length >= 1) {
      if (this.markers.length < 1) {
        const centerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        centerMarker.renderOrder = 2;
        centerMarker.scale.set(1.5, 1.5, 1.5);
        scene.add(centerMarker);
        this.markers.push(centerMarker);
      }
      this.markers[0].position.copy(this.points[0]);
    }

    // Radius point
    if (this.points.length >= 2) {
      if (this.markers.length < 2) {
        const radiusMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        radiusMarker.renderOrder = 2;
        scene.add(radiusMarker);
        this.markers.push(radiusMarker);
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
        color: 0x00ffff,
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
   * Update sphere/ellipsoid wireframe visualization (reuse existing or create new)
   * Based on Potree's SphereVolume wireframe
   * @private
   */
  _updateSphereWireframe(scene) {
    if (this.points.length < 2) return;

    const center = this.points[0];
    const rx = this.scale.x;
    const ry = this.scale.y;
    const rz = this.scale.z;

    // Calculate wireframe positions
    const framePositions = [];
    const segments = 32;
    const latitudes = 8;
    const longitudes = 5;

    // Create horizontal rings (latitude lines) at different Y heights
    for (let i = 0; i < latitudes; i++) {
      const lat = ((i / latitudes) - 0.5) * Math.PI;
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

    // Find or create wireframe
    let frame = this.labels.find(l => l.userData && l.userData.isWireframe);

    if (!frame) {
      const frameGeometry = new THREE.BufferGeometry();
      const frameMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
      });
      frame = new THREE.LineSegments(frameGeometry, frameMaterial);
      frame.renderOrder = 1;
      frame.userData.isWireframe = true;
      scene.add(frame);
      this.labels.push(frame);
    }

    // Update wireframe positions
    frame.geometry.setAttribute('position',
      new THREE.Float32BufferAttribute(framePositions, 3)
    );
    frame.geometry.attributes.position.needsUpdate = true;

    // Find or create sphere mesh
    let sphere = this.labels.find(l => l.userData && l.userData.isSphereMesh);

    if (!sphere) {
      const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
      });
      sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.renderOrder = 2;
      sphere.userData.isSphereMesh = true;
      scene.add(sphere);
      this.labels.push(sphere);
    }

    // Update sphere position and scale
    sphere.position.copy(center);
    sphere.scale.set(rx, ry, rz);

    // Update labels
    const result = this.getResult();

    // Find or create volume label
    let volumeLabel = this.labels.find(l => l.material && l.material.map && l.userData && l.userData.isVolumeLabel);

    if (!volumeLabel) {
      volumeLabel = new TextSprite(`V: ${result.volume.toFixed(2)} m³`);
      volumeLabel.renderOrder = 3;
      volumeLabel.backgroundColor = 'rgba(0, 255, 255, 0.8)';
      volumeLabel.scale.multiplyScalar(0.5);
      volumeLabel.userData.isVolumeLabel = true;
      scene.add(volumeLabel);
      this.labels.push(volumeLabel);
    }

    volumeLabel.text = `V: ${result.volume.toFixed(2)} m³`;
    volumeLabel.position.set(center.x, center.y + ry + 0.5, center.z);

    // Find or create radius label
    let radiusLabel = this.labels.find(l => l.material && l.material.map && l.userData && l.userData.isRadiusLabel);
    const radiusPos = new THREE.Vector3().addVectors(center, this.points[1]).multiplyScalar(0.5);

    if (!radiusLabel) {
      radiusLabel = new TextSprite(`r: ${result.radius.toFixed(2)} m`);
      radiusLabel.renderOrder = 3;
      radiusLabel.backgroundColor = 'rgba(0, 255, 255, 0.7)';
      radiusLabel.scale.multiplyScalar(0.5);
      radiusLabel.userData.isRadiusLabel = true;
      scene.add(radiusLabel);
      this.labels.push(radiusLabel);
    }

    radiusLabel.text = `r: ${result.radius.toFixed(2)} m`;
    radiusLabel.position.copy(radiusPos);
  }
}
