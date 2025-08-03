import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Key, Bot, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface APIKeySetupProps {
  onApiKeySet: (provider: 'openai' | 'gemini', apiKey: string) => void;
}

export default function APIKeySetup({ onApiKeySet }: APIKeySetupProps) {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const { toast } = useToast();

  // Kiểm tra xem đã có API key chưa
  useEffect(() => {
    const savedGeminiKey = localStorage.getItem('tvbank-gemini-api-key');
    const savedOpenAIKey = localStorage.getItem('tvbank-openai-api-key');
    
    if (savedGeminiKey || savedOpenAIKey) {
      setShowInstructions(false);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập API Key",
        variant: "destructive"
      });
      return;
    }

    // Lưu API key vào localStorage
    localStorage.setItem(`tvbank-${selectedProvider}-api-key`, apiKey);
    
    // Gọi callback
    onApiKeySet(selectedProvider, apiKey);
    
    toast({
      title: "Thành công",
      description: `API Key ${selectedProvider === 'openai' ? 'OpenAI' : 'Gemini'} đã được lưu`,
    });

    setApiKey('');
    setShowInstructions(false);
  };

  const getStoredKeys = () => {
    const geminiKey = localStorage.getItem('tvbank-gemini-api-key');
    const openaiKey = localStorage.getItem('tvbank-openai-api-key');
    return { geminiKey, openaiKey };
  };

  const { geminiKey, openaiKey } = getStoredKeys();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-banking-blue mb-2">Cấu hình AI API</h2>
        <p className="text-muted-foreground">Nhập API Key để sử dụng AI chatbot</p>
      </div>

      {/* Hiển thị trạng thái API keys đã lưu */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Key className="w-4 h-4" />
          Trạng thái API Keys
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Google Gemini
            </span>
            <Badge variant={geminiKey ? 'default' : 'secondary'}>
              {geminiKey ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Đã cấu hình
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Chưa cấu hình
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              OpenAI ChatGPT
            </span>
            <Badge variant={openaiKey ? 'default' : 'secondary'}>
              {openaiKey ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Đã cấu hình
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Chưa cấu hình
                </>
              )}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Form thêm API Key mới */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Thêm/Cập nhật API Key</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="provider">Chọn nhà cung cấp AI</Label>
            <Select value={selectedProvider} onValueChange={(value: 'openai' | 'gemini') => setSelectedProvider(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Google Gemini (Miễn phí)
                  </div>
                </SelectItem>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    OpenAI ChatGPT (Trả phí)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="apikey">API Key</Label>
            <Input
              id="apikey"
              type="password"
              placeholder={`Nhập ${selectedProvider === 'openai' ? 'OpenAI' : 'Google Gemini'} API Key`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveApiKey} className="w-full" variant="banking">
            <Key className="w-4 h-4 mr-2" />
            Lưu API Key
          </Button>
        </div>
      </Card>

      {/* Hướng dẫn lấy API Key */}
      <Card className="p-6 bg-gradient-to-br from-banking-blue/5 to-banking-light/5">
        <h3 className="font-semibold mb-4 text-banking-blue">Hướng dẫn lấy API Key</h3>
        
        <div className="space-y-4 text-sm">
          {/* Gemini */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Google Gemini (Khuyến nghị - Miễn phí)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-banking-blue hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a></li>
              <li>Đăng nhập bằng tài khoản Google</li>
              <li>Nhấn "Create API Key" → "Create API key in new project"</li>
              <li>Copy API key và dán vào form trên</li>
            </ol>
          </div>

          {/* OpenAI */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              OpenAI ChatGPT (Trả phí)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Truy cập <a href="https://platform.openai.com/api-keys" target="_blank" className="text-banking-blue hover:underline inline-flex items-center gap-1">OpenAI Platform <ExternalLink className="w-3 h-3" /></a></li>
              <li>Đăng nhập/Đăng ký tài khoản OpenAI</li>
              <li>Nhấn "Create new secret key"</li>
              <li>Copy API key và dán vào form trên</li>
              <li><strong>Lưu ý:</strong> Cần nạp credit để sử dụng</li>
            </ol>
          </div>
        </div>

        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Bảo mật:</strong> API Key được lưu trữ an toàn trên trình duyệt của bạn, không được gửi đến máy chủ của TV Bank.
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  );
}