// api/src/services/ChatbotService.js

const { v4: uuidv4 } = require("uuid");

class ChatbotService {
  constructor({
    openAIService,
    ChatSession,
    ChatbotKnowledge,
    HelpRequest,
    ChatMetrics,
    User,
  }) {
    this.openAIService = openAIService;
    this.ChatSession = ChatSession;
    this.ChatbotKnowledge = ChatbotKnowledge;
    this.HelpRequest = HelpRequest;
    this.ChatMetrics = ChatMetrics;
    this.User = User;
    this.confidenceThreshold =
      parseFloat(process.env.CHATBOT_CONFIDENCE_THRESHOLD) || 0.7;
    this.maxHistoryMessages =
      parseInt(process.env.CHATBOT_MAX_HISTORY) || 10;
  }

  /**
   * Main method to process a user message
   */
  async processMessage(sessionId, userMessage, options = {}) {
    const { userId, metadata } = options;

    try {
      // Get or create session
      let session = await this.getOrCreateSession(sessionId, userId, metadata);

      // Detect language if not set
      if (!session.language || session.language === "en") {
        session.language = await this.openAIService.detectLanguage(
          userMessage
        );
      }

      // Add user message to session
      session.addMessage("user", userMessage);

      // Get user context if logged in
      const userContext = userId ? await this.getUserContext(userId) : null;

      // Search knowledge base
      const relevantKnowledge = await this.searchKnowledge(
        userMessage,
        session.language,
        userContext?.planName
      );

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(
        relevantKnowledge,
        userContext,
        session.language
      );

      // Prepare messages for OpenAI
      const conversationHistory = this.openAIService.buildConversationContext(
        session.messages,
        this.maxHistoryMessages
      );

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ];

      // Call OpenAI
      const response = await this.openAIService.generateResponse(messages);

      // Assess confidence
      const confidence = this.openAIService.assessConfidence(
        response.content,
        response.finishReason
      );

      // Add assistant response to session
      session.addMessage("assistant", response.content, {
        confidence: confidence,
        tokens: response.tokens.total,
      });

      // Save session
      await session.save();

      // Increment knowledge usage count for used FAQs
      if (relevantKnowledge.length > 0) {
        await this.incrementKnowledgeUsage(relevantKnowledge.map((k) => k._id));
      }

      // Determine if should escalate
      const shouldEscalate =
        confidence < this.confidenceThreshold ||
        session.messages.length > 20 ||
        this.detectEscalationIntent(userMessage);

      return {
        sessionId: session.sessionId,
        message: response.content,
        confidence: confidence,
        shouldEscalate: shouldEscalate,
        language: session.language,
        metadata: {
          tokensUsed: response.tokens.total,
          messageCount: session.messages.length,
        },
      };
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  }

  /**
   * Get or create a chat session
   */
  async getOrCreateSession(sessionId, userId, metadata = {}) {
    let session = await this.ChatSession.findOne({ sessionId });

    if (!session) {
      session = new this.ChatSession({
        sessionId: sessionId || uuidv4(),
        userId: userId || null,
        metadata: {
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
          page: metadata.page,
          referrer: metadata.referrer,
          deviceType: this.detectDeviceType(metadata.userAgent),
        },
      });
      await session.save();
    }

    return session;
  }

  /**
   * Get user context for personalized responses
   */
  async getUserContext(userId) {
    try {
      const user = await this.User.findById(userId).populate(
        "subscription.planId"
      );

      if (!user) return null;

      const totalLimit = user.getTotalDocumentLimit();
      const totalUsed = user.getTotalDocumentsUsed();
      const remaining = user.getRemainingDocuments();

      return {
        firstName: user.firstName,
        email: user.email,
        planName: user.subscription?.planName || "No active plan",
        subscriptionStatus: user.subscription?.status,
        documentLimit: totalLimit,
        documentsUsed: totalUsed,
        documentsRemaining: remaining,
        isTrialing: user.subscription?.status === "trialing",
        currentPeriodEnd: user.subscription?.current_period_end,
      };
    } catch (error) {
      console.error("Error fetching user context:", error);
      return null;
    }
  }

  /**
   * Search knowledge base for relevant FAQs
   */
  async searchKnowledge(query, language = "en", planName = null) {
    try {
      // Text search with scoring
      const results = await this.ChatbotKnowledge.find(
        {
          $text: { $search: query },
          isActive: true,
          $or: [{ planSpecific: [] }, { planSpecific: planName }],
        },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" }, priority: -1 })
        .limit(5);

      return results;
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      return [];
    }
  }

  /**
   * Build system prompt with context
   */
  buildSystemPrompt(knowledgeBase, userContext, language) {
    const languageNames = {
      en: "English",
      fr: "French",
      nl: "Dutch",
      de: "German",
      es: "Spanish",
      it: "Italian",
    };

    const escalationMessages = {
      en: "I'm not entirely sure about that. Would you like to submit a support request for personalized assistance?",
      fr: "Je ne suis pas tout à fait sûr de cela. Souhaitez-vous soumettre une demande d'assistance personnalisée?",
      nl: "Ik weet het niet helemaal zeker. Wilt u een ondersteuningsverzoek indienen voor persoonlijke hulp?",
      de: "Ich bin mir darüber nicht ganz sicher. Möchten Sie eine Support-Anfrage für persönliche Hilfe einreichen?",
      es: "No estoy completamente seguro de eso. ¿Le gustaría enviar una solicitud de soporte para asistencia personalizada?",
      it: "Non ne sono del tutto sicuro. Vuoi inviare una richiesta di supporto per assistenza personalizzata?",
    };

    let prompt = `You are a helpful customer support assistant for an e-signing platform called B-Consulting E-Sign.

**Your Role:**
- Help users understand how to use the e-signing platform
- Explain subscription plans and features
- Guide users through document signing and sending processes
- Answer questions about account management

**Your Boundaries:**
- ONLY answer questions related to e-signing, document management, subscriptions, and platform features
- DO NOT provide legal advice about document validity or compliance
- DO NOT discuss topics unrelated to the platform
- If you cannot answer confidently, respond with: "${escalationMessages[language]}"

**Instructions:**
- Respond in ${languageNames[language] || "English"}
- Be concise but thorough (aim for 2-4 sentences unless steps are needed)
- Use bullet points for step-by-step instructions
- Be friendly and professional
- Never make up information or features that don't exist
`;

    // Add user context if available
    if (userContext) {
      prompt += `\n**Current User Information:**
- Name: ${userContext.firstName}
- Subscription Plan: ${userContext.planName}
- Plan Status: ${userContext.subscriptionStatus}
- Document Limit: ${userContext.documentLimit} per month
- Documents Used: ${userContext.documentsUsed}
- Documents Remaining: ${userContext.documentsRemaining}
${
  userContext.currentPeriodEnd
    ? `- Subscription Renews: ${new Date(
        userContext.currentPeriodEnd
      ).toLocaleDateString()}`
    : ""
}

When answering subscription-related questions, use this information to provide personalized responses.
`;
    }

    // Add knowledge base context
    if (knowledgeBase.length > 0) {
      prompt += `\n**Relevant Information from Knowledge Base:**\n`;
      knowledgeBase.forEach((kb, index) => {
        const answer =
          kb.translations?.[language] || kb.answer || "No information available";
        prompt += `${index + 1}. Q: ${kb.question}\n   A: ${answer}\n\n`;
      });
    }

    return prompt;
  }

  /**
   * Increment usage count for knowledge base entries
   */
  async incrementKnowledgeUsage(knowledgeIds) {
    try {
      await this.ChatbotKnowledge.updateMany(
        { _id: { $in: knowledgeIds } },
        { $inc: { usageCount: 1 } }
      );
    } catch (error) {
      console.error("Error incrementing knowledge usage:", error);
    }
  }

  /**
   * Detect if user is explicitly asking for human help
   */
  detectEscalationIntent(message) {
    const escalationKeywords = [
      "speak to human",
      "talk to someone",
      "real person",
      "agent",
      "representative",
      "support team",
      "help me",
      "this isn't working",
      "not helpful",
      "parler à quelqu'un",
      "personne réelle",
      "avec une personne",
      "spreek met iemand",
      "echte persoon",
    ];

    const lowerMessage = message.toLowerCase();
    return escalationKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Create a help request
   */
  async createHelpRequest(sessionId, requestData) {
    try {
      const session = await this.ChatSession.findOne({ sessionId });

      if (!session) {
        throw new Error("Chat session not found");
      }

      // Get last 5 messages for context
      const recentMessages = session.messages
        .slice(-5)
        .map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
        }));

      // Get user context if available
      let metadata = { ...session.metadata };
      if (session.userId) {
        const userContext = await this.getUserContext(session.userId);
        if (userContext) {
          metadata.subscriptionPlan = userContext.planName;
          metadata.documentsRemaining = userContext.documentsRemaining;
        }
      }

      const helpRequest = new this.HelpRequest({
        sessionId: sessionId,
        chatSessionRef: session._id,
        userId: session.userId,
        contactInfo: {
          email: requestData.email,
          name: requestData.name || "Anonymous",
          phone: requestData.phone,
        },
        category: requestData.category,
        subject: requestData.subject,
        description: requestData.description,
        priority: this.determinePriority(requestData.category),
        conversationHistory: recentMessages,
        metadata: metadata,
      });

      await helpRequest.save();

      // Update session status
      session.status = "escalated";
      session.escalatedToHelpRequest = helpRequest._id;
      await session.save();

      return helpRequest;
    } catch (error) {
      console.error("Error creating help request:", error);
      throw error;
    }
  }

  /**
   * Determine priority based on category
   */
  determinePriority(category) {
    const highPriority = ["technical_issue", "bug_report", "account_help"];
    const urgentPriority = ["billing_question"];

    if (urgentPriority.includes(category)) return "urgent";
    if (highPriority.includes(category)) return "high";
    return "medium";
  }

  /**
   * Get session history
   */
  async getSessionHistory(sessionId) {
    try {
      const session = await this.ChatSession.findOne({ sessionId });
      return session || null;
    } catch (error) {
      console.error("Error fetching session history:", error);
      return null;
    }
  }

  /**
   * Rate a chat session
   */
  async rateSession(sessionId, rating, feedback) {
    try {
      const session = await this.ChatSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error("Session not found");
      }

      session.userSatisfaction = {
        rating: rating,
        feedback: feedback,
        ratedAt: new Date(),
      };
      session.status = "resolved";

      await session.save();
      return session;
    } catch (error) {
      console.error("Error rating session:", error);
      throw error;
    }
  }

  /**
   * Detect device type from user agent
   */
  detectDeviceType(userAgent) {
    if (!userAgent) return "unknown";

    const ua = userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return "mobile";
    }
    return "desktop";
  }

  /**
   * Get chatbot analytics
   */
  async getAnalytics(startDate, endDate) {
    try {
      const sessions = await this.ChatSession.find({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const helpRequests = await this.HelpRequest.find({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const totalSessions = sessions.length;
      const totalMessages = sessions.reduce(
        (sum, s) => sum + s.messages.length,
        0
      );
      const avgMessagesPerSession =
        totalSessions > 0 ? totalMessages / totalSessions : 0;

      const escalatedSessions = sessions.filter(
        (s) => s.status === "escalated"
      ).length;
      const escalationRate =
        totalSessions > 0 ? (escalatedSessions / totalSessions) * 100 : 0;

      const languageDistribution = {};
      sessions.forEach((s) => {
        languageDistribution[s.language] =
          (languageDistribution[s.language] || 0) + 1;
      });

      const categoryDistribution = {};
      helpRequests.forEach((hr) => {
        categoryDistribution[hr.category] =
          (categoryDistribution[hr.category] || 0) + 1;
      });

      return {
        totalSessions,
        totalMessages,
        avgMessagesPerSession: avgMessagesPerSession.toFixed(2),
        escalationRate: escalationRate.toFixed(2),
        resolutionRate: (100 - escalationRate).toFixed(2),
        languageDistribution,
        helpRequestCategories: categoryDistribution,
        totalHelpRequests: helpRequests.length,
      };
    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  }
}

module.exports = ChatbotService