const { createContainer, asClass, asFunction, asValue } = require("awilix");
const db = require("./db");
const User = require("../models/UserModel");
const Package = require("../models/PackageModel");
const Contact = require("../models/ContactModel");
const Team = require("../models/TeamModel");
const Template = require("../models/TemplateModel");
const OTP = require("../models/OTPModel");
const Plan = require("../models/PlanModel");
const UsedTrialFingerprintModel = require("../models/UsedTrialFingerprintModel");
const Review = require("../models/ReviewModel");
const ChatSession = require("../models/ChatSessionModel");
const ChatbotKnowledge = require("../models/ChatbotKnowledgeModel");
const HelpRequest = require("../models/HelpRequestModel");
const ChatMetrics = require("../models/ChatMetricsModel");

const UserService = require("../services/UserService");
const PackageService = require("../services/PackageService");
const ContactService = require("../services/ContactService");
const TemplateService = require("../services/TemplateService");
const VivaWalletPaymentService = require("../services/VivaWalletPaymentService");
const VivaWalletInvoiceService = require("../services/VivaWalletInvoiceService");
const PlanService = require("../services/PlanService");
const ReviewService = require("../services/ReviewService");
const OpenAIService = require("../services/OpenAIService");
const ChatbotService = require("../services/ChatbotService");

const CronService = require("../services/CronService");
const EmailService = require("../services/EmailService");
const S3Service = require("../services/S3Service");
const SmsService = require("../services/SmsService");
const PdfModificationService = require("../services/PdfModificationService");
const PushNotificationService = require("../services/PushNotificationService");

const SocketManager = require("../websocket/SocketManager");
const PackageEventEmitter = require("../websocket/events/packageEvents");
const ChatbotEventEmitter = require("../websocket/events/chatbotEvents");

const UserController = require("../controllers/UserController");
const PackageController = require("../controllers/PackageController");
const ContactController = require("../controllers/ContactController");
const TemplateController = require("../controllers/TemplateController");
const SubscriptionController = require("../controllers/SubscriptionController");
const PaymentMethodController = require("../controllers/PaymentMethodController");
const WebhookController = require("../controllers/WebhookController");
const ReviewController = require("../controllers/ReviewController");
const ChatbotController = require("../controllers/ChatbotController");

const userRoutes = require("../routes/UserRoutes");
const PackageRoutes = require("../routes/PackageRoutes");
const ContactRoutes = require("../routes/ContactRoutes");
const TemplateRoutes = require("../routes/TemplateRoutes");
const subscriptionRoutes = require("../routes/SubscriptionRoutes");
const paymentMethodRoutes = require("../routes/PaymentMethodRoutes");
const reviewRoutes = require("../routes/ReviewRoutes");
const chatbotRoutes = require("../routes/ChatbotRoutes");

const VivaWalletSubscriptionService = require("../services/VivaWalletSubscriptionService");
const VivaWalletWebhookHandler = require("../services/VivaWalletWebhookHandler");

const container = createContainer();

container.register({
  db: asValue(db),

  User: asValue(User),
  Package: asValue(Package),
  Contact: asValue(Contact),
  Team: asValue(Team),
  Template: asValue(Template),
  OTP: asValue(OTP),
  Plan: asValue(Plan),
  UsedTrialFingerprintModel: asValue(UsedTrialFingerprintModel),
  Review: asValue(Review),
  // Chatbot Models
  ChatSession: asValue(ChatSession),
  ChatbotKnowledge: asValue(ChatbotKnowledge),
  HelpRequest: asValue(HelpRequest),
  ChatMetrics: asValue(ChatMetrics),

  userService: asClass(UserService).singleton(),
  packageService: asClass(PackageService).singleton(),
  contactService: asClass(ContactService).singleton(),
  templateService: asClass(TemplateService).singleton(),
  vivaWalletPaymentService: asClass(VivaWalletPaymentService).singleton(),
  vivaWalletInvoiceService: asClass(VivaWalletInvoiceService).singleton(),
  vivaWalletSubscriptionService: asClass(VivaWalletSubscriptionService).singleton(),
  vivaWalletWebhookHandler: asClass(VivaWalletWebhookHandler).singleton(),
  planService: asClass(PlanService).singleton(),
  reviewService: asClass(ReviewService).singleton(),
  // Chatbot Services
  openAIService: asClass(OpenAIService).singleton(),
  chatbotService: asClass(ChatbotService).singleton(),

  emailService: asClass(EmailService).singleton(),
  smsService: asClass(SmsService).singleton(),
  s3Service: asClass(S3Service).singleton(),
  pdfModificationService: asClass(PdfModificationService).singleton(),
  pushNotificationService: asClass(PushNotificationService).singleton(),
  cronService: asClass(CronService).singleton(),

  socketManager: asClass(SocketManager).singleton(),
  packageEventEmitter: asClass(PackageEventEmitter).singleton(),
  chatbotEventEmitter: asClass(ChatbotEventEmitter).singleton(),

  userController: asClass(UserController).singleton(),
  packageController: asClass(PackageController).singleton(),
  contactController: asClass(ContactController).singleton(),
  templateController: asClass(TemplateController).singleton(),
  subscriptionController: asClass(SubscriptionController).singleton(),
  paymentMethodController: asClass(PaymentMethodController).singleton(),
  webhookController: asClass(WebhookController).singleton(),
  reviewController: asClass(ReviewController).singleton(),
  // Chatbot Controller
  chatbotController: asClass(ChatbotController).singleton(),

  userRoutes: asFunction(userRoutes).singleton(),
  packageRoutes: asFunction(PackageRoutes).singleton(),
  contactRoutes: asFunction(ContactRoutes).singleton(),
  templateRoutes: asFunction(TemplateRoutes).singleton(),
  subscriptionRoutes: asFunction(subscriptionRoutes).singleton(),
  paymentMethodRoutes: asFunction(paymentMethodRoutes).singleton(),
  reviewRoutes: asFunction(reviewRoutes).singleton(),
  // Chatbot Routes
  chatbotRoutes: asFunction(chatbotRoutes).singleton(),
});

module.exports = container;
