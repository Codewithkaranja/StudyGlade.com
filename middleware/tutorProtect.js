// middleware/tutorProtect.js
import dotenv from "dotenv";
dotenv.config();

import { protect } from "./authMiddleware.js"; // your existing protect middleware (assumed)

const tutorProtect = async (req, res, next) => {
  try {
    // 1) Bypass header check
    const bypassSecret = process.env.TUTOR_BYPASS;
    const headerSecret = req.header("x-tutor-bypass");

    if (bypassSecret && headerSecret && headerSecret === bypassSecret) {
      // Provide a minimal req.user object so controllers that expect req.user can work
      req.user = {
        _id: process.env.TUTOR_BYPASS_USER_ID || "tutor-bypass-user",
        name: process.env.TUTOR_BYPASS_NAME || "TutorAdmin",
        role: "tutor",
      };
      return next();
    }

    // 2) Otherwise fall back to normal protect (JWT etc.)
    if (typeof protect === "function") {
      return protect(req, res, next);
    }

    // 3) If no protect available, deny
    return res.status(401).json({ message: "Not authorized" });
  } catch (err) {
    console.error("tutorProtect error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default tutorProtect;
