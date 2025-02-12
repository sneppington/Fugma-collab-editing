import { useEffect, useRef, useState } from 'react'
import './App.css'
import DrawingTool from '../components/draw'
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

const DrawingPage = ({ peerClient, setShowLanding }) => {
    const [drawControl, setDrawControl] = useState(null) // Need to pass paper scope back up to handle the canvas
    const drawControlRef = useRef(null)
    useEffect(() => {
        drawControlRef.current = drawControl
        console.log(drawControl)
    }, [drawControl])

    const peerConnections = useRef({"peers": [], "mode": ""}) // Dictionary {mode, peers} passed down to DrawingTool

    let answer

    useEffect(() => {
        waitForValue(peerClient).then(() => {
            if (peerClient.current === "host") { // Hosting
                let addingUser = false
                let peerNames = []
                let peerConnectionBuffer

                peerConnections.current.mode = "host"
        
                const addUserWrapper = document.querySelector("#add-user-wrapper")
                const addUserButton = document.querySelector("#add-user-button")

                addUserWrapper.style.height = "30px"
        
                addUserButton.addEventListener("click", () => {
                    if (addingUser) {
                        addUserWrapper.style.height = "30px"
                    } else {
                        addUserWrapper.style.height = `${addUserWrapper.scrollHeight}px`
                        console.log("meowozies")
                        peerConnectionBuffer = StartUpPeerConnection("host")

                        peerConnectionBuffer.peer.ondatachannel = (event) => {
                            event.channel.onmessage = (message) => {
                                const peerConnection = peerConnectionBuffer
                                peerConnections.current.peers.push(peerConnection)
                                const name = JSON.parse(message.data).name
        
                                // Add user to userlist

                                const userButton = `<span>${name}</span>
                                                    <button className='remove-user'></button>`

                                const htmlElement = document.createElement("div")
                                htmlElement.className = "user"
                                htmlElement.insertAdjacentHTML("beforeend", userButton.trim())

                                htmlElement.querySelector("button").addEventListener("click", () => {
                                    peerConnection.getDataChannel().send(JSON.stringify({"answer": "close"}))
                                    peerConnection.peer.close()
                                    htmlElement.remove()
                                })

                                document.querySelector("#user-list").appendChild(htmlElement)

                                peerConnection.peer.addEventListener("connectionstatechange", () => {  
                                    if (  
                                        peerClient.peer.connectionState === "disconnected" ||  
                                        peerClient.peer.connectionState === "failed"  
                                    ) {  
                                        htmlElement.remove()
                                    }  
                                })   

                                const echoPeers = (message) => {
                                    for (let i = 0; i < peerConnections.current.peers.length; i++) {
                                        if (peerConnections.current.peers[i] === peerConnection) {
                                            continue // Skip echoing over original peer
                                        }

                                        peerConnections.current.peers[i].getDataChannel().send(message) // Echo
                                    }
                                }

                                event.channel.onmessage = (message) => {
                                    message = JSON.parse(message.data)
                                    switch (message.answer) {
                                        case "newCanvas":
                                            drawControlRef.current.replaceCanvas(JSON.parse(message.content))
                                            break
                                        case "addPath":
                                            drawControlRef.current.replaceCanvas(JSON.parse(message.content))
                                            break
                                        case "removePath":
                                            drawControlRef.current.removePath(JSON.parse(message.content))
                                            break
                                        default:
                                            break
                                    }
                                }
                            }
                        }
                    }
                    addingUser = !addingUser
                })
        
                document.querySelector("form").addEventListener("submit", (event) => {
                    event.preventDefault()
                })
        
                document.querySelector("#answer-wrapper button").addEventListener("click", () => {
                    peerConnectionBuffer.createAnswer(
                        document.querySelector("#user-add-form input").value
                    ).then((answer_) => {
                        answer = answer_
                        navigator.clipboard.writeText(answer_).then(() => {
                            console.log("Text copied to clipboard!")
                        }).catch(err => {
                            console.error("Failed to copy: ")
                        })
                    })
                })
        
                document.querySelector("#copy-answer").addEventListener("click", () => {
                    navigator.clipboard.writeText(answer).then(() => {
                        console.log("Text copied to clipboard!")
                    }).catch(err => {
                        console.error("Failed to copy: ")
                    })
                })
        
                document.querySelector("#copy-ICE").addEventListener("click", () => {
                    navigator.clipboard.writeText(peerConnectionBuffer.getICE()).then(() => {
                        console.log(peerConnectionBuffer)
                        console.log("Text copied to clipboard!")
                    }).catch(err => {
                        console.error("Failed to copy: ")
                    })
                })
        
                document.querySelector("#ICE-wrapper button").addEventListener("click", () => {
                    peerConnectionBuffer.saveIceCandidate(document.querySelector("#ICE-wrapper input").value)
                })
            } else { // Client
                document.querySelector("#add-user-wrapper").remove()

                peerClient = peerClient.current
                let dataChannel = peerClient.getDataChannel()

                peerConnections.current.mode = "client"
                peerConnections.current.peers.push(peerClient)

                peerClient.peer.addEventListener("connectionstatechange", () => {  
                    if (  
                        peerClient.peer.connectionState === "disconnected" ||  
                        peerClient.peer.connectionState === "failed"  
                    ) {  
                        console.log("Peer disconnected!")  
                        setShowLanding(true)  
                    }  
                })                

                dataChannel.onmessage = (message) => {
                    message = JSON.parse(message.data)
                    switch (message.answer) {
                        case "userList":
                            for (let i = 0; i < message.content.length; i++) {
                                const userPrompt = `<span>${message.content[i]}</span>`

                                const htmlElement = document.createElement("div")
                                htmlElement.className = "user"
                                htmlElement.insertAdjacentHTML("beforeend", userButton.trim())

                                document.querySelector("#user-list").innerHTML = ""
                                document.querySelector("#user-list").appendChild(htmlElement)
                            }
                            break
                        case "newCanvas":
                            drawControlRef.current.replaceCanvas(JSON.parse(message.content))
                            break
                        case "addPath":
                            drawControlRef.current.replaceCanvas(JSON.parse(message.content))
                            break
                        case "removePath":
                            drawControlRef.current.removePath(JSON.parse(message.content))
                            break
                        case "close":
                            setShowLanding(true)
                        default:
                            break
                    }
                }

                //dataChannel.send(JSON.stringify({'request': 'userList'})) // Request User List
            }
        })    
    }, [])

    return (
        <div style={{ width: '100vw', height: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div id='drwaing-tool-wrapper' style={{ width: "80%", height: "100%", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DrawingTool setDrawControl={ setDrawControl } peerConnections={ peerConnections } />
            </div>
            <aside id='draw-page-control-bar'>
                <div id='add-user-wrapper'>
                    <div id='add-user-button-wrapper'>
                        <button id='add-user-button'>
                            <div></div>
                            <div style={{ rotate: '90deg' }} ></div>
                        </button>
                        <span>Add user...</span>
                    </div>
                    <form id='user-add-form'>
                        <div id='answer-wrapper'>
                            <input type='text' placeholder='Paste Offer'></input>
                            <button></button>
                        </div>
                        <button id='copy-answer'>copy answer</button>
                        <button id='copy-ICE'>copy ICE</button>
                        <div id='ICE-wrapper'>
                            <input type='text' placeholder='Paste ICE'></input>
                            <button></button>
                        </div>
                    </form>
                </div>
                <div id='user-list'>
                </div>
            </aside>
        </div>
    )
}

export default DrawingPage