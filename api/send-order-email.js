import nodemailer from "nodemailer";

export default async function handler(req, res) {

  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { userEmail, userName, orderId, status, orderItems } = req.body;

    if (!userEmail || !orderId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ MAIL CONFIG (Zoho / Gmail both supported)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ STATUS SUBJECT
    const subjectMap = {
      processing: "🛠️ Order Processing",
      shipped: "🚚 Order Shipped",
      delivered: "✅ Order Delivered",
      returned: "↩️ Order Returned",
      cancelled: "❌ Order Cancelled",
    };

    const subject = subjectMap[status] || "📦 Order Update";

    // ✅ STATUS COLOR
    const statusColor = {
      processing: "#f59e0b",
      shipped: "#3b82f6",
      delivered: "#10b981",
      cancelled: "#ef4444",
      returned: "#6b7280",
    }[status] || "#10b981";

    // ✅ PRODUCTS HTML
    const items = Array.isArray(orderItems) ? orderItems : [];

    const productHTML = items.map(item => `
      <tr>
        <td style="padding:10px;">
          <img src="${item.image || 'https://via.placeholder.com/60'}"
            style="width:60px;height:60px;border-radius:6px;" />
        </td>
        <td style="padding:10px;">
          <b>${item.name}</b><br/>
          Qty: ${item.quantity || 1}
        </td>
        <td style="padding:10px;text-align:right;">
          ₹${Number(item.price || 0).toLocaleString("en-IN")}
        </td>
      </tr>
    `).join("");

    // ✅ EMAIL TEMPLATE
    const html = `
    <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
      <div style="max-width:650px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">

        <div style="background:#111827;color:white;padding:20px;text-align:center;">
          <h2>🛍️ Order Update</h2>
        </div>

        <div style="padding:25px;">
          <p>Hi <b>${userName || "Customer"}</b>,</p>

          <p>Your order <b>#${orderId}</b> is now 
            <span style="color:${statusColor};font-weight:bold;">
              ${status}
            </span>
          </p>

          <h3>🧾 Order Items</h3>

          <table width="100%">
            ${productHTML}
          </table>

          <div style="text-align:center;margin:20px 0;">
            <a href="#" style="background:#10b981;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
              Track Order
            </a>
          </div>

          <p>Thank you for shopping ❤️</p>
        </div>

        <div style="background:#f3f4f6;padding:10px;text-align:center;font-size:12px;">
          © ${new Date().getFullYear()} Your Store
        </div>

      </div>
    </div>
    `;

    // ✅ SEND EMAIL
    await transporter.sendMail({
      from: `"Your Store" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject,
      html,
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Email Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
