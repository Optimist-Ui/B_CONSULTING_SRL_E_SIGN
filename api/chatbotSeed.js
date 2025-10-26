// api/src/chatbotSeed.js

const container = require("./src/config/container");
const dotenv = require("dotenv");

dotenv.config();

const db = container.resolve("db");
const ChatbotKnowledge = container.resolve("ChatbotKnowledge");

const knowledgeBase = [
  // ===== E-SIGNING CATEGORY =====
  {
    category: "e-signing",
    subcategory: "signing_process",
    question: "How do I sign a document?",
    answer:
      "To sign a document: 1) Open the email invitation you received, 2) Click the 'Review & Sign' button, 3) Complete any required fields (text, checkboxes, etc.), 4) Click on the signature field and draw or type your signature, 5) Verify your identity using Email OTP or SMS OTP, 6) Review and click 'Submit'. Your signed document will be saved automatically.",
    keywords: ["sign", "signature", "how to sign", "signing process", "document signing"],
    priority: 10,
    translations: {
      fr: "Pour signer un document : 1) Ouvrez l'email d'invitation, 2) Cliquez sur 'Réviser & Signer', 3) Remplissez les champs requis, 4) Cliquez sur le champ de signature et dessinez ou tapez votre signature, 5) Vérifiez votre identité via OTP email ou SMS, 6) Révisez et cliquez sur 'Soumettre'.",
      nl: "Om een document te ondertekenen: 1) Open de uitnodigingsmail, 2) Klik op 'Beoordelen & Ondertekenen', 3) Vul vereiste velden in, 4) Klik op het handtekeningveld en teken of typ uw handtekening, 5) Verifieer uw identiteit via e-mail OTP of SMS OTP, 6) Controleer en klik op 'Indienen'.",
    },
  },
  {
    category: "e-signing",
    subcategory: "sending_documents",
    question: "How do I send a document for signing?",
    answer:
      "To send a document: 1) Log in to your account, 2) Click 'Create Package' or 'New Document', 3) Upload your PDF file, 4) Add recipients (signers, form fillers, or approvers), 5) Place signature fields and other form elements on the document, 6) Assign fields to specific recipients, 7) Set any expiration dates or reminders (optional), 8) Add a custom message (optional), 9) Click 'Send'. All recipients will receive email notifications.",
    keywords: ["send document", "create package", "upload", "share document", "send for signature"],
    priority: 10,
    translations: {
      fr: "Pour envoyer un document : 1) Connectez-vous, 2) Cliquez sur 'Créer un Package', 3) Téléchargez votre PDF, 4) Ajoutez des destinataires, 5) Placez les champs de signature, 6) Assignez les champs, 7) Définissez les dates d'expiration, 8) Ajoutez un message personnalisé, 9) Cliquez sur 'Envoyer'.",
      nl: "Om een document te verzenden: 1) Log in, 2) Klik op 'Pakket maken', 3) Upload uw PDF, 4) Voeg ontvangers toe, 5) Plaats handtekeningvelden, 6) Wijs velden toe, 7) Stel vervaldatums in, 8) Voeg een aangepast bericht toe, 9) Klik op 'Verzenden'.",
    },
  },
  {
    category: "e-signing",
    subcategory: "otp_verification",
    question: "What are Email OTP and SMS OTP?",
    answer:
      "OTP (One-Time Password) is a security feature to verify the signer's identity. Email OTP sends a 6-digit code to the signer's email, while SMS OTP sends the code via text message to their phone. The signer must enter this code before they can complete their signature. This ensures only authorized individuals can sign documents.",
    keywords: ["otp", "verification", "security", "email otp", "sms otp", "authentication"],
    priority: 8,
    translations: {
      fr: "OTP (mot de passe à usage unique) est une fonction de sécurité pour vérifier l'identité du signataire. L'OTP email envoie un code à 6 chiffres par email, tandis que l'OTP SMS envoie le code par message texte. Le signataire doit entrer ce code avant de pouvoir finaliser sa signature.",
      nl: "OTP (eenmalig wachtwoord) is een beveiligingsfunctie om de identiteit van de ondertekenaar te verifiëren. E-mail OTP stuurt een 6-cijferige code naar de e-mail van de ondertekenaar, terwijl SMS OTP de code via tekstbericht naar hun telefoon stuurt.",
    },
  },
  {
    category: "e-signing",
    subcategory: "participant_roles",
    question: "What are the different participant roles?",
    answer:
      "There are three participant roles: 1) **Signer** - Signs the document using signature fields and OTP verification, 2) **Form Filler** - Fills out form fields (text, checkboxes, dates) but doesn't sign, 3) **Approver** - Reviews and approves the document without signing. Each role has specific permissions and capabilities within the document workflow.",
    keywords: ["roles", "signer", "form filler", "approver", "participants", "recipient types"],
    priority: 7,
    translations: {
      fr: "Il existe trois rôles de participants : 1) **Signataire** - Signe le document avec vérification OTP, 2) **Remplisseur de formulaire** - Remplit les champs de formulaire, 3) **Approbateur** - Révise et approuve le document sans signer.",
      nl: "Er zijn drie deelnemersrollen: 1) **Ondertekenaar** - Ondertekent het document met OTP-verificatie, 2) **Formulier invuller** - Vult formuliervelden in, 3) **Goedkeurder** - Beoordeelt en keurt het document goed zonder te ondertekenen.",
    },
  },
  {
    category: "e-signing",
    subcategory: "document_tracking",
    question: "How can I track my document's status?",
    answer:
      "You can track your documents from the main dashboard. Each document shows its current status: Draft, Sent, Completed, Archived, Rejected, Expired, or Revoked. Click on any document to see detailed information including who has signed, who still needs to sign, when it was sent, and all activity history. You'll also receive email notifications when recipients take action.",
    keywords: ["track", "status", "monitor", "document status", "progress", "notifications"],
    priority: 8,
    translations: {
      fr: "Vous pouvez suivre vos documents depuis le tableau de bord principal. Chaque document affiche son statut actuel : Brouillon, Envoyé, Complété, Archivé, Rejeté, Expiré ou Révoqué. Cliquez sur un document pour voir les détails complets.",
      nl: "U kunt uw documenten volgen vanaf het hoofddashboard. Elk document toont zijn huidige status: Concept, Verzonden, Voltooid, Gearchiveerd, Afgewezen, Verlopen of Ingetrokken.",
    },
  },

  // ===== SUBSCRIPTIONS CATEGORY =====
  {
    category: "subscriptions",
    subcategory: "plan_comparison",
    question: "What are the differences between Starter and Pro plans?",
    answer:
      "**Starter Plan** ($9.99/month or $105.50/year): 27 documents per month, all core features including templates, email & SMS OTP verification, and document tracking. **Pro Plan** ($19.99/month or $211/year): 60 documents per month with all Starter features. Both plans include unlimited recipients, all participant roles, and full feature access. The main difference is the monthly document limit.",
    keywords: ["plans", "pricing", "starter", "pro", "comparison", "subscription plans"],
    priority: 10,
    planSpecific: [],
    translations: {
      fr: "**Plan Starter** (9,99$/mois ou 105,50$/an) : 27 documents par mois. **Plan Pro** (19,99$/mois ou 211$/an) : 60 documents par mois. Les deux incluent toutes les fonctionnalités principales.",
      nl: "**Starter Plan** ($9,99/maand of $105,50/jaar): 27 documenten per maand. **Pro Plan** ($19,99/maand of $211/jaar): 60 documenten per maand. Beide bevatten alle kernfuncties.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "document_limits",
    question: "What happens when I reach my monthly document limit?",
    answer:
      "When you reach your monthly document limit, you won't be able to send new documents until: 1) Your subscription renews (monthly/yearly), or 2) You upgrade to a higher plan, or 3) You purchase a top-up. Your existing documents remain accessible, and recipients can still sign documents you've already sent. Top-ups add extra documents to your current plan without changing your subscription.",
    keywords: ["limit", "document limit", "monthly limit", "quota", "top-up", "upgrade"],
    priority: 9,
    translations: {
      fr: "Lorsque vous atteignez votre limite mensuelle de documents, vous ne pourrez pas envoyer de nouveaux documents jusqu'à : 1) Le renouvellement de votre abonnement, 2) La mise à niveau vers un plan supérieur, ou 3) L'achat d'un complément.",
      nl: "Wanneer u uw maandelijkse documentlimiet bereikt, kunt u geen nieuwe documenten verzenden totdat: 1) Uw abonnement wordt vernieuwd, 2) U upgradet naar een hoger plan, of 3) U een aanvulling koopt.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "free_trial",
    question: "Do you offer a free trial?",
    answer:
      "Yes! New users get a 14-day free trial with access to all features and a limited number of documents. No credit card is required to start your trial. You can explore all features including document sending, templates, and all signature methods. If you decide to continue after the trial, you can choose between Starter or Pro plans.",
    keywords: ["trial", "free trial", "free", "demo", "test"],
    priority: 9,
    translations: {
      fr: "Oui ! Les nouveaux utilisateurs bénéficient d'un essai gratuit de 14 jours avec accès à toutes les fonctionnalités et un nombre limité de documents. Aucune carte de crédit n'est requise pour commencer.",
      nl: "Ja! Nieuwe gebruikers krijgen een gratis proefperiode van 14 dagen met toegang tot alle functies en een beperkt aantal documenten. Er is geen creditcard vereist om uw proefperiode te starten.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "billing",
    question: "When will I be charged and how does billing work?",
    answer:
      "You're charged when you first subscribe (after the trial period ends) and then automatically on your renewal date (monthly or yearly, depending on your plan). You'll receive an invoice via email after each payment. Your subscription auto-renews unless you cancel. You can view your billing history, update payment methods, and manage your subscription from your account settings.",
    keywords: ["billing", "payment", "charge", "invoice", "renewal", "auto-renew"],
    priority: 7,
    translations: {
      fr: "Vous êtes facturé lors de votre premier abonnement (après la fin de la période d'essai) puis automatiquement à votre date de renouvellement (mensuelle ou annuelle). Vous recevrez une facture par email après chaque paiement.",
      nl: "U wordt in rekening gebracht wanneer u zich voor het eerst abonneert (nadat de proefperiode eindigt) en vervolgens automatisch op uw verlengingsdatum (maandelijks of jaarlijks). U ontvangt een factuur per e-mail na elke betaling.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "cancellation",
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time from your account settings. When you cancel, you'll still have access to all features until the end of your current billing period. After that, your account will be downgraded and you won't be able to send new documents, but you can still access and download your existing documents. No refunds are provided for partial periods.",
    keywords: ["cancel", "cancellation", "unsubscribe", "stop subscription"],
    priority: 8,
    translations: {
      fr: "Oui, vous pouvez annuler votre abonnement à tout moment depuis les paramètres de votre compte. Lorsque vous annulez, vous conservez l'accès à toutes les fonctionnalités jusqu'à la fin de votre période de facturation actuelle.",
      nl: "Ja, u kunt uw abonnement op elk moment annuleren via uw accountinstellingen. Wanneer u annuleert, heeft u nog steeds toegang tot alle functies tot het einde van uw huidige factureringsperiode.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "enterprise",
    question: "What is the Enterprise plan?",
    answer:
      "The Enterprise plan is designed for larger organizations with custom needs. It includes custom document volumes, team management with user roles, a dedicated account manager, priority support, custom integrations, and API access. Pricing is customized based on your requirements. Contact our sales team to discuss your specific needs and get a quote.",
    keywords: ["enterprise", "business", "custom", "team", "api", "large organization"],
    priority: 6,
    planSpecific: ["Enterprise"],
    translations: {
      fr: "Le plan Enterprise est conçu pour les grandes organisations avec des besoins personnalisés. Il inclut des volumes de documents personnalisés, la gestion d'équipe avec des rôles d'utilisateur, un gestionnaire de compte dédié, et l'accès API.",
      nl: "Het Enterprise-plan is ontworpen voor grotere organisaties met aangepaste behoeften. Het omvat aangepaste documentvolumes, teambeheer met gebruikersrollen, een toegewijde accountmanager en API-toegang.",
    },
  },

  // ===== FEATURES CATEGORY =====
  {
    category: "features",
    subcategory: "templates",
    question: "How do I create and use templates?",
    answer:
      "Templates save time by storing pre-configured documents. To create a template: 1) Upload a document, 2) Add all fields and configure settings, 3) Save as template instead of sending. To use a template: 1) Go to Templates section, 2) Select a template, 3) Add recipients, 4) Customize the message if needed, 5) Send. Templates include all fields, their positions, and document settings.",
    keywords: ["template", "templates", "reuse", "save template", "template creation"],
    priority: 7,
    translations: {
      fr: "Les modèles permettent de gagner du temps en stockant des documents préconfigurés. Pour créer un modèle : 1) Téléchargez un document, 2) Ajoutez tous les champs, 3) Enregistrez comme modèle au lieu d'envoyer.",
      nl: "Sjablonen besparen tijd door vooraf geconfigureerde documenten op te slaan. Om een sjabloon te maken: 1) Upload een document, 2) Voeg alle velden toe, 3) Opslaan als sjabloon in plaats van verzenden.",
    },
  },
  {
    category: "features",
    subcategory: "field_types",
    question: "What types of fields can I add to documents?",
    answer:
      "You can add seven types of fields: 1) **Text** - Single line text input, 2) **Textarea** - Multi-line text input, 3) **Signature** - Electronic signature (requires OTP), 4) **Checkbox** - Yes/no selection, 5) **Radio** - Multiple choice (select one from group), 6) **Date** - Date picker, 7) **Dropdown** - Select from predefined options. All fields can be marked as required and assigned to specific participants.",
    keywords: ["fields", "field types", "signature field", "text field", "form fields"],
    priority: 6,
    translations: {
      fr: "Vous pouvez ajouter sept types de champs : 1) **Texte** - Saisie de texte sur une seule ligne, 2) **Zone de texte** - Saisie multiligne, 3) **Signature** - Signature électronique (nécessite OTP), 4) **Case à cocher**, 5) **Bouton radio**, 6) **Date**, 7) **Liste déroulante**.",
      nl: "U kunt zeven soorten velden toevoegen: 1) **Tekst** - Invoer van één regel, 2) **Tekstgebied** - Invoer van meerdere regels, 3) **Handtekening** - Elektronische handtekening (vereist OTP), 4) **Selectievakje**, 5) **Keuzerondje**, 6) **Datum**, 7) **Vervolgkeuzemenu**.",
    },
  },
  {
    category: "features",
    subcategory: "expiration",
    question: "Can I set an expiration date for documents?",
    answer:
      "Yes, you can set expiration dates when sending documents. Go to document options and set the 'Expires At' date. You can also enable automatic expiration reminders (1 hour, 2 hours, 1 day, or 2 days before expiration). Once a document expires, recipients can no longer sign it, and its status changes to 'Expired'. This is useful for time-sensitive agreements.",
    keywords: ["expiration", "expire", "deadline", "expiration date", "time limit"],
    priority: 6,
    translations: {
      fr: "Oui, vous pouvez définir des dates d'expiration lors de l'envoi de documents. Accédez aux options du document et définissez la date 'Expire le'. Vous pouvez également activer des rappels automatiques d'expiration.",
      nl: "Ja, u kunt vervaldatums instellen bij het verzenden van documenten. Ga naar documentopties en stel de datum 'Verloopt op' in. U kunt ook automatische herinneringen voor vervaldatum inschakelen.",
    },
  },
  {
    category: "features",
    subcategory: "reminders",
    question: "How do automatic reminders work?",
    answer:
      "Automatic reminders send email notifications to recipients who haven't completed their actions. You can set: 1) First reminder after X days, 2) Repeat reminder every X days until completed or expired. For example, send first reminder after 3 days, then repeat every 2 days. This helps ensure documents get signed promptly without manual follow-up.",
    keywords: ["reminders", "automatic reminders", "notifications", "follow-up"],
    priority: 5,
    translations: {
      fr: "Les rappels automatiques envoient des notifications par email aux destinataires qui n'ont pas terminé leurs actions. Vous pouvez définir : 1) Premier rappel après X jours, 2) Répéter le rappel tous les X jours.",
      nl: "Automatische herinneringen sturen e-mailmeldingen naar ontvangers die hun acties niet hebben voltooid. U kunt instellen: 1) Eerste herinnering na X dagen, 2) Herhaal herinnering elke X dagen.",
    },
  },
  {
    category: "features",
    subcategory: "reassignment",
    question: "Can recipients reassign documents to someone else?",
    answer:
      "Yes, if you enable 'Allow Reassign' in document options. Recipients can reassign their signing responsibility to another person by providing their email and a reason. The new recipient will receive a notification and can complete the signing. All reassignments are tracked in the document's audit trail for compliance.",
    keywords: ["reassign", "reassignment", "delegate", "transfer", "change signer"],
    priority: 5,
    translations: {
      fr: "Oui, si vous activez 'Autoriser la réaffectation' dans les options du document. Les destinataires peuvent réaffecter leur responsabilité de signature à une autre personne en fournissant leur email et une raison.",
      nl: "Ja, als u 'Opnieuw toewijzen toestaan' inschakelt in documentopties. Ontvangers kunnen hun ondertekeningsverantwoordelijkheid opnieuw toewijzen aan een andere persoon door hun e-mail en een reden op te geven.",
    },
  },

  // ===== TROUBLESHOOTING CATEGORY =====
  {
    category: "troubleshooting",
    subcategory: "otp_issues",
    question: "I didn't receive my OTP code. What should I do?",
    answer:
      "If you didn't receive your OTP: 1) Check your spam/junk folder, 2) Verify the email/phone number is correct, 3) Wait a few minutes and try again, 4) Request a new code by clicking 'Resend OTP', 5) Try the alternative method (if email OTP isn't working, try SMS OTP and vice versa). If issues persist, contact the document sender or our support team.",
    keywords: ["otp not received", "missing otp", "otp problem", "verification code"],
    priority: 8,
    translations: {
      fr: "Si vous n'avez pas reçu votre OTP : 1) Vérifiez votre dossier spam/courrier indésirable, 2) Vérifiez que l'email/téléphone est correct, 3) Attendez quelques minutes et réessayez, 4) Demandez un nouveau code.",
      nl: "Als u uw OTP niet heeft ontvangen: 1) Controleer uw spam/junk-map, 2) Controleer of het e-mailadres/telefoonnummer correct is, 3) Wacht een paar minuten en probeer het opnieuw, 4) Vraag een nieuwe code aan.",
    },
  },
  {
    category: "troubleshooting",
    subcategory: "document_upload",
    question: "Why can't I upload my document?",
    answer:
      "Common upload issues: 1) **File format** - Only PDF files are supported, 2) **File size** - Files must be under 25MB, 3) **File corruption** - Try re-saving or re-creating your PDF, 4) **Browser issues** - Clear cache or try a different browser, 5) **Internet connection** - Check your connection stability. If the problem continues, try converting your document to PDF using a different tool.",
    keywords: ["upload failed", "can't upload", "upload error", "pdf upload"],
    priority: 7,
    translations: {
      fr: "Problèmes de téléchargement courants : 1) **Format de fichier** - Seuls les PDF sont pris en charge, 2) **Taille du fichier** - Les fichiers doivent faire moins de 25 Mo, 3) **Fichier corrompu** - Essayez de réenregistrer votre PDF.",
      nl: "Veelvoorkomende uploadproblemen: 1) **Bestandsformaat** - Alleen PDF-bestanden worden ondersteund, 2) **Bestandsgrootte** - Bestanden moeten kleiner zijn dan 25 MB, 3) **Bestandscorruptie** - Probeer uw PDF opnieuw op te slaan.",
    },
  },
  {
    category: "troubleshooting",
    subcategory: "email_not_received",
    question: "Recipients aren't receiving email notifications. Why?",
    answer:
      "If recipients aren't receiving emails: 1) Ask them to check spam/junk folders, 2) Verify email addresses are correct (no typos), 3) Add noreply@yourdomain.com to their contacts, 4) Check if their email provider is blocking automated emails, 5) Wait 5-10 minutes as there may be delivery delays. You can resend notifications from the document details page.",
    keywords: ["email not received", "no notification", "missing email", "email delivery"],
    priority: 7,
    translations: {
      fr: "Si les destinataires ne reçoivent pas d'emails : 1) Demandez-leur de vérifier les dossiers spam/courrier indésirable, 2) Vérifiez que les adresses email sont correctes, 3) Ajoutez noreply@votredomaine.com à leurs contacts.",
      nl: "Als ontvangers geen e-mails ontvangen: 1) Vraag hen hun spam/junk-mappen te controleren, 2) Controleer of e-mailadressen correct zijn, 3) Voeg noreply@uwdomein.com toe aan hun contacten.",
    },
  },
  {
    category: "troubleshooting",
    subcategory: "signature_not_working",
    question: "My signature isn't being accepted. What's wrong?",
    answer:
      "Signature issues usually occur when: 1) The signature field is empty - make sure you've drawn or typed something, 2) OTP verification wasn't completed - you must verify with OTP before submitting, 3) Required fields are missing - complete all fields marked as required, 4) Browser issues - try refreshing the page or using a different browser. Make sure JavaScript is enabled in your browser.",
    keywords: ["signature error", "can't sign", "signature not working", "signature problem"],
    priority: 7,
    translations: {
      fr: "Les problèmes de signature se produisent généralement lorsque : 1) Le champ de signature est vide, 2) La vérification OTP n'a pas été effectuée, 3) Des champs obligatoires sont manquants, 4) Problèmes de navigateur.",
      nl: "Handtekeningproblemen treden meestal op wanneer: 1) Het handtekeningveld leeg is, 2) OTP-verificatie niet is voltooid, 3) Vereiste velden ontbreken, 4) Browserproblemen.",
    },
  },

  // ===== ACCOUNT CATEGORY =====
  {
    category: "account",
    subcategory: "password_reset",
    question: "How do I reset my password?",
    answer:
      "To reset your password: 1) Go to the login page, 2) Click 'Forgot Password', 3) Enter your email address, 4) Check your email for a reset link (check spam if not found), 5) Click the link and enter your new password, 6) Confirm your new password. The reset link expires after 1 hour for security. If you don't receive the email, try again or contact support.",
    keywords: ["password reset", "forgot password", "change password", "reset password"],
    priority: 6,
    translations: {
      fr: "Pour réinitialiser votre mot de passe : 1) Allez à la page de connexion, 2) Cliquez sur 'Mot de passe oublié', 3) Entrez votre adresse email, 4) Vérifiez votre email pour un lien de réinitialisation, 5) Cliquez sur le lien et entrez votre nouveau mot de passe.",
      nl: "Om uw wachtwoord opnieuw in te stellen: 1) Ga naar de inlogpagina, 2) Klik op 'Wachtwoord vergeten', 3) Voer uw e-mailadres in, 4) Controleer uw e-mail voor een resetlink, 5) Klik op de link en voer uw nieuwe wachtwoord in.",
    },
  },
  {
    category: "account",
    subcategory: "profile_update",
    question: "How do I update my profile information?",
    answer:
      "To update your profile: 1) Log in to your account, 2) Click on your profile icon/name in the top right, 3) Select 'Profile Settings' or 'My Account', 4) Update your information (name, email, phone, profile picture, language preference), 5) Click 'Save Changes'. If you change your email, you'll need to verify the new email address.",
    keywords: ["profile", "update profile", "account settings", "change email", "personal information"],
    priority: 5,
    translations: {
      fr: "Pour mettre à jour votre profil : 1) Connectez-vous, 2) Cliquez sur votre icône/nom de profil en haut à droite, 3) Sélectionnez 'Paramètres du profil', 4) Mettez à jour vos informations, 5) Cliquez sur 'Enregistrer les modifications'.",
      nl: "Om uw profiel bij te werken: 1) Log in, 2) Klik op uw profielpictogram/naam rechtsboven, 3) Selecteer 'Profielinstellingen', 4) Update uw informatie, 5) Klik op 'Wijzigingen opslaan'.",
    },
  },
  {
    category: "account",
    subcategory: "account_deletion",
    question: "How do I delete my account?",
    answer:
      "To delete your account: 1) Go to Account Settings, 2) Scroll to 'Delete Account' section, 3) Click 'Request Account Deletion', 4) Confirm your decision. Your account will be deactivated immediately and scheduled for permanent deletion after 14 days. You'll receive a reactivation link via email if you change your mind within this grace period. All your documents will be permanently deleted after 14 days.",
    keywords: ["delete account", "close account", "account deletion", "remove account"],
    priority: 4,
    translations: {
      fr: "Pour supprimer votre compte : 1) Allez dans Paramètres du compte, 2) Faites défiler jusqu'à la section 'Supprimer le compte', 3) Cliquez sur 'Demander la suppression du compte', 4) Confirmez. Votre compte sera désactivé immédiatement et programmé pour suppression permanente après 14 jours.",
      nl: "Om uw account te verwijderen: 1) Ga naar Accountinstellingen, 2) Scroll naar de sectie 'Account verwijderen', 3) Klik op 'Accountverwijdering aanvragen', 4) Bevestig. Uw account wordt onmiddellijk gedeactiveerd en gepland voor permanente verwijdering na 14 dagen.",
    },
  },

  // ===== SECURITY CATEGORY =====
  {
    category: "security",
    subcategory: "data_security",
    question: "Is my data secure?",
    answer:
      "Yes, we take security seriously. Your data is: 1) **Encrypted** - All data is encrypted in transit (SSL/TLS) and at rest, 2) **Securely stored** - Documents are stored on AWS S3 with restricted access, 3) **OTP verified** - Signatures require two-factor authentication, 4) **Audit trails** - All document activities are logged, 5) **Compliance** - We follow industry best practices for data protection. We never share your data with third parties without your consent.",
    keywords: ["security", "data security", "encryption", "safe", "privacy", "secure"],
    priority: 8,
    translations: {
      fr: "Oui, nous prenons la sécurité au sérieux. Vos données sont : 1) **Chiffrées** - Toutes les données sont chiffrées en transit et au repos, 2) **Stockées en toute sécurité** - Documents stockés sur AWS S3, 3) **Vérifiées par OTP** - Authentification à deux facteurs.",
      nl: "Ja, we nemen beveiliging serieus. Uw gegevens zijn: 1) **Versleuteld** - Alle gegevens zijn versleuteld tijdens verzending en opslag, 2) **Veilig opgeslagen** - Documenten worden opgeslagen op AWS S3, 3) **OTP-geverifieerd** - Tweefactorauthenticatie.",
    },
  },
  {
    category: "security",
    subcategory: "document_validity",
    question: "Are electronically signed documents legally valid?",
    answer:
      "Electronic signatures are legally valid in most countries, including the US (ESIGN Act), EU (eIDAS Regulation), and many others. Our e-signatures include: 1) OTP verification for authentication, 2) Complete audit trails, 3) Tamper-evident seals, 4) IP address and timestamp logging. However, we cannot provide legal advice. For specific legal questions about document validity in your jurisdiction, please consult a lawyer.",
    keywords: ["legal", "validity", "legally binding", "law", "compliance", "esign"],
    priority: 6,
    translations: {
      fr: "Les signatures électroniques sont légalement valides dans la plupart des pays, y compris aux États-Unis (ESIGN Act) et dans l'UE (règlement eIDAS). Cependant, nous ne pouvons pas fournir de conseils juridiques.",
      nl: "Elektronische handtekeningen zijn juridisch geldig in de meeste landen, waaronder de VS (ESIGN Act) en EU (eIDAS-verordening). We kunnen echter geen juridisch advies geven.",
    },
  },

  // ===== GENERAL CATEGORY =====
  {
    category: "general",
    subcategory: "getting_started",
    question: "I'm new to the platform. Where do I start?",
    answer:
      "Welcome! Here's how to get started: 1) **Create an account** - Sign up with your email, 2) **Start your free trial** - Get 14 days with full access, 3) **Upload your first document** - Click 'Create Package' and upload a PDF, 4) **Add recipients** - Enter email addresses and assign roles, 5) **Place fields** - Drag and drop signature and form fields, 6) **Send** - Recipients will receive email notifications. Check out our dashboard for templates and tracking tools!",
    keywords: ["getting started", "new user", "how to start", "beginner", "first time"],
    priority: 9,
    translations: {
      fr: "Bienvenue ! Voici comment commencer : 1) **Créer un compte** - Inscrivez-vous avec votre email, 2) **Commencez votre essai gratuit** - 14 jours d'accès complet, 3) **Téléchargez votre premier document** - Cliquez sur 'Créer un package'.",
      nl: "Welkom! Zo begin je: 1) **Maak een account** - Meld je aan met je e-mail, 2) **Start je gratis proefperiode** - 14 dagen volledige toegang, 3) **Upload je eerste document** - Klik op 'Pakket maken'.",
    },
  },
  {
    category: "general",
    subcategory: "contact_support",
    question: "How do I contact customer support?",
    answer:
      "You can reach our support team through: 1) **Help Request Form** - Available in this chat when I can't answer your question, 2) **Email** - support@yourdomain.com, 3) **Live Chat** - Available during business hours (9 AM - 6 PM EST), 4) **Help Center** - Visit our knowledge base for guides and FAQs. Enterprise customers have access to a dedicated account manager and priority support.",
    keywords: ["support", "contact", "help", "customer service", "assistance"],
    priority: 7,
    translations: {
      fr: "Vous pouvez contacter notre équipe d'assistance via : 1) **Formulaire de demande d'aide** - Disponible dans ce chat, 2) **Email** - support@votredomaine.com, 3) **Chat en direct** - Disponible pendant les heures d'ouverture.",
      nl: "U kunt ons ondersteuningsteam bereiken via: 1) **Hulpaanvraagformulier** - Beschikbaar in deze chat, 2) **E-mail** - support@uwdomein.com, 3) **Live chat** - Beschikbaar tijdens kantooruren.",
    },
  },
];

// Main seed function
(async () => {
  try {
    await db.connect();
    console.log("✅ Database connected for chatbot seeding.");

    console.log("🔄 Removing old knowledge base entries...");
    await ChatbotKnowledge.deleteMany({});
    console.log("✅ Old entries removed.");

    console.log("🌱 Seeding chatbot knowledge base...");
    await ChatbotKnowledge.insertMany(knowledgeBase);
    console.log(`✅ Successfully seeded ${knowledgeBase.length} knowledge base entries!`);

    console.log("🎉 Chatbot knowledge base seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
})();