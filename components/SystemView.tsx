import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Html, MeshDistortMaterial, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --- CUSTOM SHADERS ---

// Fresnel Atmosphere Shader
const AtmosphereMaterial = shaderMaterial(
  { color: new THREE.Color(0.0, 0.0, 0.0), coefficient: 0.7, power: 3.0 },
  // Vertex Shader
  `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 color;
    uniform float coefficient;
    uniform float power;
    varying vec3 vNormal;
    void main() {
      float intensity = pow(coefficient - dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
      // Fade out at the back
      if (intensity > 0.8) intensity = 0.0; 
      gl_FragColor = vec4(color, intensity);
    }
  `
);

extend({ AtmosphereMaterial });

// --- TEXTURE GENERATION ---

const createGasTexture = (color1: string, color2: string) => {
    if (typeof document === 'undefined') return null;
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size, size);

    // Bands
    const bands = 15;
    for (let i = 0; i < bands; i++) {
        const y = Math.random() * size;
        const h = Math.random() * (size / 5);
        ctx.fillStyle = color2;
        ctx.globalAlpha = 0.1 + Math.random() * 0.3;
        ctx.fillRect(0, y, size, h);
        
        // Smudge edges
        ctx.globalAlpha = 0.05;
        ctx.fillRect(0, y - 5, size, 5);
        ctx.fillRect(0, y + h, size, 5);
    }

    // Noise
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for(let i=0; i<data.length; i+=4) {
        const noise = (Math.random() - 0.5) * 10;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
};

// --- COMPONENTS ---

interface CelestialBodyProps {
  size: number;
  color: string;
  distance: number;
  speed: number;
  children?: React.ReactNode;
  orbitColor?: string;
  isSun?: boolean;
  name?: string;
  phase?: number;
  hasRings?: boolean;
  ringColor?: string;
  ringRotation?: [number, number, number];
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
  type?: 'rocky' | 'gas' | 'ice' | 'star';
  secondaryColor?: string; // For gas giants
}

const Atmosphere: React.FC<{ size: number, color: string }> = ({ size, color }) => (
    <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[size, 32, 32]} />
        {/* @ts-ignore */}
        <atmosphereMaterial color={color} coefficient={0.5} power={2.5} transparent blending={THREE.AdditiveBlending} side={THREE.BackSide} depthWrite={false} />
    </mesh>
);

const ArtificialSatellite = ({ color = "#cbd5e1", distance, speed, phase = 0, scale = 1, rotationAxis = [0, 1, 0] }: any) => {
    const orbitRef = useRef<THREE.Group>(null);
    
    useFrame(({ clock }) => {
      if (orbitRef.current) {
        orbitRef.current.rotation.y = (clock.getElapsedTime() * speed * 0.1) + phase;
        // Add some inclination/wobble
        orbitRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1 + phase) * 0.1;
        orbitRef.current.rotation.z = Math.cos(clock.getElapsedTime() * 0.1 + phase) * 0.1;
      }
    });

    return (
      <group ref={orbitRef}>
          <group position={[distance, 0, 0]}>
              <group scale={[scale, scale, scale]}>
                  {/* Satellite Body */}
                  <mesh castShadow>
                      <boxGeometry args={[0.1, 0.1, 0.1]} />
                      <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
                  </mesh>
                  {/* Solar Panels */}
                  <mesh position={[0.15, 0, 0]}>
                      <boxGeometry args={[0.2, 0.01, 0.1]} />
                      <meshStandardMaterial color="#3b82f6" metalness={0.8} />
                  </mesh>
                  <mesh position={[-0.15, 0, 0]}>
                      <boxGeometry args={[0.2, 0.01, 0.1]} />
                      <meshStandardMaterial color="#3b82f6" metalness={0.8} />
                  </mesh>
                  
                  {/* Antenna */}
                  <mesh position={[0, 0.1, 0]}>
                      <cylinderGeometry args={[0.005, 0.005, 0.1]} />
                      <meshStandardMaterial color="silver" />
                  </mesh>
              </group>
          </group>
      </group>
    )
}

const SpaceStation = ({ distance, speed, phase = 0, scale = 1 }: any) => {
    const orbitRef = useRef<THREE.Group>(null);
    const stationRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
      if (orbitRef.current) {
        orbitRef.current.rotation.y = (clock.getElapsedTime() * speed * 0.1) + phase;
        orbitRef.current.rotation.z = 0.3; // Inclination
      }
      if (stationRef.current) {
          stationRef.current.rotation.y += 0.005;
      }
    });

    return (
      <group ref={orbitRef}>
          <group position={[distance, 0, 0]} ref={stationRef} scale={[scale, scale, scale]}>
               {/* Main Module */}
               <mesh rotation={[0,0,Math.PI/2]}>
                   <cylinderGeometry args={[0.08, 0.08, 0.6]} />
                   <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.4} />
               </mesh>
               {/* Cross Module */}
               <mesh>
                   <cylinderGeometry args={[0.06, 0.06, 0.4]} />
                   <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
               </mesh>
               {/* Solar Arrays */}
               <group position={[0, 0.25, 0]}>
                   <mesh rotation={[Math.PI/4, 0, 0]}>
                        <boxGeometry args={[0.8, 0.2, 0.01]} />
                        <meshStandardMaterial color="#1d4ed8" metalness={0.8} roughness={0.2} />
                   </mesh>
               </group>
               <group position={[0, -0.25, 0]}>
                   <mesh rotation={[-Math.PI/4, 0, 0]}>
                        <boxGeometry args={[0.8, 0.2, 0.01]} />
                        <meshStandardMaterial color="#1d4ed8" metalness={0.8} roughness={0.2} />
                   </mesh>
               </group>
               {/* Docking Port */}
               <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                   <coneGeometry args={[0.05, 0.1, 8]} />
                   <meshStandardMaterial color="#64748b" />
               </mesh>
          </group>
      </group>
    )
}

const CelestialBody: React.FC<CelestialBodyProps> = ({ 
  size, 
  color, 
  distance, 
  speed, 
  children,
  orbitColor = '#ffffff',
  isSun = false,
  name,
  phase = 0,
  hasRings = false,
  ringColor = '#eab308',
  ringRotation = [-Math.PI / 2.2, 0, 0],
  hasAtmosphere = false,
  atmosphereColor = '#ffffff',
  type = 'rocky',
  secondaryColor = '#ffffff'
}) => {
  const orbitRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const texture = useMemo(() => {
      if (type === 'gas' && secondaryColor) {
          return createGasTexture(color, secondaryColor);
      }
      return null;
  }, [type, color, secondaryColor]);

  useFrame(({ clock }) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y = (clock.getElapsedTime() * speed * 0.1) + phase;
    }
    if (bodyRef.current && !isSun) {
      bodyRef.current.rotation.y = clock.getElapsedTime() * (type === 'gas' ? 0.8 : 0.2);
    }
  });

  return (
    <group>
      {/* Orbit Path Visual */}
      {!isSun && distance > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[distance - 0.08, distance + 0.08, 128]} />
          <meshBasicMaterial color={orbitColor} opacity={0.05} transparent side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      
      {/* Orbiting Group */}
      <group ref={orbitRef}>
        <group position={[distance, 0, 0]}>
          
          <group ref={bodyRef}>
            {/* SUN */}
            {isSun ? (
                <group>
                    <mesh>
                        <sphereGeometry args={[size, 64, 64]} />
                        <meshStandardMaterial emissive="#f59e0b" emissiveIntensity={2} color="#fcd34d" toneMapped={false} />
                    </mesh>
                    <mesh scale={[1.05, 1.05, 1.05]}>
                        <sphereGeometry args={[size, 64, 64]} />
                        {/*@ts-ignore*/}
                        <MeshDistortMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={1} distort={0.4} speed={2} transparent opacity={0.4} />
                    </mesh>
                    <pointLight intensity={3} distance={500} decay={1} color="#ffaa00" />
                    <Sparkles count={150} scale={size * 4} size={10} speed={0.4} opacity={0.6} color="#fbbf24" />
                    <Atmosphere size={size * 1.3} color="#f59e0b" />
                </group>
            ) : (
                /* PLANETS */
                <group>
                    <mesh castShadow receiveShadow>
                        <sphereGeometry args={[size, 64, 64]} />
                        <meshStandardMaterial 
                            color={texture ? '#ffffff' : color}
                            map={texture}
                            roughness={type === 'gas' ? 0.4 : 0.8}
                            metalness={type === 'ice' ? 0.3 : 0.1}
                        />
                    </mesh>
                    
                    {/* Earth Clouds */}
                    {name === 'Earth' && (
                        <mesh scale={[1.02, 1.02, 1.02]}>
                            <sphereGeometry args={[size, 64, 64]} />
                            <meshStandardMaterial color="white" transparent opacity={0.35} roughness={1} depthWrite={false} />
                        </mesh>
                    )}

                    {/* Shader Atmosphere */}
                    {hasAtmosphere && <Atmosphere size={size} color={atmosphereColor} />}

                    {/* Rings */}
                    {hasRings && (
                        <group rotation={ringRotation}>
                            <mesh>
                                <ringGeometry args={[size * 1.4, size * 2.5, 128]} />
                                <meshStandardMaterial color={ringColor} opacity={0.7} transparent side={THREE.DoubleSide} />
                            </mesh>
                            {/* Inner Faint Ring */}
                            <mesh>
                                <ringGeometry args={[size * 1.1, size * 1.35, 64]} />
                                <meshStandardMaterial color={ringColor} opacity={0.3} transparent side={THREE.DoubleSide} />
                            </mesh>
                        </group>
                    )}
                </group>
            )}
          </group>
          
          {/* Label */}
          {name && (
            <Html position={[0, size + (hasRings ? size : 0.5) + 0.5, 0]} center distanceFactor={25} zIndexRange={[100, 0]}>
               <div className="pointer-events-none select-none text-white text-[10px] font-cinzel font-bold bg-black/60 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap backdrop-blur-sm transition-opacity hover:opacity-100 opacity-70">
                 {name}
               </div>
            </Html>
          )}

          {/* Children (Moons) */}
          {children}
        </group>
      </group>
    </group>
  );
};

export const SystemView = ({ onBack, researchedTechs = [] }: { onBack: () => void, researchedTechs?: string[] }) => {
  const hasSatellites = researchedTechs.includes('satellites');

  return (
    <div className="w-full h-full relative bg-black animate-fade-in">
      <div className="absolute top-6 left-6 z-50">
        <button 
            onClick={onBack}
            className="bg-slate-900/80 text-blue-200 px-6 py-2 rounded-lg border border-blue-500/30 hover:bg-blue-900/50 hover:border-blue-400 transition font-cinzel font-bold flex items-center gap-2 backdrop-blur-md"
        >
            ← Return to World
        </button>
      </div>
      
      <div className="absolute bottom-6 left-6 z-50 pointer-events-none">
          <h1 className="text-4xl text-white font-cinzel font-bold tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">SOLAR SYSTEM</h1>
          <div className="text-blue-400 font-mono text-sm mt-1">Stellar Cartography Mode</div>
      </div>

      <Canvas camera={{ position: [0, 50, 80], fov: 35 }} shadows dpr={[1, 2]}>
        <OrbitControls maxDistance={300} minDistance={10} enablePan={true} />
        <Stars radius={300} depth={50} count={8000} factor={4} saturation={0} fade speed={0.5} />
        <ambientLight intensity={0.05} />
        
        {/* Sun */}
        <CelestialBody size={6} color="#fbbf24" distance={0} speed={0} isSun name="Sun" />

        {/* Mercury */}
        <CelestialBody size={0.4} color="#a1a1aa" distance={10} speed={2.5} name="Mercury" phase={1} type="rocky" />

        {/* Venus */}
        <CelestialBody size={0.9} color="#eab308" distance={15} speed={1.8} name="Venus" phase={3} type="rocky" hasAtmosphere atmosphereColor="#fde047" />

        {/* Earth */}
        <CelestialBody size={1.0} color="#1d4ed8" distance={22} speed={1.2} name="Earth" phase={5} type="rocky" hasAtmosphere atmosphereColor="#60a5fa">
           {/* Moon */}
           <CelestialBody size={0.25} color="#cbd5e1" distance={2.5} speed={4.0} orbitColor="#555555" phase={0} />
           
           {/* Satellites & Station */}
           {hasSatellites && (
               <>
                   <SpaceStation distance={1.8} speed={5.0} scale={1} />
                   <ArtificialSatellite distance={1.4} speed={6.5} phase={1} />
                   <ArtificialSatellite distance={1.5} speed={7.0} phase={3} />
                   <ArtificialSatellite distance={1.4} speed={6.0} phase={5} />
               </>
           )}
        </CelestialBody>

        {/* Mars */}
        <CelestialBody size={0.6} color="#ef4444" distance={29} speed={0.8} name="Mars" phase={0.5} type="rocky" hasAtmosphere atmosphereColor="#fca5a5">
           <CelestialBody size={0.1} color="#7f1d1d" distance={1.2} speed={5} orbitColor="#555555" phase={1} />
           <CelestialBody size={0.1} color="#991b1b" distance={1.5} speed={4} orbitColor="#555555" phase={3} />
        </CelestialBody>

        {/* Asteroid Belt */}
        <group rotation={[Math.PI / 12, 0, 0]}>
            <points>
                <ringGeometry args={[33, 38, 128, 1]} />
                <pointsMaterial size={0.08} color="#78716c" transparent opacity={0.3} sizeAttenuation={true} />
            </points>
            <points>
                <ringGeometry args={[32.5, 38.5, 96, 4]} />
                <pointsMaterial size={0.25} color="#a8a29e" transparent opacity={0.8} sizeAttenuation={true} />
            </points>
            <points>
                <ringGeometry args={[34, 37, 64, 2]} />
                <pointsMaterial size={0.35} color="#d6d3d1" transparent opacity={0.9} sizeAttenuation={true} />
            </points>
        </group>

        {/* Jupiter - Gas Giant with Bands */}
        <CelestialBody size={3.2} color="#d97706" distance={48} speed={0.4} name="Jupiter" phase={2} type="gas" secondaryColor="#fef3c7">
           <CelestialBody size={0.3} color="#fef3c7" distance={4.5} speed={2.0} orbitColor="#555555" phase={0} />
           <CelestialBody size={0.25} color="#fcd34d" distance={5.5} speed={1.5} orbitColor="#555555" phase={2} />
           <CelestialBody size={0.35} color="#b45309" distance={6.5} speed={1.0} orbitColor="#555555" phase={4} />
           <CelestialBody size={0.28} color="#92400e" distance={7.5} speed={0.8} orbitColor="#555555" phase={1} />
        </CelestialBody>

        {/* Saturn - Gas Giant with Rings */}
        <CelestialBody size={2.8} color="#fcd34d" distance={65} speed={0.25} name="Saturn" phase={4.5} hasRings ringColor="#fef08a" type="gas" secondaryColor="#fef9c3">
            <CelestialBody size={0.2} color="#fef3c7" distance={5.0} speed={1.2} orbitColor="#555555" phase={1} />
        </CelestialBody>

        {/* Uranus */}
        <CelestialBody size={2.0} color="#22d3ee" distance={80} speed={0.15} name="Uranus" phase={6} type="ice" hasRings ringColor="#cffafe" ringRotation={[0, 0, Math.PI/2]} />

        {/* Neptune */}
        <CelestialBody size={1.9} color="#3b82f6" distance={95} speed={0.1} name="Neptune" phase={1} type="ice" hasAtmosphere atmosphereColor="#60a5fa" />

        {/* Pluto */}
        <CelestialBody size={0.35} color="#d6cbb6" distance={110} speed={0.08} name="Pluto" phase={2} type="rocky">
            <CelestialBody size={0.15} color="#9ca3af" distance={0.8} speed={3} orbitColor="#555555" phase={0} />
        </CelestialBody>

        {/* Eris */}
        <CelestialBody size={0.32} color="#f3f4f6" distance={130} speed={0.05} name="Eris" phase={4} type="ice" />

      </Canvas>
    </div>
  )
}