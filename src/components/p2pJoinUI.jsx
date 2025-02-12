import React, { useRef, useEffect, useState } from 'react';
import './componentsStyle.css'

const p2pJoinUI = ({ peerClient }) => {
    
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

    waitForValue(peerClient.current).then(() => {
        peerClient = peerClient.current
    })

    let step = 0
    let handlingSubmit = false // Avoid from there being more than 1 handleSubmit() at the same time
    const [color, setColor] = useState("#ff0066") // User Color
    const [userName, setUserName] = useState("")
    const [answer, setAnswer] = useState("") // P2P answer from the other peer for connection
    const [error, setError] = useState("")

    useEffect(() => {
        const form = document.querySelector("#p2p-form")

        const handleSubmit = (event) => {
            event.preventDefault()
            if (handlingSubmit) {
                return
            }
            console.log(step)
            handlingSubmit = true

            if (step === 0) {
                // Step 0
                let ICEConnection = false
                let DataChannel = false

                peerClient.peer.oniceconnectionstatechange = () => { // Check if connection can be established
                    console.log("ICE connection state:", peerClient.peer.iceConnectionState)
                
                    if (peerClient.peer.iceConnectionState === "connected") {
                        // Listen for the creation of a data channel
                        peerClient.peer.ondatachannel = (event) => { // Wait for full connection
                            console.log("Data channel opened:", event.channel)
                            
                            peerClient.peer.ondatachannel = null
                            handlingSubmit = false
                            step++
                        }
                    } else if (peerClient.peer.iceConnectionState === "failed") {
                        // Show error to user

                        handlingSubmit = false
                    }

                    peerClient.peer.oniceconnectionstatechange = null
                }
                
                console.log("savedAnswer")
                peerClient.saveAnswer(form.querySelector("#p2p-answer").value)
            } else {
                // Step 1
                peerClient.dataChannel.send(`{userName: ${form.querySelector("userName").value}, color: #FFFFFF}`) // Send username and usercolor
                handlingSubmit = false
            }
        }

        form.addEventListener("submit", handleSubmit)
    }, [])

    return (
        <div id='p2pJoinUI-main'>
            <form id='p2p-form'>
                <div>
                    <div id='p2p-request-code'></div>
                    <input type='text' id='p2p-answer'></input>
                    <div>
                        <input type='text' id='userName'></input>
                        <div className='color-picker-wrapper'>
                            <div className="color-picker" style={{ backgroundColor: color }}>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                />
                            </div>
                            <div className='color-picker-shadow'></div>
                        </div>
                    </div>
                </div>
                <button type='submit'></button>
            </form>
        </div>
    )
}

export default p2pJoinUI