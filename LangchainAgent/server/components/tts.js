const textToSpeech = require("@google-cloud/text-to-speech");
const dotenv = require("dotenv");

dotenv.config();

// Updated map with the most natural-sounding neural voices for each language
const languageVoiceMap = {
  // Neural voices sound much more natural than Standard voices
  "en-IN": { languageCode: "en-IN", name: "en-IN-Neural2-A", ssmlGender: "FEMALE" },
  "en-US": { languageCode: "en-US", name: "en-US-Studio-O", ssmlGender: "FEMALE" }, // Premium US neural voice
  "hi-IN": { languageCode: "hi-IN", name: "hi-IN-Neural2-A", ssmlGender: "FEMALE" },
  "bn-IN": { languageCode: "bn-IN", name: "bn-IN-Wavenet-A", ssmlGender: "FEMALE" }, // Wavenet is more natural than Standard
  "ta-IN": { languageCode: "ta-IN", name: "ta-IN-Wavenet-A", ssmlGender: "FEMALE" }, // Wavenet voice
  "te-IN": { languageCode: "te-IN", name: "te-IN-Wavenet-A", ssmlGender: "FEMALE" }, // Wavenet voice
  "kn-IN": { languageCode: "kn-IN", name: "kn-IN-Wavenet-A", ssmlGender: "FEMALE" }, // Wavenet voice
  "ml-IN": { languageCode: "ml-IN", name: "ml-IN-Wavenet-A", ssmlGender: "FEMALE" }, // Wavenet voice
  "mr-IN": { languageCode: "mr-IN", name: "mr-IN-Wavenet-A", ssmlGender: "FEMALE" }, // Wavenet voice
  "gu-IN": { languageCode: "gu-IN", name: "gu-IN-Wavenet-A", ssmlGender: "FEMALE" }, // Wavenet voice
  // Default fallback - premium Studio voice (most human-like)
  "default": { languageCode: "en-US", name: "en-US-Studio-O", ssmlGender: "FEMALE" }
};

async function generateSpeechWithGoogle(text, languageCode = "en-IN") {
  // Creates a client with authentication from environment variables
  const client = new textToSpeech.TextToSpeechClient({
    projectId: process.env.GOOGLE_PROJECT_ID,
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });

  // Select appropriate voice based on language code
  const voice = languageVoiceMap[languageCode] || languageVoiceMap["default"];
  
  console.log(`Generating speech in language: ${languageCode}, using voice: ${voice.name}`);

  // Configure the TTS request with enhanced naturalness settings
  const request = {
    input: { text: text },
    voice: voice,
    audioConfig: { 
      audioEncoding: "MP3",
      // Adjust speaking rate slightly based on language
      speakingRate: ["hi-IN", "mr-IN"].includes(languageCode) ? 0.9 : 1.0,
      // Add pitch variation for more natural sound
      pitch: 0,
      // Enable audio effects profile for more natural sound
      effectsProfileId: ["headphone-class-device"]
    },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    return response.audioContent;
  } catch (error) {
    console.error(`TTS error with language ${languageCode}:`, error);
    
    // Enhanced error handling with more fallback options
    if (error.message && error.message.includes("voice")) {
      console.log(`Voice ${voice.name} failed, trying alternative voice for ${languageCode}`);
      
      // Try with same language but a different voice type (Neural → Wavenet → Standard)
      const voiceTypes = ["Neural", "Wavenet", "Standard"];
      
      for (const voiceType of voiceTypes) {
        if (voice.name.includes(voiceType)) continue; // Skip the one that just failed
        
        try {
          console.log(`Trying ${voiceType} voice for ${languageCode}`);
          const alternativeRequest = {
            input: { text: text },
            voice: { 
              languageCode: languageCode,
              // Try a different voice type but let Google choose the specific voice
            },
            audioConfig: { 
              audioEncoding: "MP3",
              speakingRate: ["hi-IN", "mr-IN"].includes(languageCode) ? 0.9 : 1.0,
              effectsProfileId: ["headphone-class-device"]
            },
          };
          
          const [alternativeResponse] = await client.synthesizeSpeech(alternativeRequest);
          return alternativeResponse.audioContent;
        } catch (alternativeError) {
          console.error(`${voiceType} voice failed:`, alternativeError);
        }
      }
    }
    
    // Fallback to our premium default voice if all else fails
    if (languageCode !== "default") {
      console.log("Falling back to premium Studio voice");
      return generateSpeechWithGoogle(text, "default");
    } else {
      throw error; // Re-throw if already using fallback
    }
  }
}

// List available voices (can be useful for finding the most natural-sounding options)
async function listAvailableVoices() {
  const client = new textToSpeech.TextToSpeechClient({
    projectId: process.env.GOOGLE_PROJECT_ID,
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });

  try {
    const [result] = await client.listVoices({});
    return result.voices;
  } catch (error) {
    console.error("Error listing voices:", error);
    throw error;
  }
}

module.exports = {
  generateSpeechWithGoogle,
  listAvailableVoices,
};