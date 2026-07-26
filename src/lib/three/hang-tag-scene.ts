/**
 * Hero scene — a paper swing tag hanging from a cord.
 *
 * A plain (non-React) class so construction, warmup and disposal are explicit
 * and the frame loop is a single method that allocates nothing. The React leaf
 * that mounts it is `views/home/sections/hang-tag.tsx`.
 *
 * Budgets (pixel ratio, frame rate, antialias, pointer) come from
 * `lib/scene/device.ts`; the loop is driven by the app-wide ticker and only
 * runs while the canvas is on screen and the tab is visible.
 *
 * 📖 Docs: obsidian/frontend/hero-scene.md · obsidian/workflows/optimize-3d-scene.md
 */

import {
  AmbientLight,
  CanvasTexture,
  Clock,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  Shape,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { subscribeToTicker } from "@/lib/animation/ticker";
import { getSceneBudget, sceneShouldFreeze } from "@/lib/scene/device";
import {
  drawTagFace,
  TAG_HOLE_CENTER_Y,
  TAG_HOLE_RADIUS,
  type TagFaceColors,
} from "@/lib/three/tag-face";

export interface HangTagSceneOptions {
  canvas: HTMLCanvasElement;
  /** The element whose box the canvas fills. */
  container: HTMLElement;
  colors: TagFaceColors;
  /** Font family string, read from the page so the tag matches the type. */
  fontFamily: string;
  /** Pre-decoded logo mark; `null` when it failed to load. */
  mark: HTMLImageElement | null;
}

/** Tag proportions in world units — 2:3, matching the texture. */
const TAG_WIDTH = 1.6;
const TAG_HEIGHT = 2.4;
const TAG_DEPTH = 0.035;
const TAG_CORNER_RADIUS = 0.17;
/** Bevel on the die-cut edge. `ExtrudeGeometry` adds this *beyond* `depth`. */
const TAG_BEVEL = 0.012;
/** Front surface of the bevelled body, plus a hair to avoid z-fighting. */
const TAG_FACE_Z = TAG_DEPTH / 2 + TAG_BEVEL + 0.002;

/** Pendulum constants — tuned to read as stiff card on a short cord. */
const GRAVITY = 11;
const DAMPING = 0.9;
const CORD_LENGTH = 1.55;

/**
 * Widest angle the tag is allowed to reach, either from its entrance or from
 * the pointer. The frustum below is framed around this: swing wider and the
 * corners of the card leave the canvas.
 */
const MAX_SWING = 0.2;
/** How far the pointer can push the pendulum, within `MAX_SWING`. */
const POINTER_SWING = 0.16;

/** Frame delta is clamped so a tab-switch return cannot teleport the tag. */
const MAX_DELTA = 0.05;

/** Distance from the tag's centre up to the punched hole. */
const HOLE_OFFSET_Y = TAG_HEIGHT / 2 - TAG_HEIGHT * TAG_HOLE_CENTER_Y;
const HOLE_RADIUS = TAG_HEIGHT * TAG_HOLE_RADIUS * 0.62;

const buildTagShape = () => {
  const w = TAG_WIDTH;
  const h = TAG_HEIGHT;
  const r = TAG_CORNER_RADIUS;
  const shape = new Shape();

  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

  // The punched hole, in the same place the texture clears it.
  const hole = new Path();
  hole.absarc(0, HOLE_OFFSET_Y, HOLE_RADIUS, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  return shape;
};

export class HangTagScene {
  private readonly container: HTMLElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly clock = new Clock();
  private readonly budget = getSceneBudget();

  /** Pivot the cord + tag swing around. */
  private readonly pivot = new Group();
  private readonly tag = new Group();

  private readonly disposables: { dispose: () => void }[] = [];
  private readonly cleanups: (() => void)[] = [];

  /** Pendulum state — angle, angular velocity, and the pointer target. */
  private angle = MAX_SWING;
  private angularVelocity = 0;
  private readonly pointer = new Vector2(0, 0);
  private pointerActive = false;

  private visible = false;
  private frozen = false;
  private unsubscribe: (() => void) | null = null;
  private disposed = false;

  constructor({ canvas, container, colors, fontFamily, mark }: HangTagSceneOptions) {
    this.container = container;

    this.renderer = new WebGLRenderer({
      canvas,
      // The canvas sits over the page's cream background, so it must be
      // transparent — the one renderer flag the look requires.
      alpha: true,
      antialias: this.budget.antialias,
      stencil: false,
      powerPreference:
        this.budget.tier === "desktop" ? "high-performance" : "default",
    });
    this.renderer.setPixelRatio(this.budget.pixelRatio);

    // Framed for the *swung* tag, not the resting one: at MAX_SWING the far
    // bottom corner is ~1.6 units off centre, and a 4:5 canvas at this distance
    // gives ~2.2 of half-width. Pull the camera in and the corners get clipped.
    this.camera = new PerspectiveCamera(34, 1, 0.1, 20);
    this.camera.position.set(0, 0, 8.4);

    this.build(colors, fontFamily, mark);
    this.resize();
  }

  /**
   * Async factory — decodes the logo mark and waits for the page fonts before
   * anything is built, so the texture is drawn once, with the right type.
   */
  static async create(
    options: Omit<HangTagSceneOptions, "mark">,
  ): Promise<HangTagScene> {
    const [mark] = await Promise.all([
      loadImage("/assets/brand/renova-hanger.png"),
      document.fonts?.ready.catch(() => undefined),
    ]);
    return new HangTagScene({ ...options, mark });
  }

  private build(
    colors: TagFaceColors,
    fontFamily: string,
    mark: HTMLImageElement | null,
  ) {
    // ── Environment: one PMREM'd room + a single directional key. More real
    // lights would multiply the fragment cost of every lit material for a look
    // the image-based lighting already gives.
    const pmrem = new PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = environment.texture;
    this.scene.environmentIntensity = 0.4;
    room.dispose();
    pmrem.dispose();
    this.disposables.push(environment.texture);

    // Kept deliberately under 1.0 total. Cream paper plus a strong key clips to
    // pure white, and the small printed lines wash out with it — the tag reads
    // as a blank card. Lighting it slightly under exposure is what makes the
    // print legible.
    const key = new DirectionalLight(0xffffff, 1.15);
    key.position.set(2.4, 3.2, 4);
    this.scene.add(key, new AmbientLight(0xffffff, 0.35));

    // ── Tag body: real thickness with a small bevel, so the die-cut edge
    // catches the key light as it turns.
    const bodyGeometry = new ExtrudeGeometry(buildTagShape(), {
      depth: TAG_DEPTH,
      bevelEnabled: true,
      bevelThickness: TAG_BEVEL,
      bevelSize: TAG_BEVEL,
      bevelSegments: 2,
      curveSegments: 8,
    });
    bodyGeometry.translate(0, 0, -TAG_DEPTH / 2);
    const bodyMaterial = new MeshStandardMaterial({
      color: colors.paper,
      roughness: 0.85,
      metalness: 0,
    });
    this.disposables.push(bodyGeometry, bodyMaterial);
    this.tag.add(new Mesh(bodyGeometry, bodyMaterial));

    // ── Printed face: a thin plane just proud of the body, carrying the canvas
    // texture. Its transparent corners let the body's rounding show through.
    const faceTexture = new CanvasTexture(
      drawTagFace({ colors, fontFamily, mark }),
    );
    faceTexture.colorSpace = SRGBColorSpace;
    faceTexture.anisotropy = this.budget.tier === "mobile" ? 1 : 8;
    const faceGeometry = new PlaneGeometry(TAG_WIDTH, TAG_HEIGHT);
    const faceMaterial = new MeshStandardMaterial({
      map: faceTexture,
      transparent: true,
      roughness: 0.9,
      metalness: 0,
    });
    this.disposables.push(faceTexture, faceGeometry, faceMaterial);

    const face = new Mesh(faceGeometry, faceMaterial);
    face.position.z = TAG_FACE_Z;
    this.tag.add(face);

    // ── Cord: a thin cylinder from the pivot down through the punched hole.
    const cordGeometry = new CylinderGeometry(0.012, 0.012, CORD_LENGTH, 6);
    cordGeometry.translate(0, -CORD_LENGTH / 2, 0);
    const cordMaterial = new MeshStandardMaterial({
      color: colors.accent,
      roughness: 0.7,
      metalness: 0,
    });
    this.disposables.push(cordGeometry, cordMaterial);
    this.pivot.add(new Mesh(cordGeometry, cordMaterial));

    // Hang the tag so its hole sits exactly on the end of the cord.
    this.tag.position.y = -(CORD_LENGTH + HOLE_OFFSET_Y);
    this.pivot.add(this.tag);
    this.pivot.position.y = 1.9;
    this.scene.add(this.pivot);
  }

  /**
   * Compile programs, upload textures and render one throwaway frame — all
   * before the canvas is revealed, so the loop never stalls later.
   */
  prewarm() {
    this.renderer.compile(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  resize = () => {
    const { clientWidth, clientHeight } = this.container;
    if (!clientWidth || !clientHeight) return;

    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight, false);
    this.render();
  };

  setVisible(visible: boolean) {
    this.visible = visible;
    this.syncLoop();
  }

  /** Normalised pointer position, −1…1, relative to the container's box. */
  setPointer(x: number, y: number) {
    this.pointer.set(x, y);
    this.pointerActive = true;
  }

  clearPointer() {
    this.pointerActive = false;
  }

  start() {
    this.frozen = sceneShouldFreeze(this.budget.tier);
    if (this.frozen) {
      // Settle the pendulum and draw the resting frame once. WebGL keeps the
      // last frame on the canvas, so a frozen scene costs nothing after this.
      this.angle = 0;
      this.angularVelocity = 0;
      this.pivot.rotation.z = 0;
      this.tag.rotation.y = -0.22;
      this.render();
      return;
    }
    this.syncLoop();
  }

  handleVisibilityChange = () => {
    this.syncLoop();
  };

  private syncLoop() {
    if (this.disposed || this.frozen) return;
    const shouldRun = this.visible && !document.hidden;

    if (shouldRun && !this.unsubscribe) {
      this.clock.getDelta(); // drop the gap accumulated while stopped
      this.unsubscribe = subscribeToTicker(
        this.frame,
        () => this.budget.frameBudget,
      );
      return;
    }

    if (!shouldRun && this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private frame = () => {
    const delta = Math.min(MAX_DELTA, this.clock.getDelta());
    const time = this.clock.elapsedTime;

    // Pendulum: gravity restores the tag, the pointer nudges it sideways.
    const target = this.pointerActive ? this.pointer.x * POINTER_SWING : 0;
    const acceleration =
      -GRAVITY * Math.sin(this.angle - target) - DAMPING * this.angularVelocity;

    this.angularVelocity += acceleration * delta;
    this.angle += this.angularVelocity * delta;

    // Hard stop at the framed limit. Overshoot past MAX_SWING would clip the
    // card against the canvas edge, so the swing bounces off it instead.
    if (Math.abs(this.angle) > MAX_SWING) {
      this.angle = Math.sign(this.angle) * MAX_SWING;
      this.angularVelocity *= -0.35;
    }

    this.pivot.rotation.z = this.angle;

    // A slow turn around its own axes, so the card reads as a physical object
    // rather than a flat sprite. Eased towards the target, never snapped.
    const yawTarget =
      Math.sin(time * 0.42) * 0.34 +
      (this.pointerActive ? this.pointer.x * 0.34 : 0);
    const pitchTarget =
      Math.sin(time * 0.31) * 0.06 -
      (this.pointerActive ? this.pointer.y * 0.16 : 0);

    this.tag.rotation.y += (yawTarget - this.tag.rotation.y) * 0.05;
    this.tag.rotation.x += (pitchTarget - this.tag.rotation.x) * 0.05;

    this.render();
  };

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  /** Register a listener teardown that must run with `dispose()`. */
  addCleanup(cleanup: () => void) {
    this.cleanups.push(cleanup);
  }

  dispose() {
    this.disposed = true;
    this.unsubscribe?.();
    this.unsubscribe = null;
    for (const cleanup of this.cleanups) cleanup();
    for (const disposable of this.disposables) disposable.dispose();
    this.renderer.dispose();
  }

  get pointerEnabled() {
    return this.budget.pointer;
  }
}

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
