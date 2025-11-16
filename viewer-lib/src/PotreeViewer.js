import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Potree, PointSizeType, PointShape, PointColorType } from 'potree-core';
import { EventEmitter } from './utils/EventEmitter.js';
import { mergeConfig, validateConfig } from './utils/config.js';
import { MeasurementManager } from './measurements/MeasurementManager.js';

/**
 * PotreeViewer - Modern, framework-agnostic point cloud viewer
 * Built on potree-core and Three.js
 */
export class PotreeViewer extends EventEmitter {
  constructor(options = {}) {
    super();

    // Merge and validate configuration
    this.config = mergeConfig(options);
    validateConfig(this.config);

    // Internal state
    this.container = this.config.container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.potree = null;
    this.pointClouds = [];
    this.animationId = null;
    this.isDisposed = false;
    this.measurementManager = null;

    // Initialize the viewer
    this._init();
  }

  /**
   * Initialize Three.js scene, camera, renderer, and Potree instance
   * @private
   */
  _init() {
    try {
      // Create Three.js scene
      this.scene = new THREE.Scene();

      // Create camera
      const aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(
        this.config.fov,
        aspect,
        0.1,
        10000
      );
      this.camera.position.set(10, 10, 10);

      // Create renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.container.appendChild(this.renderer.domElement);

      // Create controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;

      // Allow full rotation around vertical axis
      this.controls.minPolarAngle = 0; // Allow looking straight down
      this.controls.maxPolarAngle = Math.PI; // Allow looking straight up

      // Enable full 360° rotation
      this.controls.enableRotate = true;
      this.controls.rotateSpeed = 1.0;

      // Minimal zoom limits - allow very close and very far
      this.controls.minDistance = 0.1;   // Can zoom very close
      this.controls.maxDistance = 10000; // Can zoom very far

      // Enable pan
      this.controls.enablePan = true;
      this.controls.panSpeed = 0.5;

      // Better mouse button mapping
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };

      // Set background
      this._setBackgroundInternal(this.config.background);

      // Create Potree instance
      this.potree = new Potree();
      this.potree.pointBudget = this.config.pointBudget;

      // Create measurement manager
      this.measurementManager = new MeasurementManager(this);

      // Handle window resize
      this._boundResizeHandler = this._handleResize.bind(this);
      window.addEventListener('resize', this._boundResizeHandler);

      // Start animation loop
      this._animate();

      // Load point cloud if URL is provided
      if (this.config.pointCloudUrl) {
        this.loadPointCloud(this.config.pointCloudUrl, this.config.pointCloudName)
          .then(() => {
            // Apply initial view
            this._applyInitialView();

            // Emit ready event
            this.emit('ready', this);
            if (typeof this.config.onReady === 'function') {
              this.config.onReady(this);
            }
          })
          .catch(error => {
            console.error('Failed to load point cloud in _init:', error);
            this._handleError(error);
          });
      } else {
        // No point cloud to load, emit ready immediately
        this.emit('ready', this);
        if (typeof this.config.onReady === 'function') {
          this.config.onReady(this);
        }
      }
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Animation loop
   * @private
   */
  _animate() {
    if (this.isDisposed) return;

    this.animationId = requestAnimationFrame(() => this._animate());

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Update point clouds
    if (this.potree && this.pointClouds.length > 0) {
      this.potree.updatePointClouds(this.pointClouds, this.camera, this.renderer);
    }

    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Handle window resize
   * @private
   */
  _handleResize() {
    if (this.isDisposed) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Apply initial view from configuration
   * @private
   */
  _applyInitialView() {
    const { initialView } = this.config;

    if (typeof initialView === 'string') {
      // Named view
      this.setNamedView(initialView);
    } else if (typeof initialView === 'object' && initialView.position && initialView.target) {
      // Custom position and target
      this.setView(initialView.position, initialView.target);
    }

    // Auto-fit if enabled
    if (this.config.autoFitOnLoad && this.pointClouds.length > 0) {
      this.fitToScreen();
    }
  }

  /**
   * Set background color or style
   * @private
   */
  _setBackgroundInternal(background) {
    if (!this.scene) return;

    if (background === 'black') {
      this.scene.background = new THREE.Color(0x000000);
    } else if (background === 'white') {
      this.scene.background = new THREE.Color(0xffffff);
    } else if (background === 'gradient') {
      // Simple gradient using fog effect
      this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
      this.scene.fog = new THREE.Fog(0x87CEEB, 10, 1000);
    } else if (typeof background === 'string') {
      // Assume it's a color string
      this.scene.background = new THREE.Color(background);
    }
  }

  /**
   * Handle errors
   * @private
   */
  _handleError(error) {
    console.error('PotreeViewer Error:', error);
    this.emit('error', error);
    if (typeof this.config.onError === 'function') {
      this.config.onError(error);
    }
  }

  // ===== PUBLIC API =====

  /**
   * Load a point cloud
   * @param {string} url - Point cloud metadata URL (e.g., 'metadata.json')
   * @param {string} name - Point cloud name
   * @returns {Promise<Object>} Promise that resolves with the point cloud object
   */
  async loadPointCloud(url, name = 'pointcloud') {
    if (!this.potree) {
      throw new Error('PotreeViewer: Potree instance not initialized');
    }

    try {
      // Extract base URL and filename
      const lastSlash = url.lastIndexOf('/');
      const baseUrl = lastSlash >= 0 ? url.substring(0, lastSlash + 1) : '';
      const filename = lastSlash >= 0 ? url.substring(lastSlash + 1) : url;

      // Load point cloud using potree-core API
      // The second parameter is the base URL string
      const pco = await this.potree.loadPointCloud(filename, baseUrl);

      pco.name = name;

      // Potree uses Z-up coordinate system, Three.js uses Y-up
      // Rotate to align Z-up with Y-up
      pco.rotation.x = -Math.PI / 2;

      // Add to scene
      this.scene.add(pco);
      this.pointClouds.push(pco);

      // Update matrix to ensure transformations are applied
      pco.updateMatrixWorld(true);

      // Set OrbitControls target to the center of the point cloud
      // This ensures rotation happens around the object center
      const { center } = this._getPointCloudWorldBounds(pco);
      this.controls.target.copy(center);
      this.controls.update();

      // Configure material AFTER adding to scene
      this._configureMaterial(pco.material);

      // Debug: Check what attributes are available
      console.log('[PotreeViewer] Point cloud attributes:', {
        attributes: pco.pcoGeometry?.attributes,
        hasRGB: pco.pcoGeometry?.attributes?.includes('rgb'),
        hasClassification: pco.pcoGeometry?.attributes?.includes('classification'),
      });

      // Debug: Log complete material state
      console.log('[PotreeViewer] Material state after config:', {
        pointColorType: pco.material.pointColorType,
        activeAttributeName: pco.material.activeAttributeName,
        attributes: Object.keys(pco.material.attributes || {}),
        pcoAttributes: pco.pcoGeometry?.pointAttributes?.attributes?.map(a => a.name),
      });

      // CRITICAL FIX: Set pointColorType based on available attributes
      // potree-core 2.x uses pointColorType enum, NOT activeAttributeName (that was Potree 1.x)
      if (pco.pcoGeometry?.pointAttributes) {
        const availableAttrs = pco.pcoGeometry.pointAttributes.attributes || [];
        const hasRGB = availableAttrs.some(a => a.name === 'rgb' || a.name === 'rgba');
        const hasClassification = availableAttrs.some(a => a.name === 'classification');

        if (hasRGB) {
          console.log('[PotreeViewer] RGB attribute found - setting pointColorType to RGB (0)');
          pco.material.pointColorType = PointColorType.RGB; // 0

          // Set color encoding like official example
          pco.material.inputColorEncoding = 1;
          pco.material.outputColorEncoding = 1;
        } else if (hasClassification) {
          console.log('[PotreeViewer] No RGB, using classification colors');
          pco.material.pointColorType = PointColorType.CLASSIFICATION; // 8
        } else {
          console.log('[PotreeViewer] No RGB or classification, using elevation colors');
          pco.material.pointColorType = PointColorType.ELEVATION; // 3
        }

        // Mark material as needing update
        pco.material.needsUpdate = true;
      }

      // Emit event
      this.emit('pointcloud-loaded', pco);
      if (typeof this.config.onPointCloudLoaded === 'function') {
        this.config.onPointCloudLoaded(pco);
      }

      return pco;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  /**
   * Configure point cloud material from config
   * @private
   */
  _configureMaterial(material) {
    const { material: matConfig } = this.config;

    material.size = matConfig.size;
    material.minSize = matConfig.minSize;

    // Map point size type
    if (matConfig.pointSizeType === 'FIXED') {
      material.pointSizeType = PointSizeType.FIXED;
    } else if (matConfig.pointSizeType === 'ATTENUATED') {
      material.pointSizeType = PointSizeType.ATTENUATED;
    } else if (matConfig.pointSizeType === 'ADAPTIVE') {
      material.pointSizeType = PointSizeType.ADAPTIVE;
    }

    // Map point shape
    if (matConfig.shape === 'SQUARE') {
      material.shape = PointShape.SQUARE;
    } else if (matConfig.shape === 'CIRCLE') {
      material.shape = PointShape.CIRCLE;
    }

    // DON'T explicitly set pointColorType - let potree-core use its default
    // The original Potree build doesn't set it either, and colors work there
    // Setting it to RGB might interfere with the default shader behavior

    // Debug: Log material settings
    console.log('[PotreeViewer] Material configured:', {
      pointColorType: material.pointColorType,
      size: material.size,
      minSize: material.minSize,
    });
  }

  /**
   * Set point budget (number of visible points)
   * @param {number} budget - Point budget
   */
  setPointBudget(budget) {
    if (typeof budget !== 'number' || budget <= 0) {
      throw new Error('Point budget must be a positive number');
    }

    if (this.potree) {
      this.potree.pointBudget = budget;
    }

    this.config.pointBudget = budget;
  }

  /**
   * Set camera view (position and target)
   * @param {Object} position - Camera position {x, y, z}
   * @param {Object} target - Look-at target {x, y, z}
   */
  setView(position, target) {
    if (!position || !target) {
      throw new Error('Position and target are required');
    }

    this.camera.position.set(position.x, position.y, position.z);
    this.controls.target.set(target.x, target.y, target.z);
    this.camera.lookAt(target.x, target.y, target.z);
    this.controls.update();

    this.emit('view-changed', {
      namedView: 'custom',
      position: { ...position },
      target: { ...target },
    });
  }

  /**
   * Get world-space center and size of point cloud
   * @private
   */
  _getPointCloudWorldBounds(pco) {
    // Get local bounding box
    const localBBox = pco.boundingBox;
    const localMin = localBBox.min.clone();
    const localMax = localBBox.max.clone();
    const localSize = localBBox.getSize(new THREE.Vector3());

    // Transform BOTH min and max corners to world coordinates
    localMin.applyMatrix4(pco.matrixWorld);
    localMax.applyMatrix4(pco.matrixWorld);

    // After transformation, min and max might be swapped (due to rotation)
    // Create new bounding box from transformed corners
    const worldBBox = new THREE.Box3();
    worldBBox.expandByPoint(localMin);
    worldBBox.expandByPoint(localMax);

    // Also transform all 8 corners to be safe
    const corners = [
      new THREE.Vector3(localBBox.min.x, localBBox.min.y, localBBox.min.z),
      new THREE.Vector3(localBBox.max.x, localBBox.min.y, localBBox.min.z),
      new THREE.Vector3(localBBox.min.x, localBBox.max.y, localBBox.min.z),
      new THREE.Vector3(localBBox.max.x, localBBox.max.y, localBBox.min.z),
      new THREE.Vector3(localBBox.min.x, localBBox.min.y, localBBox.max.z),
      new THREE.Vector3(localBBox.max.x, localBBox.min.y, localBBox.max.z),
      new THREE.Vector3(localBBox.min.x, localBBox.max.y, localBBox.max.z),
      new THREE.Vector3(localBBox.max.x, localBBox.max.y, localBBox.max.z),
    ];

    corners.forEach(corner => {
      corner.applyMatrix4(pco.matrixWorld);
      worldBBox.expandByPoint(corner);
    });

    // Get center and size from the world-space bounding box
    const worldCenter = worldBBox.getCenter(new THREE.Vector3());
    const worldSize = worldBBox.getSize(new THREE.Vector3());

    return { center: worldCenter, size: worldSize };
  }

  /**
   * Set named view (predefined camera positions)
   * @param {string} viewName - 'top' | 'front' | 'right' | 'isometric'
   */
  setNamedView(viewName) {
    if (this.pointClouds.length === 0) {
      console.warn('No point cloud loaded, cannot set view');
      return;
    }

    const pco = this.pointClouds[0];
    const { center, size } = this._getPointCloudWorldBounds(pco);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5; // Closer view

    let position;

    switch (viewName.toLowerCase()) {
      case 'top':
        // Look from above (Y+ is up after rotation)
        position = new THREE.Vector3(center.x, center.y + distance, center.z);
        break;
      case 'front':
        // Look from front (-Z direction after rotation)
        position = new THREE.Vector3(center.x, center.y + maxDim * 0.2, center.z - distance);
        break;
      case 'right':
        // Look from right side with slight elevation
        // After rotation: X is still right, Y is up, Z is forward
        position = new THREE.Vector3(
          center.x + distance,
          center.y + maxDim * 0.3,
          center.z - distance * 0.3
        );
        break;
      case 'isometric':
        // Isometric view from corner
        position = new THREE.Vector3(
          center.x + distance * 0.7,
          center.y + distance * 0.7,
          center.z - distance * 0.7
        );
        break;
      default:
        console.warn(`Unknown view name: ${viewName}`);
        return;
    }

    this.setView(
      { x: position.x, y: position.y, z: position.z },
      { x: center.x, y: center.y, z: center.z }
    );

    this.emit('view-changed', {
      namedView: viewName,
      position: { x: position.x, y: position.y, z: position.z },
      target: { x: center.x, y: center.y, z: center.z },
    });
  }

  /**
   * Get current named view (or 'custom' if not matching any predefined view)
   * @returns {string} Named view identifier
   */
  getNamedView() {
    // This is a simplified implementation
    // In a full implementation, you would check camera position against predefined views
    return 'custom';
  }

  /**
   * Fit point cloud to screen
   * Uses perspective-correct calculation to ensure entire object is visible
   */
  fitToScreen() {
    if (this.pointClouds.length === 0) {
      console.warn('No point cloud loaded, cannot fit to screen');
      return;
    }

    const pco = this.pointClouds[0];
    const { center: worldCenter, size } = this._getPointCloudWorldBounds(pco);

    // Debug: Check what we're getting
    console.log('=== fitToScreen Debug ===');
    console.log('World center:', worldCenter);
    console.log('Size:', size);
    console.log('BBox local center:', pco.boundingBox.getCenter(new THREE.Vector3()));
    console.log('BBox min:', pco.boundingBox.min);
    console.log('BBox max:', pco.boundingBox.max);
    console.log('PCO position:', pco.position);
    console.log('PCO rotation:', pco.rotation);

    const fov = this.camera.fov * (Math.PI / 180);
    const aspect = this.container.clientWidth / this.container.clientHeight;

    // Calculate distance to fit entire object in view
    // Use the maximum dimension to ensure everything is visible
    const maxDim = Math.max(size.x, size.y, size.z);

    // Calculate required distance for vertical and horizontal FOV
    const distanceV = maxDim / (2 * Math.tan(fov / 2));
    const distanceH = maxDim / (2 * Math.tan(fov / 2) * aspect);
    const baseDistance = Math.max(distanceV, distanceH);

    // Add 10% margin to ensure entire object is visible
    const distance = baseDistance * 1.1;

    // Position camera higher and looking straight at the crown
    // Target is positioned at crown height (upper part of the tree)
    const crownTarget = new THREE.Vector3(
      worldCenter.x ,
      worldCenter.y + size.y * 0.22,  // Target at crown height (30% above center)
      worldCenter.z * 0.75
    );

    const newPosition = new THREE.Vector3(
      worldCenter.x - distance  ,   // Slight shift left
      crownTarget.y,                      // Camera at same height as crown
      worldCenter.z + distance            // In front along Z axis
    );

    this.camera.position.copy(newPosition);
    this.controls.target.copy(crownTarget);
    this.camera.lookAt(crownTarget);
    this.controls.update();

    this.emit('view-changed', {
      namedView: 'custom',
      position: { x: newPosition.x, y: newPosition.y, z: newPosition.z },
      target: { x: crownTarget.x, y: crownTarget.y, z: crownTarget.z },
    });
  }

  /**
   * Recenter camera on point cloud
   * Sets the OrbitControls target to the center of the point cloud
   * without moving the camera position
   */
  recenterOnObject() {
    if (this.pointClouds.length === 0) {
      console.warn('No point cloud loaded, cannot recenter');
      return;
    }

    const pco = this.pointClouds[0];
    const { center } = this._getPointCloudWorldBounds(pco);
    this.controls.target.copy(center);
    this.controls.update();
  }

  /**
   * Set background
   * @param {string} background - Background style ('black', 'white', 'gradient', or hex color)
   */
  setBackground(background) {
    this._setBackgroundInternal(background);
    this.config.background = background;
  }

  /**
   * Set point color type (how points are colored)
   * @param {PointColorType} colorType - Color type from PointColorType enum
   * Examples:
   * - PointColorType.RGB - Use RGB colors from point cloud data
   * - PointColorType.CLASSIFICATION - Use LAS classification (ground=brown, vegetation=green)
   * - PointColorType.ELEVATION - Color by height
   * - PointColorType.INTENSITY - Color by intensity values
   */
  setPointColorType(colorType) {
    if (this.pointClouds.length === 0) {
      console.warn('No point cloud loaded');
      return;
    }

    for (const pco of this.pointClouds) {
      if (pco.material) {
        pco.material.pointColorType = colorType;
      }
    }
  }

  /**
   * Get current point color type
   * @returns {PointColorType} Current color type
   */
  getPointColorType() {
    if (this.pointClouds.length === 0) {
      return null;
    }
    return this.pointClouds[0].material?.pointColorType;
  }

  // ===== MEASUREMENT API =====

  /**
   * Set measurement mode
   * @param {string} mode - 'none' | 'distance' | 'height' | 'area' | 'volume'
   */
  setMeasurementMode(mode) {
    if (!this.measurementManager) {
      throw new Error('Measurement manager not initialized');
    }
    this.measurementManager.setMode(mode);
  }

  /**
   * Get current measurement mode
   * @returns {string} Current measurement mode
   */
  getMeasurementMode() {
    if (!this.measurementManager) return 'none';
    return this.measurementManager.getMode();
  }

  /**
   * Start a new measurement
   * @param {string} type - Measurement type ('distance', 'height', 'area', 'volume')
   * @returns {Object} Measurement object
   */
  startMeasurement(type) {
    if (!this.measurementManager) {
      throw new Error('Measurement manager not initialized');
    }
    return this.measurementManager.startMeasurement(type);
  }

  /**
   * Finish a measurement by ID
   * @param {string} id - Measurement ID
   */
  finishMeasurement(id) {
    if (!this.measurementManager) return;
    this.measurementManager.finishMeasurement(id);
  }

  /**
   * Get all measurements
   * @returns {Array} Array of measurement summaries
   */
  getMeasurements() {
    if (!this.measurementManager) return [];
    return this.measurementManager.getMeasurements();
  }

  /**
   * Clear all measurements
   */
  clearMeasurements() {
    if (!this.measurementManager) return;
    this.measurementManager.clearMeasurements();
  }

  /**
   * Remove a measurement by ID
   * @param {string} id - Measurement ID
   */
  removeMeasurement(id) {
    if (!this.measurementManager) return;
    this.measurementManager.removeMeasurement(id);
  }

  // ===== ADVANCED API =====

  /**
   * Get Potree instance (advanced use - escape hatch)
   * @returns {Potree} Potree instance
   */
  getPotree() {
    return this.potree;
  }

  /**
   * Get Three.js scene (advanced use)
   * @returns {THREE.Scene} Three.js scene
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get Three.js camera (advanced use)
   * @returns {THREE.Camera} Three.js camera
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Get Three.js renderer (advanced use)
   * @returns {THREE.WebGLRenderer} Three.js renderer
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Dispose and clean up all resources
   */
  dispose() {
    if (this.isDisposed) return;

    this.isDisposed = true;

    // Stop animation loop
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', this._boundResizeHandler);
    this.removeAllListeners();

    // Dispose measurement manager
    if (this.measurementManager) {
      this.measurementManager.dispose();
      this.measurementManager = null;
    }

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    // Dispose point clouds
    for (const pco of this.pointClouds) {
      if (pco.material) {
        pco.material.dispose();
      }
      if (pco.geometry) {
        pco.geometry.dispose();
      }
      this.scene.remove(pco);
    }
    this.pointClouds = [];

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    // Clear scene
    if (this.scene) {
      this.scene = null;
    }

    this.camera = null;
    this.potree = null;
  }
}
