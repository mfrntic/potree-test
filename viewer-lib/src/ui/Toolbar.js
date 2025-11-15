/**
 * Minimal toolbar UI for PotreeViewer
 * Provides basic controls for navigation, measurements, and views
 */
export class Toolbar {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.container = null;
    this.currentMeasurement = null;

    this.options = {
      position: options.position || 'top', // 'top' | 'bottom' | 'left' | 'right'
      showMeasurements: options.showMeasurements !== false,
      showViews: options.showViews !== false,
      showControls: options.showControls !== false,
      ...options
    };

    this._init();
    this._attachEventListeners();
  }

  /**
   * Initialize toolbar HTML
   * @private
   */
  _init() {
    // Create toolbar container
    this.container = document.createElement('div');
    this.container.className = 'potree-toolbar';
    this.container.style.cssText = this._getContainerStyles();

    // Add sections
    if (this.options.showControls) {
      this.container.appendChild(this._createControlsSection());
    }

    if (this.options.showMeasurements) {
      this.container.appendChild(this._createMeasurementsSection());
    }

    if (this.options.showViews) {
      this.container.appendChild(this._createViewsSection());
    }

    // Add measurement info display
    this.measurementInfo = document.createElement('div');
    this.measurementInfo.className = 'potree-measurement-info';
    this.measurementInfo.style.cssText = `
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      display: none;
      margin-left: auto;
    `;
    this.container.appendChild(this.measurementInfo);

    // Inject styles
    this._injectStyles();

    // Add to viewer container
    this.viewer.container.appendChild(this.container);
  }

  /**
   * Get container styles based on position
   * @private
   */
  _getContainerStyles() {
    const baseStyles = `
      position: absolute;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      user-select: none;
    `;

    switch (this.options.position) {
      case 'top':
        return baseStyles + 'top: 0; left: 0; right: 0; flex-direction: row;';
      case 'bottom':
        return baseStyles + 'bottom: 0; left: 0; right: 0; flex-direction: row;';
      case 'left':
        return baseStyles + 'left: 0; top: 0; bottom: 0; flex-direction: column;';
      case 'right':
        return baseStyles + 'right: 0; top: 0; bottom: 0; flex-direction: column;';
      default:
        return baseStyles + 'top: 0; left: 0; right: 0; flex-direction: row;';
    }
  }

  /**
   * Create controls section
   * @private
   */
  _createControlsSection() {
    const section = this._createSection('Controls');

    // Navigate button
    const navigateBtn = this._createButton('Navigate', () => {
      this.viewer.setMeasurementMode('none');
      this._setActiveButton(navigateBtn);
    });
    navigateBtn.classList.add('active');
    section.appendChild(navigateBtn);

    // Fit to screen button
    const fitBtn = this._createButton('Fit', () => {
      this.viewer.fitToScreen();
    });
    section.appendChild(fitBtn);

    return section;
  }

  /**
   * Create measurements section
   * @private
   */
  _createMeasurementsSection() {
    const section = this._createSection('Measurements');

    // Distance button
    const distanceBtn = this._createButton('Distance', () => {
      this.viewer.setMeasurementMode('distance');
      this._setActiveButton(distanceBtn);
    });
    section.appendChild(distanceBtn);

    // Height button
    const heightBtn = this._createButton('Height', () => {
      this.viewer.setMeasurementMode('height');
      this._setActiveButton(heightBtn);
    });
    section.appendChild(heightBtn);

    // Clear measurements button
    const clearBtn = this._createButton('Clear', () => {
      this.viewer.clearMeasurements();
      this.measurementInfo.style.display = 'none';
    });
    clearBtn.style.marginLeft = '8px';
    section.appendChild(clearBtn);

    return section;
  }

  /**
   * Create views section
   * @private
   */
  _createViewsSection() {
    const section = this._createSection('Views');

    const views = [
      { name: 'Top', value: 'top' },
      { name: 'Front', value: 'front' },
      { name: 'Right', value: 'right' },
      { name: 'Iso', value: 'isometric' },
    ];

    for (const view of views) {
      const btn = this._createButton(view.name, () => {
        this.viewer.setNamedView(view.value);
      });
      section.appendChild(btn);
    }

    return section;
  }

  /**
   * Create a section container
   * @private
   */
  _createSection(title) {
    const section = document.createElement('div');
    section.className = 'potree-toolbar-section';
    section.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      border-right: 1px solid #ddd;
    `;
    return section;
  }

  /**
   * Create a button
   * @private
   */
  _createButton(text, onClick) {
    const button = document.createElement('button');
    button.className = 'potree-toolbar-button';
    button.textContent = text;
    button.onclick = onClick;
    return button;
  }

  /**
   * Set active button (toggle active state)
   * @private
   */
  _setActiveButton(activeButton) {
    // Remove active class from all buttons
    const buttons = this.container.querySelectorAll('.potree-toolbar-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Add active class to the clicked button
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  /**
   * Attach event listeners to viewer
   * @private
   */
  _attachEventListeners() {
    // Listen for measurement events
    this.viewer.on('measurement-finished', (measurement) => {
      this._displayMeasurementResult(measurement);
    });

    this.viewer.on('measurement-cleared', () => {
      this.measurementInfo.style.display = 'none';
    });
  }

  /**
   * Display measurement result
   * @private
   */
  _displayMeasurementResult(measurement) {
    let text = '';

    if (measurement.type === 'distance' && measurement.result.distanceTotal) {
      text = `Distance: ${measurement.result.distanceTotal.toFixed(2)} m`;
    } else if (measurement.type === 'height' && measurement.result.deltaZ !== undefined) {
      text = `Height (ΔZ): ${measurement.result.deltaZ.toFixed(2)} m`;
      if (measurement.result.distance3D) {
        text += ` | 3D Distance: ${measurement.result.distance3D.toFixed(2)} m`;
      }
    }

    if (text) {
      this.measurementInfo.textContent = text;
      this.measurementInfo.style.display = 'block';
    }
  }

  /**
   * Inject CSS styles
   * @private
   */
  _injectStyles() {
    if (document.getElementById('potree-toolbar-styles')) return;

    const style = document.createElement('style');
    style.id = 'potree-toolbar-styles';
    style.textContent = `
      .potree-toolbar-button {
        padding: 6px 12px;
        border: 1px solid #ddd;
        background: white;
        color: #333;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .potree-toolbar-button:hover {
        background: #f5f5f5;
        border-color: #999;
      }

      .potree-toolbar-button:active {
        background: #e0e0e0;
      }

      .potree-toolbar-button.active {
        background: #007bff;
        color: white;
        border-color: #0056b3;
      }

      .potree-toolbar-button.active:hover {
        background: #0056b3;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Dispose and clean up
   */
  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}
