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
    this._cachedResult = null; // Cache result to prevent jitter from recalculation
    this._pointsHash = null; // Hash of points to detect changes
  }

  /**
   * Add a point to the measurement
   * @param {THREE.Vector3} point - 3D point
   */
  addPoint(point) {
    this.points.push(point.clone());
    this._invalidateCache(); // Clear cache when points change
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
   * Get cached result or calculate new one
   * Subclasses should call this to enable caching
   * @protected
   */
  _getCachedResult(calculateFn) {
    // Create hash of current points
    const currentHash = this._hashPoints();

    // If hash matches and we have cached result, return it
    if (this._pointsHash === currentHash && this._cachedResult !== null) {
      return this._cachedResult;
    }

    // Otherwise calculate new result and cache it
    this._pointsHash = currentHash;
    this._cachedResult = calculateFn();
    return this._cachedResult;
  }

  /**
   * Create hash of points for cache comparison
   * @private
   */
  _hashPoints() {
    // Simple hash: concatenate rounded coordinates
    return this.points.map(p =>
      `${p.x.toFixed(6)},${p.y.toFixed(6)},${p.z.toFixed(6)}`
    ).join('|');
  }

  /**
   * Invalidate cached result
   * @private
   */
  _invalidateCache() {
    this._cachedResult = null;
    this._pointsHash = null;
  }

  /**
   * Finish the measurement (no more points can be added)
   */
  finish() {
    this.finished = true;
  }

  /**
   * Update marker and label scales based on camera distance
   * Call this in the render loop to keep markers at consistent visual size
   * @param {THREE.Camera} camera - Camera to calculate distance from
   */
  updateMarkerScales(camera) {
    if (!camera) return;

    const referenceDistance = 10; // Distance at which base scale looks good

    // Update marker spheres
    for (const marker of this.markers) {
      if (!marker.position) continue;

      const distance = camera.position.distanceTo(marker.position);
      const scale = distance / referenceDistance;
      const clampedScale = Math.max(0.2, Math.min(5.0, scale));

      marker.scale.setScalar(clampedScale);
    }

    // Update text labels (TextSprites)
    for (const label of this.labels) {
      // Check if it's a TextSprite (has position and material.map from canvas)
      if (label.position && label.material && label.material.map) {
        const distance = camera.position.distanceTo(label.position);

        // TextSprites need different scaling - they already have base scale
        // We just multiply their existing scale by distance factor
        const baseLabelScale = 0.5; // This was set in createVisuals
        const scaleFactor = (distance / referenceDistance) * baseLabelScale;
        const clampedScale = Math.max(0.1, Math.min(2.0, scaleFactor));

        // Preserve aspect ratio from original scale
        const aspect = label.scale.x / label.scale.y;
        label.scale.set(clampedScale * aspect, clampedScale, 1);
      }
    }
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
