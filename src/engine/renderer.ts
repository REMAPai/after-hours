// Renderer + post stack + quality tiers (spec §21).
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

export type Quality = 'low' | 'med' | 'high'

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 0.0 },
    vignette: { value: 0.35 },
    grain: { value: 0.04 },
    time: { value: 0 },
    warmth: { value: 0.0 }, // 0 cold, 1 warm — lift/gain tint
    aberration: { value: 0.0 },
    flash: { value: 0.0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float saturation, vignette, grain, time, warmth, aberration, flash;
    varying vec2 vUv;
    // per-REAL-pixel noise (gl_FragCoord): a fixed virtual grid moirés into
    // diagonal stripes on flat walls when it doesn't match the buffer size
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + time * 13.0) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      vec3 col;
      if (aberration > 0.0001) {
        vec2 d = (uv - 0.5) * aberration;
        col.r = texture2D(tDiffuse, uv + d).r;
        col.g = texture2D(tDiffuse, uv).g;
        col.b = texture2D(tDiffuse, uv - d).b;
      } else {
        col = texture2D(tDiffuse, uv).rgb;
      }
      // tint: cold = blue lift, warm = warm gain
      col += mix(vec3(0.010, 0.014, 0.030), vec3(0.0), warmth);
      col *= mix(vec3(0.96, 0.99, 1.06), vec3(1.05, 1.0, 0.93), warmth);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, 1.0 + saturation);
      // vignette
      float dcorner = distance(uv, vec2(0.5)) * 1.4142;
      col *= 1.0 - vignette * smoothstep(0.5, 1.1, dcorner);
      // grain
      col += (hash(gl_FragCoord.xy) - 0.5) * grain;
      col += flash;
      gl_FragColor = vec4(col, 1.0);
    }
  `
}

export class Renderer {
  renderer: THREE.WebGLRenderer
  composer: EffectComposer
  bloom: UnrealBloomPass
  grade: ShaderPass
  quality: Quality = 'high'
  private w = 1
  private h = 1
  aberrationTarget = 0
  flashValue = 0
  reduceMotion = false

  constructor(public scene: THREE.Scene, public camera: THREE.PerspectiveCamera, container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(scene, camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.6, 0.85)
    this.composer.addPass(this.bloom)
    this.grade = new ShaderPass(GradeShader as never)
    this.composer.addPass(this.grade)
    this.composer.addPass(new OutputPass())
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  get canvas() { return this.renderer.domElement }

  setQuality(q: Quality) {
    this.quality = q
    this.bloom.enabled = q !== 'low'
    this.renderer.shadowMap.enabled = q !== 'low'
    this.resize()
    // force material recompile for shadow toggle
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined
      if (m) m.needsUpdate = true
    })
  }

  resize() {
    this.w = Math.max(2, window.innerWidth)
    this.h = Math.max(2, window.innerHeight)
    const capByQ = { low: 1.0, med: 1.25, high: 1.5 }[this.quality]
    const pr = Math.min(window.devicePixelRatio || 1, capByQ)
    this.renderer.setPixelRatio(pr)
    this.renderer.setSize(this.w, this.h)
    this.composer.setPixelRatio(pr)
    this.composer.setSize(this.w, this.h)
    this.camera.aspect = this.w / this.h
    this.camera.updateProjectionMatrix()
  }

  render(dt: number, time: number) {
    if (this.w !== Math.max(2, window.innerWidth) || this.h !== Math.max(2, window.innerHeight)) this.resize()
    const u = this.grade.uniforms as Record<string, THREE.IUniform>
    u.time.value = time
    // scare aberration eases back to 0 over ~0.8s
    u.aberration.value += (this.aberrationTarget - u.aberration.value) * Math.min(1, dt * 4)
    this.aberrationTarget *= Math.pow(0.2, dt)
    this.flashValue *= Math.pow(0.001, dt)
    u.flash.value = this.flashValue
    u.grain.value = this.reduceMotion || this.quality === 'low' ? 0 : 0.025
    this.composer.render()
  }

  setGrade(saturation: number, vignette: number, warmth: number, bloomStrength: number, exposure: number) {
    const u = this.grade.uniforms as Record<string, THREE.IUniform>
    u.saturation.value = saturation
    u.vignette.value = vignette
    u.warmth.value = warmth
    this.bloom.strength = bloomStrength
    this.renderer.toneMappingExposure = exposure
  }

  scarePulse() {
    this.aberrationTarget = 0.006
  }
  lightning() {
    this.flashValue = 0.18
  }
}
