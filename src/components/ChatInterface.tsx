import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Send, Bot, User, Settings, MessageCircle, TrendingUp, Users, CreditCard, LogOut, Menu } from 'lucide-react';
import chatbotAvatar from '@/assets/chatbot-avatar.jpg';
import Header from '@/components/Header';
import AIIntegration, { generateChatResponse } from '@/components/AIIntegration';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  scenario?: string;
}

interface ChatScenario {
  id: string;
  title: string;
  userType: 'customer' | 'credit-officer' | 'manager';
  icon: React.ReactNode;
  description: string;
  initialMessage: string;
  responses: string[];
}

const chatScenarios: ChatScenario[] = [
  // Khách hàng scenarios
  {
    id: 'account-balance',
    title: 'Kiểm tra số dư tài khoản',
    userType: 'customer',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Hướng dẫn kiểm tra số dư và lịch sử giao dịch',
    initialMessage: 'Chào bạn! Tôi muốn kiểm tra số dư tài khoản của mình.',
    responses: [
      'Xin chào! Tôi sẽ hướng dẫn bạn kiểm tra số dư tài khoản. Bạn có thể sử dụng các cách sau:',
      '1. Internet Banking: Đăng nhập vào website tvbank.vn với tài khoản của bạn',
      '2. Mobile Banking: Sử dụng app TV Bank trên điện thoại',
      '3. SMS Banking: Soạn tin "SD [số tài khoản]" gửi 8168',
      '4. ATM: Sử dụng thẻ ATM tại bất kỳ cây ATM nào của TV Bank',
      'Bạn cần hỗ trợ thêm về cách nào cụ thể không?'
    ]
  },
  {
    id: 'loan-application',
    title: 'Hướng dẫn vay vốn',
    userType: 'customer',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Tư vấn các gói vay và thủ tục cần thiết',
    initialMessage: 'Tôi muốn tìm hiểu về các gói vay cá nhân của ngân hàng.',
    responses: [
      'TV Bank cung cấp nhiều gói vay phù hợp với nhu cầu sản xuất, kinh doanh và tiêu dùng cá nhân:',
  '🌾 **Vay phục vụ sản xuất nông nghiệp**\n- Phù hợp với hộ nông dân, hợp tác xã\n- Hạn mức: theo nhu cầu thực tế (có thể lên đến vài trăm triệu đồng)\n- Lãi suất ưu đãi theo chính sách hỗ trợ phát triển nông thôn\n- Thời hạn: 6 - 60 tháng',
  '🛒 **Vay hộ kinh doanh cá thể / tiểu thương**\n- Hỗ trợ vốn lưu động, mua hàng, mở rộng quy mô\n- Hạn mức: 30 - 500 triệu\n- Có thể yêu cầu tài sản đảm bảo hoặc bảo lãnh từ Quỹ tín dụng nhân dân',
  '🏡 **Vay tiêu dùng có tài sản đảm bảo**\n- Dành cho mục đích: sửa nhà, học phí, mua sắm, chữa bệnh...\n- Tài sản đảm bảo: sổ đỏ, xe ô tô, sổ tiết kiệm\n- Lãi suất hợp lý, linh hoạt thời hạn trả nợ',
  '📄 **Hồ sơ vay vốn cần chuẩn bị:**\n- CMND/CCCD + sổ hộ khẩu\n- Phương án vay vốn (kế hoạch sản xuất, nhu cầu cụ thể...)\n- Giấy tờ chứng minh thu nhập hoặc tài sản đảm bảo\n- Một số giấy tờ khác tùy theo từng gói vay',
  '📌 Bạn đang cần vay để làm gì? (ví dụ: trồng trọt, chăn nuôi, kinh doanh, sửa nhà...) Mình sẽ tư vấn gói vay phù hợp nhất cho bạn.'
    ]
  },
  {
    id: 'savings-investment',
    title: 'Gửi tiết kiệm và tích luỹ',
    userType: 'customer',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Tư vấn các sản phẩm tiết kiệm và sinh lời ổn định',
    initialMessage: 'Tôi muốn tìm hiểu về các sản phẩm gửi tiết kiệm của ngân hàng.',
    responses: [
      'TV Bank cung cấp nhiều lựa chọn gửi tiết kiệm linh hoạt, phù hợp với nhu cầu tích lũy an toàn của khách hàng:',
    '💵 **Tiết kiệm có kỳ hạn:**\n- Kỳ hạn: từ 1 tháng đến 36 tháng\n- Lãi suất: cạnh tranh theo kỳ hạn, trả lãi cuối kỳ hoặc định kỳ\n- Có thể tái tục tự động khi đến hạn',
    '🧾 **Tiết kiệm không kỳ hạn:**\n- Gửi và rút bất cứ lúc nào\n- Lãi suất: khoảng 0.2% - 0.5%/năm\n- Phù hợp tích lũy linh hoạt, không cố định thời gian',
    '🎯 **Tiết kiệm tích lũy định kỳ:**\n- Gửi hàng tháng từ 200.000 VNĐ trở lên\n- Lãi suất ưu đãi theo kỳ hạn đăng ký\n- Hỗ trợ khách hàng hình thành thói quen tiết kiệm',
    '🏅 **Chứng chỉ tiền gửi TV Bank:**\n- Kỳ hạn từ 6 đến 36 tháng\n- Lãi suất cao hơn gửi tiết kiệm thông thường\n- Có thể chuyển nhượng nếu cần thanh khoản',
    '📌 Bạn đang quan tâm đến hình thức gửi tiết kiệm nào? Mình sẽ tư vấn cụ thể hơn về kỳ hạn và lãi suất cho bạn.'
    ]
  },
  {
    id: 'transfer-payment',
    title: 'Chuyển khoản và thanh toán',
    userType: 'customer',
    icon: <Send className="w-4 h-4" />,
    description: 'Hướng dẫn các dịch vụ chuyển khoản và thanh toán',
    initialMessage: 'Tôi cần hướng dẫn chuyển khoản qua ứng dụng mobile banking.',
    responses: [
      'Tôi sẽ hướng dẫn bạn chuyển khoản qua TV Bank Mobile:',
      '📱 **Bước 1:** Mở app TV Bank và đăng nhập bằng vân tay/mật khẩu',
      '💸 **Bước 2:** Chọn "Chuyển khoản" → "Trong nước" hoặc "Ngoài nước"',
      '📋 **Bước 3:** Nhập thông tin người nhận:\n- Số tài khoản\n- Tên người nhận\n- Ngân hàng (nếu khác TV Bank)\n- Số tiền và nội dung',
      '✅ **Bước 4:** Xác nhận bằng OTP SMS hoặc Smart OTP',
      '🎁 **Ưu đãi hiện tại:**\n- Miễn phí chuyển khoản trong hệ thống\n- Phí ưu đãi 5,000đ cho ngân hàng khác\n- Chuyển nhanh 24/7 qua Napas 247',
      'Bạn cần hỗ trợ thêm về loại chuyển khoản nào không?'
    ]
  },
  {
    id: 'card-services',
    title: 'Dịch vụ thẻ ngân hàng',
    userType: 'customer',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Thông tin và hướng dẫn sử dụng thẻ',
    initialMessage: 'Tôi muốn đăng ký thẻ tín dụng và tìm hiểu các ưu đãi.',
    responses: [
      'TV Bank có nhiều loại thẻ phù hợp với nhu cầu của bạn:',
      '💳 **Thẻ tín dụng Classic:**\n- Hạn mức: 10-50 triệu\n- Miễn phí năm đầu\n- Hoàn tiền 0.5% mọi giao dịch',
      '🏆 **Thẻ tín dụng Gold:**\n- Hạn mức: 50-200 triệu\n- Hoàn tiền 1% mọi giao dịch\n- Ưu đãi tại sân bay và khách sạn',
      '💎 **Thẻ tín dụng Platinum:**\n- Hạn mức: 200-500 triệu\n- Hoàn tiền 1.5% + tích điểm\n- Dịch vụ concierge 24/7',
      '🛡️ **Thẻ ghi nợ:**\n- Liên kết trực tiếp với tài khoản\n- Rút tiền miễn phí tại ATM TV Bank\n- Thanh toán không tiếp xúc',
      '📋 **Điều kiện đăng ký:**\n- Thu nhập từ 8 triệu/tháng\n- CMND + Giấy tờ thu nhập\n- Duyệt nhanh trong 24h',
      'Loại thẻ nào phù hợp với bạn nhất?'
    ]
  },
  {
    id: 'insurance-services',
    title: 'Dịch vụ bảo hiểm',
    userType: 'customer',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Tư vấn các gói bảo hiểm liên kết ngân hàng',
    initialMessage: 'Tôi quan tâm đến các sản phẩm bảo hiểm của ngân hàng.',
    responses: [
      'TV Bank hợp tác với các công ty bảo hiểm uy tín để cung cấp:',
      '🏥 **Bảo hiểm sức khỏe:**\n- Bảo hiểm y tế cá nhân\n- Bảo hiểm tai nạn 24/7\n- Gói gia đình ưu đãi',
      '🏠 **Bảo hiểm tài sản:**\n- Bảo hiểm nhà ở\n- Bảo hiểm xe cộ\n- Bảo hiểm hàng hóa',
      '💼 **Bảo hiểm nhân thọ:**\n- Bảo hiểm tiết kiệm\n- Bảo hiểm giáo dục\n- Bảo hiểm hưu trí',
      '🎁 **Ưu đãi đặc biệt:**\n- Giảm 15% phí bảo hiểm cho khách hàng VIP\n- Thanh toán phí qua tài khoản TV Bank\n- Hỗ trợ bồi thường nhanh chóng',
      'Bạn muốn tìm hiểu loại bảo hiểm nào cụ thể?'
    ]
  },
  
  // Chuyên viên tín dụng scenarios
  {
    id: 'credit-check',
    title: 'Tra cứu thông tin khách hàng',
    userType: 'credit-officer',
    icon: <Users className="w-4 h-4" />,
    description: 'Kiểm tra lịch sử tín dụng và thông tin khách hàng',
    initialMessage: 'Tôi cần tra cứu thông tin tín dụng của khách hàng mã KH123456.',
    responses: [
      '🔍 **Thông tin khách hàng KH123456:**',
      '📊 **Điểm tín dụng CIC:** 750/900 (Tốt)\n**Phân loại nợ:** Nhóm 1 (Chuẩn)\n**Tổng dư nợ hiện tại:** 125 triệu VND',
      '📈 **Lịch sử vay:**\n- 2023: Vay tiêu dùng 80 triệu - Đã trả đúng hạn\n- 2022: Vay mua xe 200 triệu - Thanh toán tốt\n- Không có nợ xấu',
      '💰 **Tài chính hiện tại:**\n- Thu nhập: 35 triệu/tháng\n- Tỷ lệ DSTI: 45% (Trong ngưỡng an toàn)\n- Tài sản đảm bảo: Nhà tại Hà Nội trị giá 2.8 tỷ',
      '✅ **Đánh giá rủi ro:** THẤP - Khách hàng đủ điều kiện cho các gói vay ưu đãi.',
      'Bạn cần thêm thông tin gì khác về khách hàng này?'
    ]
  },
  {
    id: 'risk-assessment',
    title: 'Báo cáo rủi ro tín dụng',
    userType: 'credit-officer',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Phân tích và đánh giá rủi ro cho hồ sơ vay',
    initialMessage: 'Cần phân tích rủi ro cho hồ sơ vay 500 triệu của khách hàng KH789012.',
    responses: [
      '⚠️ **Báo cáo đánh giá rủi ro - KH789012:**',
      '🔴 **Các yếu tố rủi ro:**\n- Thu nhập không ổn định (freelancer)\n- DSTI cao 68% (vượt ngưỡng 60%)\n- Đã có 2 khoản vay đang tồn đọng',
      '🟡 **Yếu tố tích cực:**\n- Có tài sản đảm bảo (căn hộ 1.2 tỷ)\n- Lịch sử giao dịch tại TV Bank 5 năm\n- Chưa có nợ quá hạn',
      '📋 **Đề xuất:**\n1. Giảm hạn mức xuống 300 triệu\n2. Yêu cầu tài sản đảm bảo bổ sung\n3. Lãi suất áp dụng: 14%/năm (cao hơn 2% so với tiêu chuẩn)',
      '📊 **Mức độ rủi ro:** TRUNG BÌNH - Cần theo dõi sát sao trong 12 tháng đầu.',
      'Bạn có muốn xem thêm chi tiết về từng yếu tố rủi ro không?'
    ]
  },
  {
    id: 'loan-approval',
    title: 'Phê duyệt hồ sơ vay',
    userType: 'credit-officer',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Quy trình thẩm định và phê duyệt hồ sơ',
    initialMessage: 'Cần hướng dẫn quy trình phê duyệt cho hồ sơ vay KH555888.',
    responses: [
      '📋 **Quy trình phê duyệt hồ sơ vay - KH555888:**',
      '✅ **Bước 1: Kiểm tra hồ sơ cơ bản**\n- Giấy tờ tùy thân: Hoàn chỉnh\n- Chứng minh thu nhập: Đã xác thực\n- Hồ sơ pháp lý tài sản: Hợp lệ',
      '🔍 **Bước 2: Thẩm định tín dụng**\n- CIC Score: 780/900 (Tốt)\n- Lịch sử nợ: Sạch\n- Khả năng trả nợ: Đủ điều kiện',
      '🏠 **Bước 3: Thẩm định tài sản**\n- Định giá tài sản: 3.2 tỷ\n- Tỷ lệ cho vay: 70% (2.24 tỷ)\n- Pháp lý: Không vướng mắc',
      '📊 **Kết luận thẩm định:**\n- Đề xuất phê duyệt: 2.0 tỷ VND\n- Lãi suất: 9.5%/năm\n- Thời hạn: 15 năm\n- Điều kiện đặc biệt: Không',
      '⏰ **Tiến độ:** Chờ phê duyệt cấp trên - Dự kiến hoàn thành trong 2 ngày làm việc.',
      'Bạn cần bổ sung thông tin gì khác cho hồ sơ này không?'
    ]
  },
  {
    id: 'debt-restructuring',
    title: 'Tái cấu trúc nợ',
    userType: 'credit-officer',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Hỗ trợ khách hàng tái cấu trúc khoản vay',
    initialMessage: 'Khách hàng KH444777 gặp khó khăn, cần tư vấn tái cấu trúc nợ.',
    responses: [
      '🔄 **Phương án tái cấu trúc nợ - KH444777:**',
      '💳 **Tình trạng hiện tại:**\n- Dư nợ gốc: 850 triệu VND\n- Quá hạn: 45 ngày\n- Lý do: Giảm thu nhập do Covid-19',
      '📋 **Đề xuất phương án:**\n**Phương án 1:** Gia hạn nợ gốc 12 tháng\n**Phương án 2:** Giảm lãi suất xuống 8%/năm\n**Phương án 3:** Kết hợp cả hai',
      '💰 **Phương án được chọn - Kết hợp:**\n- Gia hạn nợ gốc: 12 tháng\n- Lãi suất mới: 8%/năm (giảm 1.5%)\n- Phí gia hạn: Miễn\n- Thời hạn còn lại: 8 năm',
      '📊 **Khoản thanh toán mới:**\n- Trước: 12.5 triệu/tháng\n- Sau: 8.2 triệu/tháng\n- Tiết kiệm: 4.3 triệu/tháng',
      '✅ **Điều kiện áp dụng:**\n- Cam kết không phát sinh nợ mới\n- Báo cáo tình hình tài chính 3 tháng/lần\n- Đưa tài khoản lương về TV Bank',
      'Phương án này có phù hợp với khách hàng không?'
    ]
  },
  {
    id: 'compliance-check',
    title: 'Kiểm tra tuân thủ',
    userType: 'credit-officer',
    icon: <Users className="w-4 h-4" />,
    description: 'Kiểm tra các quy định tuân thủ pháp luật',
    initialMessage: 'Cần kiểm tra tuân thủ cho giao dịch lớn của khách hàng KH999000.',
    responses: [
      '🛡️ **Kiểm tra tuân thủ - KH999000:**',
      '🔍 **Anti Money Laundering (AML):**\n- Nguồn gốc tiền: Đã xác minh\n- Blacklist check: Không có\n- PEP screening: Âm tính\n- STR/CTR: Không cần báo cáo',
      '📋 **Know Your Customer (KYC):**\n- Cập nhật thông tin: Đầy đủ\n- Xác thực danh tính: Hoàn thành\n- Due diligence: Cấp độ chuẩn\n- Risk rating: Thấp',
      '⚖️ **Tuân thủ pháp lý:**\n- Tuân thủ thông tư 01/2020: ✅\n- Quyết định 2345/QĐ-NHNN: ✅\n- Luật phòng chống rửa tiền: ✅\n- FATCA/CRS: Không áp dụng',
      '📊 **Đánh giá rủi ro:**\n- Rủi ro tuân thủ: THẤP\n- Cần thêm giấy tờ: Không\n- Thời gian xử lý: Bình thường\n- Approval required: Level 2',
      '✅ **Kết luận:** Giao dịch tuân thủ đầy đủ quy định, có thể tiếp tục xử lý.',
      'Bạn có cần kiểm tra thêm khía cạnh nào khác không?'
    ]
  },

  // Quản lý scenarios
  {
    id: 'branch-performance',
    title: 'Báo cáo hiệu suất chi nhánh',
    userType: 'manager',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Tổng quan hiệu suất và KPI của chi nhánh',
    initialMessage: 'Tôi cần xem báo cáo hiệu suất tháng này của chi nhánh.',
    responses: [
      '📊 **Báo cáo hiệu suất của chi nhánh - Tháng 07/2025:**',
      '💰 **Tài chính:**\n- Tổng huy động: 485 tỷ (đạt 97% kế hoạch)\n- Tổng cho vay: 392 tỷ (đạt 104% kế hoạch)\n- Lợi nhuận: 15.2 tỷ (tăng 12% so với cùng kỳ)\n- Tỷ trọng cho vay hộ gia đình: 68% tổng dư nợ',
      '👥 **Khách hàng:**\n- Khách hàng mới: 234 (đạt 117% chỉ tiêu)\n- Tỷ lệ hài lòng: 4.6/5\n- Số lượng giao dịch: 12,458 (tăng 8%)\n- Chương trình "Tài chính xanh": 56 hộ vay ưu đãi (đạt 112% chỉ tiêu)',
      '⚡ **Hiệu suất:**\n- Thời gian xử lý hồ sơ vay: 3.2 ngày (giảm 0.5 ngày)\n- Tỷ lệ nợ xấu: 0.8% (trong ngưỡng kiểm soát)\n- ROA: 1.8%',
      '🏆 **Xếp hạng:** #3/6 chi nhánh khu vực Hà Nội',
      'Bạn muốn xem chi tiết về chỉ số nào cụ thể?'
    ]
  },
  {
    id: 'customer-overview',
    title: 'Tổng quan khách hàng',
    userType: 'manager',
    icon: <Users className="w-4 h-4" />,
    description: 'Phân tích đối tượng khách hàng và xu hướng',
    initialMessage: 'Cần báo cáo phân tích khách hàng VIP của toàn hệ thống.',
    responses: [
      '👑 **Báo cáo Khách hàng VIP - Toàn hệ thống:**',
      '📈 **Tổng quan:**\n- Tổng số KH VIP: 2,847 (tăng 15% so với năm trước)\n- Tổng tài sản gửi: 8,450 tỷ VND\n- Doanh thu từ KH VIP: 245 tỷ (chiếm 68% tổng doanh thu)',
      '🎯 **Phân khúc:**\n- Premier (>5 tỷ): 156 khách (5.5%)\n- Gold (1-5 tỷ): 734 khách (25.8%)\n- Silver (500tr-1 tỷ): 1,957 khách (68.7%)',
      '📊 **Xu hướng sử dụng:**\n- Dịch vụ phổ biến: Gửi tiết kiệm (89%), Vay BĐS (45%), Đầu tư (32%)\n- Kênh giao dịch: Digital Banking (78%), Quầy (22%)',
      '🎪 **Chương trình đặc biệt:**\n- Tỷ lệ tham gia: 76%\n- Mức độ hài lòng: 4.8/5\n- Tần suất sử dụng tăng 25%',
      'Bạn muốn xem phân tích sâu hơn về nhóm khách hàng nào?'
    ]
  },
  {
    id: 'financial-dashboard',
    title: 'Dashboard tài chính',
    userType: 'manager',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Báo cáo tài chính và phân tích dòng tiền',
    initialMessage: 'Cần xem dashboard tài chính tổng thể của ngân hàng trong Q1/2025.',
    responses: [
      '📈 **Dashboard Tài chính Q4/2024:**',
      '💰 **Tổng quan tài chính:**\n- Tổng tài sản: 125,000 tỷ VND (tăng 8% so với Q3)\n- Dư nợ tín dụng: 89,500 tỷ VND\n- Huy động vốn: 98,200 tỷ VND\n- Vốn chủ sở hữu: 12,800 tỷ VND',
      '🎯 **Hiệu quả kinh doanh:**\n- ROE: 18.5% (vượt mục tiêu 16%)\n- ROA: 1.9% (đạt mục tiêu)\n- NIM: 4.2% (ổn định)\n- CIR: 35.8% (giảm 2.1%)',
      '📊 **Chất lượng tài sản:**\n- NPL Ratio: 1.1% (giảm 0.3%)\n- Provision Coverage: 165%\n- LDR: 91.2% (trong giới hạn)\n- CAR: 15.8% (vượt Basel III)',
      '🔄 **Dòng tiền và thanh khoản:**\n- LCR: 145% (vượt yêu cầu 100%)\n- NSFR: 125% (đạt chuẩn)\n- Dự trữ bắt buộc: Đảm bảo 100%',
      '🏆 **So sánh ngành:** TV Bank xếp thứ 5/15 ngân hàng tương đương về ROE và chất lượng tài sản.',
      'Bạn muốn đi sâu vào chỉ số nào cụ thể?'
    ]
  },
  {
    id: 'risk-management',
    title: 'Quản lý rủi ro',
    userType: 'manager',
    icon: <Users className="w-4 h-4" />,
    description: 'Báo cáo và kiểm soát các loại rủi ro',
    initialMessage: 'Tôi cần báo cáo tổng thể về tình hình quản lý rủi ro hiện tại.',
    responses: [
      '⚠️ **Báo cáo Quản lý Rủi ro - Tháng 6/2025:**',
      '🔴 **Rủi ro tín dụng:**\n- NPL: 1.1% (trong giới hạn 2%)\n- Top 10 khách hàng lớn: 18% vốn chủ sở hữu\n- Tập trung ngành: Bất động sản 35%, Sản xuất 28%\n- Stress test: Vượt qua kịch bản khó khăn',
      '🟡 **Rủi ro thị trường:**\n- VaR (95%, 1 ngày): 2.8 tỷ VND\n- Duration Gap: +0.5 năm (chấp nhận được)\n- FX Exposure: $12M (hedge 80%)\n- Interest Rate Risk: Trong giới hạn',
      '💧 **Rủi ro thanh khoản:**\n- Stress test thanh khoản: PASS\n- Funding concentration: Phân tán tốt\n- Maturity mismatch: Kiểm soát\n- Emergency funding: 15% tổng TS',
      '🏛️ **Rủi ro hoạt động:**\n- Operational loss: 0.02% doanh thu\n- Cyber security: Không vi phạm nghiêm trọng\n- Business continuity: 99.8% uptime\n- Compliance: Không phạt lớn',
      '📋 **Khuyến nghị:**\n- Tăng cường giám sát BĐS\n- Đa dạng hóa danh mục đầu tư\n- Nâng cấp hệ thống cảnh báo sớm',
      'Loại rủi ro nào bạn quan tâm nhất?'
    ]
  },
  {
    id: 'strategic-planning',
    title: 'Lập kế hoạch chiến lược',
    userType: 'manager',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Phân tích và lập kế hoạch phát triển',
    initialMessage: 'Cần đánh giá và đề xuất kế hoạch phát triển cho năm 2025.',
    responses: [
      '🎯 **Kế hoạch Chiến lược 2025:**',
      '📊 **Mục tiêu tăng trưởng:**\n- Tổng tài sản: +12% (140,000 tỷ)\n- Dư nợ tín dụng: +15% (103,000 tỷ)\n- Lợi nhuận trước thuế: +18% (4,200 tỷ)\n- ROE mục tiêu: 19.5%',
      '🏢 **Mở rộng mạng lưới:**\n- Mở mới 8 chi nhánh (tập trung miền Nam)\n- Nâng cấp 15 phòng giao dịch\n- Đầu tư Digital Banking: 150 tỷ\n- Smart Branch concept: 5 điểm',
      '💡 **Sản phẩm và dịch vụ:**\n- Ra mắt Mobile Banking 3.0\n- Triển khai AI Chatbot toàn hệ thống\n- Phát triển Bancassurance\n- Green Banking initiatives',
      '👥 **Phát triển nhân sự:**\n- Tuyển dụng: 200 nhân viên mới\n- Đào tạo Digital Skills: 100% CB\n- Leadership program: 50 cán bộ\n- Employee satisfaction: >85%',
      '⚡ **Chuyển đổi số:**\n- Core Banking nâng cấp hoàn thành\n- API Banking cho đối tác\n- Data Analytics platform\n- Blockchain pilot project',
      '💰 **Ngân sách đầu tư:** 680 tỷ VND phân bổ theo ưu tiên chiến lược.',
      'Bạn muốn thảo luận chi tiết về mảng nào?'
    ]
  }
];

const userTypes = [
  { value: 'customer', label: 'Khách hàng', icon: <User className="w-4 h-4" /> },
  { value: 'credit-officer', label: 'Chuyên viên tín dụng', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'manager', label: 'Quản lý', icon: <Users className="w-4 h-4" /> }
];

export default function ChatInterface() {
  const { user, profile, signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<string>('customer');
  const [isTyping, setIsTyping] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map user role to chat type
  const userRoleMapping = {
    'customer': 'customer',
    'consultant': 'credit-officer',
    'branch_manager': 'manager'
  };

  // Set user type based on profile role
  useEffect(() => {
    if (profile?.role) {
      setSelectedUserType(userRoleMapping[profile.role as keyof typeof userRoleMapping] || 'customer');
    }
  }, [profile]);

  const filteredScenarios = chatScenarios.filter(scenario => 
    scenario.userType === selectedUserType
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (content: string, type: 'user' | 'bot', scenario?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      scenario
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateBotResponse = async (responses: string[]) => {
    setIsTyping(true);
    
    for (let i = 0; i < responses.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      addMessage(responses[i], 'bot');
    }
    
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = inputMessage;
    addMessage(userMessage, 'user');
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Tích hợp AI response
      const aiResponse = await generateChatResponse(userMessage, selectedUserType);
      addMessage(aiResponse, 'bot');
    } catch (error) {
      addMessage(
        'Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ nhân viên hỗ trợ.',
        'bot'
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleScenarioDemo = (scenario: ChatScenario) => {
    addMessage(scenario.initialMessage, 'user', scenario.id);
    setTimeout(() => {
      simulateBotResponse(scenario.responses);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <div className="space-y-6 p-4">
      {/* User Profile */}
      <Card className="p-4 shadow-lg border-banking-blue/20">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-banking-blue" />
          Thông tin người dùng
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-destructive hover:text-destructive flex-shrink-0"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </Card>

      {/* Demo Scenarios */}
      <Card className="p-4 shadow-lg border-banking-blue/20">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-banking-blue" />
          Hỗ trợ đề xuất
        </h3>
        <div className="space-y-3">
          {filteredScenarios.map((scenario) => (
            <Button
              key={scenario.id}
              variant="chat"
              size="sm"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => {
                handleScenarioDemo(scenario);
                setSidebarOpen(false); // Close mobile sidebar after selection
              }}
            >
              <div className="flex items-start gap-3">
                {scenario.icon}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{scenario.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed break-words">
                    {scenario.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-banking-blue/5">
      <Header onShowAIConfig={() => setShowAIConfig(true)} />
      
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <SidebarContent />
          </div>

          {/* Mobile Sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm" className="fixed top-20 left-4 z-50">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col shadow-xl border-banking-blue/20">
              {/* Chat Header */}
              <div className="p-4 border-b bg-gradient-to-r from-banking-blue to-banking-light text-white rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">TV Bank AI Assistant</h3>
                    <p className="text-sm text-white/80">
                      {profile?.role === 'customer' && 'Hỗ trợ khách hàng'}
                      {profile?.role === 'consultant' && 'Công cụ chuyên viên tư vấn'}
                      {profile?.role === 'branch_manager' && 'Dashboard quản lý'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-banking-blue/5">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <img 
                      src={chatbotAvatar} 
                      alt="Chatbot" 
                      className="w-16 h-16 mx-auto rounded-full mb-4 shadow-lg"
                    />
                    <p>Chào mừng đến với TV Bank AI Assistant!</p>
                    <p className="text-sm mt-2">Chọn hỗ trợ đề xuất hoặc gửi tin nhắn để bắt đầu.</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-${message.type === 'user' ? 'right' : 'left'}`}
                  >
                    <div className={`flex items-start gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-banking-blue text-white' 
                          : 'bg-white border border-banking-blue/20'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4 text-banking-blue" />
                        )}
                      </div>
                      <div className={`p-3 rounded-lg shadow-sm ${
                        message.type === 'user'
                          ? 'bg-banking-blue text-white rounded-br-none'
                          : 'bg-white border border-banking-blue/20 rounded-bl-none'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm break-words">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start animate-slide-in-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-banking-blue/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-banking-blue" />
                      </div>
                      <div className="bg-white border border-banking-blue/20 p-3 rounded-lg rounded-bl-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-banking-blue/60 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-banking-blue/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-banking-blue/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập nội dung cần hỗ trợ..."
                    className="flex-1 resize-none border border-banking-blue/20 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-banking-blue/20 min-h-[44px] max-h-32"
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    variant="send"
                    size="icon"
                    disabled={!inputMessage.trim()}
                    className="h-11 w-11"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
