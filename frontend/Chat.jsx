import React from 'react'
import { useCallback } from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { useRef } from 'react'

export const useChat = (socket) => {
  const chatRef = useRef(null)
  const [messages, setMessages] = useState([])

  const sendMessage = useCallback(() => {
    if (chatRef.current) {
      const message = chatRef.current.value
      socket.emit('chat', message)
      chatRef.current.value = ''
    }
  }, [chatRef])

  const onKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      sendMessage()
    }
  }, [sendMessage])

  useEffect(() => {
    socket.on('chat', (id, message) => {
      setMessages((messages) => ([...messages, { id, message }]))
    })
    return () => socket.removeAllListeners('chat')
  }, [])

  return { chatRef, messages, sendMessage, onKeyDown }
}

const Chat = ({ chatRef, messages, sendMessage, onKeyDown }) => {

  return (
    <>
      <div>
        <input type="text" ref={chatRef} onKeyDown={onKeyDown}></input>
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        {messages.map(({ id, message }, index) => <div key={index}>{id}: {message}</div>)}
      </div>
    </>
  )
}

Chat.useChat = useChat

export default Chat
