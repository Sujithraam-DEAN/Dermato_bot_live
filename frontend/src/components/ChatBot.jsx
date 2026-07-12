import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ChatBot = ({ diagnosisId, diagnosis }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { getToken } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (diagnosisId) {
      loadChatHistory()
    }
  }, [diagnosisId])

  const loadChatHistory = async () => {
    try {
      const token = await getToken()
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/chat/history/${diagnosisId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const token = await getToken()
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/chat/message`,
        {
          message: userMessage,
          diagnosisId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response 
      }])
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="card h-96 flex flex-col">
      <div className="flex items-center space-x-2 mb-4 pb-4 border-b">
        <Bot className="h-6 w-6 text-primary-600" />
        <h3 className="text-lg font-semibold">AI Dermatologist</h3>
        {diagnosis && (
          <span className="text-sm text-gray-500">
            Discussing: {diagnosis}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Ask me anything about your diagnosis!</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <Bot className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
            )}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <User className="h-6 w-6 text-gray-600 mt-1 flex-shrink-0" />
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-2">
            <Bot className="h-6 w-6 text-primary-600 mt-1" />
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about symptoms, treatments..."
          className="input flex-1"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="btn-primary px-3"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default ChatBot