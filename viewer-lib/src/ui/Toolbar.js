/**
 * Configurable toolbar UI for PotreeViewer
 * Provides controls for navigation, measurements, and views
 */
export class Toolbar {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.container = null;
    this.currentMeasurement = null;

    // Default button groups
    const defaultButtons = [
      // General controls
      { id: 'fit', group: 'general', label: 'Fit to Screen', icon: '⊡', action: () => this.viewer.fitToScreen() },
      { id: 'clear', group: 'general', label: 'Clear Measurements', icon: '🗑', action: () => this._clearMeasurements() },

      // Measurements
      { id: 'distance', group: 'measurement', label: 'Distance', icon: '📏', action: () => this._setMeasurementMode('distance') },
      { id: 'height', group: 'measurement', label: 'Height', icon: '↕', action: () => this._setMeasurementMode('height') },
      { id: 'angle', group: 'measurement', label: 'Angle', icon: '∠', action: () => this._setMeasurementMode('angle') },
      { id: 'radius', group: 'measurement', label: 'Radius', icon: '⊙', action: () => this._setMeasurementMode('radius') },
      { id: 'volume', group: 'measurement', label: 'Volume', icon: '⊚', action: () => this._setMeasurementMode('volume') },

      // Views
      { id: 'view-left', group: 'view', label: 'Left View', icon: '←', action: () => this.viewer.setNamedView('left') },
      { id: 'view-right', group: 'view', label: 'Right View', icon: '→', action: () => this.viewer.setNamedView('right') },
      { id: 'view-front', group: 'view', label: 'Front View', icon: '↓', action: () => this.viewer.setNamedView('front') },
      { id: 'view-back', group: 'view', label: 'Back View', icon: '↑', action: () => this.viewer.setNamedView('back') },
      { id: 'view-top', group: 'view', label: 'Top View', icon: '⊤', action: () => this.viewer.setNamedView('top') },
      { id: 'view-bottom', group: 'view', label: 'Bottom View', icon: '⊥', action: () => this.viewer.setNamedView('bottom') },
    ];

    this.options = {
      alignment: options.alignment || 'top-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'bottom'
      buttons: options.buttons || defaultButtons,
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

    // Group buttons by their group property
    const buttonGroups = {};
    for (const btn of this.options.buttons) {
      if (!buttonGroups[btn.group]) {
        buttonGroups[btn.group] = [];
      }
      buttonGroups[btn.group].push(btn);
    }

    // Create button groups
    for (const [groupName, buttons] of Object.entries(buttonGroups)) {
      const groupContainer = this._createButtonGroup(buttons);
      this.container.appendChild(groupContainer);
    }

    // Inject styles
    this._injectStyles();

    // Add to viewer container
    this.viewer.container.appendChild(this.container);
  }

  /**
   * Get container styles based on alignment
   * @private
   */
  _getContainerStyles() {
    const baseStyles = `
      position: absolute;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      z-index: 1000;
      user-select: none;
      pointer-events: auto;
    `;

    const alignmentMap = {
      'top-left': 'top: 12px; left: 12px; flex-direction: row;',
      'top-right': 'top: 12px; right: 12px; flex-direction: row;',
      'bottom-left': 'bottom: 12px; left: 12px; flex-direction: row;',
      'bottom-right': 'bottom: 12px; right: 12px; flex-direction: row;',
      'left': 'left: 12px; top: 50%; transform: translateY(-50%); flex-direction: column;',
      'right': 'right: 12px; top: 50%; transform: translateY(-50%); flex-direction: column;',
      'top': 'top: 12px; left: 50%; transform: translateX(-50%); flex-direction: row;',
      'bottom': 'bottom: 12px; left: 50%; transform: translateX(-50%); flex-direction: row;',
    };

    return baseStyles + (alignmentMap[this.options.alignment] || alignmentMap['top-right']);
  }

  /**
   * Create a button group
   * @private
   */
  _createButtonGroup(buttons) {
    const group = document.createElement('div');
    group.className = 'potree-toolbar-group';
    group.style.cssText = `
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    `;

    for (const btnConfig of buttons) {
      const btn = this._createButton(btnConfig);
      group.appendChild(btn);
    }

    return group;
  }

  /**
   * Set measurement mode helper
   * @private
   */
  _setMeasurementMode(mode) {
    this.viewer.setMeasurementMode(mode);

    // Update active state for measurement buttons
    const buttons = this.container.querySelectorAll('.potree-toolbar-button[data-mode]');
    buttons.forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Clear all measurements
   * @private
   */
  _clearMeasurements() {
    this.viewer.clearMeasurements();

    // Exit measurement mode completely
    this.viewer.setMeasurementMode('none');

    // Deactivate all measurement buttons
    const buttons = this.container.querySelectorAll('.potree-toolbar-button[data-mode]');
    buttons.forEach(btn => btn.classList.remove('active'));
  }

  /**
   * Create a button from configuration
   * @private
   */
  _createButton(config) {
    const button = document.createElement('button');
    button.className = 'potree-toolbar-button';
    button.title = config.label; // Tooltip

    // Add icon and label
    const iconSpan = document.createElement('span');
    iconSpan.className = 'potree-button-icon';
    iconSpan.textContent = config.icon;
    button.appendChild(iconSpan);

    // Add data attribute for measurement modes
    if (config.group === 'measurement') {
      button.dataset.mode = config.id;
    }

    button.onclick = (e) => {
      e.stopPropagation();
      config.action();
    };

    return button;
  }

  /**
   * Attach event listeners to viewer
   * @private
   */
  _attachEventListeners() {
    // Update button states when measurement mode changes
    this.viewer.on('measurement-started', (measurement) => {
      this._updateButtonStates(measurement.type);
    });

    this.viewer.on('measurement-mode-changed', (mode) => {
      this._updateButtonStates(mode);
    });
  }

  /**
   * Update button active states
   * @private
   */
  _updateButtonStates(activeMode) {
    const buttons = this.container.querySelectorAll('.potree-toolbar-button[data-mode]');
    buttons.forEach(btn => {
      if (btn.dataset.mode === activeMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
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
      .potree-toolbar {
        background: transparent;
        pointer-events: none;
      }

      .potree-toolbar-group {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        padding: 4px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        pointer-events: auto;
      }

      .potree-toolbar-button {
        width: 40px;
        height: 40px;
        padding: 0;
        border: none;
        background: transparent;
        color: #333;
        font-size: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .potree-toolbar-button:hover {
        background: rgba(0, 0, 0, 0.08);
      }

      .potree-toolbar-button:active {
        background: rgba(0, 0, 0, 0.15);
        transform: scale(0.95);
      }

      .potree-toolbar-button.active {
        background: #007bff;
        color: white;
      }

      .potree-toolbar-button.active:hover {
        background: #0056b3;
      }

      .potree-button-icon {
        display: block;
        line-height: 1;
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
