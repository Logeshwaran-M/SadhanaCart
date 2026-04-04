const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// 🔐 EmailJS Config
const SERVICE_ID = "service_zz6fgjp";
const TEMPLATE_ID = "template_j0ed6us";
const PUBLIC_KEY = "BC9CJEdLpemI19ubS";


// =====================================================
// 🔥 ADMIN ROLE SET FUNCTION (ADD THIS)
// =====================================================
exports.makeAdmin = functions.https.onRequest(async (req, res) => {
  try {

    const email = "admin@gmail.com"; // 👈 change if needed

    const user = await admin.auth().getUserByEmail(email);

    await admin.auth().setCustomUserClaims(user.uid, {
      role: "admin"
    });

    res.send(`✅ ${email} is now an Admin 🔥`);

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


// =====================================================
// 🛒 ORDER CREATED MAIL
// =====================================================
exports.sendOrderCreatedEmail = onDocumentCreated(
  {
    document: "users/{userId}/orders/{orderId}",
  },
  async (event) => {

    const order = event.data?.data();
    const { userId, orderId } = event.params;

    if (!order) return;

    try {

      const userSnap = await admin.firestore()
        .collection("users")
        .doc(userId)
        .get();

      if (!userSnap.exists) return;

      const user = userSnap.data();

      await axios.post("https://api.emailjs.com/api/v1.0/email/send", {
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        public_key: PUBLIC_KEY,
        template_params: {
          to_email: user.email,
          to_name: user.name || "Customer",
          order_id: orderId,
          order_status: "Order Placed",
          order_status_message: "🎉 Your order has been placed successfully!"
        },
      });

      console.log("✅ Order placed mail sent");

    } catch (error) {
      console.error("❌ Order mail error:", error.response?.data || error);
    }
  }
);


// =====================================================
// ❌ CANCEL & 🔁 RETURN MAIL
// =====================================================
exports.sendOrderStatusEmail = onDocumentUpdated(
  {
    document: "users/{userId}/orders/{orderId}",
  },
  async (event) => {

    const before = event.data.before.data();
    const after = event.data.after.data();
    const { userId, orderId } = event.params;

    if (before.status === after.status) return;

    try {

      const userSnap = await admin.firestore()
        .collection("users")
        .doc(userId)
        .get();

      if (!userSnap.exists) return;

      const user = userSnap.data();

      let message = "";

      if (after.status === "cancelled") {
        message = "❌ Your order has been cancelled successfully.";
      }

      if (after.status === "returned") {
        message = "🔁 Your return request has been received successfully.";
      }

      if (!message) return;

      await axios.post("https://api.emailjs.com/api/v1.0/email/send", {
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        public_key: PUBLIC_KEY,
        template_params: {
          to_email: user.email,
          to_name: user.name || "Customer",
          order_id: orderId,
          order_status: after.status,
          order_status_message: message
        },
      });

      console.log("✅ Status mail sent:", after.status);

    } catch (error) {
      console.error("❌ Status mail error:", error.response?.data || error);
    }
  }
);