import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Space, Button } from 'antd'

const useStateWithRef = (init) => {
  const [state, setState] = useState(init)
  const ref = useRef(state)
  const setStateAndRef = useCallback((v) => {
    if (typeof v == 'function') {
      setState(value => {
        const newValue = v(value)
        ref.current = newValue
        return newValue
      })
    } else {
      ref.current = v
      setState(v)
    }
  }, [setState])
  return [state, setStateAndRef, ref]
}

const useVideoCall = (socket) => {
  const localVideoRef = useRef(null)
  const [remotes, setRemotes, remotesRef] = useStateWithRef({})
  const [joined, setJoined] = useState(false)

  const handleDisconnect = (peerId) => {
    const remotes = remotesRef.current
    if (!remotes[peerId]) {
      return
    }
    setRemotes(({ [peerId]: remote, ...remotes }) => {
      remote?.peerConnection?.close()
      return remotes
    })
  }

  const initializePeerConnection = (peerId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })

    peerConnection.ontrack = event => {
      const oldRemote = remotes[peerId]
      if (!oldRemote) {
        const remote = { srcObject: event.streams[0], peerConnection }
        setRemotes({ ...remotes, [peerId]: remote })
      } else {
        const remote = { ...oldRemote, srcObject: event.streams[0] }
        setRemotes({ ...remotes, [peerId]: remote })
      }
    }

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate)
      }
    }

    peerConnection.oniceconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(peerConnection.iceConnectionState)) {
        handleDisconnect(peerId)
      }
    }

    setRemotes(prev => ({ ...prev, [peerId]: { peerConnection } }))

    return peerConnection
  }
  // , [remotes, setRemotes, handleDisconnect])

  const getPeerConnection = (peerId) => {
    return remotesRef.current?.[peerId]?.peerConnection
  }

  const getOrInitializePeerConnection = (peerId) => {
    return getPeerConnection(peerId) ?? initializePeerConnection(peerId)
  }

  const setupSocketListener = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    // Setup local video
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream
    }

    // Setup socket listeners
    socket.on('offer', async (peerId, description) => {
      if (getPeerConnection(peerId)) {
        // Skip existing remotes
        return
      }
      const peerConnection = initializePeerConnection(peerId)
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))
      await peerConnection.setRemoteDescription(new RTCSessionDescription(description))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      socket.emit('answer', { peerId, answer })
    })

    socket.on('answer', async (peerId, description) => {
      const peerConnection = getPeerConnection(peerId)
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(description))
      }
    })

    socket.on('candidate', async (peerId, candidate) => {
      const peerConnection = getPeerConnection(peerId)
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      }
    })

    socket.on('user-disconnected', (peerId) => {
      handleDisconnect(peerId)
    })

    socket.on('user-joined', async (peerId) => {
      const peerConnection = getOrInitializePeerConnection(peerId)
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))
      // Create offer to peerId
      const offer = await peerConnection.createOffer({
        iceRestart: true,
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await peerConnection.setLocalDescription(offer)
      socket.emit('offer', { offer, peerId })
    })
  }
  // , [socket, remotesRef, createOfferToPeer, handleDisconnect, initializePeerConnection])

  const joinCall = async () => {
    await setupSocketListener()
    socket.emit('join')
    setJoined(true)
  }
  // , [socket, setJoined, setupSocketListener])

  return { localVideoRef, remotes, joinCall, joined }
}

const VideoContainer = (props) => {
  return (
    <div style={{ border: '1px solid black' }}>
      {props.children}
    </div>
  )
}

const RemoteVideo = ({ srcObject }) => {
  const ref = useRef(null)

  useEffect(() => {
    if (srcObject) {
      ref.current.srcObject = srcObject
    }
  }, [srcObject])

  return (
    <VideoContainer>
      <video ref={ref} autoPlay style={{ width: '300px' }} />
    </VideoContainer>
  )
}

const LocalVideo = ({ localVideoRef }) => {
  return (
    <VideoContainer>
      <video id='localVideo' ref={localVideoRef} autoPlay muted style={{ width: '300px' }} />
    </VideoContainer>
  )
}

const VideoCall = ({
  localVideoRef,
  remotes,
  joinCall,
  joined,
}) => {
  return (
    <>
      <Space wrap>
        <LocalVideo localVideoRef={localVideoRef} />
        {Object.entries(remotes).map(([id, { srcObject }]) =>
          <RemoteVideo srcObject={srcObject} key={id} />
        )}
      </Space>
      <div>
        <Button onClick={joinCall} disabled={joined}>Start Call</Button>
      </div>
    </>
  )
}

VideoCall.useVideoCall = useVideoCall

export default VideoCall
