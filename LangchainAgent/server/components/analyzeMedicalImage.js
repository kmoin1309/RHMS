const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
const dotenv = require("dotenv");

dotenv.config();

/**
 * Analyzes a medical image using Google's Generative AI (Gemini Pro Vision)
 * @param {Buffer} imageBuffer - The raw image buffer
 * @param {string} userPrompt - User's description or question about the image
 * @param {string} languageCode - The language code for the response
 * @returns {Promise<string>} - The analysis result
 */
async function analyzeMedicalImage(imageBuffer, userPrompt, languageCode = "en-IN") {
  try {
    // Initialize Gemini API client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY1);

    // Get Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Process the image: Resize while maintaining aspect ratio
    const processedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg")
      .toBuffer();

    // Convert image to base64 for API
    const base64Image = processedImageBuffer.toString("base64");

    // Prepare the image part for Gemini API
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg", // Ensure correct MIME type
      },
    };

    // Extract language name for prompt
    const languageMapping = {
      "en-IN": "English",
      "hi-IN": "Hindi",
      "bn-IN": "Bengali",
      "ta-IN": "Tamil",
      "te-IN": "Telugu",
      "kn-IN": "Kannada",
      "ml-IN": "Malayalam",
      "mr-IN": "Marathi",
      "gu-IN": "Gujarati"
    };
    
    const languageName = languageMapping[languageCode] || "English";
    console.log(`Analyzing medical image with response in ${languageName}`);

    // Multilingual prompt with instructions to respond in the specified language
    const prompt = `
      You are an AI Image Analyzer specialized in both medical imaging and real-time visual assessment.
      The user input: "${userPrompt || "Please analyze this image"}"
      
      If this appears to be a live camera feed/frame of a person:
      1. **Visual Assessment**: Note any visible concerns (skin conditions, visible injuries, etc.)
      2. **General Observations**: Comment on visible wellness indicators if applicable
      3. **Privacy Reminder**: Mention that live assessment has limitations and preserve user privacy
      
      If this appears to be a medical image (X-ray, CT scan, MRI, etc.):
      1. **Observations**: Describe key visible elements in the medical image
      2. **Potential Medical Insights**: Mention possible medical implications (without diagnosing)
      3. **Patient Advice**: Explain findings in simple terms
      4. **Next Steps**: If relevant, suggest whether a professional medical review is needed
      
      IMPORTANT: Respond in ${languageName} language (${languageCode}).
      Ensure your response is culturally appropriate for the language.
      Keep responses precise, informative, and non-alarming.
      Remember your response will be passed to another AI for further analysis, so please be as detailed as possible while respecting privacy.
    `;

    // Generate response from Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = await response.text();
    console.log("medical text:", text);
    console.log(`Medical image analysis in ${languageName} generated successfully`);
    return text;
  } catch (error) {
    console.error("Error analyzing medical image:", error.message);
    
    // Create error messages in different languages
    const errorMessages = {
      "en-IN": "⚠️ Unable to analyze the medical image due to a technical issue. Ensure the image is clear and try again.",
      "hi-IN": "⚠️ तकनीकी समस्या के कारण चिकित्सा छवि का विश्लेषण करने में असमर्थ। सुनिश्चित करें कि छवि स्पष्ट है और फिर से प्रयास करें।",
      "bn-IN": "⚠️ প্রযুক্তিগত সমস্যার কারণে মেডিকেল ইমেজ বিশ্লেষণ করতে অক্ষম। ছবিটি পরিষ্কার কিনা তা নিশ্চিত করুন এবং আবার চেষ্টা করুন।",
      "ta-IN": "⚠️ தொழில்நுட்ப சிக்கல் காரணமாக மருத்துவ படத்தை பகுப்பாய்வு செய்ய முடியவில்லை. படம் தெளிவாக உள்ளதா என்பதை உறுதிப்படுத்தி மீண்டும் முயற்சிக்கவும்.",
      "te-IN": "⚠️ సాంకేతిక సమస్య కారణంగా వైద్య చిత్రాన్ని విశ్లేషించడం సాధ్యం కాలేదు. చిత్రం స్పష్టంగా ఉందని నిర్ధారించుకొని మళ్లీ ప్రయత్నించండి.",
      "kn-IN": "⚠️ ತಾಂತ್ರಿಕ ಸಮಸ್ಯೆಯಿಂದಾಗಿ ವೈದ್ಯಕೀಯ ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಚಿತ್ರವು ಸ್ಪಷ್ಟವಾಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಂಡು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      "ml-IN": "⚠️ സാങ്കേതിക പ്രശ്നം കാരണം മെഡിക്കൽ ചിത്രം വിശകലനം ചെയ്യാൻ കഴിയുന്നില്ല. ചിത്രം വ്യക്തമാണെന്ന് ഉറപ്പാക്കി വീണ്ടും ശ്രമിക്കുക.",
      "mr-IN": "⚠️ तांत्रिक समस्येमुळे वैद्यकीय प्रतिमेचे विश्लेषण करण्यास अक्षम. प्रतिमा स्पष्ट आहे याची खात्री करा आणि पुन्हा प्रयत्न करा.",
      "gu-IN": "⚠️ ટેકનિકલ સમસ્યાને કારણે મેડિકલ ઈમેજનું વિશ્લેષણ કરવામાં અસમર્થ. ખાતરી કરો કે ઈમેજ સ્પષ્ટ છે અને ફરી પ્રયાસ કરો."
    };
    
    return errorMessages[languageCode] || errorMessages["en-IN"];
  }
}

module.exports = analyzeMedicalImage;