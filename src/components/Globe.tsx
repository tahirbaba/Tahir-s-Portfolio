"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { home, sites } from "@/content/profile";

const R = 1;

function toVec(lat: number, lng: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

const dotVertex = /* glsl */ `
  uniform float uSize; uniform float uPr;
  varying float vFacing;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vFacing = dot(n, normalize(-mv.xyz));
    gl_PointSize = uSize * uPr * (0.55 + 0.45 * max(vFacing, 0.0));
    gl_Position = projectionMatrix * mv;
  }`;
const dotFragment = /* glsl */ `
  uniform vec3 uColor; varying float vFacing;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    float a = smoothstep(-0.05, 0.55, vFacing);
    gl_FragColor = vec4(uColor, a * 0.95);
  }`;
const atmoVertex = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const atmoFragment = /* glsl */ `
  uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
  void main() {
    float f = pow(abs(dot(vN, vV)), 2.2);
    gl_FragColor = vec4(uColor, f * 0.9);
  }`;

function Land({ dots }: { dots: [number, number][] }) {
  const { gl } = useThree();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(dots.length * 3);
    dots.forEach(([lat, lng], i) => toVec(lat, lng, R * 1.002).toArray(arr, i * 3));
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [dots]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dotVertex,
        fragmentShader: dotFragment,
        transparent: true,
        depthWrite: false,
        uniforms: { uSize: { value: 2.6 }, uPr: { value: Math.min(gl.getPixelRatio(), 2) }, uColor: { value: new THREE.Color("#8ccbff") } },
      }),
    [gl],
  );
  return <points geometry={geo} material={mat} />;
}

function Arcs() {
  const pulses = useRef<THREE.Mesh[]>([]);
  const arcs = useMemo(() => {
    const a = toVec(home.lat, home.lng);
    return sites.map((s, i) => {
      const b = toVec(s.lat, s.lng);
      const dist = a.distanceTo(b);
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R + dist * 0.42);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#8ccbff", transparent: true, opacity: 0.28 }));
      return { curve, line, end: b, offset: i / sites.length, speed: 0.22 + (i % 3) * 0.05 };
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    arcs.forEach((arc, i) => {
      const m = pulses.current[i];
      if (!m) return;
      const p = (t * arc.speed + arc.offset) % 1;
      m.position.copy(arc.curve.getPoint(p));
      const s = Math.sin(p * Math.PI);
      m.scale.setScalar(0.6 + s * 0.8);
    });
  });

  const homeV = toVec(home.lat, home.lng, R * 1.004);
  return (
    <group>
      {arcs.map((arc, i) => (
        <group key={i}>
          <primitive object={arc.line} />
          <mesh ref={(el) => { if (el) pulses.current[i] = el; }}>
            <sphereGeometry args={[0.012, 10, 10]} />
            <meshBasicMaterial color="#ffb547" />
          </mesh>
          <mesh position={arc.end.clone().multiplyScalar(1.004)}>
            <sphereGeometry args={[0.011, 10, 10]} />
            <meshBasicMaterial color="#8ccbff" />
          </mesh>
        </group>
      ))}
      <mesh position={homeV}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color="#ffb547" />
      </mesh>
      <HomeRing position={homeV} />
    </group>
  );
}

function HomeRing({ position }: { position: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize()), [position]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const p = (clock.getElapsedTime() * 0.6) % 1;
    ref.current.scale.setScalar(1 + p * 3.2);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - p);
  });
  return (
    <mesh ref={ref} position={position} quaternion={q}>
      <ringGeometry args={[0.02, 0.026, 40]} />
      <meshBasicMaterial color="#ffb547" transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function World({ dots }: { dots: [number, number][] }) {
  const group = useRef<THREE.Group>(null);
  const drag = useRef({ active: false, x: 0, y: 0, vx: 0, vy: 0 });
  const { gl } = useThree();
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  // Face home base toward the viewer, nudged so the westward arcs show.
  const startY = useMemo(() => {
    const v = toVec(home.lat, home.lng);
    return -Math.atan2(v.x, v.z) + 0.55;
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => { drag.current.active = true; drag.current.x = e.clientX; drag.current.y = e.clientY; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!drag.current.active) return;
      drag.current.vx = (e.clientX - drag.current.x) * 0.005;
      drag.current.vy = (e.clientY - drag.current.y) * 0.003;
      drag.current.x = e.clientX; drag.current.y = e.clientY;
    };
    const up = () => { drag.current.active = false; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const d = drag.current;
    g.rotation.y += d.vx + (reduced || d.active ? 0 : dt * 0.06);
    g.rotation.x = THREE.MathUtils.clamp(g.rotation.x + d.vy, -0.5, 0.7);
    d.vx *= 0.92; d.vy *= 0.92;
  });

  return (
    <group ref={group} rotation={[0.32, startY, 0]}>
      <mesh>
        <sphereGeometry args={[R * 0.995, 64, 64]} />
        <meshBasicMaterial color="#070b12" />
      </mesh>
      <Land dots={dots} />
      <Arcs />
    </group>
  );
}

function Atmosphere() {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: atmoVertex, fragmentShader: atmoFragment, transparent: true,
      blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color("#3d8bff") } },
    }),
    [],
  );
  return (
    <mesh material={mat} scale={1.2}>
      <sphereGeometry args={[R, 64, 64]} />
    </mesh>
  );
}

export default function Globe() {
  const [dots, setDots] = useState<[number, number][] | null>(null);
  const [visible, setVisible] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/land-dots.json").then((r) => r.json()).then((d) => { if (alive) setDots(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.7], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ touchAction: "pan-y" }}
      >
        <Atmosphere />
        {dots && <World dots={dots} />}
      </Canvas>
    </div>
  );
}
