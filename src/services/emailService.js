// ============================================================
// src/services/emailService.js - DỊCH VỤ GỬI EMAIL (MOCK)
// ============================================================
// Service này GIẢI LẬP việc gửi email để demo
// Production thực tế cần dùng Nodemailer + SMTP hoặc SendGrid

/**
 * Mock email service - chỉ log ra console
 * Trong production thực tế, thay bằng Nodemailer hoặc SendGrid
 */

// ===== Template email đặt hàng thành công =====
const orderConfirmationTemplate = (order) => {
  return {
    to: order.customer.email,
    subject: `[Nông Sản Việt] Xác nhận đơn hàng #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #71B979;">🌾 Cảm ơn bạn đã đặt hàng!</h2>
        
        <p>Xin chào <strong>${order.customer.name}</strong>,</p>
        
        <p>Chúng tôi đã nhận được đơn hàng <strong>#${order.orderNumber}</strong> của bạn.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Thông tin đơn hàng</h3>
          <p><strong>Tổng tiền:</strong> ${order.finalAmount.toLocaleString('vi-VN')} VNĐ</p>
          <p><strong>Phương thức thanh toán:</strong> ${getPaymentMethodName(order.paymentMethod)}</p>
          <p><strong>Địa chỉ giao hàng:</strong> ${order.customer.address}</p>
        </div>
        
        <h4>Sản phẩm:</h4>
        <ul>
          ${order.items.map(item => `
            <li>${item.name} - SL: ${item.quantity} - ${item.subtotal.toLocaleString('vi-VN')} VNĐ</li>
          `).join('')}
        </ul>
        
        <p>Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận và giao hàng.</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Trân trọng,<br>
          <strong>Nông Sản Việt</strong>
        </p>
      </div>
    `,
    text: `
      Cảm ơn bạn đã đặt hàng!
      
      Đơn hàng #${order.orderNumber}
      Tổng tiền: ${order.finalAmount.toLocaleString('vi-VN')} VNĐ
      Địa chỉ: ${order.customer.address}
      
      Chúng tôi sẽ liên hệ với bạn sớm.
    `,
  };
};

// ===== Template email thay đổi trạng thái =====
const orderStatusUpdateTemplate = (order, oldStatus, newStatus) => {
  const statusMessages = {
    confirmed: {
      title: 'Đơn hàng đã được xác nhận',
      message: 'Chúng tôi đang chuẩn bị hàng cho bạn.',
    },
    shipping: {
      title: 'Đơn hàng đang được giao',
      message: 'Đơn hàng của bạn đã được chuyển cho đơn vị vận chuyển.',
    },
    delivered: {
      title: 'Đã giao hàng thành công',
      message: 'Cảm ơn bạn đã tin tưởng Nông Sản Việt!',
    },
    cancelled: {
      title: 'Đơn hàng đã bị hủy',
      message: 'Đơn hàng của bạn đã bị hủy theo yêu cầu.',
    },
  };

  const statusInfo = statusMessages[newStatus] || {
    title: 'Cập nhật trạng thái đơn hàng',
    message: `Trạng thái mới: ${newStatus}`,
  };

  return {
    to: order.customer.email,
    subject: `[Nông Sản Việt] ${statusInfo.title} - #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #71B979;">📦 ${statusInfo.title}</h2>
        
        <p>Xin chào <strong>${order.customer.name}</strong>,</p>
        
        <p>Đơn hàng <strong>#${order.orderNumber}</strong> của bạn đã có cập nhật:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 18px; margin: 0;"><strong>${statusInfo.message}</strong></p>
        </div>
        
        <p>Bạn có thể theo dõi đơn hàng tại: <a href="http://localhost:3000/orders/${order._id}">Xem chi tiết</a></p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Trân trọng,<br>
          <strong>Nông Sản Việt</strong>
        </p>
      </div>
    `,
  };
};

// ===== Hàm mock gửi email =====
const sendEmail = async (emailData) => {
  // MOCK: Chỉ log ra console, không gửi email thật
  console.log("\n ========== MOCK EMAIL ==========");
  console.log(`To: ${emailData.to}`);
  console.log(`Subject: ${emailData.subject}`);
  console.log(`Text: ${emailData.text || '(HTML only)'}`);
  console.log("===================================\n");

  // Giả lập delay gửi email
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        messageId: `mock-${Date.now()}`,
        timestamp: new Date(),
      });
    }, 100);
  });
};

// ===== Các hàm tiện ích =====
const getPaymentMethodName = (method) => {
  const names = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank_transfer: 'Chuyển khoản ngân hàng',
    momo: 'Ví MoMo',
    zalopay: 'ZaloPay',
  };
  return names[method] || method;
};

// ===== Export các hàm =====
module.exports = {
  /**
   * Gửi email xác nhận đơn hàng
   */
  sendOrderConfirmation: async (order) => {
    if (!order.customer.email) {
      console.log("Đơn hàng không có email, bỏ qua gửi email");
      return { success: false, message: "No email provided" };
    }

    const emailData = orderConfirmationTemplate(order);
    return await sendEmail(emailData);
  },

  /**
   * Gửi email thông báo thay đổi trạng thái
   */
  sendOrderStatusUpdate: async (order, oldStatus, newStatus) => {
    if (!order.customer.email) {
      console.log("⚠️ Đơn hàng không có email, bỏ qua gửi email");
      return { success: false, message: "No email provided" };
    }

    const emailData = orderStatusUpdateTemplate(order, oldStatus, newStatus);
    return await sendEmail(emailData);
  },

  /**
   * Gửi email tùy chỉnh (generic)
   */
  sendCustomEmail: async (to, subject, htmlContent, textContent) => {
    return await sendEmail({
      to,
      subject,
      html: htmlContent,
      text: textContent,
    });
  },
};

// ============================================================
// HƯỚNG DẪN SỬ DỤNG TRONG PRODUCTION
// ============================================================
/*

### Cài đặt Nodemailer (Production)
```bash
npm install nodemailer
```

### Cấu hình thực tế (thay code mock ở trên)
```javascript
const nodemailer = require('nodemailer');

// Tạo transporter (ví dụ dùng Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Hàm gửi email thực
const sendEmail = async (emailData) => {
  const info = await transporter.sendMail({
    from: '"Nông Sản Việt" <nongsanviet@gmail.com>',
    to: emailData.to,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html,
  });

  return {
    success: true,
    messageId: info.messageId,
  };
};
```

*/