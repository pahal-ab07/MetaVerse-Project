import React, { useState } from 'react';
import TokenInterface from './components/TokenInterface';
import MetaverseScene from './components/MetaverseScene';
import { Canvas } from '@react-three/fiber';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleUserRegistration = (userData) => {
    setCurrentUser(userData);
  };

  return (
    <div className="App">
      <div className="token-interface">
        <TokenInterface onUserRegistration={handleUserRegistration} />
      </div>
      <div className="metaverse-environment">
        <Canvas shadows camera={{ position: [5, 5, 5], fov: 75 }}>
          <MetaverseScene currentUser={currentUser} />
        </Canvas>
      </div>
    </div>
  );
}

export default App;