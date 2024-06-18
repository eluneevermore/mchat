import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Space, Button, Input, List, Card } from 'antd'

export const useChat = (socket) => {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState([])

  const sendMessage = useCallback(() => {
    if (value) {
      socket.emit('chat', value)
      setValue('')
    }
  }, [value, setValue])

  const onKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      sendMessage()
    }
  }, [sendMessage])

  const onInputChange = useCallback((event) => {
    setValue(event.target.value)
  }, [setValue])

  useEffect(() => {
    socket.on('chat', (id, message) => {
      setMessages((messages) => ([...messages, { id, message }]))
    })
    return () => socket.removeAllListeners('chat')
  }, [])

  return { value, messages, onInputChange, sendMessage, onKeyDown }
}

const Chat = ({ value, onInputChange, messages, sendMessage, onKeyDown }) => {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (ref.current) {
      element.scrollTop = element.scrollHeight
    }
  }, [messages])

  return (
    <>
      <Card size='small'
        style={{
          height: 'calc(100% - 100px)',
          overflow: 'auto',
        }}
        ref={ref}
      >
        <List
          size='small'
          dataSource={messages}
          renderItem={({ id, message }) => (
            <List.Item>
              <List.Item.Meta title={id} />
              {message}
            </List.Item>
          )}
        />
      </Card>
      <Card>
        <Space.Compact>
          <Input type="text" value={value} onChange={onInputChange} onKeyDown={onKeyDown} />
          <Button onClick={sendMessage}>Send</Button>
        </Space.Compact>
      </Card>
    </>
  )
}

Chat.useChat = useChat

export default Chat
