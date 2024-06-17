import React from 'react'
import { useState } from 'react'
import { useCallback } from 'react'
import { useEffect } from 'react'
import { useRef } from 'react'

const useVideoCall = (socket) => {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const [joined, setJoined] = useState(false)

  const handleDisconnect = useCallback(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
  }, [remoteVideoRef, peerConnectionRef])

  const initializePeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })

    peerConnection.ontrack = event => {
      console.log('remoteVideoRef', remoteVideoRef, event)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate)
      }
    }

    peerConnection.oniceconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(peerConnection.iceConnectionState)) {
        handleDisconnect()
      }
    }

    peerConnectionRef.current = peerConnection
    return peerConnection
  }, [remoteVideoRef, peerConnectionRef, handleDisconnect])

  const setupSocketListener = useCallback(() => {
    socket.on('offer', async (id, description) => {
      const pc = peerConnectionRef.current ?? initializePeerConnection()
      await pc.setRemoteDescription(new RTCSessionDescription(description))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('answer', answer)
    })

    socket.on('answer', async (id, description) => {
      const pc = peerConnectionRef.current
      if (pc && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(description))
        setJoined(true)
      }
    })

    socket.on('candidate', async (id, candidate) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      }
    })

    socket.on('user-disconnected', () => {
      handleDisconnect()
    })

    return () => {
      handleDisconnect()
      socket.disconnect()
    }
  }, [peerConnectionRef, handleDisconnect, setJoined])

  const createOffer = useCallback(async () => {
    peerConnectionRef.current ?? initializePeerConnection()
    const offer = await peerConnectionRef.current.createOffer({
      iceRestart: true,
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    })
    await peerConnectionRef.current.setLocalDescription(offer)
    socket.emit('offer', offer)
  }, [peerConnectionRef, initializePeerConnection])

  const joinCall = useCallback(() => {
    createOffer()
    setJoined(true)
  }, [createOffer, setJoined])

  useEffect(() => {
    const peerConnection = initializePeerConnection()
    // Setup local video
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))
    })
  }, [])

  useEffect(() => {
    // Add socket listener
    setupSocketListener()
    return () => {
      ['offer', 'answer', 'candidate', 'user-disconnected'].forEach(event => {
        socket.removeAllListeners(event)
      })
    }
  }, [])

  return { localVideoRef, remoteVideoRef, joinCall, joined }
}

const VideoCall = ({
  localVideoRef,
  remoteVideoRef,
  joinCall,
  joined,
}) => {
  return (
    <>
      < div >
        <video id='localVideo' ref={localVideoRef} autoPlay muted style={{ width: '300px' }} />
        <video id='remoteVideo' ref={remoteVideoRef} autoPlay style={{ width: '300px' }} /> </div >
      <div>
        <button onClick={joinCall} disabled={joined}>Start Call</button>
      </div>
    </>
  )
}

VideoCall.useVideoCall = useVideoCall

export default VideoCall
