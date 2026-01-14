import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { 
  FiSend, 
  FiSmartphone, 
  FiMessageSquare,
  FiAlertCircle,
  FiThumbsUp,
  FiShoppingBag
} from 'react-icons/fi';
import { format } from 'date-fns';

const ChatAI = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const examplePrompts = [
    "Monte um look para entrevista",
    "O que combina com minha saia jeans?",
    "O que falta no meu guarda-roupa?",
    "Sugira looks para clima quente",
    "Analise meu consumo de moda"
  ];

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/chat/history');
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content) => {
    if (!content.trim()) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      content,
      is_user: true,
      created_at: new Date().toISOString(),
      ai_response: null
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSending(true);

    try {
      const response = await axios.post('/api/chat/message', {
        content,
        message_type: 'text'
      });

      setMessages(prev => [...prev, response.data.ai_response]);
      showToast('Resposta recebida da IA', 'success');
    } catch (error) {
      showToast('Erro ao enviar mensagem', 'error');
      
      // Adiciona mensagem de erro simulada
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: 'Desculpe, estou com problemas para processar sua solicitação. Tente novamente em alguns momentos.',
        is_user: false,
        created_at: new Date().toISOString(),
        ai_response: { type: 'error' }
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleExampleClick = (prompt) => {
    sendMessage(prompt);
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center">
          <FiMessageSquare className="text-2xl mr-3" />
          <div>
            <h1 className="text-2xl font-bold">Stylist Virtual</h1>
            <p className="text-primary-100">Sua assistente de estilo pessoal com IA</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiMessageSquare className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Inicie uma conversa com sua stylist
              </h3>
              <p className="text-gray-600">
                Faça perguntas sobre estilo, peça dicas ou monte looks
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.is_user
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-start">
                    {!message.is_user && (
                      <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white font-bold">IA</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {/* AI Response Data */}
                      {message.ai_response && (
                        <div className="mt-3">
                          {message.ai_response.type === 'outfit_suggestion' && (
                            <div className="bg-white/20 rounded-lg p-3 mt-2">
                              <div className="flex items-center mb-2">
                                <FiSmartphone className="mr-2" />
                                <span className="font-semibold">Sugestão de Look</span>
                              </div>
                              <div className="flex space-x-2">
                                {message.ai_response.items?.map((item, idx) => (
                                  <div key={idx} className="text-sm bg-white/10 px-2 py-1 rounded">
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {message.ai_response.type === 'shopping_recommendation' && (
                            <div className="bg-white/20 rounded-lg p-3 mt-2">
                              <div className="flex items-center mb-2">
                                <FiShoppingBag className="mr-2" />
                                <span className="font-semibold">Recomendações de Compra</span>
                              </div>
                              {message.ai_response.recommendations?.map((rec, idx) => (
                                <div key={idx} className="text-sm mb-1">
                                  • {rec.item} - {rec.reason}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {message.ai_response.type === 'styling_tip' && (
                            <div className="bg-white/20 rounded-lg p-3 mt-2">
                              <div className="flex items-center mb-2">
                                <FiThumbsUp className="mr-2" />
                                <span className="font-semibold">Dica de Estilo</span>
                              </div>
                              <div className="text-sm">
                                {message.ai_response.suggestions?.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={`text-xs mt-2 ${message.is_user ? 'text-primary-200' : 'text-gray-500'}`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                    {message.is_user && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                        <span className="text-gray-700 font-bold">VC</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Example Prompts */}
        {messages.length === 0 && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-600 mb-3">Experimente perguntar:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(prompt)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Alertas Conscientes */}
        {messages.length > 0 && messages.length % 3 === 0 && (
          <div className="mx-4 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <FiAlertCircle className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Alerta consciente:</span> Você já tem 3 peças similares a essa em seu guarda-roupa. Considere diversificar seu estilo.
              </p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua pergunta..."
              className="input-field flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="btn-primary flex items-center justify-center"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <FiSend />
              )}
            </button>
          </form>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => handleExampleClick("Sugestão de look para entrevista")}
              className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
            >
              👔 Entrevista
            </button>
            <button
              onClick={() => handleExampleClick("O que combina com camisa branca?")}
              className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
            >
              🎨 Combinações
            </button>
            <button
              onClick={() => handleExampleClick("Analise meu consumo este mês")}
              className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition"
            >
              📊 Análise
            </button>
            <button
              onClick={() => handleExampleClick("Dicas de estilo para meu corpo")}
              className="text-xs px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition"
            >
              💃 Estilo
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Como funciona</h4>
          <p className="text-sm text-blue-700">
            A IA analisa seu guarda-roupa e preferências para dar recomendações personalizadas
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Dicas úteis</h4>
          <p className="text-sm text-green-700">
            Seja específico nas perguntas para receber respostas mais precisas
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">Consumo consciente</h4>
          <p className="text-sm text-purple-700">
            Receba alertas quando estiver prestes a comprar peças similares
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatAI;