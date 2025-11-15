import * as THREE from 'three';
import { Potree } from 'potree-core';
import { DistanceMeasurement } from './DistanceMeasurement.js';
import { HeightMeasurement } from './HeightMeasurement.js';

/**
 * Manages measurements for PotreeViewer
 */
export class MeasurementManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.measurements = [];
    this.currentMeasurement = null;
    this.mode = 'none'; // 'none' | 'distance' | 'height' | 'area' | 'volume'

    // Bind event handlers
    this._boundClickHandler = this._handleClick.bind(this);
    this._boundKeyHandler = this._handleKey.bind(this);
  }

  /**
   * Set measurement mode
   * @param {string} mode - Measurement mode ('none', 'distance', 'height', 'area', 'volume')
   */
  setMode(mode) {
    const validModes = ['none', 'distance', 'height', 'area', 'volume'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid measurement mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
    }

    // Finish current measurement if switching modes
    if (this.currentMeasurement && !this.currentMeasurement.finished) {
      this.finishCurrentMeasurement();
    }

    const oldMode = this.mode;
    this.mode = mode;

    // Add/remove event listeners based on mode
    if (mode === 'none') {
      this._removeEventListeners();
    } else {
      if (oldMode === 'none') {
        this._addEventListeners();
      }

      // Start new measurement
      if (mode === 'area' || mode === 'volume') {
        console.warn(`Measurement mode '${mode}' is not yet implemented`);
        this.mode = 'none';
        this._removeEventListeners();
        return;
      }

      this._startMeasurement(mode);
    }
  }

  /**
   * Get current measurement mode
   * @returns {string} Current mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Start a new measurement
   * @param {string} type - Measurement type
   * @returns {Measurement} The created measurement
   */
  _startMeasurement(type) {
    let measurement;

    switch (type) {
      case 'distance':
        measurement = new DistanceMeasurement();
        break;
      case 'height':
        measurement = new HeightMeasurement();
        break;
      default:
        throw new Error(`Unsupported measurement type: ${type}`);
    }

    this.currentMeasurement = measurement;
    this.measurements.push(measurement);

    this.viewer.emit('measurement-started', measurement.getSummary());

    return measurement;
  }

  /**
   * Manually start a measurement (advanced API)
   * @param {string} type - Measurement type
   * @returns {Measurement} The created measurement
   */
  startMeasurement(type) {
    this.setMode(type);
    return this.currentMeasurement;
  }

  /**
   * Finish current measurement
   */
  finishCurrentMeasurement() {
    if (!this.currentMeasurement) return;

    this.currentMeasurement.finish();
    this.viewer.emit('measurement-finished', this.currentMeasurement.getSummary());

    this.currentMeasurement = null;
  }

  /**
   * Finish a measurement by ID
   * @param {string} id - Measurement ID
   */
  finishMeasurement(id) {
    const measurement = this.measurements.find(m => m.id === id);
    if (measurement) {
      measurement.finish();
      if (this.currentMeasurement === measurement) {
        this.currentMeasurement = null;
      }
      this.viewer.emit('measurement-finished', measurement.getSummary());
    }
  }

  /**
   * Get all measurements
   * @returns {Array} Array of measurement summaries
   */
  getMeasurements() {
    return this.measurements.map(m => m.getSummary());
  }

  /**
   * Clear all measurements
   */
  clearMeasurements() {
    for (const measurement of this.measurements) {
      measurement.clear(this.viewer.scene);
    }
    this.measurements = [];
    this.currentMeasurement = null;
    this.viewer.emit('measurement-cleared');
  }

  /**
   * Remove a measurement by ID
   * @param {string} id - Measurement ID
   */
  removeMeasurement(id) {
    const index = this.measurements.findIndex(m => m.id === id);
    if (index !== -1) {
      const measurement = this.measurements[index];
      measurement.clear(this.viewer.scene);
      this.measurements.splice(index, 1);

      if (this.currentMeasurement === measurement) {
        this.currentMeasurement = null;
      }
    }
  }

  /**
   * Add event listeners
   * @private
   */
  _addEventListeners() {
    const canvas = this.viewer.renderer.domElement;
    canvas.addEventListener('click', this._boundClickHandler);
    window.addEventListener('keydown', this._boundKeyHandler);
  }

  /**
   * Remove event listeners
   * @private
   */
  _removeEventListeners() {
    const canvas = this.viewer.renderer.domElement;
    canvas.removeEventListener('click', this._boundClickHandler);
    window.removeEventListener('keydown', this._boundKeyHandler);
  }

  /**
   * Handle click events
   * @private
   */
  _handleClick(event) {
    if (this.mode === 'none' || !this.currentMeasurement) return;

    // Prevent orbit controls from interfering
    event.stopPropagation();

    // Get mouse coordinates
    const canvas = this.viewer.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Create ray
    const mouse = new THREE.Vector2(x, y);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.viewer.camera);
    const ray = raycaster.ray;

    // Pick point on point cloud
    const pickPoint = Potree.pick(
      this.viewer.pointClouds,
      this.viewer.renderer,
      this.viewer.camera,
      ray
    );

    if (pickPoint) {
      // Add point to measurement
      this.currentMeasurement.addPoint(pickPoint.position);

      // Update visuals
      this.currentMeasurement.createVisuals(this.viewer.scene);

      // Emit update event
      this.viewer.emit('measurement-updated', this.currentMeasurement.getSummary());

      // Check if measurement is finished
      if (this.currentMeasurement.finished) {
        this.finishCurrentMeasurement();

        // Start a new measurement of the same type
        this._startMeasurement(this.mode);
      }
    }
  }

  /**
   * Handle keyboard events
   * @private
   */
  _handleKey(event) {
    if (this.mode === 'none') return;

    // ESC key - cancel current measurement and exit mode
    if (event.key === 'Escape') {
      if (this.currentMeasurement) {
        this.removeMeasurement(this.currentMeasurement.id);
      }
      this.setMode('none');
    }

    // Enter key - finish current measurement
    if (event.key === 'Enter') {
      if (this.currentMeasurement && this.currentMeasurement.points.length > 0) {
        this.finishCurrentMeasurement();
      }
    }
  }

  /**
   * Dispose and clean up
   */
  dispose() {
    this._removeEventListeners();
    this.clearMeasurements();
  }
}
