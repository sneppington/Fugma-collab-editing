const StartUpPeerConnection = (mode) => {
  const peer = new RTCPeerConnection()
  let dataChannel // Instance to send/receive messages through
  let ICE = []
  
  const createOffer = () => {
      dataChannel = peer.createDataChannel("chat")

      return peer.createOffer().then((offer) => {
          return peer.setLocalDescription(offer).then(() => {
              return JSON.stringify(offer) // Return the offer as a string to send
          })
      })
  }

  const createAnswer = (offer) => {
      console.log("Creating answer...")
      return peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer))).then(() => {
          return peer.createAnswer().then((answer) => {
              return peer.setLocalDescription(answer).then(() => {
                  return JSON.stringify(answer) // Return the answer as a string to send
              })
          })
      })
  }

  const saveAnswer = (answer) => {
      return peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)))
          .then(() => "Answer saved and remote description set.")
          .catch((err) => console.error("Error setting remote answer:", err))
  }

  // Save ICE candidate received from the remote peer
  const saveIceCandidate = (candidates) => {
    JSON.parse(candidates).forEach(candidate => {
        peer.addIceCandidate(new RTCIceCandidate(candidate))
          .then(() => console.log("ICE candidate added:", candidate))
          .catch(err => console.error("Error adding ICE candidate:", err))
    })
  }

  const getDataChannel = () => {
    return dataChannel
  }

  const getICE = () => {
    return JSON.stringify(ICE)
  }

  // Listen for ICE candidates and send them to the other peer
  peer.onicecandidate = (event) => {
      if (event.candidate) {
        ICE.push(event.candidate)
        console.log(ICE)
        // Send this candidate to the remote peer
      }
  }

  // Handle data channel events
  peer.addEventListener('datachannel', event => {
    console.log("Data channel opened:", event.channel)
    dataChannel = event.channel
  
    dataChannel.addEventListener('message', event => {
      console.log("Received message:", event.data)
    })
  })
  
  peer.onconnectionstatechange = () => {
    console.log("Connection state changed:", peer.connectionState);

    if (peer.connectionState === "connected") {
      console.log("Peer-to-peer connection established successfully!");
    }
  }


  return {
      peer,
      mode,
      getICE,
      getDataChannel,
      createOffer,
      createAnswer,
      saveAnswer,
      saveIceCandidate
  }
}

export default StartUpPeerConnection
