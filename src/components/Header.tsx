import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Bot, Cpu } from 'lucide-react';
import tvBankLogo from '@/assets/tv-bank-logo.jpg';

interface HeaderProps {
  onShowAIConfig: () => void;
}

export default function Header({ onShowAIConfig }: HeaderProps) {
  return (
    <header className="bg-white shadow-lg border-b border-banking-blue/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <img 
              src={tvBankLogo} 
              alt="TV Bank Logo" 
              className="h-12 w-auto rounded-lg shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-banking-blue to-banking-light bg-clip-text text-transparent">
                TV Bank AI Assistant
              </h1>
              <p className="text-sm text-muted-foreground">
                Chatbot thông minh hỗ trợ ngân hàng
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="chat"
              size="sm"
              onClick={onShowAIConfig}
              className="flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              Cấu hình AI
            </Button>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-banking-blue/5 rounded-lg">
              <Bot className="w-4 h-4 text-banking-blue" />
              <span className="text-sm font-medium text-banking-blue">Demo Mode</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}