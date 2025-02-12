import { useEffect, useRef, useState } from 'react'
import './App.css'
import DrawingTool from '../components/draw'
import P2PJoinUI from '../components/p2pJoinUI'
import StartUpPeerConnection from '../scripts/P2PNetwork'

function waitForValue(getValue, interval = 100) {
  return new Promise((resolve) => {
      const check = setInterval(() => {
          const value = getValue
          if (value !== null && value !== undefined) {
              clearInterval(check)
              resolve(value)
          }
      }, interval)
  })
}

const Landing = ({ peerClient, setPeerClient, setShowLanding }) => {
  const [count, setCount] = useState(0)
  const [offer, setOffer] = useState(null)
  const offerRef = useRef(null)

    useEffect(() => {
      offerRef.current = offer
    }, [offer])

  const createPeerOffer = async () => { // Getting offer string
    setPeerClient(StartUpPeerConnection("client"))
    waitForValue(peerClient).then(() => {
      peerClient = peerClient.current
      peerClient.peer.oniceconnectionstatechange = () => { // Check if connection can be established
        console.log("ICE connection state:", peerClient.peer.iceConnectionState)
    
        if (peerClient.peer.iceConnectionState === "connected") {
            // Listen for the creation of a data channel
            peerClient.peer.ondatachannel = (event) => { // Wait for full connection
                console.log("Data channel opened:", event.channel)
                 
                peerClient.peer.ondatachannel = null
            }
        } else if (peerClient.peer.iceConnectionState === "failed") {
            // Show error to user
        }
        
        peerClient.peer.oniceconnectionstatechange = null
      }
    }).then(async () => {
      const offer_ = await peerClient.createOffer();
      setOffer(offer_)  // Update state once the offer is created
    })
  }

  useEffect(() => {
    document.querySelector("#host-button").addEventListener("click", () => {
      setPeerClient("host")
      setShowLanding(false)
    })

    // Join host handler //

    document.querySelector("#join-button").addEventListener("click", () => {
      createPeerOffer()
      document.querySelector("#join-wrapper").style.transform = "translateX(0)"
    })

    document.querySelector("#copy-offer").addEventListener("click", () => {
      navigator.clipboard.writeText(offerRef.current).then(() => {
          console.log("Text copied to clipboard!");
      }).catch(err => {
          console.error("Failed to copy: ");
      });  
    })

    document.querySelector("#paste-answer-wrapper button").addEventListener("click", () => {
      peerClient.saveAnswer(document.querySelector("#paste-answer-wrapper input").value)
    })

    document.querySelector("#copy-ICE").addEventListener("click", () => {
      navigator.clipboard.writeText(peerClient.getICE()).then(() => {
          console.log("Text copied to clipboard!");
      }).catch(err => {
          console.error("Failed to copy");
      });  
    })

    document.querySelector("#paste-ICE-wrapper button").addEventListener("click", () => {
      peerClient.saveIceCandidate(document.querySelector("#paste-ICE-wrapper input").value)
      console.log("mrow", document.querySelector("#paste-ICE-wrapper input").value)
    })

    document.querySelector("#username-wrapper button").addEventListener("click", () => {
      peerClient.getDataChannel().send(JSON.stringify({'name': document.querySelector("#username-wrapper input").value}))

      // Change to drawing page as client
      setShowLanding(false)
    })

  }, [peerClient])

  return (
    <>
      <aside id='join-wrapper'>
          <div id='join-steps'>
            <button id='copy-offer'>copy offer</button>
            <div id='paste-answer-wrapper'>
              <input></input>
              <button>answer</button>
            </div>
            <button id='copy-ICE'>Copy ICE</button>
            <div id='paste-ICE-wrapper'>
              <input></input>
              <button>ICE</button>
            </div>
            <div id='username-wrapper'>
              <input></input>
              <button>name</button>
            </div>
          </div>
      </aside>
      <header id='menu-header'>
        <div className='header-content'>
          <div className='header-button-wrapper'>
            <button id='host-button' className='header-button'>Host</button>
            <div className='header-button-background'></div>
          </div>
          <div className='header-button-wrapper'>
            <button id='join-button' className='header-button'>Join</button>
            <div className='header-button-background'></div>
          </div>
          <div className='header-button-wrapper'>
            <button className='header-button'>About</button>
            <div className='header-button-background'></div>
          </div>
        </div>
      </header>
      <main style={{ width: '100vw', height: 'fit-content', overflowY: 'hidden' }}>
        <div id='title-test-wrapper'>
          <div id='title-holder'>
            <h1 style={{ fontSize: '90px', margin: '0' }}>Fugma</h1>
            <h2 style={{ fontSize: '30px' }}>The Real Time Collaborative Tool</h2>
          </div>
          <div id='drawing-canvas-wrapper'>
            <DrawingTool peerClient={ "offline" } />
          </div>
        </div>
        <p>{offer}</p>
      </main>
      <footer>
        <div className='footer-deco'></div>
        <div className='footer-main'></div>
      </footer>
    </>
  )
}

export default Landing
