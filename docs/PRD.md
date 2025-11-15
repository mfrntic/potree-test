# PotreeViewer – Product Requirements Document (PRD)

## 1. Osnovne informacije
- **Naziv projekta**: PotreeViewer (NPM biblioteka / komponenta)
- **Verzija dokumenta**: 1.0.0
- **Datum**: 2025-11-15
- **Autor**: Cascade (AI asistent)
- **Vlasnik proizvoda**: _[upiši svoje ime]_

## 2. Kontekst i motivacija

### 2.1 Postojeće stanje
Trenutni projekt je Potree primjer koji:
- koristi klasični Potree bundle (`build/potree/potree.js`, `potree.css`, resursi u `build/potree/resources/…`),
- oslanja se na globalne skripte i objekte (npr. `Potree`, `viewer`, `THREE`),
- inicijalizaciju radi u `script.js` kroz jQuery `$(function () { … })`,
- direktno pristupa DOM elementima preko hardkodiranih ID‑eva (`potree_render_area`, `#menu_tools`, `#sidebar_header`, …),
- koristi dodatne biblioteke iz `libs/` (jQuery, jQuery UI, Spectrum, OpenLayers, i18next, jstree, itd.),
- za point cloud koristi lokalnu strukturu (npr. `7_1/metadata.json`).

U `package.json` već postoje ovisnosti:
- `potree`, `potree-core`, `three`, `jquery`, `dat.gui`, `proj4`, `stats.js`, `tween.js`, …
- `express` i `nodemon` za lokalni server.

### 2.2 Problem
Takav pristup:
- otežava korištenje u modernim aplikacijama (ESM, bundleri, React/Vue itd.),
- oslanja se na globalni state (`window.viewer`),
- nije enkapsuliran (Potree živi direktno u globalnom DOM-u i `window` objektu),
- otežava pisanje testova, ponovno korištenje i integraciju u veće projekte.

### 2.3 Cilj
Napraviti **modularnu, framework‑agnostičku JavaScript biblioteku** (u ovoj fazi lokalni modul unutar ovog repozitorija, kasnije NPM paket) koja:
- koristi `potree-core` + `three` kao jezgru za prikaz point cloudova (bez lokalnog `build/potree/potree.js` i bez jQuery‑a),
- enkapsulira viewer logiku u **klasu / modul** (`PotreeViewer`) umjesto globalnog `window.viewer`,
- inicijalizaciju i sve relevantne postavke preuzima iz trenutnog `script.js` (FOV, point budget, početni pogled, opis), ali ih implementira na vrhu `potree-core`,
- uključuje **osnovne alate mjerenja** (distance / duljina, height / visinska razlika) izravno nad point cloudom, uz mogućnost kasnijeg proširenja na area / površina i volume / volumen,
- omogućava upravljanje viewerom „izvana“ kroz jasan API (metode i događaji),
- se može koristiti u bilo kojem okruženju (čisti JS, React, Vue, …) preko standardnog JS importa.

### 2.4 UI i UX kontekst

Cilj nije napraviti potpunu repliku izvornog Potree GUI‑a (sidebar, svi izbornici, tabovi itd.), već **minimalan viewer UI** koji:

- ne ovisi o originalnom Potree sidebar‑u i njegovom HTML/CSS‑u,
- može izgledom biti drugačiji (npr. gornji toolbar umjesto sidebar‑a),
- osigurava samo osnovne kontrole za:
  - pokretanje osnovnih mjerenja,
  - promjenu osnovnih projekcija/pogleda (navigacija kamerom),
- ostavlja potpunu slobodu integratoru da oko viewer containera napravi vlastiti UI.


## 3. Scope (obuhvat)

### 3.1 U obuhvatu
- Izrada **core** biblioteke `PotreeViewer` kao ESM modula.
- Integracija s `potree-core` i `three` za prikaz point cloudova.
- Enkapsulacija inicijalizacije koja je sada u `script.js` u novu klasu (ponašanje slično, implementacija modernizirana).
- Parametrizacija hardkodiranih vrijednosti (URL point clouda, opis, jezik, početni pogled, point budget, materijal, itd.).
- Definiranje javnog API‑ja za upravljanje viewerom (metode i događaji).
- Implementacija **osnovnih mjernih alata** (MUST):
  - distance / duljina (polilinija),
  - height / visinska razlika (vertikalna razlika po Z osi između dvije točke).

- Implementacija dodatnih mjernih alata (NICE‑TO‑HAVE u ovoj fazi):
  - area / površina (2D poligon na „tlu"),
  - volume / volumen (volumen ispod poligona ili unutar jednostavnog volumena),
  iznad `potree-core` i three.js scene.

- Implementacija osnovnih **navigacijskih projekcija/pogleda**:
  - predefined pogledi (npr. top, front, right, isometric),
  - mogućnost promjene projekcije preko API‑ja i/ili jednostavnog toolbar‑a.
- Osnovna dokumentacija i jedan ili više primjera korištenja (uključujući primjer mjerenja).

### 3.2 Izvan obuhvata (za ovu fazu)
- Potpuna replika originalnog Potree GUI‑ja (sidebar, svi izbornici i alati).
- Napredne funkcije poput clippinga, klasifikacije, naprednih anotacija – mogu se dodati kasnije.
- Gotove React/Vue komponente (dok ne postoji stabilan core API).


## 4. Funkcionalni zahtjevi

### 4.1 Inicijalizacija viewer‑a

**Opis:** Kreirati instancu Potree viewer‑a unutar danog DOM containera, bez globalnih side‑effekata.

**Zahtjevi:**
- [ ] Napraviti klasu `PotreeViewer` koja se koristi ovako (primjer):
  ```js
  import { PotreeViewer } from 'potree-viewer';

  const viewer = new PotreeViewer({
    container: document.getElementById('potree-container'),
    pointCloudUrl: '7_1/metadata.json',
    language: 'hr',
    pointBudget: 1_000_000,
    description: 'Hrvatski šumarski institut: 7_1cm_laz.laz',
  });
  ```
- [ ] Konstruktor prima **jedan objekt** s opcijama (vidi 4.2).
- [ ] Niti jedna globalna varijabla tipa `window.viewer` ne smije biti potrebna.
- [ ] Interno se kreira `potree-core` `Potree` instanca, three.js scena, kamera i renderer unutar proslijeđenog `container` elementa.
- [ ] U inicijalizaciji treba replicirati relevantnu logiku iz trenutnog `script.js` (FOV, point budget, početni pogled, opis), ali implementiranu preko `potree-core` i three.js. EDL se može zanemariti jer nije podržan u `potree-core`.

### 4.2 Konfiguracija putem opcija

**Opis:** Umjesto hardkodiranih vrijednosti, `PotreeViewer` prima konfiguracijski objekt.

**Minimalna struktura (JavaScript objekt, prilagođeno postojećem `script.js`):**
```js
// Primjer konfiguracijskog objekta za PotreeViewer
const options = {
  container: document.getElementById('potree-container'), // Obavezno

  // Point cloud postavke (trenutno script.js: Potree.loadPointCloud("7_1/metadata.json", "7_1", ...))
  pointCloudUrl: '7_1/metadata.json',   // npr. '7_1/metadata.json'
  pointCloudName: '7_1',                // npr. '7_1'
  description: 'Hrvatski šumarski institut: 7_1cm_laz.laz', // viewer.setDescription

  // Viewer postavke (trenutno script.js: FOV, point budget, desni pogled)
  language: 'hr',                       // npr. 'hr', 'en'; default: 'en'
  pointBudget: 1_000_000,               // default: 1_000_000
  fov: 80,                              // default: 80
  // Napomena: EDL nije podržan u potree-core, ova opcija je rezervirana za buduće custom proširenje
  edlEnabled: false,

  // Početni pogled
  initialView: 'right',                 // ekvivalent viewer.setRightView();
  // initialView: {                     // alternativno: custom pozicija/target
  //   position: { x, y, z },
  //   target:   { x, y, z },
  // },

  // Materijal point clouda (script.js: material.size, minSize, PointSizeType, PointShape)
  material: {
    size: 0.6,
    minSize: 0.4,
    pointSizeType: 'FIXED',             // mapira se na Potree.PointSizeType.FIXED
    shape: 'SQUARE',                    // mapira se na Potree.PointShape.SQUARE
  },

  // Ostalo
  background: 'black',                  // 'black' | 'skybox' | 'gradient' | custom string; default: Potree default
  autoFitOnLoad: true,                  // viewer.fitToScreen() nakon učitavanja point clouda
  loadSettingsFromUrl: true,            // zadržati ponašanje viewer.loadSettingsFromURL()

  // Callbackovi
  onReady: (viewerInstance) => {},        // kad je viewer + GUI inicijaliziran
  onPointCloudLoaded: (pointCloud) => {}, // kad je point cloud učitan
  onError: (error) => {},                 // pri grešci
};
```

**Zahtjevi:**
- [ ] Svi gore navedeni parametri trebaju biti podržani, sa smislenim default vrijednostima.
- [ ] `PotreeViewer` mora validirati kritične vrijednosti (npr. da `container` postoji, da je `pointCloudUrl` string).

### 4.3 API za upravljanje izvana

**Opis:** Potrošač biblioteke treba moći mijenjati ključne parametre nakon inicijalizacije.

**Minimalne metode (JavaScript API):**
```js
// Primjer očekivanog API-ja klase PotreeViewer (pseudo-kod)
class PotreeViewer {
  // ...

  // Postavlja broj vidljivih točaka
  setPointBudget(budget) {}

  // Mijenja jezik sučelja (ako je podržano u Potree resursima)
  setLanguage(language) {}

  // Postavlja poziciju i target kamere
  setView(position, target) {
    // position: { x, y, z }
    // target:   { x, y, z }
  }

  // Podesi kameru tako da point cloud stane u kadar
  fitToScreen() {}

  // Postavlja background (boja ili predefinirani način, npr. 'black', 'skybox')
  setBackground(background) {}

  // Dinamičko učitavanje point clouda
  loadPointCloud(url, name) {
    // treba vratiti Promise koji se resolve-a kad je učitavanje gotovo
  }

  // Čišćenje resursa (event listeneri, renderer, scene itd.)
  dispose() {}
}
```

**Zahtjevi:**
- [ ] `setPointBudget` delegira na `viewer.setPointBudget`.
- [ ] `setView` koristi `viewer.scene.view.position.set` i `viewer.scene.view.lookAt` (kao u postojećem primjeru, ali parametrizirano).
- [ ] `fitToScreen` delegira na `viewer.fitToScreen`.
- [ ] `dispose` treba:
  - ukloniti sve event listenere dodane od strane `PotreeViewer` klase,
  - ukloniti render loop (ako je posebno kreiran),
  - po potrebi ukloniti DOM elemente koje je kreirala klasa (ne i one koje je dobila izvana).

  - (opcionalno) omogućiti metodu npr. `getViewer()` koja vraća internu Potree viewer instancu za naprednije scenarije (escape hatch), uz napomenu da je to „advanced use“.

### 4.4 Eventi

**Opis:** Omogućiti jednostavnu pretplatu na događaje (bez obaveznog korištenja vanjskih event biblioteka).

**Minimalno:**
- `ready` – viewer je inicijaliziran i GUI učitan (ekvivalentno trenutnom `viewer.loadGUI(() => { ... })`).
- `pointcloud-loaded` – point cloud uspješno učitan.
- `error` – greška tijekom učitavanja ili inicijalizacije.

**API primjer:**
```js
viewer.on('ready', () => { /* ... */ });
viewer.on('pointcloud-loaded', (pc) => { /* ... */ });
viewer.on('error', (err) => { console.error(err); });

viewer.off('ready', handler);
```

**Zahtjevi:**
- [ ] Jednostavan interni event sistem (npr. vlastita mini implementacija ili `EventTarget`/`EventEmitter` analogija).
- [ ] Događaji se ne smiju oslanjati na globalne objekte (`window` itd.).

### 4.5 Mapiranje na postojeći `script.js` (informativno)

Kako bi se osiguralo da nova klasa `PotreeViewer` funkcionalno pokriva postojeći primjer, sljedeće mapiranje treba biti zadovoljeno:

- **`window.viewer = new Potree.Viewer(document.getElementById("potree_render_area"));`**  
  → kreira se unutar `PotreeViewer` konstruktora s proslijeđenim `options.container`; nema više globalnog `window.viewer`.

- **`viewer.setEDLEnabled(false); ... viewer.setEDLEnabled(true);`**  
  → konačno stanje je `edlEnabled: true`; privremeno isključivanje tijekom init-a je interna implementacija (nije dio API-ja).

- **`viewer.setFOV(80);`**  
  → pokriveno kroz opciju `fov` i/ili metodu ako bude potrebna.

- **`viewer.setPointBudget(1_000_000);`**  
  → default `pointBudget` + javna metoda `setPointBudget(budget)`.

- **`viewer.loadSettingsFromURL();`**  
  → opcija `loadSettingsFromUrl: true` (zadano), s mogućnošću isključivanja.

- **`viewer.setRightView();`**  
  → opcija `initialView: 'right'` ili naprednija konfiguracija `initialView`.

- **`viewer.setDescription("Hrvatski šumarski institut: 7_1cm_laz.laz");`**  
  → opcija `description`.

- **`viewer.loadGUI(() => { ... });`**  
  → interni dio `PotreeViewer` koji nakon load-a:
  - postavlja jezik prema `language`,
  - može (opcionalno) otvarati `#menu_tools` i `#menu_clipping` sekcije,
  - može (opcionalno) sakriti `#sidebar_header` ako to zadamo u konfiguraciji (npr. buduće opcije `autoOpenToolsMenu`, `autoOpenClippingMenu`, `hideLanguageHeader`).

- **`Potree.loadPointCloud("7_1/metadata.json", "7_1", e => { ... });`**  
  → opcije `pointCloudUrl` i `pointCloudName` + internalno rukovanje callbackom i emitiranje eventa `pointcloud-loaded`.

- **Materijal point clouda (`material.size`, `material.minSize`, `material.pointSizeType`, `material.shape`)**  
  → opcija `material` u konfiguraciji, uz mogućnost kasnijeg mijenjanja kroz dodatnu metodu (npr. `setMaterialOptions(options)`).

### 4.6 Osnovna mjerenja

**Opis:** Omogućiti korisniku pokretanje osnovnih mjerenja nad point cloudom: distance (MUST), height (MUST), area i volume (NICE‑TO‑HAVE). Mjerenja se pokreću putem API‑ja, a konkretni UI (toolbar) je tanak sloj iznad toga.

#### 4.6.1 Tipovi mjerenja

- **distance (MUST)**
  - tip: polilinija,
  - korisnik klikanjem dodaje točke na point cloud (projekcija klikova na geometriju),
  - duljina je zbroj segmenata između uzastopnih točaka.

- **height (MUST)**
  - tip: dva odabrana pointa,
  - mjeri se **vertikalna komponenta** razlike (Z) između dviju točaka,
  - prikazuje se barem `ΔZ` (u metrima), opcionalno i ukupna 3D udaljenost.

- **area (NICE‑TO‑HAVE)**
  - tip: 2D poligon projiciran na "tlo" (npr. XY ravnina ili lokalna horizontalna ravnina),
  - korisnik definira niz točaka, poligon se zatvara između prve i zadnje,
  - prikazuje se površina poligona u m².

- **volume (NICE‑TO‑HAVE)**
  - tip: jednostavni volumen (npr. prizma/cuboid ili volume ispod poligona),
  - konkretna geometrijska interpretacija može biti pojednostavljena (nije ključno za prvu fazu),
  - prikazuje se aproksimacija volumena u m³.

#### 4.6.2 API za mjerenja

`PotreeViewer` izlaže API za upravljanje načinom mjerenja i pristup rezultatima. Ponašanje je definirano tako da se UI (toolbar) može jednostavno nakačiti na ovaj API.

```js
// postavljanje aktivnog načina rada mjerenja
viewer.setMeasurementMode(mode);

// dohvat aktivnog načina
const mode = viewer.getMeasurementMode();

// ručno kreiranje i upravljanje mjerenjima (naprednije)
const measurement = viewer.startMeasurement('distance');
viewer.finishMeasurement(measurement.id);

// dohvat svih mjerenja
const allMeasurements = viewer.getMeasurements();

// brisanje
viewer.clearMeasurements();
viewer.removeMeasurement(measurement.id);
```

Gdje je `mode`:

```ts
type MeasurementMode = 'none' | 'distance' | 'height' | 'area' | 'volume';
```

**Zahtjevi:**

- [ ] `setMeasurementMode('none')` vraća viewer u normalni navigacijski način (bez dodavanja novih mjernih točaka).
- [ ] `setMeasurementMode('distance' | 'height' | 'area' | 'volume')` postavlja interakciju miša tako da klikovi dodaju točke u odgovarajući mjerni objekt.
- [ ] Implementirati barem `distance` i `height` načine; `area` i `volume` mogu bacati "not implemented" ili biti skriveni ako nisu podržani.
- [ ] `getMeasurements()` vraća listu objekata sa barem:

```ts
type MeasurementSummary = {
  id: string;
  type: 'distance' | 'height' | 'area' | 'volume';
  points: { x: number; y: number; z: number }[];
  result: {
    distanceTotal?: number; // za distance
    deltaZ?: number;        // za height
    area?: number;          // za area
    volume?: number;        // za volume
  };
};
```

#### 4.6.3 Eventi vezani uz mjerenja

Minimalni događaji:

- `measurement-started` – kada korisnik krene novo mjerenje (npr. prvi klik),
- `measurement-updated` – kad se mjerenje ažurira (dodana točka, pomaknuta točka),
- `measurement-finished` – kad je mjerenje završeno (zadnji klik ili ESC/Enter),
- `measurement-cleared` – kada su sva mjerenja obrisana.

**API primjer:**

```js
viewer.on('measurement-finished', (measurement) => {
  console.log('Measurement done:', measurement.type, measurement.result);
});
```

### 4.7 Pogledi i navigacijske projekcije

**Opis:** Omogućiti jednostavno prebacivanje kamere u predefinirane poglede (projekcije) preko API‑ja i preko minimalnog UI‑a (toolbar).

#### 4.7.1 Predefinirani pogledi

Minimalni skup pogleda:

- `top` – pogled odozgo prema dolje,
- `front` – pogled sprijeda,
- `right` – pogled s desne strane,
- `isometric` – kos pogled pod kutom (npr. iz desno‑gornjeg kuta).

Ako u implementaciji postoje drugačije osi ili nazivi, potrebno je mapirati ih tako da semantika ostane (gore, sprijeda, desno, izometrično).

#### 4.7.2 API za poglede

```js
// prebacivanje na named view
viewer.setNamedView('top');
viewer.setNamedView('front');
viewer.setNamedView('right');
viewer.setNamedView('isometric');

// dohvat trenutnog named view-a (ako je prepoznat)
const currentView = viewer.getNamedView();
```

Gdje je:

```ts
type NamedView = 'top' | 'front' | 'right' | 'isometric' | 'custom';
```

**Zahtjevi:**

- [ ] `setNamedView(name)` koristi internu kameru/view objekat (ekvivalent `viewer.setRightView()` i sl. u starom API‑ju).
- [ ] `getNamedView()` vraća jedan od predefiniranih naziva ako je kamera unutar razumne tolerancije tog pogleda; u suprotnom vraća `'custom'`.
- [ ] API mora biti kompatibilan s postojećom metodom `setView(position, target)` – named views su samo helperi iznad toga.

#### 4.7.3 Eventi vezani uz poglede

- `view-changed` – emitira se kada se kamera značajno promijeni (npr. nakon `setNamedView`, `setView`, `fitToScreen` ili ručne navigacije korisnika).

```js
viewer.on('view-changed', (info) => {
  console.log('View changed:', info.namedView, info.position, info.target);
});

// minimalna struktura event payload-a
// info: {
//   namedView: 'top' | 'front' | 'right' | 'isometric' | 'custom',
//   position: { x, y, z },
//   target: { x, y, z },
// }
```

### 4.8 Minimalni UI (toolbar)

**Opis:** Iako je `PotreeViewer` prvenstveno core biblioteka, potrebno je definirati najmanji zajednički UI sloj (npr. jednostavan toolbar) kako bi primjer korištenja bio konzistentan. Ovaj UI je referentna implementacija, i može se po želji zamijeniti vlastitim UI‑em.

#### 4.8.1 Funkcionalnosti toolbara

Minimalni set kontrola:

- **Grupa: Navigacija / select**
  - gumb "Navigate" ili ikona za povratak u normalni način (measurement mode = `none`).

- **Grupa: Mjerenja**
  - gumb "Distance" → `setMeasurementMode('distance')`,
  - gumb "Height" → `setMeasurementMode('height')`.
  - (ako je implementirano) gumbi za `area`, `volume`.

- **Grupa: Pogledi**
  - gumbi: `Top`, `Front`, `Right`, `Iso` → pozivi na `setNamedView('top' | 'front' | 'right' | 'isometric')`.

- **Grupa: Ostalo**
  - gumb "Fit" → `fitToScreen()`.

Toolbar ne mora koristiti nikakvu specifičnu biblioteku (može biti običan HTML/CSS). Layout (gore, lijevo, floating) nije striktno definiran, ali primjer implementacije treba koristiti jednostavan horizontalni toolbar.

#### 4.8.2 Prikaz rezultata mjerenja

Minimalno je potrebno prikazati rezultat zadnjeg završenog mjerenja:

- naziv tipa mjerenja (Distance, Height, ...),
- numeričku vrijednost u SI jedinicama (m, m², m³).

Ovaj prikaz može biti:

- mali overlay u jednom kutu viewer containera, ili
- dio samog toolbara (npr. status bar sekcija).

**Zahtjev:** način prikaza mora koristiti podatke koje vraća API (`measurement-finished` event i `getMeasurements()`), bez direktnog diranja internih Potree objekata izvan `PotreeViewer` klase.


## 5. Tehnički zahtjevi

### 5.1 Arhitektura i struktura projekta

Predložena struktura (unutar ovog repozitorija, npr. `viewer-lib/` ili slično):

```text
potree-test/
  index.html
  script.js
  build/potree/...
  libs/...
  docs/
    PRD.md
  viewer-lib/             # NOVI dio za NPM biblioteku (prijedlog)
    src/
      PotreeViewer.js     # glavna klasa
      events.js           # jednostavan event sistem
      utils/
        dom.js            # helperi za DOM, ako trebaju
        config.js         # spajanje default + user opcija
    package.json          # (za budući izdvojeni paket)
    README.md             # dokumentacija za biblioteku
```

### 5.2 Ovisnosti

S obzirom na postojeći `package.json` projekta i cilj izrade čiste, moderne implementacije:

- **Runtime:**
  - `potree-core` – jezgra za prikaz point cloudova (umjesto lokalnog `build/potree/potree.js` bundle-a).
  - `three` – Three.js biblioteka za WebGL renderiranje; verzija mora biti kompatibilna s `potree-core`.
  - **BEZ** `jquery` ovisnosti – sav UI i DOM manipulacija radi se vanilla JS-om ili modernim framework-agnostičkim pristupom.
  - Ostale biblioteke iz `libs/` (jQuery UI, Spectrum, OpenLayers, i18next, jstree) **nisu potrebne** za core `PotreeViewer` – one su bile dio starog Potree GUI-a.

- **Dev:**
  - Bundler (Vite/Rollup/Webpack) za izgradnju ESM/CJS/UMD verzija biblioteke.
  - Test framework (npr. Vitest ili Jest) – preporučljivo za kvalitetu koda.
  - Development server (npr. Vite dev server umjesto `express` + `nodemon`).

### 5.3 Kompatibilnost

- Ciljaju se moderni browseri (Chrome, Firefox, Edge, Safari) s podrškom za WebGL.
- Nije cilj podržavati jako stare browsere (IE i sl.).


## 6. Plan implementacije (fokus na core)

> Ova sekcija je fokusirana na **plan**, jer si naglasio da se trebamo fokusirati na plan implementacije.

### Faza 1 – Analiza i izdvajanje postojeće logike (1–2 dana)
- [ ] Detaljno proći `script.js` i popisati sve: 
  - pozive na `viewer` metode,
  - interakcije s DOM‑om,
  - specifične Potree postavke (EDL, FOV, point budget, opis, jezik itd.).
- [ ] Identificirati koje od tih postavki ulaze u **default konfiguraciju**, a koje idu kao **parametri opcija**.

### Faza 2 – Skeleton klase `PotreeViewer` (1 dan)
- [ ] Kreirati `viewer-lib/src/PotreeViewer.js` s minimalnim skeletonom:
  - konstruktor (`constructor(options)`),
  - metoda `init()` koja kreira `Potree.Viewer` u proslijeđenom `container`u,
  - stubovi metoda `setPointBudget`, `setView`, `fitToScreen`, `dispose`.
- [ ] Napraviti pomoćni modul za spajanje default i user konfiguracije (npr. `utils/config.js`).

### Faza 3 – Prenos trenutne logike u klasu (2–3 dana)
- [ ] Prenijeti inicijalizaciju iz `script.js` u `PotreeViewer.init()`:
  - `new Potree.Viewer(containerElement)` umjesto `document.getElementById("potree_render_area")`.
  - `viewer.setEDLEnabled`, `viewer.setFOV`, `viewer.setPointBudget`, `viewer.loadSettingsFromURL`, `viewer.setRightView`, `viewer.setDescription`.
- [ ] Prenijeti `viewer.loadGUI(...)` u klasu i povezati `ready` event / `onReady` callback.
- [ ] Konfigurirati učitavanje point cloud‑a kroz opcije (`pointCloudUrl`, `pointCloudName`).
- [ ] Izbaciti direktan jQuery ovisni kod iz core logike (npr. eventualno GUI sakrivanje prebaciti u opcionalni dio ili ostaviti kao primjer).

### Faza 4 – API i eventi (1–2 dana)
- [ ] Implementirati jednostavan event sistem (`on`, `off`, `emit`).
- [ ] Emitirati `ready`, `pointcloud-loaded`, `error` na pravim mjestima.
- [ ] Implementirati javne metode za upravljanje viewerom (`setPointBudget`, `setView`, `fitToScreen`, `setBackground`, `loadPointCloud`).

### Faza 5 – Primjer integracije i dokumentacija (1–2 dana)
- [ ] Napraviti minimalan primjer koji **umjesto** `script.js` koristi novu klasu `PotreeViewer` (npr. `index-module.html`).
- [ ] U `README.md` (ili u `docs/`) opisati:
  - kako inicijalizirati `PotreeViewer`,
  - koje opcije postoje,
  - primjer korištenja metoda i eventa.


## 7. Testiranje

### 7.1 Funkcionalno testiranje
- [ ] Provjeriti da se viewer inicijalizira u proslijeđenom containteru.
- [ ] Provjeriti da se point cloud učitava iz `pointCloudUrl`.
- [ ] Provjeriti da `setPointBudget` mijenja broj vidljivih točaka.
- [ ] Provjeriti da `fitToScreen` radi očekivano.
- [ ] Provjeriti da `dispose` ne ostavlja render loop ili event listenere aktivne.

### 7.2 Regresijsko testiranje
- [ ] Usporediti vizualni rezultat s originalnim primjerom (`index.html` + `script.js`) kako bi se osiguralo da su postavke približno iste (FOV, EDL, point size itd.).

## 8. Buduća proširenja (izvan trenutnog scope‑a)

- Dodavanje posebnih metoda za mjerenje, anotacije, clipping i sl.
- Izrada React/Vue omotača (`<PotreeViewer />` komponenta) koji koristi ovu klasu ispod haube.
- Izrada dodatnog konfiguracijskog UI‑ja (kontrole, paneli) neovisnog o originalnom Potree sidebaru.
- Opcionalno generiranje TypeScript definicija (`.d.ts`) na temelju postojećeg JS API-ja, **bez** migracije koda na TypeScript.

## 9. Sažetak

Ovaj PRD definira **realističan i korak‑po‑korak plan** kako postojeći Potree primjer (sa `index.html` i `script.js`) pretvoriti u **modularnu NPM biblioteku** `PotreeViewer`. Ključna ideja je:

- izvući postojeću logiku u klasu,
- parametrizirati sve što je trenutno hardkodirano,
- omogućiti upravljanje viewerom kroz čisti, jasan API i događaje,
- pritom poštovati postojeći Potree ekosustav i strukturu koju već imaš u projektu.
