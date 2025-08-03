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
    apiKey: 'AIzaSyB3IJvx6Gyiic3a2pdZLXaJJx0_yD_IVoA',
    model: 'gemini-1.5-pro',
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
    gemini: 'connected' // Mặc định gemini đã connected
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

// Gọi Gemini API với SDK và xử lý quota exceeded
const callGemini = async (
  message: string,
  userType: string,
  config: AIConfig,
  history?: { role: 'user' | 'assistant'; content: string }[],
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

    // Xây dựng conversation history
    const chatHistory = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        chatHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    const chat = model.startChat({
      history: chatHistory
    });

    const fullMessage = `[Khách hàng ${userType}] ${message}

Hãy trả lời một cách chi tiết, đầy đủ và thân thiện. Cung cấp thông tin hữu ích và hướng dẫn cụ thể.`;

    console.log('Sending message to Gemini:', fullMessage);
    
    const result = await chat.sendMessage(fullMessage);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      console.warn('Empty response from Gemini, using fallback');
      return generateDetailedResponse(message, userType);
    }

    return text;

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // Xử lý lỗi quota exceeded
    if (error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      if (retryCount < 2) {
        const delay = (retryCount + 1) * 3000; // 3s, 6s
        console.warn(`Quota exceeded. Retrying in ${delay}ms... (attempt ${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGemini(message, userType, config, history, retryCount + 1);
      } else {
        // Trả về response mẫu thay vì lỗi
        return generateDetailedResponse(message, userType);
      }
    }
    
    // Với các lỗi khác, trả về response mẫu
    return generateDetailedResponse(message, userType);
  }
};

// Hàm tạo response chi tiết dựa trên context
const generateDetailedResponse = (message: string, userType: string) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('vay') || lowerMessage.includes('vốn') || lowerMessage.includes('tín dụng')) {
    return `Chào bạn! 👋 Tôi là TV Bank AI Assistant, rất vui được hỗ trợ bạn về thủ tục vay vốn. Để giúp bạn hiểu rõ quy trình, tôi sẽ chia sẻ thông tin chi tiết như sau:

**1. Các loại hình vay vốn tại TV Bank:**

Trước khi đi vào thủ tục, bạn cần xác định loại hình vay phù hợp với nhu cầu của mình. TV Bank cung cấp nhiều sản phẩm vay khác nhau, bao gồm:

• **Vay tín chấp:** Dành cho mục đích tiêu dùng cá nhân, không cần tài sản đảm bảo.
• **Vay thế chấp:** Cần có tài sản đảm bảo như nhà đất, xe cộ. Thường được sử dụng cho mục đích mua nhà, mua xe, kinh doanh.
• **Vay kinh doanh:** Dành cho doanh nghiệp hoặc hộ kinh doanh cá thể.
• **Vay nông nghiệp:** Hỗ trợ các hoạt động sản xuất nông nghiệp với lãi suất ưu đãi.

**2. Thủ tục vay vốn chi tiết:**

📝 **Bước 1: Chuẩn bị hồ sơ**
- Giấy tờ tùy thân: CMND/CCCD, hộ khẩu (bản sao công chứng)
- Giấy tờ chứng minh thu nhập: Hợp đồng lao động, sao kê lương 3-6 tháng gần nhất
- Giấy tờ liên quan đến tài sản đảm bảo (nếu có)

🏦 **Bước 2: Nộp hồ sơ và thẩm định**
- Nộp hồ sơ tại chi nhánh gần nhất
- Ngân hàng thẩm định trong vòng 5-7 ngày làm việc

✅ **Bước 3: Phê duyệt và giải ngân**
- Nhận thông báo kết quả phê duyệt
- Ký hợp đồng tín dụng
- Giải ngân theo thỏa thuận

Bạn có cần tư vấn thêm về loại hình vay nào cụ thể không? 🤔`;
  }
  
  if (lowerMessage.includes('tiết kiệm') || lowerMessage.includes('gửi') || lowerMessage.includes('lãi suất')) {
    return `Chào bạn! 💰 Cảm ơn bạn quan tâm đến dịch vụ tiết kiệm của TV Bank. Chúng tôi có nhiều sản phẩm tiết kiệm hấp dẫn:

**🏦 Các loại hình tiết kiệm tại TV Bank:**

**1. Tiết kiệm không kỳ hạn:**
• Linh hoạt rút tiền bất cứ lúc nào
• Lãi suất: 0.5%/năm
• Không có số tiền tối thiểu
• Phù hợp cho việc dự phòng khẩn cấp

**2. Tiết kiệm có kỳ hạn:**
• Kỳ hạn 1 tháng: 4.5%/năm
• Kỳ hạn 3 tháng: 5.2%/năm  
• Kỳ hạn 6 tháng: 5.8%/năm
• Kỳ hạn 12 tháng: 6.5%/năm
• Số tiền tối thiểu: 500.000 VNĐ

**3. Tiết kiệm tích lũy định kỳ:**
• Gửi định kỳ hàng tháng từ 200.000 VNĐ
• Lãi suất ưu đãi: 6.8%/năm
• Thời gian tích lũy linh hoạt từ 12-60 tháng
• Có thể rút trước khi đến hạn (tính lãi theo kỳ hạn ngắn hơn)

**📋 Thủ tục mở sổ tiết kiệm:**
1. Mang CMND/CCCD gốc
2. Điền phiếu gửi tiền
3. Nộp tiền mặt hoặc chuyển khoản
4. Nhận sổ tiết kiệm và hợp đồng

Bạn muốn tìm hiểu thêm về loại tiết kiệm nào? Hay cần tư vấn về số tiền và kỳ hạn phù hợp? 😊`;
  }

  if (lowerMessage.includes('chuyển khoản') || lowerMessage.includes('internet banking') || lowerMessage.includes('mobile banking')) {
    return `Xin chào! 💳 TV Bank cung cấp đa dạng dịch vụ thanh toán hiện đại và tiện lợi:

**🌐 Internet Banking TV Bank:**

**Tính năng chính:**
• Chuyển khoản trong và ngoài ngân hàng 24/7
• Thanh toán hóa đơn điện, nước, internet, điện thoại
• Nạp tiền điện thoại và thẻ game
• Kiểm tra số dư và lịch sử giao dịch
• Mở sổ tiết kiệm online

**Phí dịch vụ:**
• Chuyển khoản nội bộ TV Bank: MIỄN PHÍ
• Chuyển khoản liên ngân hàng: 5.500 VNĐ/giao dịch
• Thanh toán hóa đơn: 2.200 VNĐ/giao dịch

**📱 Mobile Banking TV Bank:**
• Giao diện thân thiện, dễ sử dụng
• Tất cả tính năng của Internet Banking
• Đăng nhập bằng vân tay/Face ID
• Nhận thông báo giao dịch realtime
• QR Pay - thanh toán bằng mã QR

**🔒 Bảo mật:**
• Xác thực 2 lớp (OTP qua SMS)
• Mã hóa SSL 256-bit
• Tự động đăng xuất sau 10 phút không hoạt động
• Thông báo mọi giao dịch qua SMS

**📋 Đăng ký dịch vụ:**
1. Mang CMND + thẻ ATM đến chi nhánh
2. Điền form đăng ký
3. Nhận mã đăng nhập qua SMS
4. Tải app TV Bank Mobile và kích hoạt

Bạn muốn đăng ký dịch vụ nào? Tôi có thể hướng dẫn chi tiết hơn! 📞`;
  }

  // Response mặc định
  return `Chào bạn! 👋 Tôi là AI Assistant của TV Bank, sẵn sàng hỗ trợ bạn 24/7.

**🏦 Dịch vụ chính của TV Bank:**

💰 **Vay vốn:** Tín chấp, thế chấp, kinh doanh, nông nghiệp với lãi suất từ 6.5%/năm
💎 **Tiết kiệm:** Có/không kỳ hạn, lãi suất lên đến 6.8%/năm  
💳 **Thanh toán:** Internet Banking, Mobile Banking, chuyển khoản 24/7
🎯 **Thẻ ATM:** Rút tiền miễn phí tại hơn 16.000 ATM toàn quốc

**📞 Liên hệ hỗ trợ:**
• Hotline: 1900 6060 (24/7)
• Website: tvbank.com.vn
• Hơn 200 chi nhánh/phòng giao dịch

Bạn muốn tìm hiểu dịch vụ nào cụ thể? Tôi sẽ tư vấn chi tiết cho bạn! ✨`;
};

// Export function để lưu cấu hình từ component
export const saveAIConfig = (provider: 'openai' | 'gemini', config: AIConfig) => {
  saveConfig(provider, config);
};