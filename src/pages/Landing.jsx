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

    document.querySelector("#copy-offer-wrapper").addEventListener("click", () => {
      navigator.clipboard.writeText(offerRef.current).then(() => {
          console.log("Text copied to clipboard!");
      }).catch(err => {
          console.error("Failed to copy: ");
      });  
    })

    document.querySelector("#paste-answer-wrapper button").addEventListener("click", () => {
      try {
        peerClient.saveAnswer(document.querySelector("#paste-answer-wrapper input").value)
        document.querySelector("#paste-answer-wrapper .status").style.backgroundColor = "Green"
      } catch (error) {
        console.error("Error:", error.message)
      }
    })

    document.querySelector("#copy-ICE-wrapper").addEventListener("click", () => {
      navigator.clipboard.writeText(peerClient.getICE()).then(() => {
          console.log("Text copied to clipboard!");
      }).catch(err => {
          console.error("Failed to copy");
      });  
    })

    document.querySelector("#paste-ICE-wrapper button").addEventListener("click", () => {
      try {
        peerClient.saveIceCandidate(document.querySelector("#paste-ICE-wrapper input").value)
        document.querySelector("#paste-ICE-wrapper .status").style.backgroundColor = "Green"
      } catch (error) {
        console.error("Error:", error.message)
      }
    })

    document.querySelector("#username-wrapper button").addEventListener("click", () => {
      peerClient.getDataChannel().send(JSON.stringify({'name': document.querySelector("#username-wrapper input").value}))

      // Change to drawing page as client
      setShowLanding(false)
    })

  }, [peerClient])

  useEffect(() => {
    document.querySelector("#join-button").addEventListener("click", () => {
      createPeerOffer()
      document.querySelector("#join-wrapper").style.transform = "translateX(0)"
    })

    document.querySelector("#join-back-button").addEventListener("click", () => {
      document.querySelector("#join-wrapper").style.transform = "translateX(100%)"
      peerClient.peer.close()

      document.querySelector("#paste-answer-wrapper .status").style.backgroundColor = ""
    })
  }, [])

  return (
    <>
      <aside id='join-wrapper'>
        <div id='join-steps'>

          <div className='top-button-wrapper' id='join-back-button'>
            <div className='nav-button'>
              <button className='back-button-canvas' style={{ rotate: '180deg' }} />
            </div>
            <div className='nav-button-shadow'></div>
          </div>

          <button id='copy-offer-wrapper'>
            <div id='copy-offer-main' style={{ position: 'absolute' }}>
              <div id='copy-offer-text'>copy offer</div>
              <div id='copy-offer-icon'></div>
            </div>
            <div id='copy-offer-shadow'>mraw</div>
          </button>
          <div id='paste-answer-wrapper' style={{ transform: 'translateX(-10px)' }}>
            <div className='status' style={{ transform: 'translateY(-20px)' }}>
              <div></div>
            </div>
            <input placeholder='Paste answer'></input>
            <button></button>
          </div>

          <button id='copy-ICE-wrapper'>
            <div id='copy-ICE-main' style={{ position: 'absolute' }}>
              <div id='copy-ICE-text'>copy ICE</div>
              <div id='copy-ICE-icon'></div>
            </div>
            <div id='copy-ICE-shadow'></div>
          </button>

          <div id='paste-ICE-wrapper' style={{ transform: 'translateX(-10px)' }}>
            <div className='status' style={{ transform: 'translateY(-20px)' }}>
              <div></div>
            </div>
            <input placeholder='Paste Other ICE'></input>
            <button></button>
          </div>
          <div id='username-wrapper'>
            <input placeholder='User Name'></input>
            <button></button>
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
      </main>
      <footer>
        <div className='footer-deco'></div>
        <div className='footer-main'></div>
      </footer>
    </>
  )
}

export default Landing
