// api/src/services/OpenAIService.js

const OpenAI = require("openai");

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || "500");
    this.temperature = 0.7;

    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  /**
   * Generate a response from OpenAI
   */
  async generateResponse(messages, options = {}) {
    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        presence_penalty: 0.6, // Encourage diverse responses
        frequency_penalty: 0.5, // Reduce repetition
      });

      const choice = completion.choices[0];
      const usage = completion.usage;

      return {
        content: choice.message.content.trim(),
        finishReason: choice.finish_reason,
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
      };
    } catch (error) {
      console.error("OpenAI API Error:", error.message);

      if (error.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }

      if (error.status === 401) {
        throw new Error("OpenAI API authentication failed.");
      }

      if (error.status === 503) {
        throw new Error("OpenAI service is temporarily unavailable.");
      }

      throw new Error("Failed to generate response. Please try again.");
    }
  }

  /**
   * Detect language from text
   */
  async detectLanguage(text) {
    try {
      const messages = [
        {
          role: "system",
          content:
            "You are a language detector. Respond with ONLY the ISO 639-1 language code (en, fr, nl, de, es, it). No other text.",
        },
        {
          role: "user",
          content: `Detect the language of this text: "${text}"`,
        },
      ];

      const response = await this.generateResponse(messages, {
        maxTokens: 10,
        temperature: 0,
      });

      const detectedLang = response.content.toLowerCase().trim();
      const supportedLanguages = ["en", "fr", "nl", "de", "es", "it"];

      return supportedLanguages.includes(detectedLang) ? detectedLang : "en";
    } catch (error) {
      console.error("Language detection error:", error.message);
      return "en"; // Default to English
    }
  }

  /**
   * Assess confidence in the response
   * This is a heuristic-based approach
   */
  assessConfidence(responseContent, finishReason) {
    let confidence = 0.5; // Base confidence

    // Check finish reason
    if (finishReason === "stop") {
      confidence += 0.2; // Complete response
    } else if (finishReason === "length") {
      confidence -= 0.1; // Truncated response
    }

    // Check for uncertainty phrases
    const uncertaintyPhrases = [
      "i'm not sure",
      "i don't know",
      "i cannot",
      "i can't help",
      "unclear",
      "unsure",
      "might be",
      "possibly",
      "perhaps",
      "maybe",
    ];

    const lowerContent = responseContent.toLowerCase();
    const hasUncertainty = uncertaintyPhrases.some((phrase) =>
      lowerContent.includes(phrase)
    );

    if (hasUncertainty) {
      confidence -= 0.3;
    }

    // Check response length (very short responses might indicate uncertainty)
    if (responseContent.length < 50) {
      confidence -= 0.1;
    }

    // Check for specific, detailed answers (usually more confident)
    const hasNumbersOrSteps = /\d+\.|\d+\)|\*\*|\-\s/.test(responseContent);
    if (hasNumbersOrSteps && responseContent.length > 100) {
      confidence += 0.2;
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Build conversation context for OpenAI
   */
  buildConversationContext(messages, maxMessages = 10) {
    // Take only the last N messages to stay within token limits
    const recentMessages = messages.slice(-maxMessages);

    return recentMessages.map((msg) => ({
      role: msg.role === "system" ? "system" : msg.role,
      content: msg.content,
    }));
  }

  /**
   * Count approximate tokens (rough estimate)
   */
  estimateTokens(text) {
    // Rough estimate: 1 token ~= 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Translate text to target language
   */
  async translate(text, targetLanguage) {
    try {
      const messages = [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the tone and meaning. Return ONLY the translation, no additional text.`,
        },
        {
          role: "user",
          content: text,
        },
      ];

      const response = await this.generateResponse(messages, {
        temperature: 0.3, // Lower temperature for more accurate translation
      });

      return response.content;
    } catch (error) {
      console.error("Translation error:", error.message);
      return text; // Return original text on error
    }
  }
}

module.exports = OpenAIService;
