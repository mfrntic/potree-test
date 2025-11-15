import * as THREE from 'three';

/**
 * Base class for all measurements
 */
export class Measurement {
  constructor(type, id) {
    this.id = id || `measurement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.points = [];
    this.markers = [];
    this.lines = null;
    this.labels = [];
    this.finished = false;
  }

  /**
   * Add a point to the measurement
   * @param {THREE.Vector3} point - 3D point
   */
  addPoint(point) {
    this.points.push(point.clone());
    this.update();
  }

  /**
   * Update the measurement visualization
   * Must be implemented by subclasses
   */
  update() {
    throw new Error('update() must be implemented by subclass');
  }

  /**
   * Get the measurement result
   * Must be implemented by subclasses
   */
  getResult() {
    throw new Error('getResult() must be implemented by subclass');
  }

  /**
   * Finish the measurement (no more points can be added)
   */
  finish() {
    this.finished = true;
  }

  /**
   * Clear all visualization objects
   */
  clear(scene) {
    // Remove markers
    for (const marker of this.markers) {
      scene.remove(marker);
      if (marker.geometry) marker.geometry.dispose();
      if (marker.material) marker.material.dispose();
    }
    this.markers = [];

    // Remove lines
    if (this.lines) {
      scene.remove(this.lines);
      if (this.lines.geometry) this.lines.geometry.dispose();
      if (this.lines.material) this.lines.material.dispose();
      this.lines = null;
    }

    // Remove labels
    for (const label of this.labels) {
      scene.remove(label);
      if (label.geometry) label.geometry.dispose();
      if (label.material) label.material.dispose();
    }
    this.labels = [];
  }

  /**
   * Get a summary of this measurement
   */
  getSummary() {
    return {
      id: this.id,
      type: this.type,
      points: this.points.map(p => ({ x: p.x, y: p.y, z: p.z })),
      result: this.getResult(),
    };
  }
}
