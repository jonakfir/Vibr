"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 400;

const vertexShader = `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  varying float vAlpha;
  varying float vViolet;

  void main() {
    float t = uTime * 0.03;
    vec3 pos = position;
    pos.x += sin(t + aPhase) * 0.15;
    pos.y += cos(t * 0.6 + aPhase * 1.3) * 0.12;
    pos.z += sin(t * 0.4 + aPhase * 0.7) * 0.1;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (80.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = 0.04 + 0.03 * sin(t * 0.5 + aPhase * 2.0);
    vViolet = step(0.94, fract(aPhase * 7.13));
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying float vViolet;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float fade = 1.0 - smoothstep(0.1, 0.5, d);

    vec3 warmWhite = vec3(0.85, 0.82, 0.78);
    vec3 violet = vec3(0.49, 0.23, 0.93);
    vec3 color = mix(warmWhite, violet, vViolet * 0.5);

    gl_FragColor = vec4(color, vAlpha * fade);
  }
`;

function Particles() {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, phases } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      sizes[i] = 0.5 + Math.random() * 1.0;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, sizes, phases };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          array={sizes}
          count={PARTICLE_COUNT}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          array={phases}
          count={PARTICLE_COUNT}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function ParticleField() {
  return (
    <div className="absolute inset-0 z-0" aria-hidden="true">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Particles />
        </Canvas>
      </Suspense>
    </div>
  );
}
