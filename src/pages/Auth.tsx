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
  const [role, setRole] = useState<'customer' | 'consultant' | 'branch_manager'>('customer');
  
  // Common fields
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Customer fields
  const [email, setEmail] = useState('');
  const [phoneOrAccount, setPhoneOrAccount] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idIssueDate, setIdIssueDate] = useState('');
  const [idIssuePlace, setIdIssuePlace] = useState('');
  
  // Employee fields  
  const [employeeId, setEmployeeId] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [branchId, setBranchId] = useState('');
  
  // Manager fields
  const [managerId, setManagerId] = useState('');
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const getLoginCredentials = () => {
    switch (role) {
      case 'customer':
        return { email: phoneOrAccount, password };
      case 'consultant':
        return { email: employeeId, password };
      case 'branch_manager':
        return { email: managerId, password };
      default:
        return { email, password };
    }
  };

  const getSignUpData = () => {
    const baseData = {
      full_name: fullName,
      role,
      phone: role === 'customer' ? phone : undefined,
      ...(role !== 'customer' && branchId && { branch_id: branchId })
    };

    switch (role) {
      case 'customer':
        return {
          ...baseData,
          email: email || `${phone}@customer.tvbank.com`,
          id_number: idNumber,
          id_issue_date: idIssueDate,
          id_issue_place: idIssuePlace
        };
      case 'consultant':
        return {
          ...baseData,
          email: companyEmail,
          employee_id: employeeId
        };
      case 'branch_manager':
        return {
          ...baseData,
          email: companyEmail,
          manager_id: managerId
        };
      default:
        return baseData;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const credentials = getLoginCredentials();
        const { error } = await signIn(credentials.email, credentials.password);
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
        const userData = getSignUpData();
        const signUpEmail = ('email' in userData ? userData.email : null) || email;
        const { error } = await signUp(signUpEmail, password, userData);
        if (error) {
          toast({
            title: 'Lỗi đăng ký',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Đăng ký thành công',
            description: 'Tài khoản đã được tạo thành công!'
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
            {/* Role selection - always show for both login and signup */}
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

            {/* Login fields based on role */}
            {isLogin && (
              <>
                {role === 'customer' && (
                  <div className="space-y-2">
                    <Label htmlFor="phoneOrAccount">Số điện thoại / Số tài khoản</Label>
                    <Input
                      id="phoneOrAccount"
                      type="text"
                      value={phoneOrAccount}
                      onChange={(e) => setPhoneOrAccount(e.target.value)}
                      required
                      placeholder="Nhập số điện thoại hoặc số tài khoản"
                    />
                  </div>
                )}

                {role === 'consultant' && (
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Mã nhân viên / Username</Label>
                    <Input
                      id="employeeId"
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                      placeholder="Nhập mã nhân viên"
                    />
                  </div>
                )}

                {role === 'branch_manager' && (
                  <div className="space-y-2">
                    <Label htmlFor="managerId">Mã quản lý / ID quản lý</Label>
                    <Input
                      id="managerId"
                      type="text"
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      required
                      placeholder="Nhập mã quản lý"
                    />
                  </div>
                )}
              </>
            )}

            {/* Signup fields based on role */}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên đầy đủ</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>

                {role === 'customer' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại (nhận OTP)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (tuỳ chọn)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email (không bắt buộc)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idNumber">CCCD/CMND</Label>
                      <Input
                        id="idNumber"
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        required
                        placeholder="Nhập số CCCD/CMND"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="idIssueDate">Ngày cấp</Label>
                        <Input
                          id="idIssueDate"
                          type="date"
                          value={idIssueDate}
                          onChange={(e) => setIdIssueDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="idIssuePlace">Nơi cấp</Label>
                        <Input
                          id="idIssuePlace"
                          type="text"
                          value={idIssuePlace}
                          onChange={(e) => setIdIssuePlace(e.target.value)}
                          required
                          placeholder="Nơi cấp CCCD"
                        />
                      </div>
                    </div>
                  </>
                )}

                {role === 'consultant' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Mã nhân viên (được cấp sẵn)</Label>
                      <Input
                        id="employeeId"
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        required
                        placeholder="Nhập mã nhân viên"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email công ty</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        required
                        placeholder="Nhập email công ty"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branchId">Mã chi nhánh</Label>
                      <Input
                        id="branchId"
                        type="text"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        required
                        placeholder="Nhập mã chi nhánh"
                      />
                    </div>
                  </>
                )}

                {role === 'branch_manager' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="managerId">Mã quản lý (được cấp trước)</Label>
                      <Input
                        id="managerId"
                        type="text"
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value)}
                        required
                        placeholder="Nhập mã quản lý"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email nội bộ</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        required
                        placeholder="Nhập email nội bộ"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branchId">Mã chi nhánh</Label>
                      <Input
                        id="branchId"
                        type="text"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        required
                        placeholder="Nhập mã chi nhánh"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            
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