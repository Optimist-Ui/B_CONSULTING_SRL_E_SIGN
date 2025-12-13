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
      "To sign a document: 1) Open the email invitation you received, 2) Click the 'Review & Sign' button, 3) Complete any required fields (text, date fields, etc.), 4) Click on the signature field, 5) Choose your verification method (Email OTP or SMS OTP - as configured by the sender), 6) Enter the 6-digit OTP code sent to your email/phone (valid for 60 seconds), 7) Review and click 'Submit'. Your signature, OTP, IP address, and timestamp are recorded in the audit trail. If you have multiple signature fields, you only need to verify OTP once.",
    keywords: [
      "sign",
      "signature",
      "how to sign",
      "signing process",
      "document signing",
      "otp",
    ],
    priority: 10,
    translations: {
      fr: "Pour signer un document : 1) Ouvrez l'email d'invitation, 2) Cliquez sur 'Réviser & Signer', 3) Remplissez les champs requis, 4) Cliquez sur le champ de signature, 5) Choisissez votre méthode de vérification OTP, 6) Entrez le code à 6 chiffres (valide 60 secondes), 7) Révisez et cliquez sur 'Soumettre'.",
      nl: "Om een document te ondertekenen: 1) Open de uitnodigingsmail, 2) Klik op 'Beoordelen & Ondertekenen', 3) Vul vereiste velden in, 4) Klik op het handtekeningveld, 5) Kies uw OTP-verificatiemethode, 6) Voer de 6-cijferige code in (60 seconden geldig), 7) Controleer en klik op 'Indienen'.",
    },
  },
  {
    category: "e-signing",
    subcategory: "sending_documents",
    question: "How do I send a document for signing?",
    answer:
      "To send a document: 1) Log in to your account, 2) Click 'Create Package', 3) Upload your PDF file (max 10MB, PDF format only), 4) Add recipients: Signers (sign with OTP), Form Fillers (fill fields), Approvers (approve with/without checkbox), or Receivers (view-only, can add more receivers or reassign), 5) Choose OTP verification method for signers (SMS, Email, or Both), 6) Place signature fields, text inputs, and date fields on the document, 7) Assign fields to specific participants, 8) Configure options: Allow reassignment, Allow viewing others' actions, Allow download before signing, Set expiration date, Set reminder intervals (24 hours or custom), 9) Add a custom message (optional), 10) Click 'Send'. All participants will receive email notifications.",
    keywords: [
      "send document",
      "create package",
      "upload",
      "share document",
      "send for signature",
      "participants",
    ],
    priority: 10,
    translations: {
      fr: "Pour envoyer un document : 1) Connectez-vous, 2) Cliquez sur 'Créer un Package', 3) Téléchargez votre PDF (max 10 Mo), 4) Ajoutez des participants avec leurs rôles, 5) Choisissez la méthode OTP, 6) Placez les champs, 7) Configurez les options, 8) Cliquez sur 'Envoyer'.",
      nl: "Om een document te verzenden: 1) Log in, 2) Klik op 'Pakket maken', 3) Upload uw PDF (max 10 MB), 4) Voeg deelnemers toe met hun rollen, 5) Kies OTP-methode, 6) Plaats velden, 7) Configureer opties, 8) Klik op 'Verzenden'.",
    },
  },
  {
    category: "e-signing",
    subcategory: "otp_verification",
    question: "What are Email OTP and SMS OTP?",
    answer:
      "OTP (One-Time Password) is a security feature to verify the signer's identity. When you create a package, you choose which OTP method(s) signers can use: Email OTP (sends 6-digit code to email), SMS OTP (sends code via text message), or Both (signer can choose). The code is valid for 60 seconds and signers can request a new code up to 5 times if needed. If a signer has multiple signature fields in the same document, they only need to verify OTP once. The OTP, along with IP address and timestamp, is recorded in the document's audit trail for security and compliance.",
    keywords: [
      "otp",
      "verification",
      "security",
      "email otp",
      "sms otp",
      "authentication",
      "one-time password",
    ],
    priority: 9,
    translations: {
      fr: "L'OTP (mot de passe à usage unique) vérifie l'identité du signataire. Vous choisissez la méthode lors de la création : Email OTP, SMS OTP, ou les deux. Le code est valide 60 secondes et peut être redemandé jusqu'à 5 fois. Pour plusieurs champs de signature, une seule vérification OTP suffit.",
      nl: "OTP (eenmalig wachtwoord) verifieert de identiteit van de ondertekenaar. U kiest de methode bij het maken: E-mail OTP, SMS OTP, of beide. De code is 60 seconden geldig en kan tot 5 keer opnieuw worden aangevraagd. Voor meerdere handtekeningvelden is één OTP-verificatie voldoende.",
    },
  },
  {
    category: "e-signing",
    subcategory: "participant_roles",
    question: "What are the different participant roles?",
    answer:
      "There are four participant roles: 1) **Signer** - Signs the document using OTP verification (SMS, Email, or both as configured by sender), receives email notifications, can reassign if enabled. 2) **Form Filler** - Fills out form fields (text inputs, dates) but doesn't sign, receives email notifications, can reassign if enabled. 3) **Approver** - Reviews and approves the document with or without checkbox, can add comments, receives email notifications, can reassign if enabled. 4) **Receiver** - View-only access to see actions of other participants, cannot perform signing/filling actions, can add additional receivers to the package, can reassign the package (but loses access after reassigning). Multiple roles can be assigned to the same person in one document.",
    keywords: [
      "roles",
      "signer",
      "form filler",
      "approver",
      "receiver",
      "participants",
      "recipient types",
    ],
    priority: 8,
    translations: {
      fr: "Quatre rôles de participants : 1) **Signataire** - Signe avec OTP, 2) **Remplisseur** - Remplit les champs, 3) **Approbateur** - Approuve avec/sans case à cocher, 4) **Destinataire** - Accès en lecture seule, peut ajouter d'autres destinataires. Les rôles multiples sont possibles pour une même personne.",
      nl: "Vier deelnemersrollen: 1) **Ondertekenaar** - Ondertekent met OTP, 2) **Invuller** - Vult velden in, 3) **Goedkeurder** - Keurt goed met/zonder selectievakje, 4) **Ontvanger** - Alleen-lezen toegang, kan andere ontvangers toevoegen. Meerdere rollen mogelijk voor dezelfde persoon.",
    },
  },
  {
    category: "e-signing",
    subcategory: "document_tracking",
    question: "How can I track my document's status?",
    answer:
      "You can track your documents from the main dashboard. Each document shows its current status: Draft, Pending (sent but not completed), Completed, Rejected, Expired, or Revoked. You can search documents by status or name. Click on any document to see detailed information including who has signed, who still needs to act, when it was sent, and the complete activity history. You'll also receive email notifications when participants take action. The signing process is parallel - all participants can act simultaneously, not sequential.",
    keywords: [
      "track",
      "status",
      "monitor",
      "document status",
      "progress",
      "notifications",
      "dashboard",
      "search",
    ],
    priority: 8,
    translations: {
      fr: "Suivez vos documents depuis le tableau de bord. Statuts disponibles : Brouillon, En attente, Complété, Rejeté, Expiré, Révoqué. Recherchez par statut ou nom. La signature est parallèle - tous les participants peuvent agir simultanément.",
      nl: "Volg uw documenten vanaf het dashboard. Beschikbare statussen: Concept, In afwachting, Voltooid, Afgewezen, Verlopen, Ingetrokken. Zoek op status of naam. Ondertekening is parallel - alle deelnemers kunnen gelijktijdig handelen.",
    },
  },
  {
    category: "e-signing",
    subcategory: "bulk_sending",
    question: "Can I send the same document to multiple people at once?",
    answer:
      "Yes, bulk sending is supported with no limit on the number of recipients. However, package credits are consumed based on unique signers: 1 credit per 2 unique signers. For example: If you have 10 signature fields but only 2 different signers, it consumes 1 credit. If you have 4 different signers, it consumes 2 credits. This applies only to signers - Form Fillers, Approvers, and Receivers don't count toward credit consumption. All recipients receive individual email notifications with their specific signing links.",
    keywords: [
      "bulk send",
      "multiple recipients",
      "mass send",
      "batch send",
      "unique signers",
      "credits",
    ],
    priority: 7,
    translations: {
      fr: "Oui, l'envoi groupé est pris en charge sans limite de destinataires. Les crédits sont consommés par groupes de 2 signataires uniques. Exemple : 10 champs de signature avec 2 signataires différents = 1 crédit. Les autres rôles ne comptent pas.",
      nl: "Ja, bulk verzenden wordt ondersteund zonder limiet op ontvangers. Credits worden verbruikt per 2 unieke ondertekenaars. Voorbeeld: 10 handtekeningvelden met 2 verschillende ondertekenaars = 1 credit. Andere rollen tellen niet mee.",
    },
  },

  // ===== SUBSCRIPTIONS CATEGORY =====
  {
    category: "subscriptions",
    subcategory: "plan_comparison",
    question: "What are the differences between Starter and Pro plans?",
    answer:
      "**Starter Plan** ($9.99/month or $105.50/year): 27 packages per month, all core features including templates, email & SMS OTP verification, all participant roles, document tracking, bulk sending, and mobile app access (except checkout). **Pro Plan** ($19.99/month or $211/year): 60 packages per month with all Starter features. Both plans include unlimited recipients, all field types, complete audit trails, and access to all platform features. The main difference is the monthly package limit. Remember: 1 package credit = 2 unique signers (other roles don't count).",
    keywords: [
      "plans",
      "pricing",
      "starter",
      "pro",
      "comparison",
      "subscription plans",
      "features",
    ],
    priority: 10,
    planSpecific: ["Starter", "Pro"],
    translations: {
      fr: "**Plan Starter** (9,99$/mois ou 105,50$/an) : 27 packages/mois. **Plan Pro** (19,99$/mois ou 211$/an) : 60 packages/mois. Les deux incluent toutes les fonctionnalités. Rappel : 1 crédit = 2 signataires uniques.",
      nl: "**Starter Plan** ($9,99/maand of $105,50/jaar): 27 pakketten/maand. **Pro Plan** ($19,99/maand of $211/jaar): 60 pakketten/maand. Beide bevatten alle functies. Let op: 1 credit = 2 unieke ondertekenaars.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "document_limits",
    question: "What happens when I reach my monthly package limit?",
    answer:
      "When you reach your monthly package limit, you won't be able to create new packages until: 1) Your subscription renews (based on your billing cycle, not calendar month - e.g., if purchased on the 27th, renews after 30 days), 2) You upgrade to a higher plan (your new limit applies immediately), or 3) You purchase a top-up. Your existing documents remain fully accessible, and recipients can still sign documents you've already sent. Top-ups add extra credits to your current balance (they stack and don't expire). Note: If you buy a different plan as a top-up, your automatic renewal will switch to that plan.",
    keywords: [
      "limit",
      "package limit",
      "monthly limit",
      "quota",
      "top-up",
      "upgrade",
      "billing cycle",
    ],
    priority: 9,
    translations: {
      fr: "À la limite : vous ne pouvez plus créer de packages jusqu'au renouvellement (cycle de facturation, pas mois calendaire), mise à niveau, ou achat de complément. Les compléments s'empilent sans expiration. Attention : acheter un autre plan comme complément change votre renouvellement automatique.",
      nl: "Bij de limiet: u kunt geen nieuwe pakketten maken tot vernieuwing (factureringscyclus, geen kalendermaand), upgrade, of aanvulling. Aanvullingen stapelen zonder te vervallen. Let op: een ander plan kopen als aanvulling wijzigt uw automatische vernieuwing.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "free_trial",
    question: "Do you offer a free trial?",
    answer:
      "Yes! We offer a 14-day free trial with 3 package credits (6 unique signers). **Valid card details are required to activate the trial**, but you will NOT be charged immediately. You can explore all features freely. If you do not cancel before the 14 days end, your paid subscription will automatically activate. You can cancel anytime during the trial to avoid any charges.",
    keywords: [
      "trial",
      "free trial",
      "card required",
      "demo",
      "test",
      "3 documents",
      "automatic activation",
    ],
    priority: 9,
    translations: {
      fr: "Oui ! Essai gratuit de 14 jours (3 crédits). **Une carte valide est requise pour l'activation**, mais vous ne serez pas débité immédiatement. L'abonnement s'active automatiquement après 14 jours sauf annulation. Annulez à tout moment pendant l'essai pour éviter les frais.",
      nl: "Ja! Gratis proefperiode van 14 dagen (3 credits). **Geldige kaartgegevens zijn vereist voor activering**, maar u wordt niet direct belast. Abonnement wordt automatisch geactiveerd na 14 dagen tenzij geannuleerd. Annuleer op elk moment tijdens de proef om kosten te vermijden.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "billing",
    question: "When will I be charged and how does billing work?",
    answer:
      "You're charged when you first subscribe (after the trial period ends) and then automatically on your renewal date based on your billing cycle (monthly or yearly). For example, if you subscribe on the 27th, your renewal is 30 days later, not on the 1st of each month. You'll receive an invoice via email after each payment. Your subscription auto-renews unless you cancel. You can view billing history, download invoices, and manage your subscription from account settings or the mobile app. Payment method updates must be done on the web platform (not available in mobile app).",
    keywords: [
      "billing",
      "payment",
      "charge",
      "invoice",
      "renewal",
      "auto-renew",
      "billing cycle",
    ],
    priority: 7,
    translations: {
      fr: "Facturation lors du premier abonnement puis automatiquement selon votre cycle (pas le mois calendaire). Exemple : abonnement le 27, renouvellement 30 jours après. Factures par email. Gestion dans les paramètres ou l'app mobile (sauf mise à jour du paiement - web uniquement).",
      nl: "Facturering bij eerste abonnement en daarna automatisch volgens uw cyclus (geen kalendermaand). Voorbeeld: abonnement op de 27e, vernieuwing 30 dagen later. Facturen per e-mail. Beheer in instellingen of mobiele app (behalve betalingsupdate - alleen web).",
    },
  },
  {
    category: "subscriptions",
    subcategory: "cancellation",
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time from your account settings (web or mobile app). When you cancel, automatic renewal is stopped, but you'll still have full access to all features until the end of your current billing period. After that, you cannot create new packages but can still access, view, and download your existing documents forever. You can re-enable automatic renewal at any time before your billing period ends. No refunds are provided for partial periods. If you want to delete your account entirely, see the account deletion process.",
    keywords: [
      "cancel",
      "cancellation",
      "unsubscribe",
      "stop subscription",
      "auto-renewal",
    ],
    priority: 8,
    translations: {
      fr: "Oui, annulation à tout moment (web ou mobile). Le renouvellement automatique s'arrête mais accès complet jusqu'à la fin de la période. Après : aucun nouveau package mais accès permanent aux documents existants. Réactivation possible avant la fin de période. Pas de remboursement partiel.",
      nl: "Ja, annuleren op elk moment (web of mobiel). Automatische vernieuwing stopt maar volledige toegang tot einde periode. Daarna: geen nieuwe pakketten maar permanente toegang tot bestaande documenten. Heractivering mogelijk voor einde periode. Geen gedeeltelijke terugbetaling.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "enterprise",
    question: "What is the Enterprise plan?",
    answer:
      "The Enterprise plan is designed for larger organizations with custom needs. Features and pricing are fully customizable based on your requirements and can include: custom package volumes, team management with user roles, workspace features (coming soon), dedicated account manager, priority support, API access, custom integrations, and bulk export capabilities. Contact our sales team at alexandros@your-career.eu to discuss your specific needs and get a custom quote tailored to your organization.",
    keywords: [
      "enterprise",
      "business",
      "custom",
      "team",
      "api",
      "large organization",
      "workspace",
    ],
    priority: 6,
    planSpecific: ["Enterprise"],
    translations: {
      fr: "Plan Enterprise pour grandes organisations avec besoins personnalisés. Tout est personnalisable : volumes, gestion d'équipe, espaces de travail (bientôt), gestionnaire dédié, API, intégrations. Contactez alexandros@your-career.eu pour un devis sur mesure.",
      nl: "Enterprise-plan voor grote organisaties met aangepaste behoeften. Alles aanpasbaar: volumes, teambeheer, werkruimten (binnenkort), toegewijde manager, API, integraties. Neem contact op met alexandros@your-career.eu voor een offerte op maat.",
    },
  },
  {
    category: "subscriptions",
    subcategory: "top_ups",
    question: "How do top-ups work?",
    answer:
      "Top-ups allow you to increase your package limit by purchasing additional plans on top of your current subscription. When you buy a top-up: 1) The credits are added immediately to your remaining balance, 2) Credits stack and never expire, 3) IMPORTANT: Your automatic renewal will change to the last plan you purchased. For example, if you have Pro and buy Starter as a top-up, your automatic renewal switches to Starter. Top-ups give you flexibility to handle temporary increases in volume without committing to a permanent upgrade.",
    keywords: [
      "top-up",
      "add credits",
      "increase limit",
      "buy more",
      "additional packages",
    ],
    priority: 7,
    translations: {
      fr: "Les compléments augmentent votre limite en achetant des plans supplémentaires. Crédits ajoutés immédiatement, s'empilent, n'expirent jamais. IMPORTANT : le renouvellement automatique passe au dernier plan acheté. Exemple : Pro + complément Starter = renouvellement Starter.",
      nl: "Aanvullingen verhogen uw limiet door extra plannen te kopen. Credits onmiddellijk toegevoegd, stapelen, vervallen nooit. BELANGRIJK: automatische vernieuwing verandert naar het laatst gekochte plan. Voorbeeld: Pro + aanvulling Starter = vernieuwing Starter.",
    },
  },

  // ===== FEATURES CATEGORY =====
  {
    category: "features",
    subcategory: "templates",
    question: "How do I create and use templates?",
    answer:
      "Templates save time by storing pre-configured documents. To create a template: 1) Upload a PDF and add all fields (text, date, signature), 2) Configure all settings (OTP methods, participant roles, field assignments), 3) Save as template instead of sending. To use a template: 1) Go to Templates section, 2) Select a template, 3) Add recipients, 4) Customize the message if needed, 5) Send. There's no limit on template creation, and using templates does NOT count toward your monthly package limit - only sending actual packages counts.",
    keywords: [
      "template",
      "templates",
      "reuse",
      "save template",
      "template creation",
      "unlimited",
    ],
    priority: 7,
    translations: {
      fr: "Les modèles économisent du temps. Création : 1) Téléchargez le PDF, ajoutez les champs, 2) Configurez tout, 3) Enregistrez comme modèle. Utilisation : sélectionnez, ajoutez destinataires, envoyez. Nombre illimité, n'affecte PAS la limite mensuelle.",
      nl: "Sjablonen besparen tijd. Maken: 1) Upload PDF, voeg velden toe, 2) Configureer alles, 3) Opslaan als sjabloon. Gebruik: selecteer, voeg ontvangers toe, verzend. Onbeperkt aantal, telt NIET mee voor maandlimiet.",
    },
  },
  {
    category: "features",
    subcategory: "field_types",
    question: "What types of fields can I add to documents?",
    answer:
      "You can add three types of fields: 1) **Text Input** - Single or multi-line text entry, supports placeholder text that can be updated by the initiator, 2) **Date** - Date picker for selecting dates, 3) **Signature** - Electronic signature field (requires OTP verification). All fields can be marked as required and assigned to specific participants. More field types (checkboxes, dropdowns, radio buttons) are planned for future releases. Fields support default placeholder values that guide recipients on what to enter.",
    keywords: [
      "fields",
      "field types",
      "signature field",
      "text field",
      "form fields",
      "date field",
      "placeholder",
    ],
    priority: 6,
    translations: {
      fr: "Trois types de champs : 1) **Saisie de texte** - Une ou plusieurs lignes, avec placeholder personnalisable, 2) **Date** - Sélecteur de date, 3) **Signature** - Nécessite OTP. Tous marquables comme requis. Plus de types à venir.",
      nl: "Drie soorten velden: 1) **Tekstinvoer** - Enkele of meerdere regels, met aanpasbare placeholder, 2) **Datum** - Datumkiezer, 3) **Handtekening** - Vereist OTP. Alle markeerbaar als verplicht. Meer types komen eraan.",
    },
  },
  {
    category: "features",
    subcategory: "expiration",
    question: "Can I set an expiration date for documents?",
    answer:
      "Yes, you can set custom expiration dates when creating packages. Choose any date you want as the 'Expires At' date. You can also enable automatic expiration reminders at flexible intervals: 1 hour before, 2 hours before, 1 day before, 2 days before, or custom intervals. Once a document expires, recipients can no longer sign it, and its status changes to 'Expired'. Expired documents remain accessible for viewing and downloading but cannot be acted upon. This is useful for time-sensitive agreements.",
    keywords: [
      "expiration",
      "expire",
      "deadline",
      "expiration date",
      "time limit",
      "reminders",
    ],
    priority: 6,
    translations: {
      fr: "Oui, définissez une date d'expiration personnalisée lors de la création. Rappels automatiques flexibles : 1h, 2h, 1 jour, 2 jours avant, ou intervalles personnalisés. Document expiré = accessible mais non modifiable. Utile pour accords urgents.",
      nl: "Ja, stel aangepaste vervaldatum in bij maken. Flexibele automatische herinneringen: 1u, 2u, 1 dag, 2 dagen voor, of aangepaste intervallen. Verlopen document = toegankelijk maar niet bewerkbaar. Handig voor tijdgevoelige overeenkomsten.",
    },
  },
  {
    category: "features",
    subcategory: "reminders",
    question: "How do automatic reminders work?",
    answer:
      "Automatic reminders send email notifications to participants who haven't completed their actions. You can configure: 1) **Action reminders** - First reminder after X days, repeat every Y days (customizable intervals like every 24 hours, 2 days, 3 days, etc.), 2) **Expiration reminders** - Sent 1 hour, 2 hours, 1 day, or 2 days before document expires. Reminders continue until all parties complete their actions OR the document expires/gets revoked. This ensures documents get completed promptly without manual follow-up. All participants receive individual reminders based on their pending actions.",
    keywords: [
      "reminders",
      "automatic reminders",
      "notifications",
      "follow-up",
      "24 hours",
      "custom intervals",
    ],
    priority: 7,
    translations: {
      fr: "Rappels automatiques pour participants n'ayant pas agi. Configuration : 1) **Rappels d'action** - Premier après X jours, répéter tous les Y jours (24h, 2 jours, etc.), 2) **Rappels d'expiration** - 1h, 2h, 1 jour, 2 jours avant. Continue jusqu'à complétion ou expiration.",
      nl: "Automatische herinneringen voor deelnemers die niet hebben gehandeld. Configuratie: 1) **Actieherinneringen** - Eerste na X dagen, herhaal elke Y dagen (24u, 2 dagen, etc.), 2) **Vervalherinneringen** - 1u, 2u, 1 dag, 2 dagen voor. Gaat door tot voltooiing of vervaldatum.",
    },
  },
  {
    category: "features",
    subcategory: "reassignment",
    question: "Can participants reassign documents to someone else?",
    answer:
      "Yes, if you enable 'Allow Reassignment' when creating the package. All assigned participants (Signers, Form Fillers, Approvers, and Receivers) can reassign their responsibility to another person by providing their email and a reason. Special case for Receivers: they can always add new receivers to the package, and if they reassign the package as a receiver, they lose access to it. The new recipient receives a notification and can complete the action. New assignees can also reassign again if the option is enabled. All reassignments are tracked in the document's audit trail with email, timestamp, and reason for compliance.",
    keywords: [
      "reassign",
      "reassignment",
      "delegate",
      "transfer",
      "change signer",
      "receiver",
    ],
    priority: 7,
    translations: {
      fr: "Oui, si 'Autoriser la réaffectation' est activée. Tous les participants peuvent réaffecter. Cas spécial Destinataires : peuvent toujours ajouter de nouveaux destinataires, perdent l'accès s'ils se réaffectent. Les nouveaux peuvent réaffecter aussi. Tout tracé dans l'audit.",
      nl: "Ja, als 'Opnieuw toewijzen toestaan' is ingeschakeld. Alle deelnemers kunnen opnieuw toewijzen. Speciaal geval Ontvangers: kunnen altijd nieuwe ontvangers toevoegen, verliezen toegang bij hertoewijzing. Nieuwe kunnen ook hertoewijzen. Alles bijgehouden in audit.",
    },
  },
  {
    category: "features",
    subcategory: "package_options",
    question: "What control options do I have when creating a package?",
    answer:
      "When creating a package, you have several control options: 1) **OTP Method** - Choose SMS, Email, or Both for signer verification, 2) **Allow Reassignment** - Let participants transfer their responsibilities to others, 3) **Allow Viewing Others** - Let participants see other participants' actions and information, 4) **Allow Download Before Signing** - Let participants download the document before completing their actions, 5) **Expiration Date** - Set when the package expires, 6) **Reminder Intervals** - Configure automatic reminder frequency (24 hours, custom intervals), 7) **Expiration Reminders** - Set alerts before expiration (1h, 2h, 1 day, 2 days). These options give you full control over the document workflow.",
    keywords: [
      "options",
      "settings",
      "controls",
      "package settings",
      "document options",
      "permissions",
    ],
    priority: 6,
    translations: {
      fr: "Options de contrôle : 1) Méthode OTP, 2) Autoriser réaffectation, 3) Autoriser voir les autres, 4) Autoriser téléchargement avant signature, 5) Date d'expiration, 6) Intervalles de rappel (24h, personnalisés), 7) Rappels d'expiration (1h, 2h, 1j, 2j). Contrôle total du flux.",
      nl: "Besturingsopties: 1) OTP-methode, 2) Opnieuw toewijzen toestaan, 3) Anderen bekijken toestaan, 4) Downloaden voor ondertekenen toestaan, 5) Vervaldatum, 6) Herinneringsintervallen (24u, aangepast), 7) Vervalherinneringen (1u, 2u, 1d, 2d). Volledige controle over workflow.",
    },
  },
  {
    category: "features",
    subcategory: "audit_trail",
    question: "What information is captured in the audit trail?",
    answer:
      "The audit trail captures complete activity history for compliance and security: 1) **Identity** - Participant's email address and role, 2) **Verification** - OTP code used for signature verification, 3) **Metadata** - IP addresses and timestamps for every action taken, 4) **Action Details** - Specific actions (viewed, signed, rejected). Unlike other platforms, our audit trail is permanently embedded at the bottom of the original PDF document upon completion. This ensures the evidence is always attached to the file itself. The data is retained forever as long as the document exists.",
    keywords: [
      "audit",
      "trail",
      "log",
      "history",
      "tracking",
      "ip address",
      "timestamp",
      "embedded",
    ],
    priority: 8,
    translations: {
      fr: "La piste d'audit capture l'historique complet : 1) **Identité** - Email et rôle, 2) **Vérification** - Code OTP utilisé, 3) **Métadonnées** - Adresses IP et horodatages. La piste d'audit est intégrée en permanence au bas du PDF original. Données conservées pour toujours.",
      nl: "De audit trail legt de volledige geschiedenis vast: 1) **Identiteit** - E-mail en rol, 2) **Verificatie** - Gebruikte OTP-code, 3) **Metadata** - IP-adressen en tijdstempels. De audit trail is permanent ingesloten onderaan de originele PDF. Gegevens blijven voor altijd bewaard.",
    },
  },

  // ===== TROUBLESHOOTING CATEGORY =====
  {
    category: "troubleshooting",
    subcategory: "otp_issues",
    question:
      "I didn't receive my OTP code or it's not working. What should I do?",
    answer:
      "If you're having OTP issues: 1) **Check Spam** - Look in your junk folder for Email OTP, 2) **Wait** - Codes are valid for 60 seconds, 3) **Retry** - You can request a new code up to 5 times. If you exceed 5 attempts, you may need to wait or contact the sender. 4) **Verification Method** - Ensure you are checking the correct channel (SMS vs Email) based on what the sender configured. If issues persist, contact the document sender to check if they entered your details correctly.",
    keywords: [
      "otp not received",
      "missing otp",
      "otp problem",
      "verification code",
      "resend otp",
      "60 seconds",
    ],
    priority: 8,
    translations: {
      fr: "Problèmes OTP : 1) Vérifiez les spams, 2) Le code est valide 60 sec, 3) Réessayez (max 5 fois). Assurez-vous de vérifier le bon canal (SMS vs Email). Si le problème persiste, contactez l'expéditeur.",
      nl: "OTP-problemen: 1) Controleer spam, 2) Code is 60 seconden geldig, 3) Probeer opnieuw (max 5 keer). Zorg ervoor dat u het juiste kanaal controleert (SMS vs E-mail). Neem bij aanhoudende problemen contact op met de afzender.",
    },
  },
  {
    category: "troubleshooting",
    subcategory: "document_upload",
    question: "Why can't I upload my document?",
    answer:
      "If upload fails, check these requirements: 1) **File Format** - We currently support PDF files ONLY. Word, JPG, or other formats must be converted to PDF first. 2) **File Size** - The maximum file size is 10MB. If your file is larger, please compress it before uploading. 3) **Corrupted File** - Try opening the PDF on your computer to ensure it's not corrupted. 4) **Connection** - Ensure you have a stable internet connection.",
    keywords: [
      "upload failed",
      "can't upload",
      "upload error",
      "pdf upload",
      "file size",
      "10mb",
      "format",
    ],
    priority: 7,
    translations: {
      fr: "Échec du téléchargement ? 1) **Format** - PDF uniquement, 2) **Taille** - Max 10 Mo (compressez si nécessaire), 3) **Fichier** - Vérifiez qu'il n'est pas corrompu. Convertissez les autres formats en PDF avant de télécharger.",
      nl: "Upload mislukt? 1) **Formaat** - Alleen PDF, 2) **Grootte** - Max 10 MB (comprimeren indien nodig), 3) **Bestand** - Controleer of het niet beschadigd is. Converteer andere formaten naar PDF voor het uploaden.",
    },
  },
  {
    category: "troubleshooting",
    subcategory: "email_not_received",
    question: "Recipients aren't receiving email notifications. Why?",
    answer:
      "If recipients aren't receiving emails: 1) Ask them to check spam/junk folders, 2) Verify email addresses are correct (no typos), 3) Ensure the sender domain 'noreply@yourdomain.com' is not blocked. Note that delivery can sometimes take a few minutes. If the status is still 'Pending', you can try resending the notification from the document details page.",
    keywords: [
      "email not received",
      "no notification",
      "missing email",
      "email delivery",
      "spam",
    ],
    priority: 7,
    translations: {
      fr: "Si pas d'email : 1) Vérifiez les spams, 2) Vérifiez les fautes de frappe dans l'adresse, 3) Vérifiez que le domaine n'est pas bloqué. La livraison peut prendre quelques minutes. Vous pouvez renvoyer la notification depuis les détails.",
      nl: "Als geen e-mail: 1) Controleer spam, 2) Controleer typfouten in adres, 3) Controleer of domein niet geblokkeerd is. Bezorging kan enkele minuten duren. U kunt de melding opnieuw verzenden vanuit details.",
    },
  },

  // ===== ACCOUNT & MOBILE CATEGORY =====
  {
    category: "account",
    subcategory: "mobile_app",
    question: "Is there a mobile app available?",
    answer:
      "Yes! Our mobile app is available on both Apple App Store and Google Play Store for all users. You can perform almost all actions on the app including: creating packages, sending documents, tracking status, signing, managing your profile, and downloading invoices. **Limitation:** Purchasing new subscriptions or top-ups (Checkout) must be done via the web browser version; these features are not available in the app. Offline signing is currently not supported; you need an active internet connection.",
    keywords: [
      "mobile app",
      "ios",
      "android",
      "app store",
      "google play",
      "phone",
      "tablet",
    ],
    priority: 9,
    translations: {
      fr: "Oui ! App disponible sur Apple Store et Google Play. Vous pouvez tout faire (créer, envoyer, signer, suivre) sauf l'achat d'abonnements/compléments qui se fait via le navigateur web. Connexion internet requise (pas de mode hors ligne).",
      nl: "Ja! App beschikbaar op Apple Store en Google Play. U kunt alles doen (maken, verzenden, ondertekenen, volgen) behalve abonnementen/aanvullingen kopen (alleen via web). Internetverbinding vereist (geen offline modus).",
    },
  },
  {
    category: "account",
    subcategory: "password_reset",
    question: "How do I reset my password?",
    answer:
      "To reset your password: 1) Go to the login page, 2) Click 'Forgot Password', 3) Enter your email address, 4) Check your email for a reset link, 5) Click the link and set a new password. The link expires after 1 hour. If you don't see the email, check spam. If you need to update your profile info (name, language, etc.), you can do that inside your account settings on both web and mobile.",
    keywords: [
      "password reset",
      "forgot password",
      "change password",
      "reset password",
    ],
    priority: 6,
    translations: {
      fr: "Pour réinitialiser : 1) Page de connexion -> 'Mot de passe oublié', 2) Entrez l'email, 3) Cliquez sur le lien reçu (valide 1h). Vérifiez les spams si non reçu. Mise à jour du profil disponible dans les paramètres.",
      nl: "Om te resetten: 1) Inlogpagina -> 'Wachtwoord vergeten', 2) Voer e-mail in, 3) Klik op ontvangen link (1u geldig). Controleer spam indien niet ontvangen. Profielupdate beschikbaar in instellingen.",
    },
  },
  {
    category: "account",
    subcategory: "account_deletion",
    question: "How do I delete my account?",
    answer:
      "To delete your account: 1) Go to Account Settings, 2) Select 'Delete Account', 3) Confirm request. Your account will be deactivated immediately. There is a **14-day grace period** during which you can reactivate your account via a link sent to your email. After 14 days, your account and all associated documents will be permanently deleted. Note: Cancelling a subscription is different; cancelling simply stops auto-renewal while keeping your account active.",
    keywords: [
      "delete account",
      "close account",
      "account deletion",
      "remove account",
      "grace period",
    ],
    priority: 5,
    translations: {
      fr: "Pour supprimer : Paramètres -> Supprimer le compte. Période de grâce de 14 jours pour réactivation. Après 14 jours, suppression permanente des données. L'annulation d'abonnement est différente (arrête juste le paiement).",
      nl: "Om te verwijderen: Instellingen -> Account verwijderen. 14 dagen respijtperiode voor heractivering. Na 14 dagen permanente verwijdering van gegevens. Abonnement annuleren is anders (stopt alleen betaling).",
    },
  },

  // ===== SECURITY & TECH CATEGORY =====
  {
    category: "security",
    subcategory: "data_security",
    question: "Is my data secure and where is it stored?",
    answer:
      "Yes, security is our priority. 1) **Storage** - All documents and data are securely stored on AWS S3 (Region: East-US-1), 2) **Encryption** - Data is encrypted in transit and at rest, 3) **Compliance** - We are GDPR compliant and follow EU regulations. 4) **Retention** - Your data and completed documents are retained forever as long as your account exists. We do not share your data with third parties.",
    keywords: [
      "security",
      "data security",
      "encryption",
      "aws",
      "storage",
      "location",
      "gdpr",
      "retention",
    ],
    priority: 8,
    translations: {
      fr: "Oui. 1) **Stockage** - Sécurisé sur AWS S3 (East-US-1), 2) **Chiffrement** - En transit et au repos, 3) **Conformité** - Conforme GDPR/UE. 4) **Rétention** - Données conservées pour toujours tant que le compte existe.",
      nl: "Ja. 1) **Opslag** - Veilig op AWS S3 (East-US-1), 2) **Versleuteling** - Tijdens verzending en opslag, 3) **Naleving** - GDPR/EU-conform. 4) **Bewaring** - Gegevens voor altijd bewaard zolang account bestaat.",
    },
  },
  {
    category: "security",
    subcategory: "document_validity",
    question: "Are electronically signed documents legally valid?",
    answer:
      "Yes. Our electronic signatures are legally valid and binding in the EU, US, and many other jurisdictions. We comply with major regulations like eIDAS (EU) and ESIGN (US). Key validity features include: OTP authentication for identity verification, tamper-evident documents, and a comprehensive audit trail embedded in every PDF (containing IP, timestamp, and user details). Any type of document can be signed using our platform.",
    keywords: [
      "legal",
      "validity",
      "legally binding",
      "law",
      "compliance",
      "esign",
      "eidas",
      "audit trail",
    ],
    priority: 7,
    translations: {
      fr: "Oui, légalement valides (UE, US, etc.). Conforme eIDAS et ESIGN. Caractéristiques : authentification OTP, documents inviolables, piste d'audit intégrée (IP, horodatage). Tout type de document peut être signé.",
      nl: "Ja, juridisch geldig (EU, VS, enz.). Voldoet aan eIDAS en ESIGN. Kenmerken: OTP-authenticatie, fraudebestendige documenten, ingesloten audit trail (IP, tijdstempel). Elk type document kan worden ondertekend.",
    },
  },

  // ===== GENERAL & SUPPORT CATEGORY =====
  {
    category: "general",
    subcategory: "getting_started",
    question: "I'm new. Where do I start?",
    answer:
      "Welcome! 1) **Sign Up** - Create an account with your email, 2) **Start Trial** - Enter valid card details to activate your 14-day free trial (no immediate charge), 3) **Create Package** - Upload a PDF (max 10MB), 4) **Add Participants** - Assign roles (Signer, Form Filler, etc.), 5) **Send**. You can use the web platform or our mobile app to track your documents!",
    keywords: [
      "getting started",
      "new user",
      "how to start",
      "beginner",
      "first time",
      "app",
    ],
    priority: 9,
    translations: {
      fr: "Bienvenue ! 1) Inscrivez-vous, 2) **Démarrez l'essai** - Entrez votre carte pour activer l'essai gratuit (pas de débit immédiat), 3) Créez un package, 4) Ajoutez des participants, 5) Envoyez. Utilisez le web ou l'app pour le suivi !",
      nl: "Welkom! 1) Meld u aan, 2) **Start proefperiode** - Voer kaartgegevens in om te activeren (geen directe kosten), 3) Maak pakket, 4) Voeg deelnemers toe, 5) Verzenden. Gebruik web of app om te volgen!",
    },
  },
  {
    category: "general",
    subcategory: "languages_integrations",
    question: "What languages and integrations are supported?",
    answer:
      "**Languages:** The platform supports over 10 languages including English, Arabic, Chinese, Japanese, Greek, Russian, French, Dutch, and more. You can change your language preference in profile settings. **Integrations:** We support Vivawallet webhooks for payment processing. Team workspaces and more advanced integrations are coming soon.",
    keywords: [
      "languages",
      "translation",
      "arabic",
      "chinese",
      "greek",
      "integrations",
      "vivawallet",
      "webhooks",
    ],
    priority: 6,
    translations: {
      fr: "**Langues :** +10 supportées (Anglais, Arabe, Chinois, Grec, Russe, etc.). **Intégrations :** Webhooks Vivawallet supportés. Espaces de travail d'équipe à venir.",
      nl: "**Talen:** +10 ondersteund (Engels, Arabisch, Chinees, Grieks, Russisch, enz.). **Integraties:** Vivawallet webhooks ondersteund. Teamwerkruimten komen binnenkort.",
    },
  },
  {
    category: "general",
    subcategory: "contact_support",
    question: "How do I contact customer support?",
    answer:
      "We offer 24/7 support! You can reach us via email at **alexandros@your-career.eu**. We aim to respond ASAP. While we don't have a live chat widget yet, you can contact the CEO directly via the email provided for any urgent issues. For Enterprise inquiries, please use the same contact email to discuss custom needs.",
    keywords: ["support", "contact", "help", "email", "24/7", "alexandros"],
    priority: 8,
    translations: {
      fr: "Support 24/7 ! Contactez-nous par email à **alexandros@your-career.eu**. Réponse rapide. Pas de chat en direct pour le moment, mais contact direct possible pour les urgences. Pour Enterprise, utilisez le même email.",
      nl: "24/7 ondersteuning! Neem contact op via **alexandros@your-career.eu**. Snelle reactie. Nog geen live chat, maar direct contact mogelijk voor noodgevallen. Voor Enterprise, gebruik hetzelfde e-mailadres.",
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
    console.log(
      `✅ Successfully seeded ${knowledgeBase.length} knowledge base entries!`
    );

    console.log("🎉 Chatbot knowledge base seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
})();
