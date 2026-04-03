import { useEffect, useRef, useState } from 'react'

import './App.css'

import useFetchData from './hooks/useFetchData';

interface MessageInputFormProps {
  message: string,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setMessageList: React.Dispatch<React.SetStateAction<string[]>>,
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
  

  // Кастомный хук для получении данных текущего чата
  interface Chatroom {
    chatroom: {
      uuid: string,
      title: string,
      coverImage: string,
      users_list: Array<Object>,
      created_by: Object,
    }
  }

  const chatroomURL = useRef<string>("http://127.0.0.1:8000/api/chatroom/")

  const { data: chatroomData, loading: chatroomLoading, error: chatroomError } = useFetchData<Chatroom>(chatroomURL.current)

  // Websocket
  var websocketServerURL = "ws://localhost:8000/ws/testing/?chatroom_uuid="

  const socketRef = useRef<WebSocket | null>(null)


  // Работа websocket
  useEffect(() => {

    // Данные uuid чата не еще не получены
    if (!chatroomData?.chatroom?.uuid) {
      return;
    }

    const websocketServerURLWithParams = `${websocketServerURL}${chatroomData?.chatroom.uuid}`

    const socketInstance: WebSocket | null = new WebSocket(websocketServerURLWithParams)

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

  }, [chatroomData])

  return (
    <>
      <section>
        <h2>If you see this message then everything works fine</h2>
        {!chatroomLoading &&
        
          <section>
            <h2>{ chatroomData?.chatroom?.title }</h2>
            {/* <img src={`http://127.0.0.1:8000${ chatroomData?.chatroom?.coverImage }`} /> */}
          </section>

        }

        {chatroomError && 
          <h3 style={{ color: 'red', }}>Ошибка получения данных чата: { chatroomError } </h3>
        }
        

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
