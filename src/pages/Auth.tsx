import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'consultant' | 'branch_manager'>('customer');
  const [branchId, setBranchId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Lỗi đăng nhập',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Đăng nhập thành công',
            description: 'Chào mừng bạn quay lại!'
          });
        }
      } else {
        const userData = {
          full_name: fullName,
          phone,
          role,
          ...(role !== 'customer' && branchId && { branch_id: branchId })
        };
        
        const { error } = await signUp(email, password, userData);
        if (error) {
          toast({
            title: 'Lỗi đăng ký',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Đăng ký thành công',
            description: 'Vui lòng kiểm tra email để xác nhận tài khoản.'
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Có lỗi xảy ra',
        description: 'Vui lòng thử lại sau.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-banking-blue to-banking-light rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">TB</span>
          </div>
          <CardTitle className="text-2xl font-bold text-banking-dark">
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Truy cập vào hệ thống TV Bank' 
              : 'Tạo tài khoản mới TV Bank'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nhập họ và tên"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò</Label>
                  <Select value={role} onValueChange={(value: 'customer' | 'consultant' | 'branch_manager') => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Khách hàng</SelectItem>
                      <SelectItem value="consultant">Chuyên viên tư vấn</SelectItem>
                      <SelectItem value="branch_manager">Quản lý chi nhánh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {role !== 'customer' && (
                  <div className="space-y-2">
                    <Label htmlFor="branchId">Mã chi nhánh</Label>
                    <Input
                      id="branchId"
                      type="text"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      placeholder="Nhập mã chi nhánh"
                      required
                    />
                  </div>
                )}
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Nhập email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-banking-blue to-banking-light hover:from-banking-dark hover:to-banking-blue transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                isLogin ? 'Đăng nhập' : 'Đăng ký'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-banking-blue hover:text-banking-dark"
            >
              {isLogin 
                ? 'Chưa có tài khoản? Đăng ký ngay' 
                : 'Đã có tài khoản? Đăng nhập'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;