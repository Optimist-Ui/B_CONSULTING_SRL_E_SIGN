/**
 * Centralized SMS content for all supported languages
 * Structure: [smsType][language]
 */
const smsContent = {
  signatureOtp: {
    en: {
      message: "Hi {{recipient_name}}, your signature OTP for document \"{{document_name}}\" is: {{otp}}. Valid for 1 minute. Do not share this code."
    },
    es: {
      message: "Hola {{recipient_name}}, tu código OTP de firma para el documento \"{{document_name}}\" es: {{otp}}. Válido por 1 minuto. No compartas este código."
    },
    fr: {
      message: "Bonjour {{recipient_name}}, votre code OTP de signature pour le document \"{{document_name}}\" est : {{otp}}. Valable 1 minute. Ne partagez pas ce code."
    },
    de: {
      message: "Hallo {{recipient_name}}, Ihr Signatur-OTP-Code für das Dokument \"{{document_name}}\" lautet: {{otp}}. Gültig für 1 Minute. Teilen Sie diesen Code nicht."
    },
    it: {
      message: "Ciao {{recipient_name}}, il tuo codice OTP per la firma del documento \"{{document_name}}\" è: {{otp}}. Valido per 1 minuto. Non condividere questo codice."
    },
    el: {
      message: "Γεια σας {{recipient_name}}, ο κωδικός OTP υπογραφής σας για το έγγραφο \"{{document_name}}\" είναι: {{otp}}. Ισχύει για 1 λεπτό. Μην μοιραστείτε αυτόν τον κωδικό."
    }
  }
};

/**
 * Get SMS content for a specific SMS type and language
 * @param {string} smsType - Type of SMS (e.g., 'signatureOtp')
 * @param {string} language - Language code (e.g., 'en', 'es')
 * @returns {object} Content object for the SMS
 */
function getSmsContent(smsType, language = "en") {
  const supportedLanguages = ["en", "es", "fr", "de", "it", "el"];
  const lang = supportedLanguages.includes(language) ? language : "en";

  if (!smsContent[smsType]) {
    throw new Error(
      `SMS type "${smsType}" not found in SMS content configuration`
    );
  }

  return smsContent[smsType][lang] || smsContent[smsType]["en"];
}

module.exports = { getSmsContent };