import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  Environment, 
  Sky,
  Text,
  useGLTF,
  PresentationControls
} from '@react-three/drei';
import * as THREE from 'three';

function Avatar({ position, username, isCurrentUser }) {
  const mesh = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state, delta) => {
    // Add subtle floating animation
    mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
  });

  return (
    <group position={position}>
      <mesh 
        ref={mesh}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial 
          color={isCurrentUser ? "#00ff00" : hovered ? "#ff0000" : "hotpink"} 
        />
      </mesh>
      <Text
        position={[0, 2, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {username}
      </Text>
    </group>
  );
}

function MetaverseScene({ currentUser }) {
  const { camera } = useThree();
  const [avatars, setAvatars] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);

  // Simulate other users (replace with real data later)
  useEffect(() => {
    setAvatars([
      { id: 1, username: "User1", position: [2, 0, 2] },
      { id: 2, username: "User2", position: [-2, 0, -2] },
      { id: 3, username: "User3", position: [3, 0, -3] },
    ]);
  }, []);

  return (
    <>
      {/* Environment */}
      <Sky sunPosition={[100, 100, 20]} />
      <Environment preset="sunset" />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Ground */}
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={3.3}
        sectionThickness={1.5}
        sectionColor="#9d4b4b"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
      
      {/* Avatars */}
      {currentUser && (
        <Avatar 
          position={[0, 1, 0]} 
          username={currentUser.username} 
          isCurrentUser={true}
        />
      )}
      {avatars.map(avatar => (
        <Avatar 
          key={avatar.id}
          position={avatar.position}
          username={avatar.username}
          isCurrentUser={false}
        />
      ))}
      
      {/* Interactive Objects */}
      <mesh position={[5, 0.5, 5]} onClick={() => console.log('Object clicked!')}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      
      {/* Controls */}
      <PresentationControls
        global
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 4, Math.PI / 4]}
        azimuth={[-Math.PI / 4, Math.PI / 4]}
      >
        <OrbitControls
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={20}
        />
      </PresentationControls>
    </>
  );
}

export default MetaverseScene; 