import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import celestialUrl from '../../assets/engravings/bg-celestial.png?url';

const INK = new THREE.Color('#2C2620');
const GOLD = new THREE.Color('#E7C200');
const WINE = new THREE.Color('#7E3B4E');

function Backdrop() {
  const texture = useTexture(celestialUrl);
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.02;
  });

  return (
    <mesh ref={ref} position={[0, 0, -4]} scale={9}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.22}
        color={INK}
        depthWrite={false}
      />
    </mesh>
  );
}

function Sparks({ count = 520 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const { positions, colors, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const palette = [GOLD, WINE, INK];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 13;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      const c = palette[i % 3 === 0 ? 0 : i % 5 === 0 ? 1 : 2];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      speeds[i] = 0.15 + Math.random() * 0.4;
    }
    return { positions, colors, speeds };
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current) return;
    const arr = points.current.geometry.attributes.position
      .array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * speeds[i] * 0.3;
      if (arr[i * 3 + 1] > 4.5) arr[i * 3 + 1] = -4.5;
    }
    points.current.geometry.attributes.position.needsUpdate = true;

    const px = state.pointer.x * 0.25;
    const py = state.pointer.y * 0.18;
    points.current.rotation.y += (px - points.current.rotation.y) * 0.04;
    points.current.rotation.x += (-py - points.current.rotation.x) * 0.04;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Rig() {
  const { camera } = useThree();
  useFrame((state) => {
    camera.position.x += (state.pointer.x * 0.4 - camera.position.x) * 0.03;
    camera.position.y += (state.pointer.y * 0.3 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

interface HeroCanvasProps {
  active: boolean;
}

export default function HeroCanvas({ active }: HeroCanvasProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 55 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Backdrop />
      <Sparks />
      <Rig />
    </Canvas>
  );
}
