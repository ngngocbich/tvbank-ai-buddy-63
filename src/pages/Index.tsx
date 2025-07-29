import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-banking-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-banking-blue to-banking-light rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">TB</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-banking-dark">TV Bank</h1>
            <p className="text-muted-foreground">Hệ thống tư vấn thông minh</p>
          </div>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-banking-blue to-banking-light hover:from-banking-dark hover:to-banking-blue"
          >
            Đăng nhập để tiếp tục
          </Button>
        </div>
      </div>
    );
  }

  return <ChatInterface />;
};

export default Index;
