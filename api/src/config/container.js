const { createContainer, asClass, asFunction, asValue } = require("awilix");
const Stripe = require("stripe");
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

const UserService = require("../services/UserService");
const PackageService = require("../services/PackageService");
const ContactService = require("../services/ContactService");
const TemplateService = require("../services/TemplateService");
const PaymentMethod = require("../services/PaymentMethod");
const SubscriptionService = require("../services/SubscriptionService");
const PlanService = require("../services/PlanService");
const ReviewService = require("../services/ReviewService");

const CronService = require("../services/CronService");
const EmailService = require("../services/EmailService");
const SmsService = require("../services/SmsService");
const PdfModificationService = require("../services/PdfModificationService");

const SocketManager = require("../websocket/SocketManager");
const PackageEventEmitter = require("../websocket/events/packageEvents");

const UserController = require("../controllers/UserController");
const PackageController = require("../controllers/PackageController");
const ContactController = require("../controllers/ContactController");
const TemplateController = require("../controllers/TemplateController");
const SubscriptionController = require("../controllers/SubscriptionController");
const PaymentMethodController = require("../controllers/PaymentMethodController");
const WebhookController = require("../controllers/WebhookController");
const ReviewController = require("../controllers/ReviewController");

const userRoutes = require("../routes/UserRoutes");
const PackageRoutes = require("../routes/PackageRoutes");
const ContactRoutes = require("../routes/ContactRoutes");
const TemplateRoutes = require("../routes/TemplateRoutes");
const subscriptionRoutes = require("../routes/SubscriptionRoutes");
const paymentMethodRoutes = require("../routes/PaymentMethodRoutes");
const reviewRoutes = require("../routes/ReviewRoutes");


const container = createContainer();

// 👇 Initialize Stripe and register it
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
container.register({
  stripe: asValue(stripe),
});

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

  userService: asClass(UserService).singleton(),
  packageService: asClass(PackageService).singleton(),
  contactService: asClass(ContactService).singleton(),
  templateService: asClass(TemplateService).singleton(),
  paymentMethod: asClass(PaymentMethod).singleton(),
  subscriptionService: asClass(SubscriptionService).singleton(),
  planService: asClass(PlanService).singleton(),
  reviewService: asClass(ReviewService).singleton(),

  emailService: asClass(EmailService).singleton(),
  smsService: asClass(SmsService).singleton(),
  pdfModificationService: asClass(PdfModificationService).singleton(),
  cronService: asClass(CronService).singleton(),

  socketManager: asClass(SocketManager).singleton(),
  packageEventEmitter: asClass(PackageEventEmitter).singleton(),

  userController: asClass(UserController).singleton(),
  packageController: asClass(PackageController).singleton(),
  contactController: asClass(ContactController).singleton(),
  templateController: asClass(TemplateController).singleton(),
  subscriptionController: asClass(SubscriptionController).singleton(),
  paymentMethodController: asClass(PaymentMethodController).singleton(),
  webhookController: asClass(WebhookController).singleton(),
  reviewController: asClass(ReviewController).singleton(),

  userRoutes: asFunction(userRoutes).singleton(),
  packageRoutes: asFunction(PackageRoutes).singleton(),
  contactRoutes: asFunction(ContactRoutes).singleton(),
  templateRoutes: asFunction(TemplateRoutes).singleton(),
  subscriptionRoutes: asFunction(subscriptionRoutes).singleton(),
  paymentMethodRoutes: asFunction(paymentMethodRoutes).singleton(),
  reviewRoutes: asFunction(reviewRoutes).singleton(),
});

module.exports = container;
