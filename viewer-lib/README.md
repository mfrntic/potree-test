# PotreeViewer

Modern, framework-agnostic JavaScript library for visualizing large-scale point clouds in web browsers. Built on [potree-core](https://github.com/tentone/potree-core) and [Three.js](https://threejs.org/).

## Features

- 🚀 **Modern ESM architecture** - Clean imports, no global variables
- 🎯 **Framework-agnostic** - Works with vanilla JS, React, Vue, or any framework
- 📏 **5 measurement types** - Distance, Height, Angle, Radius, and Volume measurements
- 🎨 **Customizable UI** - Configurable Toolbar and Console components
- 🌈 **LAS Classification support** - Automatic color-coding based on point classifications
- 💡 **Eye-Dome Lighting (EDL)** - Enhanced depth perception and structure visibility
- 📦 **Lightweight** - No jQuery or legacy dependencies
- 🔧 **Full API** - Programmatic control over viewer, measurements, and camera
- 🎬 **Event-driven** - Subscribe to viewer events for custom integrations

## Quick Start

### Installation

#### Option 1: npm Package (Recommended)

```bash
npm install potree-viewer
```

#### Option 2: Local Development

```bash
npm install potree-core three
```

Copy the `viewer-lib` directory to your project.

### Minimal Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PotreeViewer Demo</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    #viewer {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="viewer"></div>

  <script type="module">
    import { PotreeViewer } from './viewer-lib/src/index.js';

    const viewer = new PotreeViewer({
      container: document.getElementById('viewer'),
      pointCloudUrl: 'path/to/metadata.json',
      pointCloudName: 'My Point Cloud',
      autoFitOnLoad: true,
    });
  </script>
</body>
</html>
```

### Complete Example with UI

```javascript
import { PotreeViewer, Toolbar, PotreeViewerConsole } from 'potree-viewer';

// Create viewer
const viewer = new PotreeViewer({
  container: document.getElementById('viewer'),
  pointCloudUrl: '/pointcloud/metadata.json',
  pointCloudName: 'Forest Scan',
  description: 'LiDAR scan of forest area',
  language: 'en',
  pointBudget: 1_000_000,
  fov: 80,
  initialView: 'right',
  material: {
    size: 0.6,
    minSize: 0.4,
    pointSizeType: 'FIXED',
    shape: 'SQUARE',
  },
  background: 'black',
  autoFitOnLoad: true,

  // Callbacks
  onReady: (viewerInstance) => {
    console.log('Viewer ready!', viewerInstance);
  },
  onPointCloudLoaded: (pointCloud) => {
    console.log('Point cloud loaded:', pointCloud);
  },
  onError: (error) => {
    console.error('Viewer error:', error);
  }
});

// Create toolbar with measurement and view controls
const toolbar = new Toolbar(viewer, {
  alignment: 'top-right'
});

// Create console for status messages and measurement results
const console = new PotreeViewerConsole(viewer, {
  position: 'bottom-left',
  width: '360px',
  collapsed: false,
  showTimestamp: true,
  visible: true
});

// Keyboard shortcut to toggle console (Ctrl+`)
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === '`') {
    console.toggleVisibility();
  }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  toolbar.dispose();
  console.dispose();
  viewer.dispose();
});
```

## Configuration

### PotreeViewer Options

```javascript
const viewer = new PotreeViewer({
  // Required
  container: HTMLElement,              // DOM element to render into

  // Point cloud settings
  pointCloudUrl: string,               // Path to metadata.json
  pointCloudName: string,              // Display name (default: 'pointcloud')
  description: string,                 // Description text

  // Viewer settings
  language: 'en' | 'hr',               // UI language (default: 'en')
  pointBudget: number,                 // Max visible points (default: 1,000,000)
  fov: number,                         // Field of view in degrees (default: 80)

  // Initial view
  initialView: 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' |
               { position: {x, y, z}, target: {x, y, z} },

  // Material settings
  material: {
    size: number,                      // Point size (default: 0.6)
    minSize: number,                   // Min point size (default: 0.4)
    pointSizeType: 'FIXED' | 'ATTENUATED' | 'ADAPTIVE',
    shape: 'SQUARE' | 'CIRCLE',
  },

  // Background
  background: 'black' | 'white' | 'gradient' | '#hexcolor',

  // Behavior
  autoFitOnLoad: boolean,              // Auto-fit camera to point cloud
  loadSettingsFromUrl: boolean,        // Load settings from URL params

  // Callbacks
  onReady: (viewer) => void,
  onPointCloudLoaded: (pointCloud) => void,
  onError: (error) => void,
});
```

### Toolbar Options

```javascript
const toolbar = new Toolbar(viewer, {
  alignment: 'top-right',  // Position of toolbar
  // Options: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' |
  //          'left' | 'right' | 'top' | 'bottom'

  buttons: [...],          // Custom button configuration (optional)
});
```

**Default toolbar buttons:**
- **Measurements**: Distance, Height, Angle, Radius, Volume, Clear
- **Views**: Fit to Screen, Top, Bottom, Front, Back, Left, Right

### PotreeViewerConsole Options

```javascript
const console = new PotreeViewerConsole(viewer, {
  position: 'bottom-left', // Position of console
  // Options: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'

  width: '360px',          // Console width
  collapsed: false,        // Start collapsed
  showTimestamp: true,     // Show timestamp for each message
  visible: true,           // Initially visible
  maxMessages: 50,         // Maximum messages to keep
});
```

## API Reference

### Viewer Methods

#### Camera & View Control

```javascript
// Set camera position and target
viewer.setView(
  { x: 10, y: 10, z: 10 },  // position
  { x: 0, y: 0, z: 0 }      // target
);

// Set predefined view
viewer.setNamedView('top' | 'bottom' | 'front' | 'back' | 'left' | 'right');

// Get current view name
const viewName = viewer.getNamedView(); // returns view name or 'custom'

// Fit point cloud to screen
viewer.fitToScreen();
```

#### Point Cloud Management

```javascript
// Load additional point cloud
await viewer.loadPointCloud('path/to/metadata.json', 'cloud-name');

// Set point budget
viewer.setPointBudget(2_000_000);

// Set background
viewer.setBackground('white');
viewer.setBackground('#87CEEB');
```

#### Point Coloring

```javascript
import { PointColorType } from 'potree-viewer';

// Set color mode
viewer.setPointColorType(PointColorType.RGB);           // RGB colors (default)
viewer.setPointColorType(PointColorType.CLASSIFICATION); // LAS classification
viewer.setPointColorType(PointColorType.ELEVATION);     // Height-based gradient
viewer.setPointColorType(PointColorType.INTENSITY);     // Intensity-based

// Get current color type
const colorType = viewer.getPointColorType();
```

**Available PointColorType values:**
- `RGB` - RGB colors from point cloud data
- `CLASSIFICATION` - LAS classification colors (ground=brown, vegetation=green)
- `ELEVATION` - Height-based gradient
- `INTENSITY` - Intensity-based colors
- `DEPTH` - Distance from camera
- `LOD` - Level of detail
- `NORMAL` - Surface normals

#### Measurements

```javascript
// Set measurement mode
viewer.setMeasurementMode('distance');  // Distance measurement
viewer.setMeasurementMode('height');    // Height measurement
viewer.setMeasurementMode('angle');     // Angle measurement
viewer.setMeasurementMode('radius');    // Radius measurement
viewer.setMeasurementMode('volume');    // Volume measurement
viewer.setMeasurementMode('none');      // Return to navigation mode

// Get current mode
const mode = viewer.getMeasurementMode();

// Programmatic measurement control
const measurement = viewer.startMeasurement('distance');
viewer.finishMeasurement(measurement.id);
viewer.removeMeasurement(measurement.id);
viewer.clearMeasurements();

// Get all measurements
const measurements = viewer.getMeasurements();
// Returns: [{ id, type, points, result }, ...]
```

#### Advanced Access

```javascript
// Get underlying instances (for advanced use)
const potree = viewer.getPotree();      // Potree instance
const scene = viewer.getScene();        // Three.js scene
const camera = viewer.getCamera();      // Three.js camera
const renderer = viewer.getRenderer();  // Three.js renderer
```

#### Cleanup

```javascript
// Dispose viewer and free resources
viewer.dispose();
```

### Toolbar Methods

```javascript
// Create toolbar
const toolbar = new Toolbar(viewer, options);

// Dispose toolbar
toolbar.dispose();
```

### Console Methods

```javascript
// Show/hide console
console.show();
console.hide();
console.toggleVisibility();
console.isVisible(); // returns true/false

// Toggle collapsed state
console.toggle();

// Clear all messages
console.clear();

// Add custom messages
console.log('Message', 'info');    // info, success, warning, error
console.log('Success!', 'success');
console.log('Warning!', 'warning');
console.log('Error!', 'error');

// Dispose console
console.dispose();
```

### Events

Subscribe to viewer events:

```javascript
// Viewer lifecycle
viewer.on('ready', (viewerInstance) => {
  console.log('Viewer initialized');
});

viewer.on('error', (error) => {
  console.error('Error:', error);
});

// Point cloud events
viewer.on('pointcloud-loaded', (pointCloud) => {
  console.log('Point cloud loaded:', pointCloud.name);
});

// View events
viewer.on('view-changed', ({ namedView, position, target }) => {
  console.log('Camera moved to:', namedView);
});

// Measurement events
viewer.on('measurement-started', (measurement) => {
  console.log('Measurement started:', measurement.type);
});

viewer.on('measurement-updated', (measurement) => {
  console.log('Point added to measurement');
});

viewer.on('measurement-finished', (measurement) => {
  console.log('Measurement complete:', measurement.result);
});

viewer.on('measurement-mode-changed', (mode) => {
  console.log('Measurement mode:', mode);
});

viewer.on('measurement-cleared', () => {
  console.log('All measurements cleared');
});

// Unsubscribe
viewer.off('ready', handler);
```

## Measurements

### Distance Measurement

Click multiple points to create line segments. Press **Enter** to finish or **ESC** to cancel.

```javascript
// Start measurement
viewer.setMeasurementMode('distance');

// Result format
{
  id: 'measurement-123',
  type: 'distance',
  points: [{ x, y, z }, { x, y, z }, ...],
  result: {
    distanceTotal: 45.67  // Total distance in meters
  }
}
```

### Height Measurement

Click 2 points to measure vertical (Y-axis) difference.

```javascript
// Start measurement
viewer.setMeasurementMode('height');

// Result format
{
  id: 'measurement-456',
  type: 'height',
  points: [{ x, y, z }, { x, y, z }],
  result: {
    deltaY: 12.34,        // Vertical difference in meters
    height: 12.34,        // Alias for deltaY
    distance3D: 15.67     // 3D distance in meters
  }
}
```

### Angle Measurement

Click 3 points to measure angle formed by the points.

```javascript
// Start measurement
viewer.setMeasurementMode('angle');

// Result format
{
  id: 'measurement-789',
  type: 'angle',
  points: [{ x, y, z }, { x, y, z }, { x, y, z }],
  result: {
    angle: 45.5  // Angle in degrees
  }
}
```

### Radius Measurement

Click 3 points to calculate circle radius.

```javascript
// Start measurement
viewer.setMeasurementMode('radius');

// Result format
{
  id: 'measurement-abc',
  type: 'radius',
  points: [{ x, y, z }, { x, y, z }, { x, y, z }],
  result: {
    radius: 5.67  // Radius in meters
  }
}
```

### Volume Measurement

Click multiple points to define polygon on ground, then specify height. Press **Enter** to finish.

```javascript
// Start measurement
viewer.setMeasurementMode('volume');

// Result format
{
  id: 'measurement-def',
  type: 'volume',
  points: [{ x, y, z }, ...],
  result: {
    volume: 123.45  // Volume in cubic meters
  }
}
```

## Framework Integration

### React

```jsx
import { useEffect, useRef } from 'react';
import { PotreeViewer, Toolbar, PotreeViewerConsole } from 'potree-viewer';

function PointCloudViewer({ pointCloudUrl }) {
  const containerRef = useRef();
  const viewerRef = useRef();
  const toolbarRef = useRef();
  const consoleRef = useRef();

  useEffect(() => {
    // Initialize viewer
    viewerRef.current = new PotreeViewer({
      container: containerRef.current,
      pointCloudUrl,
      autoFitOnLoad: true,
    });

    // Create toolbar
    toolbarRef.current = new Toolbar(viewerRef.current);

    // Create console
    consoleRef.current = new PotreeViewerConsole(viewerRef.current, {
      position: 'bottom-left',
    });

    // Cleanup
    return () => {
      consoleRef.current?.dispose();
      toolbarRef.current?.dispose();
      viewerRef.current?.dispose();
    };
  }, [pointCloudUrl]);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}
```

### Vue 3

```vue
<template>
  <div ref="container" style="width: 100%; height: 100vh"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { PotreeViewer, Toolbar, PotreeViewerConsole } from 'potree-viewer';

const props = defineProps({
  pointCloudUrl: String
});

const container = ref(null);
let viewer = null;
let toolbar = null;
let viewerConsole = null;

onMounted(() => {
  viewer = new PotreeViewer({
    container: container.value,
    pointCloudUrl: props.pointCloudUrl,
    autoFitOnLoad: true,
  });

  toolbar = new Toolbar(viewer);
  viewerConsole = new PotreeViewerConsole(viewer);
});

onUnmounted(() => {
  viewerConsole?.dispose();
  toolbar?.dispose();
  viewer?.dispose();
});
</script>
```

### Vanilla JavaScript

```javascript
import { PotreeViewer, Toolbar, PotreeViewerConsole } from 'potree-viewer';

const viewer = new PotreeViewer({
  container: document.getElementById('viewer'),
  pointCloudUrl: 'cloud/metadata.json',
  autoFitOnLoad: true,
});

const toolbar = new Toolbar(viewer, {
  alignment: 'top-right'
});

const console = new PotreeViewerConsole(viewer, {
  position: 'bottom-left',
  visible: true
});

// Custom button interactions
document.getElementById('measure-distance').addEventListener('click', () => {
  viewer.setMeasurementMode('distance');
});

document.getElementById('view-top').addEventListener('click', () => {
  viewer.setNamedView('top');
});

// Listen to measurement results
viewer.on('measurement-finished', (measurement) => {
  console.log('Measurement result:', measurement.result);
});
```

## Advanced Usage

### Custom Toolbar Buttons

```javascript
const toolbar = new Toolbar(viewer, {
  alignment: 'top-right',
  buttons: [
    {
      id: 'custom-action',
      group: 'custom',
      label: 'My Custom Action',
      icon: '<svg>...</svg>',
      action: () => {
        console.log('Custom action clicked');
      }
    },
    // ... include default buttons if needed
  ]
});
```

### Direct Three.js Scene Access

```javascript
const scene = viewer.getScene();
const camera = viewer.getCamera();
const renderer = viewer.getRenderer();

// Add custom 3D objects
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

### Load Multiple Point Clouds

```javascript
const viewer = new PotreeViewer({
  container: document.getElementById('viewer'),
});

await viewer.loadPointCloud('cloud1/metadata.json', 'Building A');
await viewer.loadPointCloud('cloud2/metadata.json', 'Building B');
```

### Custom View on Load

```javascript
const viewer = new PotreeViewer({
  container: document.getElementById('viewer'),
  pointCloudUrl: 'cloud/metadata.json',
  initialView: {
    position: { x: 100, y: 50, z: 100 },
    target: { x: 0, y: 0, z: 0 }
  }
});
```

## Point Cloud Data Preparation

Use [PotreeConverter](https://github.com/potree/PotreeConverter/releases) to prepare your point cloud data:

```bash
./PotreeConverter input.laz -o output_directory
```

**Supported input formats:** LAS, LAZ, PLY, PTX, XYZ (via TXT2LAS)

The converter will generate:
- `metadata.json` - Point cloud metadata
- `octree.bin` - Octree structure
- `hierarchy.bin` - Hierarchy data
- Individual node files

## Browser Compatibility

- Modern browsers with WebGL support (Chrome, Firefox, Edge, Safari)
- Requires ES module support
- No IE11 support

## Development

### Running the Demo

```bash
cd viewer-lib
npm install
npm run dev
```

Demo will open at `http://localhost:3000/demo.html`

### Building for Production

```bash
npm run build
```

### Project Structure

```
viewer-lib/
├── src/
│   ├── index.js                  # Main exports
│   ├── PotreeViewer.js           # Main viewer class
│   ├── utils/
│   │   ├── EventEmitter.js       # Event system
│   │   ├── config.js             # Configuration
│   │   └── TextSprite.js         # Text labels
│   ├── measurements/
│   │   ├── Measurement.js        # Base class
│   │   ├── DistanceMeasurement.js
│   │   ├── HeightMeasurement.js
│   │   ├── AngleMeasurement.js
│   │   ├── RadiusMeasurement.js
│   │   ├── VolumeMeasurement.js
│   │   └── MeasurementManager.js
│   └── ui/
│       ├── Toolbar.js            # UI toolbar component
│       └── PotreeViewerConsole.js # Console component
├── demo.html                     # Demo page
├── package.json
├── vite.config.js
└── README.md
```

## Troubleshooting

### "Cannot find module 'three'"

```bash
cd viewer-lib
npm install three potree-core
```

### Point cloud not loading

- Check the path to `metadata.json` is correct
- Open browser console for detailed error messages
- Ensure server is serving point cloud files correctly
- Verify CORS headers if loading from different origin

### Webpack/Bundler issues

Add to your bundler configuration:

```javascript
resolve: {
  extensions: ['.js', '.json'],
  alias: {
    'three': path.resolve(__dirname, 'node_modules/three'),
  }
}
```

## Publishing

To publish this package to npm, see [PUBLISHING.md](./PUBLISHING.md) for detailed instructions.

Quick publish:
```bash
cd viewer-lib
npm login
npm publish
```

## License

MIT

## Credits

- Based on [potree-core](https://github.com/tentone/potree-core) by tentone
- Original [Potree](https://github.com/potree/potree) by Markus Schütz
- Built with [Three.js](https://threejs.org/)
- Icons from [Lucide](https://lucide.dev/) (MIT License)
