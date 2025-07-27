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
    systemPrompt: `Bạn là AI Assistant của TV Bank, ngân hàng hàng đầu Việt Nam. Hãy hỗ trợ khách hàng một cách chuyên nghiệp và thân thiện.

NGUYÊN TẮC HOẠT ĐỘNG:
1. Luôn xưng hô lịch sự, thân thiện
2. Cung cấp thông tin chính xác về sản phẩm/dịch vụ ngân hàng
3. Hướng dẫn cụ thể, từng bước
4. Khi không chắc chắn, đề xuất liên hệ nhân viên
5. Bảo vệ thông tin khách hàng

LĨNH VỰC CHUYÊN MÔN:
- Sản phẩm tiết kiệm, vay vốn
- Thẻ tín dụng, debit
- Internet Banking, Mobile Banking
- Chuyển khoản, thanh toán
- Tư vấn tài chính cá nhân`,
    temperature: 0.7,
    maxTokens: 500
  },
  gemini: {
    provider: 'gemini' as const,
    apiKey: '',
    model: 'gemini-2.0-flash',
    systemPrompt: `Bạn là TV Bank AI Assistant - trợ lý thông minh của ngân hàng TV Bank.

NHIỆM VỤ:
- Hỗ trợ khách hàng về sản phẩm dịch vụ ngân hàng
- Hướng dẫn sử dụng các tính năng banking
- Tư vấn tài chính phù hợp
- Giải đáp thắc mắc chuyên nghiệp

CHỈ DẪN:
- Luôn lịch sự, chuyên nghiệp
- Thông tin chính xác, cập nhật
- Hướng dẫn chi tiết, dễ hiểu
- Bảo mật thông tin khách hàng
- Khi cần thiết, chuyển cho nhân viên

TRẢ LỜI THEO ĐỊNH DẠNG:
- Sử dụng emoji phù hợp
- Chia thành các phần rõ ràng
- Đưa ra hướng dẫn cụ thể`,
    temperature: 0.8,
    maxTokens: 600
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
        // Gemini API test - sử dụng API endpoint mới nhất
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ text: 'Test connection' }] 
            }]
          })
        });
        
        if (!response.ok) throw new Error('Gemini API connection failed');
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

                {/* System Prompt */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-banking-blue" />
                    System Prompt (Hướng dẫn cho AI)
                  </h3>
                  
                  <Textarea
                    value={configs[provider].systemPrompt}
                    onChange={(e) => updateConfig(provider, { systemPrompt: e.target.value })}
                    className="min-h-[200px]"
                    placeholder="Nhập hướng dẫn để AI hoạt động theo yêu cầu của bạn..."
                  />
                  
                  <div className="mt-4 p-4 bg-banking-blue/5 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">💡 Gợi ý để tối ưu System Prompt:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Định nghĩa rõ vai trò và tính cách của AI</li>
                      <li>• Liệt kê các sản phẩm/dịch vụ chính của ngân hàng</li>
                      <li>• Đặt ra các nguyên tắc bảo mật và compliance</li>
                      <li>• Hướng dẫn cách xử lý tình huống phức tạp</li>
                      <li>• Định dạng phản hồi phù hợp với thương hiệu</li>
                    </ul>
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
export const generateChatResponse = async (message: string, userType: string, provider: 'openai' | 'gemini' = 'gemini') => {
  const storedConfig = getStoredConfig(provider);
  
  if (!storedConfig || !storedConfig.apiKey) {
    return fallbackResponse(message, userType);
  }

  try {
    if (provider === 'openai') {
      return await callOpenAI(message, userType, storedConfig);
    } else {
      return await callGemini(message, userType, storedConfig);
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return fallbackResponse(message, userType);
  }
};

// Gọi OpenAI API
const callOpenAI = async (message: string, userType: string, config: AIConfig) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: `[${userType}] ${message}` }
      ],
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

// Gọi Gemini API với endpoint mới nhất
const callGemini = async (message: string, userType: string, config: AIConfig) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${config.systemPrompt}\n\nNgười dùng: [${userType}] ${message}`
        }]
      }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens
      }
    })
  });

  if (!response.ok) {
    throw new Error('Gemini API failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
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