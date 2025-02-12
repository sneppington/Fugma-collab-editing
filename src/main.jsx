import React, { useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './pages/Landing.jsx'
import DrawingPage from './pages/DrawingPage.jsx'
import StartUpPeerConnection from './scripts/P2PNetwork'

const App = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [peerClient, setPeerClient] = useState(null)
  const peerRef = useRef(null)

  useEffect(() => {
    peerRef.current = peerClient
  }, [peerClient])

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&display=swap" rel="stylesheet"></link>
      {showLanding ? (
        <Landing peerClient={peerRef} setPeerClient={setPeerClient} setShowLanding={setShowLanding} />
      ) : (
        <DrawingPage peerClient={peerRef} setPeerClient={setPeerClient} setShowLanding={setShowLanding} />
      )}
    </>
  );
}

const root = createRoot(document.getElementById('root'));

root.render(<App />);
