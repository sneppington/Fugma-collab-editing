import { useEffect, useState } from 'react'
import './App.css'
import DrawingTool from './components/draw'

function Landing() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Setup canvas //

    // Animations //

  }, [])

  return (
    <>
      <header id='menu-header'>
        <div className='header-content'>
          <div className='header-button-wrapper'>
            <button className='header-button'>Host</button>
            <div className='header-button-background'></div>
          </div>
          <div className='header-button-wrapper'>
            <button className='header-button'>Join</button>
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
            <DrawingTool/>
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
