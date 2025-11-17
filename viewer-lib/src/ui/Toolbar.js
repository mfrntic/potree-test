/**
 * Configurable toolbar UI for PotreeViewer
 * Provides controls for navigation, measurements, and views
 */
import { PointColorType } from '../index.js';

export class Toolbar {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.container = null;
    this.currentMeasurement = null;
    this.colorModeDropdown = null;

    // SVG Icons from Lucide (https://lucide.dev) - MIT License
    const ICONS = {
      maximize: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
      trash: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
      ruler: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>',
      moveVertical: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m8 18 4 4 4-4"/><path d="m8 6 4-4 4 4"/></svg>',
      triangle: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>',
      circleDot: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/></svg>',
      box: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
      arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
      arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
      arrowDown: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
      arrowUp: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
      chevronUp: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
      chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
      palette: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
      eye: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    };

    // Color modes available (most commonly used from potree-core)
    this.colorModes = [
      { id: PointColorType.RGB, label: 'RGB' },
      { id: PointColorType.ELEVATION, label: 'Elevation' },
      { id: PointColorType.CLASSIFICATION, label: 'Classification' },
      { id: PointColorType.INTENSITY, label: 'Intensity' },
      { id: PointColorType.INTENSITY_GRADIENT, label: 'Intensity Gradient' },
      { id: PointColorType.RETURN_NUMBER, label: 'Return Number' },
      { id: PointColorType.SOURCE, label: 'Source ID' },
      { id: PointColorType.NORMAL, label: 'Normal' },
      { id: PointColorType.LOD, label: 'Level of Detail' },
    ];

    // Background options
    this.backgrounds = [
      { id: 'black', label: 'Black' },
      { id: 'white', label: 'White' },
      { id: 'gradient', label: 'Gradient' },
      { id: 'skybox', label: 'Skybox' },
    ];

    // View options (for dropdown)
    this.viewOptions = [
      { id: 'left', label: 'Left View' },
      { id: 'right', label: 'Right View' },
      { id: 'front', label: 'Front View' },
      { id: 'back', label: 'Back View' },
      { id: 'top', label: 'Top View' },
      { id: 'bottom', label: 'Bottom View' },
    ];

    // Default button groups
    const defaultButtons = [
      // Appearance dropdown (color modes + backgrounds)
      { id: 'appearance', group: 'appearance', label: 'Appearance', icon: ICONS.palette, type: 'appearance-dropdown' },

      // Measurements
      { id: 'distance', group: 'measurement', label: 'Distance', icon: ICONS.ruler, action: () => this._setMeasurementMode('distance') },
      { id: 'height', group: 'measurement', label: 'Height', icon: ICONS.moveVertical, action: () => this._setMeasurementMode('height') },
      { id: 'angle', group: 'measurement', label: 'Angle', icon: ICONS.triangle, action: () => this._setMeasurementMode('angle') },
      { id: 'radius', group: 'measurement', label: 'Radius', icon: ICONS.circleDot, action: () => this._setMeasurementMode('radius') },
      { id: 'volume', group: 'measurement', label: 'Volume', icon: ICONS.box, action: () => this._setMeasurementMode('volume') },
      { id: 'clear', group: 'measurement', label: 'Clear Measurements', icon: ICONS.trash, action: () => this._clearMeasurements() },

      // Views - Fit to screen as button, rest as dropdown
      { id: 'fit', group: 'view', label: 'Fit to Screen', icon: ICONS.maximize, action: () => this.viewer.fitToScreen() },
      { id: 'view-selector', group: 'view', label: 'Views', icon: ICONS.eye, type: 'view-dropdown' },
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
    // Handle different dropdown types
    if (config.type === 'appearance-dropdown') {
      return this._createAppearanceDropdown(config);
    }
    if (config.type === 'view-dropdown') {
      return this._createViewDropdown(config);
    }

    const button = document.createElement('button');
    button.className = 'potree-toolbar-button';
    button.title = config.label; // Tooltip

    // Add icon (SVG or text)
    const iconSpan = document.createElement('span');
    iconSpan.className = 'potree-button-icon';
    iconSpan.innerHTML = config.icon; // Use innerHTML to support SVG
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
   * Create appearance dropdown (color modes + backgrounds)
   * @private
   */
  _createAppearanceDropdown(config) {
    const container = document.createElement('div');
    container.className = 'potree-appearance-dropdown';
    container.style.cssText = 'position: relative;';

    // Create dropdown button
    const button = document.createElement('button');
    button.className = 'potree-toolbar-button';
    button.title = config.label;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'potree-button-icon';
    iconSpan.innerHTML = config.icon;
    button.appendChild(iconSpan);

    // Create dropdown menu
    const menu = document.createElement('div');
    menu.className = 'potree-dropdown-menu';
    menu.style.cssText = `
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      background: rgba(40, 44, 52, 0.95);
      backdrop-filter: blur(8px);
      border-radius: 6px;
      padding: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      min-width: 180px;
      z-index: 10000;
    `;

    // Add section header for Color Modes
    const colorHeader = document.createElement('div');
    colorHeader.textContent = 'Point Color Mode';
    colorHeader.style.cssText = `
      padding: 6px 12px 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 0.5px;
    `;
    menu.appendChild(colorHeader);

    // Add color mode options
    this.colorModes.forEach(mode => {
      const option = document.createElement('button');
      option.className = 'potree-dropdown-option';
      option.textContent = mode.label;
      option.dataset.colorMode = mode.id;
      option.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.85);
        text-align: left;
        cursor: pointer;
        border-radius: 4px;
        font-size: 13px;
        transition: background 0.15s ease;
      `;

      option.onclick = (e) => {
        e.stopPropagation();
        this.viewer.setPointColorType(mode.id);
        menu.style.display = 'none';

        // Update active state - only for color mode options
        menu.querySelectorAll('[data-color-mode]').forEach(opt => {
          opt.style.background = 'transparent';
        });
        option.style.background = 'rgba(52, 152, 219, 0.3)';
      };

      option.onmouseenter = () => {
        if (option.style.background !== 'rgba(52, 152, 219, 0.3)') {
          option.style.background = 'rgba(255, 255, 255, 0.1)';
        }
      };

      option.onmouseleave = () => {
        if (option.style.background !== 'rgba(52, 152, 219, 0.3)') {
          option.style.background = 'transparent';
        }
      };

      menu.appendChild(option);
    });

    // Add divider
    const divider = document.createElement('div');
    divider.style.cssText = `
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 6px 0;
    `;
    menu.appendChild(divider);

    // Add section header for Backgrounds
    const bgHeader = document.createElement('div');
    bgHeader.textContent = 'Background';
    bgHeader.style.cssText = `
      padding: 4px 12px 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 0.5px;
    `;
    menu.appendChild(bgHeader);

    // Add background options
    this.backgrounds.forEach(bg => {
      const option = document.createElement('button');
      option.className = 'potree-dropdown-option';
      option.textContent = bg.label;
      option.dataset.background = bg.id;
      option.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.85);
        text-align: left;
        cursor: pointer;
        border-radius: 4px;
        font-size: 13px;
        transition: background 0.15s ease;
      `;

      option.onclick = (e) => {
        e.stopPropagation();
        this.viewer.setBackground(bg.id);
        menu.style.display = 'none';

        // Update active state - only for background options
        menu.querySelectorAll('[data-background]').forEach(opt => {
          opt.style.background = 'transparent';
        });
        option.style.background = 'rgba(52, 152, 219, 0.3)';
      };

      option.onmouseenter = () => {
        if (option.style.background !== 'rgba(52, 152, 219, 0.3)') {
          option.style.background = 'rgba(255, 255, 255, 0.1)';
        }
      };

      option.onmouseleave = () => {
        if (option.style.background !== 'rgba(52, 152, 219, 0.3)') {
          option.style.background = 'transparent';
        }
      };

      menu.appendChild(option);
    });

    // Toggle dropdown on button click
    button.onclick = (e) => {
      e.stopPropagation();
      const isVisible = menu.style.display === 'block';
      menu.style.display = isVisible ? 'none' : 'block';
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    container.appendChild(button);
    container.appendChild(menu);

    // Store reference
    this.appearanceDropdown = { container, menu, button };

    return container;
  }

  /**
   * Create view dropdown
   * @private
   */
  _createViewDropdown(config) {
    const container = document.createElement('div');
    container.className = 'potree-view-dropdown';
    container.style.cssText = 'position: relative;';

    // Create dropdown button
    const button = document.createElement('button');
    button.className = 'potree-toolbar-button';
    button.title = config.label;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'potree-button-icon';
    iconSpan.innerHTML = config.icon;
    button.appendChild(iconSpan);

    // Create dropdown menu
    const menu = document.createElement('div');
    menu.className = 'potree-dropdown-menu';
    menu.style.cssText = `
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      background: rgba(40, 44, 52, 0.95);
      backdrop-filter: blur(8px);
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      min-width: 140px;
      z-index: 10000;
    `;

    // Add view options
    this.viewOptions.forEach(view => {
      const option = document.createElement('button');
      option.className = 'potree-dropdown-option';
      option.textContent = view.label;
      option.dataset.view = view.id;
      option.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.85);
        text-align: left;
        cursor: pointer;
        border-radius: 4px;
        font-size: 13px;
        transition: background 0.15s ease;
      `;

      option.onclick = (e) => {
        e.stopPropagation();
        this.viewer.setNamedView(view.id);
        menu.style.display = 'none';
      };

      option.onmouseenter = () => {
        option.style.background = 'rgba(255, 255, 255, 0.1)';
      };

      option.onmouseleave = () => {
        option.style.background = 'transparent';
      };

      menu.appendChild(option);
    });

    // Toggle dropdown on button click
    button.onclick = (e) => {
      e.stopPropagation();
      const isVisible = menu.style.display === 'block';
      menu.style.display = isVisible ? 'none' : 'block';
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    container.appendChild(button);
    container.appendChild(menu);

    // Store reference
    this.viewDropdown = { container, menu, button };

    return container;
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

    // Update appearance dropdown when color type changes
    this.viewer.on('color-type-changed', (colorType) => {
      this._updateAppearanceDropdown(colorType);
    });

    // Initialize appearance dropdown with current color type
    this.viewer.on('pointcloud-loaded', () => {
      const currentColorType = this.viewer.getPointColorType();
      if (currentColorType !== undefined) {
        this._updateAppearanceDropdown(currentColorType);
      }
    });

    // Update appearance dropdown when background changes
    this.viewer.on('background-changed', (background) => {
      this._updateBackgroundSelection(background);
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
   * Update appearance dropdown to highlight active color type
   * @private
   */
  _updateAppearanceDropdown(colorType) {
    if (!this.appearanceDropdown || !this.appearanceDropdown.menu) {
      return;
    }

    const options = this.appearanceDropdown.menu.querySelectorAll('[data-color-mode]');
    options.forEach(option => {
      if (parseInt(option.dataset.colorMode) === colorType) {
        option.style.background = 'rgba(52, 152, 219, 0.3)';
      } else {
        option.style.background = 'transparent';
      }
    });
  }

  /**
   * Update appearance dropdown to highlight active background
   * @private
   */
  _updateBackgroundSelection(background) {
    if (!this.appearanceDropdown || !this.appearanceDropdown.menu) {
      return;
    }

    const options = this.appearanceDropdown.menu.querySelectorAll('[data-background]');
    options.forEach(option => {
      if (option.dataset.background === background) {
        option.style.background = 'rgba(52, 152, 219, 0.3)';
      } else {
        option.style.background = 'transparent';
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
        background: rgba(40, 44, 52, 0.75);
        backdrop-filter: blur(8px);
        border-radius: 8px;
        padding: 3px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        pointer-events: auto;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .potree-toolbar-button {
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.85);
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .potree-toolbar-button:hover {
        background: rgba(255, 255, 255, 0.12);
      }

      .potree-toolbar-button:active {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(0.95);
      }

      .potree-toolbar-button.active {
        background: #3498db;
        color: white;
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.25);
      }

      .potree-toolbar-button.active:hover {
        background: #2980b9;
      }

      .potree-button-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }

      .potree-button-icon svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
        stroke-width: 1.8;
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
