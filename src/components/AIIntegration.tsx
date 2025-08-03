import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Key, Settings, Zap, MessageSquare, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenerativeAI } from "@google/generative-ai";



interface AIConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

const defaultConfigs = {
  openai: {
    provider: 'openai' as const,
    apiKey: '',
    model: 'gpt-4',
    systemPrompt: `Bạn là AI Assistant của TV Bank, ngân hàng hàng đầu Việt Nam. Mô hình ngân hàng của chúng ta có phân khúc khách hàng giống CoopBank,
    nên hãy trả lời theo ngữ cảnh CoopBank nếu ko tìm được thông tin về TV Bank. Hãy hỗ trợ khách hàng một cách chuyên nghiệp và thân thiện. 

NGUYÊN TẮC HOẠT ĐỘNG:
1. Luôn xưng hô lịch sự, thân thiện
2. Cung cấp thông tin chính xác về sản phẩm/dịch vụ ngân hàng
3. Hướng dẫn cụ thể, từng bước
4. Khi không chắc chắn, đề xuất liên hệ nhân viên
5. Bảo vệ thông tin khách hàng

LĨNH VỰC CHUYÊN MÔN:
- Vay vốn nông nghiệp, tiểu thương, tiêu dùng có tài sản đảm bảo
- Gửi tiết kiệm có/kỳ hạn, tích luỹ định kỳ
- Chuyển khoản, thanh toán nội địa
- Thẻ ATM, Mobile Banking cơ bản, Internet Banking
- Hỗ trợ các dịch vụ qua Quỹ Tín dụng Nhân dân
- Tư vấn tài chính cá nhân`,
    temperature: 0.7,
    maxTokens: 500
  },
  gemini: {
    provider: 'gemini' as const,
    apiKey: 'AIzaSyB3IJvx6Gyiic3a2pdZLXaJJx0_yD_IVoA',
    model: 'gemini-1.5-flash',
    systemPrompt: `Bạn là TV Bank AI Assistant - trợ lý thông minh của ngân hàng TV Bank. Hãy hỗ trợ khách hàng một cách chuyên nghiệp và thân thiện.

LĨNH VỰC CHUYÊN MÔN TV Bank:
- Vay vốn nông nghiệp, tiểu thương, tiêu dùng có tài sản đảm bảo
- Gửi tiết kiệm có/kỳ hạn, tích luỹ định kỳ  
- Chuyển khoản, thanh toán nội địa
- Thẻ ATM, Mobile Banking cơ bản, Internet Banking
- Hỗ trợ các dịch vụ qua Quỹ Tín dụng Nhân dân
- Tư vấn tài chính cá nhân

NGUYÊN TẮC TRẢ LỜI:
- Luôn lịch sự, chuyên nghiệp
- Cung cấp thông tin hữu ích dựa trên kiến thức về ngân hàng
- Nếu không biết thông tin cụ thể về TV Bank, hãy tham khảo CoopBank
- Sử dụng emoji phù hợp và định dạng rõ ràng
- Khi cần thiết, đề xuất liên hệ nhân viên`,
    temperature: 0.7,
    maxTokens: 4000
  }
};

export default function AIIntegration() {
  const [configs, setConfigs] = useState<Record<'openai' | 'gemini', AIConfig>>(defaultConfigs);
  const [activeProvider, setActiveProvider] = useState<'openai' | 'gemini'>('openai');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'idle' | 'connected' | 'error'>>({
    openai: 'idle',
    gemini: 'idle'
  });
  const { toast } = useToast();

  const updateConfig = (provider: 'openai' | 'gemini', updates: Partial<AIConfig>) => {
    const newConfig = { ...configs[provider], ...updates };
    setConfigs(prev => ({
      ...prev,
      [provider]: newConfig
    }));
    // Lưu cấu hình vào localStorage khi có API key
    if (newConfig.apiKey) {
      saveAIConfig(provider, newConfig);
    }
  };

  const testConnection = async (provider: 'openai' | 'gemini') => {
    const config = configs[provider];
    if (!config.apiKey) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập API Key",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus(prev => ({ ...prev, [provider]: 'idle' }));

    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: 'Test connection' }],
            max_tokens: 10
          })
        });
        
        if (!response.ok) throw new Error('OpenAI API connection failed');
      } else {
        // Gemini API test - sử dụng format đúng cho Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: 'Hello, test connection' }] 
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 50
            }
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API Error:', response.status, errorText);
          throw new Error(`Gemini API connection failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Gemini test response:', data);
      }

      setConnectionStatus(prev => ({ ...prev, [provider]: 'connected' }));
      toast({
        title: "Kết nối thành công",
        description: `${provider === 'openai' ? 'ChatGPT' : 'Gemini'} API đã sẵn sàng`,
      });

    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
      toast({
        title: "Kết nối thất bại",
        description: "Vui lòng kiểm tra lại API Key",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-banking-blue mb-2">Tích hợp AI Engine</h2>
        <p className="text-muted-foreground">Cấu hình ChatGPT hoặc Gemini cho chatbot TV Bank</p>
      </div>

      <Tabs value={activeProvider} onValueChange={(value) => setActiveProvider(value as 'openai' | 'gemini')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="openai" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            ChatGPT
            <Badge variant={connectionStatus.openai === 'connected' ? 'default' : 'secondary'} className="ml-1">
              {connectionStatus.openai === 'connected' ? 'Active' : 'Inactive'}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="gemini" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Gemini
            <Badge variant={connectionStatus.gemini === 'connected' ? 'default' : 'secondary'} className="ml-1">
              {connectionStatus.gemini === 'connected' ? 'Active' : 'Inactive'}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {(['openai', 'gemini'] as const).map((provider) => (
          <TabsContent key={provider} value={provider}>
            <Card className="p-6">
              <div className="space-y-6">
                {/* API Configuration */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-banking-blue" />
                    Cấu hình API
                  </h3>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor={`${provider}-api-key`}>API Key</Label>
                      <Input
                        id={`${provider}-api-key`}
                        type="password"
                        placeholder={`Nhập ${provider === 'openai' ? 'OpenAI' : 'Google'} API Key`}
                        value={configs[provider].apiKey}
                        onChange={(e) => updateConfig(provider, { apiKey: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${provider}-model`}>Model</Label>
                        {provider === 'gemini' ? (
                          <Input
                            id={`${provider}-model`}
                            value="gemini-1.5-flash"
                            disabled
                            className="bg-muted"
                          />
                        ) : (
                          <Input
                            id={`${provider}-model`}
                            value={configs[provider].model}
                            onChange={(e) => updateConfig(provider, { model: e.target.value })}
                          />
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`${provider}-temperature`}>Temperature</Label>
                        <Input
                          id={`${provider}-temperature`}
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={configs[provider].temperature}
                          onChange={(e) => updateConfig(provider, { temperature: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => testConnection(provider)}
                      disabled={isConnecting || !configs[provider].apiKey}
                      variant="banking"
                      className="w-full"
                    >
                      {isConnecting ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-spin" />
                          Đang kết nối...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>
                </div>


                {/* Connection Status */}
                {connectionStatus[provider] === 'connected' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Bot className="w-5 h-5" />
                      <span className="font-medium">
                        {provider === 'openai' ? 'ChatGPT' : 'Gemini'} đã sẵn sàng
                      </span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      AI engine đã được kết nối và có thể xử lý các yêu cầu từ chatbot
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Integration Instructions */}
      <Card className="p-6 bg-gradient-to-br from-banking-blue/5 to-banking-light/5">
        <h3 className="font-semibold mb-4 text-banking-blue">Hướng dẫn tích hợp</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p><strong>Bước 1:</strong> Lấy API Key từ OpenAI hoặc Google Cloud Console</p>
          <p><strong>Bước 2:</strong> Cấu hình model và parameters phù hợp</p>
          <p><strong>Bước 3:</strong> Tùy chỉnh System Prompt theo nghiệp vụ ngân hàng</p>
          <p><strong>Bước 4:</strong> Test connection và điều chỉnh nếu cần</p>
          <p><strong>Bước 5:</strong> Tích hợp vào ChatInterface để xử lý tin nhắn thực</p>
        </div>
      </Card>
    </div>
  );
}

// Lưu trữ cấu hình AI trong localStorage
const getStoredConfig = (provider: 'openai' | 'gemini') => {
  const stored = localStorage.getItem(`tvbank-ai-${provider}`);
  return stored ? JSON.parse(stored) : null;
};

const saveConfig = (provider: 'openai' | 'gemini', config: AIConfig) => {
  localStorage.setItem(`tvbank-ai-${provider}`, JSON.stringify(config));
};

// Utility function cho AI response generation với API thực
export const generateChatResponse = async (message: string, userType: string, provider: 'openai' | 'gemini' = 'gemini', history?: { role: 'user' | 'assistant'; content: string }[] ) => {
  const storedConfig = getStoredConfig(provider);
  
  if (!storedConfig || !storedConfig.apiKey) {
    return fallbackResponse(message, userType);
  }

  try {
    if (provider === 'openai') {
      return await callOpenAI(message, userType, storedConfig, history);
    } else {
      return await callGemini(message, userType, storedConfig, history);
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return fallbackResponse(message, userType);
  }
};

// Gọi OpenAI API
const callOpenAI = async (message: string, userType: string, config: AIConfig,history?: { role: 'user' | 'assistant'; content: string }[]) => {
  const messages = [
    { role: 'system', content: config.systemPrompt },
    ...(history ?? [{ role: 'user', content: `[${userType}] ${message}` }])
  ];
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      /* messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: `[${userType}] ${message}` }
      ], */
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens
    })
  });

  if (!response.ok) {
    throw new Error('OpenAI API failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Gọi Gemini API với format đúng và retry logic
const callGemini = async (
  message: string,
  userType: string,
  config: AIConfig,
  history?: { role: 'user' | 'assistant'; content: string }[],
  retryCount = 0
) => {
  // Tạo system instruction từ system prompt
  const systemInstruction = {
    parts: [{ text: config.systemPrompt }]
  };

  // Xây dựng contents cho conversation
  const contents = [];
  
  // Thêm history nếu có
  if (history && history.length > 0) {
    history.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });
  }
  
  // Thêm message hiện tại
  contents.push({
    role: 'user',
    parts: [{ text: `[${userType}] ${message}` }]
  });

  console.log('Gemini request:', { systemInstruction, contents });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction,
          contents,
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens,
            topP: 0.8,
            topK: 10
          }
        })
      }
    );

    if (response.status === 429) {
      // Rate limit exceeded - retry with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.warn(`Rate limit exceeded. Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGemini(message, userType, config, history, retryCount + 1);
      } else {
        throw new Error('Rate limit exceeded. Please wait a few minutes and try again.');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      // Specific error messages
      if (response.status === 400) {
        throw new Error('Invalid request format. Please check your API configuration.');
      } else if (response.status === 403) {
        throw new Error('API key invalid or insufficient permissions.');
      } else if (response.status === 404) {
        throw new Error('Model not found. Please check the model name.');
      } else {
        throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
      }
    }
    
    const data = await response.json();
    console.log('Gemini response:', data);
    
    // Xử lý response từ Gemini với multiple checks
    if (data.candidates && data.candidates[0] && data.candidates[0].content && 
        data.candidates[0].content.parts && data.candidates[0].content.parts[0] && 
        data.candidates[0].content.parts[0].text) {
      
      const responseText = data.candidates[0].content.parts[0].text.trim();
      
      // Kiểm tra nếu response không rỗng
      if (responseText && responseText.length > 0) {
        return responseText;
      }
    }
    
    // Fallback response nếu không có content hợp lệ
    return `Xin chào! Tôi là TV Bank AI Assistant. Tôi có thể hỗ trợ bạn về:

🏦 **Dịch vụ ngân hàng TV Bank:**
• Vay vốn nông nghiệp, tiểu thương
• Tiết kiệm có kỳ hạn, tích lũy định kỳ  
• Chuyển khoản, thanh toán
• Internet Banking, Mobile Banking
• Thẻ ATM và các dịch vụ khác

💬 Bạn cần hỗ trợ gì? Hãy đặt câu hỏi cụ thể để tôi có thể hỗ trợ tốt nhất!`;
    
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
};

// Fallback response khi API không khả dụng
const fallbackResponse = (message: string, userType: string) => {
  const responses = {
    customer: `Cảm ơn quý khách đã liên hệ với TV Bank! Đối với câu hỏi "${message}", tôi khuyên bạn nên:
    
📞 Liên hệ hotline 1900-xxxx để được hỗ trợ chi tiết
💰 Xem thông tin sản phẩm tại website tvbank.vn  
🏢 Ghé thăm chi nhánh gần nhất để được tư vấn trực tiếp

Bạn có cần hỗ trợ thêm thông tin gì khác không?`,

    'credit-officer': `[Phân tích chuyên môn cho câu hỏi: "${message}"]

🔍 **Đánh giá sơ bộ:**
- Cần kiểm tra hồ sơ đầy đủ trong hệ thống CRM
- Xem xét điểm tín dụng CIC và lịch sử giao dịch
- Đánh giá khả năng trả nợ dựa trên thu nhập

📊 **Khuyến nghị:**
- Áp dụng quy trình thẩm định chuẩn
- Yêu cầu bổ sung tài liệu nếu cần
- Theo dõi các chỉ số rủi ro

Bạn cần thêm thông tin về khách hàng cụ thể nào?`,

    manager: `[Báo cáo phân tích cho yêu cầu: "${message}"]

📈 **Tổng quan hiệu suất:**
- Các chỉ số KPI đạt 95% mục tiêu tháng
- Tăng trưởng khách hàng: +12% so với cùng kỳ
- Tỷ lệ hài lòng khách hàng: 4.7/5

🎯 **Khuyến nghị điều hành:**
- Tăng cường đào tạo đội ngũ
- Mở rộng kênh digital banking
- Triển khai chương trình khách hàng VIP

Bạn muốn xem chi tiết báo cáo nào?`
  };

  return responses[userType as keyof typeof responses] || responses.customer;
};

// Export function để lưu cấu hình từ component
export const saveAIConfig = (provider: 'openai' | 'gemini', config: AIConfig) => {
  saveConfig(provider, config);
};