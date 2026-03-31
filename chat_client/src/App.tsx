import { useEffect, useRef, useState } from 'react'

import './App.css'

interface MessageInputFormProps {
  message: string,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setMessageList: React.Dispatch<React.SetStateAction<string[]>>
  textfieldID: string,
  webSocket: WebSocket | null,
}

const MessageInputForm: React.FC<MessageInputFormProps> = ({ message, setMessage, setMessageList, textfieldID, webSocket }) => {

  const handleMessageInput = (e: React.ChangeEvent<HTMLInputElement>) => {

    setMessage(e.target.value);

  }

  const handleMessageSubmit = (e: React.SubmitEvent) => {
    e.preventDefault()

    if (webSocket && message.trim()) {

      webSocket.send(message)
      setMessageList(prev => [...prev, message])
      setMessage("")
      
    }
    
  }

  const handleFormRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {

    e.preventDefault();

    setMessage("");

  }

  return (<form onSubmit={handleMessageSubmit} ><input 
            id={textfieldID}
            value={message}
            onChange={handleMessageInput}
            placeholder='Enter message....'
  />

  <button type="submit">Send</button>
  <button onClick={handleFormRefresh}>Reset</button>
  </form>)

}

function App() {

  const [messageList, setMessageList] = useState<string[]>([])
  const [message, setMessage] = useState<string>("")
  
  const websocketServerURL = "ws://127.01.01:8000"

  const socketRef = useRef<WebSocket | null>(null)


  useEffect(() => {

    const socketInstance: WebSocket | null = new WebSocket(websocketServerURL)

    socketRef.current = socketInstance;

    socketInstance.onopen = () => {
      console.log('Client has been connected....');
    };

    socketInstance.onmessage = (event) => {

      setMessageList(prev => [...prev, event.data])

    }

    socketInstance.onclose = () => {
      console.log('Client has been disconnected');
    };

    socketInstance.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return(() => {

      socketInstance.close()

    })

  }, [])

  return (
    <>
      <section>
        <h2>If you see this message then everything works fine</h2>

        {
          messageList?.map((msg: string) => (
            <h3>{msg}</h3>
          ))
        }
      </section>

      <MessageInputForm 
        message={message} 
        setMessage={setMessage} 
        setMessageList={setMessageList}
        textfieldID="messageTextInput" 
        webSocket={socketRef.current}
        />
    </>
  )
}

export default App
