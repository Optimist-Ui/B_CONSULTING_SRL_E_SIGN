const { createContainer, asClass, asFunction, asValue } = require("awilix");
const db = require("./db");
const User = require("../models/UserModel");
const Package = require("../models/PackageModel");
const Contact = require("../models/ContactModel");
const Team = require("../models/TeamModel");
const Template = require("../models/TemplateModel");
const OTP = require("../models/OTPModel");

const UserService = require("../services/UserService");
const PackageService = require("../services/PackageService");
const ContactService = require("../services/ContactService");
const TemplateService = require("../services/TemplateService");

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

const userRoutes = require("../routes/UserRoutes");
const PackageRoutes = require("../routes/PackageRoutes");
const ContactRoutes = require("../routes/ContactRoutes");
const TemplateRoutes = require("../routes/TemplateRoutes");

const container = createContainer();

container.register({
  db: asValue(db),

  User: asValue(User),
  Package: asValue(Package),
  Contact: asValue(Contact),
  Team: asValue(Team),
  Template: asValue(Template),
  OTP: asValue(OTP),

  userService: asClass(UserService).singleton(),
  packageService: asClass(PackageService).singleton(),
  contactService: asClass(ContactService).singleton(),
  templateService: asClass(TemplateService).singleton(),

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

  userRoutes: asFunction(userRoutes).singleton(),
  packageRoutes: asFunction(PackageRoutes).singleton(),
  contactRoutes: asFunction(ContactRoutes).singleton(),
  templateRoutes: asFunction(TemplateRoutes).singleton(),
});

module.exports = container;
