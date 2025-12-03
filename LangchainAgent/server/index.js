const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const express = require("express");
const axios = require("axios");
const http = require("http");
const cors = require("cors");
const { generateSpeechWithGoogle } = require("./components/tts");
// const identifyTask = require("./components/IdentifyTask"); // <-- Remove or comment out this line
// const extractTextFromImageBuffer = require("./components/ExtractText");
const multer = require("multer");
const uuid = require("uuid"); // Add this missing import
const FormData = require("form-data"); // Add this missing import
const analyzeMedicalImage = require("./components/analyzeMedicalImage");
const sharp = require("sharp");
// const whatsappClient = require('./components/whatsapp-bot');

dotenv.config();

const app = express();
const server = http.createServer(app);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// connectMongoDB(process.env.MONGODB_CONNECT_URI)
//   .then((value) => {
//     console.log("server connected");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const apiKey = process.env.GEMINI_API_KEY1;
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const VOICE_ID = process.env.VOICE_ID;

const genAI = new GoogleGenerativeAI(apiKey);

// Store the conversation history for each user session
const userHistories = {};
// Store viva sessions
const vivaSessions = {};

app.use(express.json());

app.get("/", (req, res) => {
  console.log("Hello World");
  res.send("Hello World");
});

// Add these new routes for the doctor functionality
app.post("/start-doctor", async (req, res) => {
  const userId = req.body.userId || uuid.v4();
  const patientInfo = req.body.patientInfo || "";
  const languageCode = req.body.languageCode || "en-US";

  try {
    // Call the Flask API to start doctor session
    const doctorResponse = await axios.post(
      "http://localhost:6500/api/doctor/start",
      {
        userId: userId,
        patientInfo: patientInfo,
        languageCode: languageCode,
      }
    );

    // Initialize user history with the introduction message
    userHistories[userId] = [
      { role: "model", parts: [{ text: doctorResponse.data.message }] },
    ];

    // Generate speech for the introduction
    const audioBuffer = await generateSpeechWithGoogle(
      doctorResponse.data.message
    );

    res.set({
      "Content-Type": "application/json",
    });

    res.send({
      audio: audioBuffer.toString("base64"),
      text: doctorResponse.data.message,
      userId: userId,
      success: true,
    });
  } catch (error) {
    // Enhanced error logging
    console.error("Error starting doctor session:", error);
    if (error.response) {
      console.error("Flask API error response:", error.response.data);
      res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data?.error || "Error starting doctor session",
        message: error.response.data?.message || "",
        flaskError: true,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Error starting doctor session",
        message: error.message,
      });
    }
  }
});

// Add this utility function at the top of your file
function cleanTextResponse(text) {
  if (!text) return "";

  // Replace markdown formatting and other symbols
  return text
    .replace(/\*\*/g, "") // Remove bold markers **
    .replace(/\*/g, "") // Remove italic markers *
    .replace(/#+\s?/g, "") // Remove heading markers #
    .replace(/`{1,3}/g, "") // Remove code markers ` or ```
    .replace(/\[|\]/g, "") // Remove square brackets [ ]
    .replace(/\n{3,}/g, "\n\n") // Replace excessive newlines with double newlines
    .trim();
}

// Update the doctor-analyze endpoint to handle languages
app.post("/doctor-analyze", async (req, res) => {
  const {
    userId,
    text,
    frameData,
    isUploadedImage,
    languageCode = "en-US",
  } = req.body;
  console.log("Doctor analyze request received for user:", userId);
  console.log("Text content length:", text?.length || 0);
  console.log("Frame data present:", !!frameData);
  console.log("Is uploaded image:", !!isUploadedImage);
  console.log("Language code:", languageCode);

  try {
    // Validate inputs
    if (!userId || !text) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Update conversation history
    const userHistory = userHistories[userId] || [];

    // Use different message format for uploaded images vs regular conversation
    const userMessageText = isUploadedImage
      ? `[Uploaded a medical image] ${text}`
      : text;

    userHistories[userId] = [
      ...userHistory,
      { role: "user", parts: [{ text: userMessageText }] },
    ];

    // Process frame data if present using our local analyzeMedicalImage function
    let imageAnalysis = null;
    if (frameData) {
      try {
        const imageSource = isUploadedImage ? "uploaded image" : "webcam frame";
        console.log(`Pre-analyzing ${imageSource} data in Node.js...`);

        // Convert data URL to buffer
        let imageBuffer;
        if (frameData.startsWith("data:image")) {
          // Extract the base64 part from data URL
          const base64Data = frameData.split(",")[1];
          imageBuffer = Buffer.from(base64Data, "base64");
        } else {
          // Already in base64 format
          imageBuffer = Buffer.from(frameData, "base64");
        }

        // Different prompt depending on image source
        const analysisPrompt = isUploadedImage
          ? `Analyze this medical image: ${text}. Provide detailed observations about any visible medical conditions, abnormalities, or notable features.`
          : "Analyze the patient's visual appearance for any notable medical observations";

        // Analyze the image with Gemini - passing language code
        imageAnalysis = await analyzeMedicalImage(
          imageBuffer,
          analysisPrompt,
          languageCode
        );

        console.log(
          `${imageSource} analysis complete, length:`,
          imageAnalysis?.length || 0
        );
      } catch (imageError) {
        console.error("Error analyzing image:", imageError);
        imageAnalysis = isUploadedImage
          ? "Error analyzing medical image"
          : "Error analyzing patient's visual appearance";
      }
    }

    // Call the Flask API's analyze-patient endpoint with the pre-analyzed image data
    const flaskResponse = await axios.post(
      "http://localhost:6500/analyze-patient",
      {
        userId: userId,
        text: text,
        frameData: null, // Don't send the raw frame data
        imageAnalysis: imageAnalysis, // Send the pre-analyzed text instead
        isUploadedImage: isUploadedImage || false, // Tell Flask if this is from an uploaded image
        languageCode: languageCode, // Send language code to Flask
      },
      {
        maxContentLength: 5 * 1024 * 1024,
        timeout: 30000,
      }
    );

    console.log("Flask response received:", !!flaskResponse.data);

    // Clean the AI response text
    const rawResponse = flaskResponse.data.text || "";
    const aiResponse = cleanTextResponse(rawResponse);
    console.log("Cleaned response:", aiResponse);

    // Update conversation history with cleaned response
    userHistories[userId].push({
      role: "model",
      parts: [{ text: aiResponse }],
    });

    // Generate speech with the cleaned text - pass language code
    const audioBuffer = await generateSpeechWithGoogle(
      aiResponse,
      languageCode
    );

    res.set({
      "Content-Type": "application/json",
    });

    res.send({
      audio: audioBuffer.toString("base64"),
      text: aiResponse,
      success: true,
    });
  } catch (error) {
    console.error("Error in doctor analysis:", error);
    console.error("Error details:", error.response?.data || "No response data");
    console.error("Error status:", error.response?.status || "No status code");

    res.status(500).json({
      success: false,
      error: "Error processing medical analysis",
      text: "I'm sorry, I encountered an error analyzing your input. Please try again.",
    });
  }
});

// Keep this as a fallback for compatibility

app.post("/doctor-analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file uploaded",
      });
    }
    console.log("Redirecting image analysis to main analyze endpoint");

    const userId = req.body.userId || "anonymous";
    const text = req.body.text || "Please analyze this medical image";
    const languageCode = req.body.languageCode || "en-US";
    // Convert the uploaded file to base64
    const base64Image = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    // Create request body similar to the main endpoint
    const requestBody = {
      userId: userId,
      text: text,
      frameData: base64Image,
      isUploadedImage: true,
      languageCode: languageCode,
    };

    // Call the main doctor-analyze endpoint internally
    const response = await axios.post(
      "http://localhost:5001/doctor-analyze",
      requestBody,
      {
        timeout: 60000,
        maxContentLength: 10 * 1024 * 1024,
      }
    );

    // Pass through the response
    res.send(response.data);
  } catch (error) {
    console.error("Error in doctor-analyze-image fallback:", error);

    // Provide a fallback response
    const fallbackMessage =
      "I'm sorry, I couldn't analyze the uploaded image. Please try again or describe your condition verbally.";

    try {
      const audioBuffer = await generateSpeechWithGoogle(fallbackMessage);

      res.send({
        audio: audioBuffer.toString("base64"),
        text: fallbackMessage,
        success: false,
        error: "Failed to analyze medical image",
      });
    } catch (speechError) {
      res.status(500).json({
        success: false,
        error: "Failed to analyze medical image",
        text: fallbackMessage,
      });
    }
  }
});

app.get("/doctor-history/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Try to get history from Flask API first
    try {
      const flaskResponse = await axios.get(
        `http://localhost:6500/api/doctor/history?userId=${userId}`
      );

      if (flaskResponse.data && flaskResponse.data.success) {
        return res.json({
          success: true,
          conversation: flaskResponse.data.history.map((msg) => ({
            type: msg.role === "user" ? "user" : "ai",
            text: msg.content,
            timestamp: msg.timestamp || new Date(),
          })),
        });
      }
    } catch (flaskError) {
      console.log("Could not fetch history from Flask, using local history");
    }

    // Fallback to local history
    const userHistory = userHistories[userId] || [];
    const formattedHistory = userHistory.map((message) => ({
      type: message.role === "user" ? "user" : "ai",
      text: message.parts[0].text,
      timestamp: new Date(),
    }));

    res.json({
      success: true,
      conversation: formattedHistory,
    });
  } catch (error) {
    console.error("Error getting doctor history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve conversation history",
    });
  }
});

app.post("/end-doctor", async (req, res) => {
  const { userId } = req.body;

  try {
    // Call the Flask API to end the doctor session
    await axios.post("http://localhost:6500/api/doctor/end", {
      userId: userId,
    });

    // Clean up local storage
    delete userHistories[userId];

    res.json({
      success: true,
      message: "Doctor session ended successfully",
    });
  } catch (error) {
    console.error("Error ending doctor session:", error);
    res.status(500).json({
      success: false,
      error: "Error ending doctor session",
    });
  }
});

// Update the generate-medical-report endpoint to include better error handling

// Update the generate-medical-report endpoint to be more robust
app.post("/generate-medical-report", async (req, res) => {
  const { userId, conversation = [] } = req.body;

  try {
    console.log("Generating medical report for user:", userId);

    // Format the conversation for the AI model (keep it simple)
    const formattedConversation = conversation.map((msg) => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    // Create a structured prompt for Gemini to generate a medical report
    const reportPrompt = `
      You are a medical AI assistant generating a formal medical consultation report.
      Based on the following conversation between a patient and an AI medical assistant, 
      create a comprehensive and well-structured medical report with these sections:
      
      1. PATIENT CONCERNS: Summarize the patient's main complaints, symptoms, and concerns.
      2. ASSESSMENT: Provide observations, findings, and potential conditions discussed.
      3. RECOMMENDATIONS: List specific advice, recommendations, and follow-up steps provided.
      
      FORMAT THE REPORT WITH CLEAR SECTION HEADINGS using the exact format:
      "PATIENT CONCERNS: [content]
      
      ASSESSMENT: [content]
      
      RECOMMENDATIONS: [content]"
      
      Be professional, concise, and focus on medically relevant information.
      
      CONSULTATION TRANSCRIPT:
      ${JSON.stringify(formattedConversation)}
    `;

    // Create a separate prompt for health recommendations
    const tipsPrompt = `
      You are a medical AI assistant providing personalized health recommendations.
      Based on this medical consultation, create 5-7 specific health recommendations for the patient.
      
      Format each recommendation on a new line as "Title: Description"
      For example:
      Regular Exercise: Stay active with moderate exercise for at least 30 minutes daily.
      
      Each recommendation should:
      - Be concise and actionable
      - Relate to the patient's specific situation when possible
      - Focus on practical steps the patient can take
      - Be formatted exactly as "Title: Description" with one recommendation per line
      
      CONSULTATION TRANSCRIPT:
      ${JSON.stringify(formattedConversation)}
    `;

    // Use Gemini to generate both reports in parallel
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const [reportResult, tipsResult] = await Promise.allSettled([
        model.generateContent(reportPrompt),
        model.generateContent(tipsPrompt),
      ]);

      // Extract report text, handling potential errors
      let report = "";
      if (reportResult.status === "fulfilled" && reportResult.value?.response) {
        report = reportResult.value.response.text();
      } else {
        console.warn("Report generation failed:", reportResult.reason);
        report =
          "PATIENT CONCERNS: Your medical concerns were discussed during the consultation.\n\nASSESSMENT: A general assessment was provided by the AI medical assistant.\n\nRECOMMENDATIONS: Please consult with a healthcare professional for specific medical advice.";
      }

      // Extract health tips, handling potential errors
      let healthTips = "";
      if (tipsResult.status === "fulfilled" && tipsResult.value?.response) {
        healthTips = tipsResult.value.response.text();
      } else {
        console.warn("Health tips generation failed:", tipsResult.reason);
        healthTips =
          "Regular Exercise: Stay active with moderate exercise\nBalanced Diet: Maintain nutritious eating habits\nAdequate Sleep: Aim for 7-8 hours of quality sleep\nStress Management: Practice stress reduction techniques\nPreventive Care: Schedule regular check-ups";
      }

      res.json({
        success: true,
        report: report,
        healthTips: healthTips,
      });
    } catch (genError) {
      console.error("Error generating content with Gemini:", genError);

      // Return a basic report as fallback
      res.json({
        success: true,
        report:
          "PATIENT CONCERNS: The patient consulted the AI medical assistant.\n\nASSESSMENT: The consultation covered various medical topics.\n\nRECOMMENDATIONS: Follow up with a healthcare professional for a comprehensive evaluation.",
        healthTips:
          "Regular Exercise: Stay active with moderate exercise\nBalanced Diet: Maintain nutritious eating habits\nAdequate Sleep: Aim for 7-8 hours of quality sleep\nStress Management: Practice relaxation techniques\nPreventive Care: Schedule regular check-ups",
      });
    }
  } catch (error) {
    console.error("Error in generate-medical-report endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate medical report",
      report:
        "PATIENT CONCERNS: Error generating report.\n\nASSESSMENT: Please refer to your consultation transcript.\n\nRECOMMENDATIONS: Consult with a healthcare professional.",
      healthTips:
        "Regular Exercise: Stay active with moderate exercise\nBalanced Diet: Maintain nutritious eating habits\nAdequate Sleep: Aim for 7-8 hours of quality sleep\nStress Management: Practice relaxation techniques\nPreventive Care: Schedule regular check-ups",
    });
  }
});

// Update the /api/send-message endpoint
app.post("/api/send-message", async (req, res) => {
  // Temporary response since WhatsApp integration is missing
  res.status(501).json({
    success: false,
    error: "WhatsApp integration not implemented on this server.",
  });
});

// Add this to your existing end-doctor endpoint
app.post("/end-doctor", async (req, res) => {
  const { userId, patientInfo } = req.body;

  try {
    // Call the Flask API to end the doctor session
    await axios.post("http://localhost:6500/api/doctor/end", {
      userId: userId,
    });

    // Generate a report before clearing history
    let report = null;
    let healthTips = null;

    try {
      // Only generate if we have conversation history
      if (userHistories[userId] && userHistories[userId].length > 1) {
        const reportResponse = await axios.post(
          "http://localhost:5001/generate-medical-report",
          {
            userId: userId,
            sessionData: { patientInfo },
          }
        );

        if (reportResponse.data.success) {
          report = reportResponse.data.report;
          healthTips = reportResponse.data.healthTips;
        }
      }
    } catch (reportError) {
      console.error("Error generating report:", reportError);
      // Continue with session ending even if report generation fails
    }

    // Clean up local storage
    delete userHistories[userId];

    res.json({
      success: true,
      message: "Doctor session ended successfully",
      report: report,
      healthTips: healthTips,
    });
  } catch (error) {
    console.error("Error ending doctor session:", error);
    res.status(500).json({
      success: false,
      error: "Error ending doctor session",
    });
  }
});

// Add this at the very end of your file
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});