import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bot, Key, Zap, MessageSquare, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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
    apiKey: '',
    model: 'gemini-1.5-flash',
    systemPrompt: `Bạn là TV Bank AI Assistant, một trợ lý thông minh hỗ trợ khách hàng về các dịch vụ ngân hàng.

QUAN TRỌNG: Luôn trả lời đầy đủ, chi tiết, và dài. Cung cấp thông tin hướng dẫn cụ thể từng bước. Sử dụng emoji phù hợp để làm cho câu trả lời thân thiện hơn.

DỊCH VỤ TV BANK:
• Vay vốn: nông nghiệp, tiểu thương, tiêu dùng, kinh doanh với lãi suất từ 6.5%/năm
• Tiết kiệm: có kỳ hạn, không kỳ hạn, tích lũy định kỳ với lãi suất lên đến 6.8%/năm
• Thanh toán: chuyển khoản 24/7, Internet Banking, Mobile Banking, QR Pay
• Thẻ ATM: rút tiền miễn phí tại hơn 16.000 ATM toàn quốc

Luôn kết thúc bằng câu hỏi hoặc gợi ý để tiếp tục hỗ trợ khách hàng.`,
    temperature: 0.8,
    maxTokens: 2048
  }
};

export default function AIIntegration() {
  const [configs, setConfigs] = useState<Record<'openai' | 'gemini', AIConfig>>(defaultConfigs);
  const [activeProvider, setActiveProvider] = useState<'openai' | 'gemini'>('gemini');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'idle' | 'connected' | 'error'>>({
    openai: 'idle',
    gemini: 'idle' // Đổi thành idle vì không có API key mặc định
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
        // Test Gemini bằng cách sử dụng SDK
        const genAI = new GoogleGenerativeAI(config.apiKey);
        const model = genAI.getGenerativeModel({ model: config.model });
        await model.generateContent('Test connection');
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
                        <Input
                          id={`${provider}-model`}
                          value={configs[provider].model}
                          onChange={(e) => updateConfig(provider, { model: e.target.value })}
                          disabled={provider === 'gemini'}
                          className={provider === 'gemini' ? "bg-muted" : ""}
                        />
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
export const generateChatResponse = async (
  message: string, 
  userType: string, 
  provider: 'openai' | 'gemini' = 'gemini', 
  history?: { role: 'user' | 'assistant'; content: string }[]
) => {
  const storedConfig = getStoredConfig(provider);
  
  if (!storedConfig || !storedConfig.apiKey) {
    return generateDetailedResponse(message, userType);
  }

  try {
    if (provider === 'openai') {
      return await callOpenAI(message, userType, storedConfig, history);
    } else {
      return await callGemini(message, userType, storedConfig, history);
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return generateDetailedResponse(message, userType);
  }
};

// Gọi OpenAI API
const callOpenAI = async (
  message: string, 
  userType: string, 
  config: AIConfig,
  history?: { role: 'user' | 'assistant'; content: string }[]
) => {
  const messages = [
    { role: 'system', content: config.systemPrompt },
    ...(history || []),
    { role: 'user', content: `[${userType}] ${message}` }
  ];
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
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

// Gọi Gemini API với streaming để có response mượt mà
const callGemini = async (
  message: string,
  userType: string,
  config: AIConfig,
  history?: { role: 'user' | 'assistant'; content: string }[],
  onToken?: (token: string) => void,
  retryCount = 0
) => {
  try {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    
    const systemInstruction = `Bạn là trợ lý AI của TV Bank - ngân hàng số hàng đầu Việt Nam. 

KHẢ NĂNG CỦA BẠN:
1. 📏 Trả lời TOÀN BỘ các câu hỏi của người dùng (không chỉ về ngân hàng)
2. 🏦 Chuyên sâu về dịch vụ ngân hàng, tài chính TV Bank  
3. 💬 Trò chuyện tự nhiên về mọi chủ đề
4. 🎯 Tư vấn và hỗ trợ theo ngữ cảnh cụ thể

CÁCH TRẤLỜI:
- Trả lời TẤT CẢ câu hỏi, dù có liên quan đến ngân hàng hay không
- Nếu về ngân hàng: đưa ra thông tin chi tiết, quy trình cụ thể
- Nếu về chủ đề khác: trả lời hữu ích, sau đó gợi ý dịch vụ TV Bank liên quan (nếu có)
- Luôn thân thiện, chi tiết với emoji phù hợp 😊
- Cấu trúc rõ ràng, dễ hiểu

QUAN TRỌNG: Đừng từ chối bất kỳ câu hỏi nào. Hãy trả lời hữu ích trước, rồi kết nối với dịch vụ TV Bank khi phù hợp!`;

    const model = genAI.getGenerativeModel({ 
      model: config.model,
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        topP: 0.9,
        topK: 40
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        }
      ]
    });

    // Chỉ gửi tin nhắn gốc của người dùng, không lặp lại
    const fullMessage = message;

    console.log('Sending message to Gemini:', fullMessage);
    
    // Sử dụng streaming nếu có callback onToken
    if (onToken) {
      const result = await model.generateContentStream(fullMessage);
      let fullResponse = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onToken(chunkText);
      }
      
      return fullResponse;
    } else {
      // Fallback cho non-streaming
      const result = await model.generateContent(fullMessage);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        console.warn('Empty response from Gemini, using fallback');
        return generateDetailedResponse(message, userType);
      }

      return text;
    }

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // Xử lý lỗi quota exceeded
    if (error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      if (retryCount < 1) {
        const delay = (retryCount + 1) * 60000; // 60s delay
        console.warn(`Quota exceeded. Retrying in ${delay}ms... (attempt ${retryCount + 1}/1)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGemini(message, userType, config, history, onToken, retryCount + 1);
      } else {
        console.warn('Quota exceeded, using enhanced fallback response');
        // Trả về response intelligent fallback thay vì lỗi
        const intelligentResponse = generateIntelligentFallback(message, userType);
        if (onToken) {
          // Simulate streaming cho fallback
          const words = intelligentResponse.split(' ');
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + (i < words.length - 1 ? ' ' : '');
            onToken(word);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        return intelligentResponse;
      }
    }
    
    // Với các lỗi khác, trả về response intelligent fallback
    const intelligentResponse = generateIntelligentFallback(message, userType);
    if (onToken) {
      // Simulate streaming cho fallback
      const words = intelligentResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        onToken(word);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    return intelligentResponse;
  }
};

// Tạo intelligent fallback response dựa trên context
const generateIntelligentFallback = (message: string, userType: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Tư vấn credit officer
  if (userType === 'credit-officer' && (lowerMessage.includes('tư vấn') || lowerMessage.includes('lưu ý'))) {
    return `Chào bạn! 👋 Tôi là TV Bank AI Assistant. Khi tư vấn khách hàng, bạn nên lưu ý:

**🎯 Nguyên tắc tư vấn chuyên nghiệp:**

**1. Lắng nghe và hiểu nhu cầu:**
• Để khách hàng trình bày đầy đủ tình hình tài chính
• Đặt câu hỏi mở để hiểu rõ mục đích vay vốn
• Ghi nhận thông tin về thu nhập, chi phí, tài sản hiện có

**2. Phân tích khả năng tài chính:**
• Tính toán tỷ lệ DSTI (không vượt 60%)
• Đánh giá nguồn thu nhập ổn định
• Xem xét tài sản đảm bảo (nếu có)

**3. Tư vấn sản phẩm phù hợp:**
• Giải thích rõ các gói vay: lãi suất, thời hạn, điều kiện
• So sánh ưu nhược điểm của từng sản phẩm
• Đề xuất phương án thanh toán hợp lý

**4. Quy trình và giấy tờ:**
• Hướng dẫn chuẩn bị hồ sơ đầy đủ
• Giải thích các bước thẩm định
• Cam kết thời gian xử lý

**5. Rủi ro và lưu ý:**
• Cảnh báo về rủi ro khi không trả được nợ
• Tư vấn kế hoạch tài chính dài hạn
• Đảm bảo khách hàng hiểu rõ nghĩa vụ

Bạn có cần tôi tư vấn thêm về khía cạnh nào khác không? 😊`;
  }
  
  // Fallback chung cho các câu hỏi khác
  return generateDetailedResponse(message, userType);
};

// Export function cho streaming response
export const generateStreamingChatResponse = async (
  message: string, 
  userType: string, 
  onToken: (token: string) => void,
  provider: 'openai' | 'gemini' = 'gemini', 
  history?: { role: 'user' | 'assistant'; content: string }[]
) => {
  const storedConfig = getStoredConfig(provider);
  
  if (!storedConfig || !storedConfig.apiKey) {
    // Fallback streaming simulation
    const response = generateDetailedResponse(message, userType);
    const words = response.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      onToken(word);
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing
    }
    
    return response;
  }

  try {
    if (provider === 'gemini') {
      return await callGemini(message, userType, storedConfig, history, onToken);
    } else {
      // OpenAI streaming would go here if implemented
      return await callOpenAI(message, userType, storedConfig, history);
    }
  } catch (error) {
    console.error('AI API Error:', error);
    
    // Fallback streaming simulation
    const response = generateDetailedResponse(message, userType);
    const words = response.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      onToken(word);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return response;
  }
};

// Hàm tạo response thông minh dựa trên context
const generateDetailedResponse = (message: string, userType: string) => {
  const lowerMessage = message.toLowerCase();
  
  // Phân tích nội dung câu hỏi để đưa ra phản hồi phù hợp
  if (lowerMessage.includes('rủi ro') || lowerMessage.includes('risk')) {
    if (lowerMessage.includes('tín dụng') || lowerMessage.includes('credit')) {
      return `Chào bạn! 🏦 Về rủi ro tín dụng, đây là một chủ đề quan trọng trong ngành ngân hàng. Tôi sẽ chia sẻ thông tin chi tiết:

**🔍 Các loại rủi ro tín dụng chính:**

**1. Rủi ro không trả được nợ (Default Risk):**
• Khách hàng không có khả năng trả nợ gốc và lãi đúng hạn
• Nguyên nhân: Mất thu nhập, phá sản, tình hình kinh tế xấu
• Biện pháp: Thẩm định kỹ hồ sơ, đòi hỏi tài sản đảm bảo

**2. Rủi ro thanh khoản:**
• Ngân hàng thiếu tiền mặt để đáp ứng nhu cầu rút tiền
• Xảy ra khi nhiều khoản vay có vấn đề cùng lúc
• Quản lý: Duy trì tỷ lệ thanh khoản an toàn

**3. Rủi ro lãi suất:**
• Biến động lãi suất thị trường ảnh hưởng đến lợi nhuận
• Tác động: Chênh lệch thu - chi thay đổi
• Phòng ngừa: Sử dụng công cụ phái sinh tài chính

**📊 Phương pháp đánh giá rủi ro:**
• Credit scoring - chấm điểm tín dụng
• Phân tích tài chính khách hàng
• Thẩm định tài sản đảm bảo
• Kiểm tra lịch sử tín dụng CIC

Bạn muốn tìm hiểu sâu hơn về khía cạnh nào của rủi ro tín dụng? 🤔`;
    }
    
    return `Chào bạn! ⚠️ Rủi ro là một khái niệm quan trọng trong mọi hoạt động. Tôi sẽ chia sẻ về các loại rủi ro phổ biến:

**💼 Rủi ro trong đầu tư:**
• Rủi ro thị trường: Giá cả biến động
• Rủi ro lạm phát: Sức mua giảm
• Rủi ro thanh khoản: Khó bán tài sản

**🏢 Rủi ro trong kinh doanh:**
• Rủi ro vận hành: Sự cố trong hoạt động
• Rủi ro tài chính: Thiếu vốn, nợ xấu
• Rủi ro pháp lý: Thay đổi quy định

**🔐 Cách quản lý rủi ro:**
• Đa dạng hóa danh mục đầu tư
• Mua bảo hiểm phù hợp
• Xây dựng quỹ dự phòng
• Theo dõi và đánh giá thường xuyên

Tại TV Bank, chúng tôi cung cấp các sản phẩm bảo hiểm và tư vấn quản lý rủi ro tài chính. Bạn có muốn tìm hiểu thêm không? 📞`;
  }

  if (lowerMessage.includes('tư vấn') || lowerMessage.includes('tu van')) {
    return `Chào bạn! 💡 Tôi rất vui được tư vấn cho bạn! Hãy cho tôi biết bạn cần tư vấn về vấn đề gì:

**🏦 Tư vấn tài chính ngân hàng:**
• Lựa chọn sản phẩm vay phù hợp
• Kế hoạch tiết kiệm và đầu tư
• Quản lý dòng tiền cá nhân/doanh nghiệp
• Tối ưu hóa chi phí tài chính

**💼 Tư vấn kinh doanh:**
• Lập kế hoạch kinh doanh
• Quản lý rủi ro trong kinh doanh
• Tìm kiếm nguồn vốn phù hợp
• Phát triển mô hình kinh doanh

**📈 Tư vấn đầu tư:**
• Phân tích cơ hội đầu tư
• Đa dạng hóa danh mục
• Đánh giá rủi ro - lợi nhuận
• Chiến lược đầu tư dài hạn

**🎯 Tư vấn cá nhân:**
• Quy hoạch tài chính cá nhân
• Chuẩn bị quỹ hưu trí
• Bảo hiểm và bảo vệ tài sản
• Giáo dục tài chính

Bạn muốn tư vấn về lĩnh vực nào cụ thể? Tôi sẽ đưa ra lời khuyên chi tiết nhất! 🤝`;
  }

  if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Chào bạn! 👋 Rất vui được gặp bạn! Tôi là AI Assistant của TV Bank - ngân hàng số hàng đầu Việt Nam.

**✨ Tôi có thể giúp bạn:**
• Trả lời mọi câu hỏi về dịch vụ ngân hàng
• Tư vấn tài chính cá nhân và doanh nghiệp  
• Hướng dẫn thủ tục và quy trình
• Chia sẻ kiến thức về đầu tư, tiết kiệm
• Trò chuyện về các chủ đề khác nhau

**🎯 Bạn có thể hỏi tôi về:**
- Vay vốn và tín dụng 💰
- Tiết kiệm và đầu tư 📈  
- Dịch vụ thanh toán 💳
- Quản lý rủi ro ⚠️
- Hoặc bất kỳ chủ đề nào khác! 🌟

Hôm nay bạn cần tôi hỗ trợ điều gì? Cứ thoải mái chia sẻ nhé! 😊`;
  }

  if (lowerMessage.includes('vay') || lowerMessage.includes('vốn') || lowerMessage.includes('tín dụng')) {
    return `Chào bạn! 👋 Tôi sẽ hỗ trợ bạn về dịch vụ vay vốn tại TV Bank:

**💰 Các sản phẩm vay vốn:**
• Vay tín chấp: Không cần tài sản đảm bảo
• Vay thế chấp: Lãi suất ưu đãi với TSĐB
• Vay kinh doanh: Hỗ trợ phát triển doanh nghiệp
• Vay nông nghiệp: Lãi suất từ 6.5%/năm

**📋 Thủ tục đơn giản:**
1. Chuẩn bị hồ sơ (CMND, chứng minh thu nhập)
2. Nộp hồ sơ tại chi nhánh hoặc online
3. Thẩm định và phê duyệt trong 5-7 ngày
4. Giải ngân nhanh chóng

Bạn quan tâm đến loại hình vay nào? Tôi sẽ tư vấn chi tiết! 🤝`;
  }
  
  if (lowerMessage.includes('tiết kiệm') || lowerMessage.includes('gửi') || lowerMessage.includes('lãi suất')) {
    return `Chào bạn! 💰 TV Bank có nhiều sản phẩm tiết kiệm hấp dẫn:

**📊 Lãi suất cạnh tranh:**
• Không kỳ hạn: 0.5%/năm
• Có kỳ hạn 6 tháng: 5.8%/năm
• Có kỳ hạn 12 tháng: 6.5%/năm
• Tích lũy định kỳ: 6.8%/năm

**✨ Ưu điểm:**
• Linh hoạt rút tiền
• Lãi suất cao, ổn định
• Thủ tục nhanh gọn
• Bảo mật tuyệt đối

Bạn muốn tìm hiểu về sản phẩm tiết kiệm nào? 😊`;
  }

  // Phản hồi chung cho các câu hỏi khác
  return `Chào bạn! 👋 Cảm ơn bạn đã liên hệ với TV Bank AI Assistant. 

Tôi có thể giúp bạn về:
• Dịch vụ ngân hàng và tài chính 🏦
• Tư vấn và giải đáp thắc mắc 💡  
• Thông tin sản phẩm dịch vụ 📋
• Và nhiều chủ đề khác nữa! 🌟

Bạn có câu hỏi gì cụ thể? Tôi sẽ trả lời một cách chi tiết nhất! 😊

**📞 Liên hệ nhanh:**
• Hotline: 1900 6060 (24/7)
• Website: tvbank.com.vn
• Hơn 200 chi nhánh toàn quốc`;
};

// Export function để lưu cấu hình từ component
export const saveAIConfig = (provider: 'openai' | 'gemini', config: AIConfig) => {
  saveConfig(provider, config);
};