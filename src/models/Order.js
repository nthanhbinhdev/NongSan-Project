const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => "ORD" + Date.now() + Math.floor(Math.random() * 1000),
  },

  customer: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    email: String,
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },

  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product",
        required: true 
      },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, min: 1 },
      subtotal: { type: Number, required: true },
    },
  ],

  totalAmount: { type: Number, required: true },
  shippingFee: { type: Number, default: 20000 },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },

  status: {
    type: String,
    enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
    default: "pending",
  },

  paymentMethod: {
    type: String,
    enum: ["cod", "bank_transfer", "momo", "zalopay"],
    default: "cod",
  },
  
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },

  shippingInfo: {
    partner: String,
    trackingNumber: String,
    estimatedDelivery: String,
    currentLocation: String,
  },

  note: String,

  createdAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

orderSchema.methods.getTimeline = function() {
  const timeline = [];

  timeline.push({
    event: "created",
    title: "Đơn hàng được đặt",
    description: `Đơn hàng #${this.orderNumber} đã được tạo`,
    timestamp: this.createdAt,
    completed: true,
  });

  if (this.confirmedAt) {
    timeline.push({
      event: "confirmed",
      title: "Đơn hàng được xác nhận",
      description: "Người bán đã xác nhận và đang chuẩn bị hàng",
      timestamp: this.confirmedAt,
      completed: true,
    });
  }

  if (this.shippedAt) {
    timeline.push({
      event: "shipped",
      title: "Đơn hàng đang được giao",
      description: "Đơn hàng đã được chuyển cho đơn vị vận chuyển",
      timestamp: this.shippedAt,
      completed: true,
    });
  }

  if (this.deliveredAt) {
    timeline.push({
      event: "delivered",
      title: "Đã giao hàng thành công",
      description: "Đơn hàng đã được giao đến bạn",
      timestamp: this.deliveredAt,
      completed: true,
    });
  }

  if (this.cancelledAt) {
    timeline.push({
      event: "cancelled",
      title: "Đơn hàng đã bị hủy",
      description: this.note || "Đơn hàng đã bị hủy",
      timestamp: this.cancelledAt,
      completed: true,
    });
  }

  return timeline;
};

orderSchema.methods.canBeCancelled = function() {
  return ["pending", "confirmed"].includes(this.status);
};

orderSchema.methods.getStatusLabel = function() {
  const labels = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };
  return labels[this.status] || this.status;
};

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ "customer.userId": 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "customer.phone": 1 });

module.exports = mongoose.model("Order", orderSchema);