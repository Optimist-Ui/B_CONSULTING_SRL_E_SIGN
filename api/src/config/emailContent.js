// config/emailContent.js

/**
 * Centralized email content for all supported languages
 * Structure: [emailType][language][contentKey]
 */
const emailContent = {
  welcome: {
    en: {
      subject: "Welcome to I-Sign.eu",
      heading: "Welcome Aboard!",
      greeting:
        "Hello {{name}}, your account has been successfully verified. You can now log in to start managing your documents securely.",
      buttonText: "Log In Now",
      closingText: "We're excited to have you with us.",
      supportText: "Questions? Contact us at",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, City, State 12345",
      unsubscribe: "Unsubscribe",
      preferences: "Preferences",
    },
    es: {
      subject: "Bienvenido a I-Sign.eu",
      heading: "¡Bienvenido a bordo!",
      greeting:
        "Hola {{name}}, tu cuenta ha sido verificada con éxito. Ahora puedes iniciar sesión para comenzar a gestionar tus documentos de forma segura.",
      buttonText: "Iniciar sesión ahora",
      closingText: "Estamos emocionados de tenerte con nosotros.",
      supportText: "¿Preguntas? Contáctanos en",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Ciudad, Estado 12345",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias",
    },
    fr: {
      subject: "Bienvenue sur I-Sign.eu",
      heading: "Bienvenue à bord !",
      greeting:
        "Bonjour {{name}}, votre compte a été vérifié avec succès. Vous pouvez maintenant vous connecter pour commencer à gérer vos documents en toute sécurité.",
      buttonText: "Se connecter maintenant",
      closingText: "Nous sommes ravis de vous compter parmi nous.",
      supportText: "Des questions ? Contactez-nous à",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Ville, État 12345",
      unsubscribe: "Se désabonner",
      preferences: "Préférences",
    },
    de: {
      subject: "Willkommen bei I-Sign.eu",
      heading: "Willkommen an Bord!",
      greeting:
        "Hallo {{name}}, Ihr Konto wurde erfolgreich verifiziert. Sie können sich jetzt anmelden, um Ihre Dokumente sicher zu verwalten.",
      buttonText: "Jetzt anmelden",
      closingText: "Wir freuen uns, Sie bei uns zu haben.",
      supportText: "Fragen? Kontaktieren Sie uns unter",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Stadt, Staat 12345",
      unsubscribe: "Abmelden",
      preferences: "Einstellungen",
    },
    it: {
      subject: "Benvenuto su I-Sign.eu",
      heading: "Benvenuto a bordo!",
      greeting:
        "Ciao {{name}}, il tuo account è stato verificato con successo. Ora puoi accedere per iniziare a gestire i tuoi documenti in sicurezza.",
      buttonText: "Accedi ora",
      closingText: "Siamo entusiasti di averti con noi.",
      supportText: "Domande? Contattaci a",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Città, Stato 12345",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze",
    },
    el: {
      subject: "Καλώς ήρθατε στο I-Sign.eu",
      heading: "Καλώς ήρθατε!",
      greeting:
        "Γεια σας {{name}}, ο λογαριασμός σας επαληθεύτηκε με επιτυχία. Μπορείτε τώρα να συνδεθείτε για να ξεκινήσετε τη διαχείριση των εγγράφων σας με ασφάλεια.",
      buttonText: "Συνδεθείτε τώρα",
      closingText: "Είμαστε ενθουσιασμένοι που είστε μαζί μας.",
      supportText: "Ερωτήσεις; Επικοινωνήστε μαζί μας στο",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Πόλη, Πολιτεία 12345",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις",
    },
  },
  verification: {
    en: {
      subject: "Verify Your Account",
      heading: "Verify Your Email",
      message:
        "Please confirm your email address to complete your account setup.",
      buttonText: "Verify Email",
      expiryText: "This link will expire in 1 hour for security purposes.",
      alternativeText: "Can't click the button? Copy this link:",
      supportText: "Questions? Contact us at",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, City, State 12345",
      unsubscribe: "Unsubscribe",
      preferences: "Preferences",
    },
    es: {
      subject: "Verifica tu cuenta",
      heading: "Verifica tu correo electrónico",
      message:
        "Por favor, confirma tu dirección de correo electrónico para completar la configuración de tu cuenta.",
      buttonText: "Verificar correo",
      expiryText: "Este enlace expirará en 1 hora por razones de seguridad.",
      alternativeText: "¿No puedes hacer clic en el botón? Copia este enlace:",
      supportText: "¿Preguntas? Contáctanos en",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Ciudad, Estado 12345",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias",
    },
    fr: {
      subject: "Vérifiez votre compte",
      heading: "Vérifiez votre e-mail",
      message:
        "Veuillez confirmer votre adresse e-mail pour terminer la configuration de votre compte.",
      buttonText: "Vérifier l'e-mail",
      expiryText: "Ce lien expirera dans 1 heure pour des raisons de sécurité.",
      alternativeText:
        "Vous ne pouvez pas cliquer sur le bouton ? Copiez ce lien :",
      supportText: "Des questions ? Contactez-nous à",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Ville, État 12345",
      unsubscribe: "Se désabonner",
      preferences: "Préférences",
    },
    de: {
      subject: "Bestätigen Sie Ihr Konto",
      heading: "Bestätigen Sie Ihre E-Mail",
      message:
        "Bitte bestätigen Sie Ihre E-Mail-Adresse, um die Einrichtung Ihres Kontos abzuschließen.",
      buttonText: "E-Mail bestätigen",
      expiryText: "Dieser Link läuft aus Sicherheitsgründen in 1 Stunde ab.",
      alternativeText:
        "Können Sie nicht auf die Schaltfläche klicken? Kopieren Sie diesen Link:",
      supportText: "Fragen? Kontaktieren Sie uns unter",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Stadt, Staat 12345",
      unsubscribe: "Abmelden",
      preferences: "Einstellungen",
    },
    it: {
      subject: "Verifica il tuo account",
      heading: "Verifica la tua email",
      message:
        "Conferma il tuo indirizzo email per completare la configurazione del tuo account.",
      buttonText: "Verifica email",
      expiryText: "Questo link scadrà tra 1 ora per motivi di sicurezza.",
      alternativeText: "Non riesci a cliccare sul pulsante? Copia questo link:",
      supportText: "Domande? Contattaci a",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Città, Stato 12345",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze",
    },
    el: {
      subject: "Επαληθεύστε τον λογαριασμό σας",
      heading: "Επαληθεύστε το email σας",
      message:
        "Επιβεβαιώστε τη διεύθυνση email σας για να ολοκληρώσετε τη ρύθμιση του λογαριασμού σας.",
      buttonText: "Επαλήθευση email",
      expiryText: "Αυτός ο σύνδεσμος θα λήξει σε 1 ώρα για λόγους ασφαλείας.",
      alternativeText:
        "Δεν μπορείτε να κάνετε κλικ στο κουμπί; Αντιγράψτε αυτόν τον σύνδεσμο:",
      supportText: "Ερωτήσεις; Επικοινωνήστε μαζί μας στο",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Πόλη, Πολιτεία 12345",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις",
    },
  },
  passwordReset: {
    en: {
      subject: "Reset Your Password",
      heading: "Reset Your Password",
      greeting: "Hello {{name}},",
      message:
        "A password reset was requested for your account. Please click the button below to set a new password.",
      buttonText: "Reset Password",
      ignoreText:
        "If you didn't request this, you can safely ignore this email.",
      alternativeText: "Can't click the button? Copy this link:",
      supportText: "Questions? Contact us at",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, City, State 12345",
      unsubscribe: "Unsubscribe",
      preferences: "Preferences",
    },
    es: {
      subject: "Restablece tu contraseña",
      heading: "Restablece tu contraseña",
      greeting: "Hola {{name}},",
      message:
        "Se solicitó un restablecimiento de contraseña para tu cuenta. Haz clic en el botón de abajo para establecer una nueva contraseña.",
      buttonText: "Restablecer contraseña",
      ignoreText:
        "Si no solicitaste esto, puedes ignorar este correo con seguridad.",
      alternativeText: "¿No puedes hacer clic en el botón? Copia este enlace:",
      supportText: "¿Preguntas? Contáctanos en",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Ciudad, Estado 12345",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias",
    },
    fr: {
      subject: "Réinitialisez votre mot de passe",
      heading: "Réinitialisez votre mot de passe",
      greeting: "Bonjour {{name}},",
      message:
        "Une réinitialisation de mot de passe a été demandée pour votre compte. Veuillez cliquer sur le bouton ci-dessous pour définir un nouveau mot de passe.",
      buttonText: "Réinitialiser le mot de passe",
      ignoreText:
        "Si vous n'avez pas demandé cela, vous pouvez ignorer cet e-mail en toute sécurité.",
      alternativeText:
        "Vous ne pouvez pas cliquer sur le bouton ? Copiez ce lien :",
      supportText: "Des questions ? Contactez-nous à",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Ville, État 12345",
      unsubscribe: "Se désabonner",
      preferences: "Préférences",
    },
    de: {
      subject: "Setzen Sie Ihr Passwort zurück",
      heading: "Setzen Sie Ihr Passwort zurück",
      greeting: "Hallo {{name}},",
      message:
        "Es wurde eine Passwortzurücksetzung für Ihr Konto angefordert. Bitte klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen.",
      buttonText: "Passwort zurücksetzen",
      ignoreText:
        "Wenn Sie dies nicht angefordert haben, können Sie diese E-Mail sicher ignorieren.",
      alternativeText:
        "Können Sie nicht auf die Schaltfläche klicken? Kopieren Sie diesen Link:",
      supportText: "Fragen? Kontaktieren Sie uns unter",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Stadt, Staat 12345",
      unsubscribe: "Abmelden",
      preferences: "Einstellungen",
    },
    it: {
      subject: "Reimposta la tua password",
      heading: "Reimposta la tua password",
      greeting: "Ciao {{name}},",
      message:
        "È stata richiesta una reimpostazione della password per il tuo account. Clicca sul pulsante qui sotto per impostare una nuova password.",
      buttonText: "Reimposta password",
      ignoreText:
        "Se non hai richiesto questo, puoi tranquillamente ignorare questa email.",
      alternativeText: "Non riesci a cliccare sul pulsante? Copia questo link:",
      supportText: "Domande? Contattaci a",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Città, Stato 12345",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze",
    },
    el: {
      subject: "Επαναφέρετε τον κωδικό σας",
      heading: "Επαναφέρετε τον κωδικό σας",
      greeting: "Γεια σας {{name}},",
      message:
        "Ζητήθηκε επαναφορά κωδικού για τον λογαριασμό σας. Κάντε κλικ στο παρακάτω κουμπί για να ορίσετε νέο κωδικό.",
      buttonText: "Επαναφορά κωδικού",
      ignoreText:
        "Εάν δεν ζητήσατε αυτό, μπορείτε να αγνοήσετε με ασφάλεια αυτό το email.",
      alternativeText:
        "Δεν μπορείτε να κάνετε κλικ στο κουμπί; Αντιγράψτε αυτόν τον σύνδεσμο:",
      supportText: "Ερωτήσεις; Επικοινωνήστε μαζί μας στο",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Πόλη, Πολιτεία 12345",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις",
    },
  },
  passwordResetSuccess: {
    en: {
      subject: "Your Password Was Changed",
      heading: "Password Changed Successfully",
      greeting: "Hello {{name}},",
      message:
        "This email confirms that the password for your I-Sign account has been successfully updated.",
      loginButtonText: "Login to Your Account",
      securityHeading: "Didn't make this change?",
      securityMessage:
        "If you did not change your password, your account may be compromised. Reset your password immediately to secure your account.",
      securityButtonText: "Reset Password Now",
      supportFollowUpText:
        "For additional security concerns, please contact our support team immediately.",
      supportText: "Questions? Contact us at",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, City, State 12345",
      unsubscribe: "Unsubscribe",
      preferences: "Preferences",
    },
    es: {
      subject: "Tu contraseña ha sido cambiada",
      heading: "Contraseña cambiada con éxito",
      greeting: "Hola {{name}},",
      message:
        "Este correo confirma que la contraseña de tu cuenta de I-Sign ha sido actualizada correctamente.",
      loginButtonText: "Iniciar sesión en tu cuenta",
      securityHeading: "¿No hiciste este cambio?",
      securityMessage:
        "Si no cambiaste tu contraseña, tu cuenta podría estar en riesgo. Restablece tu contraseña inmediatamente para asegurar tu cuenta.",
      securityButtonText: "Restablecer contraseña ahora",
      supportFollowUpText:
        "Para preocupaciones de seguridad adicionales, por favor contacta a nuestro equipo de soporte de inmediato.",
      supportText: "¿Preguntas? Contáctanos en",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Ciudad, Estado 12345",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias",
    },
    fr: {
      subject: "Votre mot de passe a été modifié",
      heading: "Mot de passe modifié avec succès",
      greeting: "Bonjour {{name}},",
      message:
        "Cet e-mail confirme que le mot de passe de votre compte I-Sign a été mis à jour avec succès.",
      loginButtonText: "Connectez-vous à votre compte",
      securityHeading: "Vous n'êtes pas à l'origine de ce changement ?",
      securityMessage:
        "Si vous n'avez pas changé votre mot de passe, votre compte pourrait être compromis. Réinitialisez votre mot de passe immédiatement pour sécuriser votre compte.",
      securityButtonText: "Réinitialiser le mot de passe maintenant",
      supportFollowUpText:
        "Pour des problèmes de sécurité supplémentaires, veuillez contacter notre équipe de support immédiatement.",
      supportText: "Des questions ? Contactez-nous à",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Ville, État 12345",
      unsubscribe: "Se désabonner",
      preferences: "Préférences",
    },
    de: {
      subject: "Ihr Passwort wurde geändert",
      heading: "Passwort erfolgreich geändert",
      greeting: "Hallo {{name}},",
      message:
        "Diese E-Mail bestätigt, dass das Passwort für Ihr I-Sign-Konto erfolgreich aktualisiert wurde.",
      loginButtonText: "Melden Sie sich bei Ihrem Konto an",
      securityHeading: "Haben Sie diese Änderung nicht vorgenommen?",
      securityMessage:
        "Wenn Sie Ihr Passwort nicht geändert haben, könnte Ihr Konto kompromittiert sein. Setzen Sie Ihr Passwort sofort zurück, um Ihr Konto zu sichern.",
      securityButtonText: "Passwort jetzt zurücksetzen",
      supportFollowUpText:
        "Bei weiteren Sicherheitsbedenken kontaktieren Sie bitte umgehend unser Support-Team.",
      supportText: "Fragen? Kontaktieren Sie uns unter",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Stadt, Staat 12345",
      unsubscribe: "Abmelden",
      preferences: "Einstellungen",
    },
    it: {
      subject: "La tua password è stata cambiata",
      heading: "Password cambiata con successo",
      greeting: "Ciao {{name}},",
      message:
        "Questa email conferma che la password del tuo account I-Sign è stata aggiornata con successo.",
      loginButtonText: "Accedi al tuo account",
      securityHeading: "Non hai effettuato tu questa modifica?",
      securityMessage:
        "Se non hai cambiato tu la password, il tuo account potrebbe essere compromesso. Reimposta immediatamente la password per proteggere il tuo account.",
      securityButtonText: "Reimposta password ora",
      supportFollowUpText:
        "Per ulteriori problemi di sicurezza, contatta immediatamente il nostro team di supporto.",
      supportText: "Domande? Contattaci a",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Città, Stato 12345",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze",
    },
    el: {
      subject: "Ο κωδικός πρόσβασής σας άλλαξε",
      heading: "Ο κωδικός πρόσβασης άλλαξε με επιτυχία",
      greeting: "Γεια σας {{name}},",
      message:
        "Αυτό το email επιβεβαιώνει ότι ο κωδικός πρόσβασης για τον λογαριασμό σας στο I-Sign ενημερώθηκε με επιτυχία.",
      loginButtonText: "Συνδεθείτε στον λογαριασμό σας",
      securityHeading: "Δεν κάνατε εσείς αυτήν την αλλαγή;",
      securityMessage:
        "Εάν δεν αλλάξατε τον κωδικό πρόσβασής σας, ο λογαριασμός σας μπορεί να είναι εκτεθειμένος. Επαναφέρετε τον κωδικό πρόσβασής σας αμέσως για να ασφαλίσετε τον λογαριασμό σας.",
      securityButtonText: "Επαναφορά κωδικού τώρα",
      supportFollowUpText:
        "Για πρόσθετες ανησυχίες ασφαλείας, επικοινωνήστε αμέσως με την ομάδα υποστήριξής μας.",
      supportText: "Ερωτήσεις; Επικοινωνήστε μαζί μας στο",
      companyInfo: "I-Sign Inc.<br>1234 Business Street, Πόλη, Πολιτεία 12345",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις",
    },
  },
  emailChangeOtp: {
    en: {
      subject: "Verify Your Email Change",
      heading: "Verify Email Change",
      greeting: "Hello {{name}},",
      requestMessage: "We received a request to change your email address to:",
      confirmationInstruction:
        "To confirm this change, please enter the verification code below:",
      expiryText:
        "This code will expire in 5 minutes. Do not share it with anyone.",
      securityHeading: "Security Alert:",
      securityMessage:
        "If you didn't request this change, please ignore this email and consider changing your password.",
      ignoreText:
        "If you did not request this change, you can safely ignore this email.",
    },
    es: {
      subject: "Verifica tu cambio de correo electrónico",
      heading: "Verificar cambio de correo",
      greeting: "Hola {{name}},",
      requestMessage:
        "Recibimos una solicitud para cambiar tu dirección de correo a:",
      confirmationInstruction:
        "Para confirmar este cambio, por favor ingresa el siguiente código de verificación:",
      expiryText:
        "Este código expirará en 5 minutos. No lo compartas con nadie.",
      securityHeading: "Alerta de seguridad:",
      securityMessage:
        "Si no solicitaste este cambio, por favor ignora este correo y considera cambiar tu contraseña.",
      ignoreText:
        "Si no solicitaste este cambio, puedes ignorar este correo de forma segura.",
    },
    fr: {
      subject: "Vérifiez votre changement d'e-mail",
      heading: "Vérifier le changement d'e-mail",
      greeting: "Bonjour {{name}},",
      requestMessage:
        "Nous avons reçu une demande pour changer votre adresse e-mail en :",
      confirmationInstruction:
        "Pour confirmer ce changement, veuillez saisir le code de vérification ci-dessous :",
      expiryText:
        "Ce code expirera dans 5 minutes. Ne le partagez avec personne.",
      securityHeading: "Alerte de sécurité :",
      securityMessage:
        "Si vous n'avez pas demandé ce changement, veuillez ignorer cet e-mail et envisager de changer votre mot de passe.",
      ignoreText:
        "Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet e-mail en toute sécurité.",
    },
    de: {
      subject: "Bestätigen Sie Ihre E-Mail-Änderung",
      heading: "E-Mail-Änderung überprüfen",
      greeting: "Hallo {{name}},",
      requestMessage:
        "Wir haben eine Anfrage erhalten, Ihre E-Mail-Adresse zu ändern in:",
      confirmationInstruction:
        "Um diese Änderung zu bestätigen, geben Sie bitte den folgenden Bestätigungscode ein:",
      expiryText:
        "Dieser Code läuft in 5 Minuten ab. Teilen Sie ihn mit niemandem.",
      securityHeading: "Sicherheitswarnung:",
      securityMessage:
        "Wenn Sie diese Änderung nicht angefordert haben, ignorieren Sie bitte diese E-Mail und erwägen Sie, Ihr Passwort zu ändern.",
      ignoreText:
        "Wenn Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail sicher ignorieren.",
    },
    it: {
      subject: "Verifica la modifica della tua email",
      heading: "Verifica modifica email",
      greeting: "Ciao {{name}},",
      requestMessage:
        "Abbiamo ricevuto una richiesta per cambiare il tuo indirizzo email in:",
      confirmationInstruction:
        "Per confermare questa modifica, inserisci il codice di verifica qui sotto:",
      expiryText:
        "Questo codice scadrà tra 5 minuti. Non condividerlo con nessuno.",
      securityHeading: "Avviso di sicurezza:",
      securityMessage:
        "Se non hai richiesto questa modifica, ignora questa email e considera di cambiare la tua password.",
      ignoreText:
        "Se non hai richiesto questa modifica, puoi tranquillamente ignorare questa email.",
    },
    el: {
      subject: "Επαληθεύστε την αλλαγή του email σας",
      heading: "Επαλήθευση αλλαγής email",
      greeting: "Γεια σας {{name}},",
      requestMessage:
        "Λάβαμε ένα αίτημα για αλλαγή της διεύθυνσης email σας σε:",
      confirmationInstruction:
        "Για να επιβεβαιώσετε αυτή την αλλαγή, παρακαλώ εισάγετε τον παρακάτω κωδικό επαλήθευσης:",
      expiryText:
        "Αυτός ο κωδικός θα λήξει σε 5 λεπτά. Μην τον μοιράζεστε με κανέναν.",
      securityHeading: "Ειδοποίηση ασφαλείας:",
      securityMessage:
        "Εάν δεν ζητήσατε αυτή την αλλαγή, παρακαλούμε αγνοήστε αυτό το email και εξετάστε το ενδεχόμενο να αλλάξετε τον κωδικό πρόσβασής σας.",
      ignoreText:
        "Αν δεν ζητήσατε αυτή την αλλαγή, μπορείτε να αγνοήσετε αυτό το email με ασφάλεια.",
    },
  },
  emailChangeConfirmation: {
    en: {
      subject: "Your Email Has Been Updated",
      heading: "Email Updated Successfully",
      greeting: "Hello {{name}},",
      message: "Your email address has been successfully updated to:",
      loginInstruction:
        "You can now use this email address to log in to your account.",
      noteHeading: "Note:",
      noteMessage:
        "If you didn't make this change, please contact our support team immediately.",
      footerText: "© 2025 iSign. All rights reserved.",
    },
    es: {
      subject: "Tu correo electrónico ha sido actualizado",
      heading: "Correo electrónico actualizado con éxito",
      greeting: "Hola {{name}},",
      message:
        "Tu dirección de correo electrónico ha sido actualizada con éxito a:",
      loginInstruction:
        "Ahora puedes usar esta dirección de correo para iniciar sesión en tu cuenta.",
      noteHeading: "Nota:",
      noteMessage:
        "Si no hiciste este cambio, por favor contacta a nuestro equipo de soporte de inmediato.",
      footerText: "© 2025 iSign. Todos los derechos reservados.",
    },
    fr: {
      subject: "Votre e-mail a été mis à jour",
      heading: "E-mail mis à jour avec succès",
      greeting: "Bonjour {{name}},",
      message: "Votre adresse e-mail a été mise à jour avec succès en :",
      loginInstruction:
        "Vous pouvez maintenant utiliser cette adresse e-mail pour vous connecter à votre compte.",
      noteHeading: "Remarque :",
      noteMessage:
        "Si vous n'avez pas effectué ce changement, veuillez contacter notre équipe de support immédiatement.",
      footerText: "© 2025 iSign. Tous droits réservés.",
    },
    de: {
      subject: "Ihre E-Mail wurde aktualisiert",
      heading: "E-Mail erfolgreich aktualisiert",
      greeting: "Hallo {{name}},",
      message: "Ihre E-Mail-Adresse wurde erfolgreich aktualisiert auf:",
      loginInstruction:
        "Sie können diese E-Mail-Adresse jetzt zum Anmelden bei Ihrem Konto verwenden.",
      noteHeading: "Hinweis:",
      noteMessage:
        "Wenn Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte umgehend unser Support-Team.",
      footerText: "© 2025 iSign. Alle Rechte vorbehalten.",
    },
    it: {
      subject: "La tua email è stata aggiornata",
      heading: "Email aggiornata con successo",
      greeting: "Ciao {{name}},",
      message: "Il tuo indirizzo email è stato aggiornato con successo a:",
      loginInstruction:
        "Ora puoi usare questo indirizzo email per accedere al tuo account.",
      noteHeading: "Nota:",
      noteMessage:
        "Se non hai effettuato tu questa modifica, contatta immediatamente il nostro team di supporto.",
      footerText: "© 2025 iSign. Tutti i diritti riservati.",
    },
    el: {
      subject: "Το email σας έχει ενημερωθεί",
      heading: "Το email ενημερώθηκε με επιτυχία",
      greeting: "Γεια σας {{name}},",
      message: "Η διεύθυνση email σας ενημερώθηκε με επιτυχία σε:",
      loginInstruction:
        "Μπορείτε τώρα να χρησιμοποιήσετε αυτήν τη διεύθυνση email για να συνδεθείτε στον λογαριασμό σας.",
      noteHeading: "Σημείωση:",
      noteMessage:
        "Αν δεν κάνατε εσείς αυτήν την αλλαγή, παρακαλούμε επικοινωνήστε αμέσως με την ομάδα υποστήριξής μας.",
      footerText: "© 2025 iSign. Με την επιφύλαξη παντός δικαιώματος.",
    },
  },
  emailChangeNotification: {
    en: {
      subject: "Security Alert: Your Email Was Changed",
      heading: "Email Address Changed",
      greeting: "Hello {{name}},",
      message:
        "This is a notification that your account email address has been changed to:",
      securityHeading: "Security Notice:",
      securityMessage:
        "If you did not make this change, please contact our support team immediately at",
      automatedMessage: "This is an automated security notification.",
      footerText: "© 2025 iSign. All rights reserved.",
    },
    es: {
      subject: "Alerta de seguridad: Tu correo electrónico ha sido cambiado",
      heading: "Dirección de correo electrónico cambiada",
      greeting: "Hola {{name}},",
      message:
        "Esta es una notificación de que la dirección de correo electrónico de tu cuenta ha sido cambiada a:",
      securityHeading: "Aviso de seguridad:",
      securityMessage:
        "Si no realizaste este cambio, por favor contacta a nuestro equipo de soporte de inmediato en",
      automatedMessage: "Esta es una notificación de seguridad automatizada.",
      footerText: "© 2025 iSign. Todos los derechos reservados.",
    },
    fr: {
      subject: "Alerte de sécurité : Votre e-mail a été modifié",
      heading: "Adresse e-mail modifiée",
      greeting: "Bonjour {{name}},",
      message:
        "Ceci est une notification que l'adresse e-mail de votre compte a été changée en :",
      securityHeading: "Avis de sécurité :",
      securityMessage:
        "Si vous n'avez pas effectué ce changement, veuillez contacter notre équipe de support immédiatement à",
      automatedMessage: "Ceci est une notification de sécurité automatisée.",
      footerText: "© 2025 iSign. Tous droits réservés.",
    },
    de: {
      subject: "Sicherheitswarnung: Ihre E-Mail wurde geändert",
      heading: "E-Mail-Adresse geändert",
      greeting: "Hallo {{name}},",
      message:
        "Dies ist eine Benachrichtigung, dass die E-Mail-Adresse Ihres Kontos geändert wurde in:",
      securityHeading: "Sicherheitshinweis:",
      securityMessage:
        "Wenn Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte umgehend unser Support-Team unter",
      automatedMessage:
        "Dies ist eine automatisierte Sicherheitsbenachrichtigung.",
      footerText: "© 2025 iSign. Alle Rechte vorbehalten.",
    },
    it: {
      subject: "Avviso di sicurezza: la tua email è stata cambiata",
      heading: "Indirizzo email cambiato",
      greeting: "Ciao {{name}},",
      message:
        "Questa è una notifica che l'indirizzo email del tuo account è stato cambiato in:",
      securityHeading: "Avviso di sicurezza:",
      securityMessage:
        "Se non hai effettuato questa modifica, contatta immediatamente il nostro team di supporto a",
      automatedMessage: "Questa è una notifica di sicurezza automatica.",
      footerText: "© 2025 iSign. Tutti i diritti riservati.",
    },
    el: {
      subject: "Ειδοποίηση ασφαλείας: Το email σας άλλαξε",
      heading: "Η διεύθυνση email άλλαξε",
      greeting: "Γεια σας {{name}},",
      message:
        "Αυτή είναι μια ειδοποίηση ότι η διεύθυνση email του λογαριασμού σας άλλαξε σε:",
      securityHeading: "Σημείωση ασφαλείας:",
      securityMessage:
        "Αν δεν κάνατε εσείς αυτήν την αλλαγή, παρακαλούμε επικοινωνήστε αμέσως με την ομάδα υποστήριξής μας στο",
      automatedMessage: "Αυτή είναι μια αυτοματοποιημένη ειδοποίηση ασφαλείας.",
      footerText: "© 2025 iSign. Με την επιφύλαξη παντός δικαιώματος.",
    },
  },
  accountDeactivation: {
    en: {
      subject: "Account Deactivation Requested",
      heading: "Account Deactivation Requested",
      greeting: "Hello {{name}},",
      message:
        "We've received your request to deactivate your account. Your account is now deactivated.<br><br>You have {{grace_period_days}} days to reactivate your account before it's permanently deleted. To reactivate, click the button below:",
      buttonText: "Reactivate Account",
      securityText:
        "If you didn't request this deactivation, please contact support immediately.",
      closingText: "Thank you,<br>The i-sign.eu Team",
      supportText: "Questions? Contact us at",
      companyInfo: "i-sign.eu Inc.<br>1234 Business Street, City, State 12345",
      unsubscribe: "Unsubscribe",
      preferences: "Preferences",
    },
    es: {
      subject: "Solicitud de desactivación de cuenta",
      heading: "Solicitud de desactivación de cuenta",
      greeting: "Hola {{name}},",
      message:
        "Hemos recibido tu solicitud para desactivar tu cuenta. Tu cuenta ha sido desactivada.<br><br>Tienes {{grace_period_days}} días para reactivar tu cuenta antes de que se elimine permanentemente. Para reactivar, haz clic en el botón de abajo:",
      buttonText: "Reactivar cuenta",
      securityText:
        "Si no solicitaste esta desactivación, por favor contacta a soporte de inmediato.",
      closingText: "Gracias,<br>El equipo de i-sign.eu",
      supportText: "¿Preguntas? Contáctanos en",
      companyInfo:
        "i-sign.eu Inc.<br>1234 Business Street, Ciudad, Estado 12345",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias",
    },
    fr: {
      subject: "Demande de désactivation de compte",
      heading: "Demande de désactivation de compte",
      greeting: "Bonjour {{name}},",
      message:
        "Nous avons reçu votre demande de désactivation de compte. Votre compte est maintenant désactivé.<br><br>Vous avez {{grace_period_days}} jours pour réactiver votre compte avant qu'il ne soit définitivement supprimé. Pour le réactiver, cliquez sur le bouton ci-dessous :",
      buttonText: "Réactiver le compte",
      securityText:
        "Si vous n'avez pas demandé cette désactivation, veuillez contacter le support immédiatement.",
      closingText: "Merci,<br>L'équipe i-sign.eu",
      supportText: "Des questions ? Contactez-nous à",
      companyInfo: "i-sign.eu Inc.<br>1234 Business Street, Ville, État 12345",
      unsubscribe: "Se désabonner",
      preferences: "Préférences",
    },
    de: {
      subject: "Antrag auf Deaktivierung des Kontos",
      heading: "Antrag auf Deaktivierung des Kontos",
      greeting: "Hallo {{name}},",
      message:
        "Wir haben Ihren Antrag auf Deaktivierung Ihres Kontos erhalten. Ihr Konto ist jetzt deaktiviert.<br><br>Sie haben {{grace_period_days}} Tage Zeit, um Ihr Konto zu reaktivieren, bevor es endgültig gelöscht wird. Um es zu reaktivieren, klicken Sie auf die Schaltfläche unten:",
      buttonText: "Konto reaktivieren",
      securityText:
        "Wenn Sie diese Deaktivierung nicht beantragt haben, wenden Sie sich bitte umgehend an den Support.",
      closingText: "Danke,<br>Das i-sign.eu Team",
      supportText: "Fragen? Kontaktieren Sie uns unter",
      companyInfo: "i-sign.eu Inc.<br>1234 Business Street, Stadt, Staat 12345",
      unsubscribe: "Abmelden",
      preferences: "Einstellungen",
    },
    it: {
      subject: "Richiesta di disattivazione dell'account",
      heading: "Richiesta di disattivazione dell'account",
      greeting: "Ciao {{name}},",
      message:
        "Abbiamo ricevuto la tua richiesta di disattivazione dell'account. Il tuo account è ora disattivato.<br><br>Hai {{grace_period_days}} giorni per riattivare il tuo account prima che venga eliminato definitivamente. Per riattivare, clicca sul pulsante qui sotto:",
      buttonText: "Riattiva account",
      securityText:
        "Se non hai richiesto questa disattivazione, contatta immediatamente il supporto.",
      closingText: "Grazie,<br>Il team di i-sign.eu",
      supportText: "Domande? Contattaci a",
      companyInfo: "i-sign.eu Inc.<br>1234 Business Street, Città, Stato 12345",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze",
    },
    el: {
      subject: "Αίτημα απενεργοποίησης λογαριασμού",
      heading: "Αίτηma απενεργοποίησης λογαριασμού",
      greeting: "Γεια σας {{name}},",
      message:
        "Λάβαμε το αίτημά σας για απενεργοποίηση του λογαριασμού σας. Ο λογαριασμός σας είναι πλέον απενεργοποιημένος.<br><br>Έχετε {{grace_period_days}} ημέρες για να ενεργοποιήσετε ξανά τον λογαριασμό σας πριν διαγραφεί οριστικά. Για να τον ενεργοποιήσετε ξανά, κάντε κλικ στο παρακάτω κουμπί:",
      buttonText: "Επανενεργοποίηση λογαριασμού",
      securityText:
        "Εάν δεν ζητήσατε αυτήν την απενεργοποίηση, επικοινωνήστε αμέσως με την υποστήριξη.",
      closingText: "Ευχαριστούμε,<br>Η ομάδα του i-sign.eu",
      supportText: "Ερωτήσεις; Επικοινωνήστε μαζί μας στο",
      companyInfo:
        "i-sign.eu Inc.<br>1234 Business Street, Πόλη, Πολιτεία 12345",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις",
    },
  },
  accountReactivation: {
    en: {
      subject: "Your Account Has Been Reactivated",
      heading: "Account Reactivated!",
      greeting: "Hello {{name}},",
      message:
        "Your account has been successfully reactivated. You can now log in and continue using Isign.eu.",
      buttonText: "Log In Now",
      closingText: "Welcome back!",
      supportText: "Questions? Contact us at",
      companyInfo: "i-sign.eu Inc.<br>1234 Business Street, City, State 12345",
      unsubscribe: "Unsubscribe",
      preferences: "Preferences",
    },
    es: {
      subject: "Tu cuenta ha sido reactivada",
      heading: "¡Cuenta reactivada!",
      greeting: "Hola {{name}},",
      message:
        "Tu cuenta ha sido reactivada con éxito. Ahora puedes iniciar sesión y continuar usando Isign.eu.",
      buttonText: "Iniciar sesión ahora",
      closingText: "¡Bienvenido de nuevo!",
      supportText: "¿Preguntas? Contáctanos en",
      companyInfo:
        "i-sign.eu Inc.<br>1234 Business Street, Ciudad, Estado 12345",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias",
    },
    fr: {
      subject: "Votre compte a été réactivé",
      heading: "Compte réactivé !",
      greeting: "Bonjour {{name}},",
      message:
        "Votre compte a été réactivé avec succès. Vous pouvez maintenant vous connecter et continuer à utiliser Isign.eu.",
      buttonText: "Se connecter maintenant",
      closingText: "Bon retour parmi nous !",
      supportText: "Des questions ? Contactez-nous à",
      companyInfo: "i-sign.eu Inc.<br>1234 Business Street, Ville, État 12345",
      unsubscribe: "Se désabonner",
      preferences: "Préférences",
    },
    de: {
      subject: "Ihr Konto wurde reaktiviert",
      heading: "Konto reaktiviert!",
      greeting: "Hallo {{name}},",
      message:
        "Ihr Konto wurde erfolgreich reaktiviert. Sie können sich jetzt anmelden und Isign.eu weiterhin verwenden.",
      buttonText: "Jetzt einloggen",
      closingText: "Willkommen zurück!",
      supportText: "Fragen? Kontaktieren Sie uns unter",
      companyInfo: "i-sign.eu Inc.<br>1234 Business Street, Stadt, Staat 12345",
      unsubscribe: "Abmelden",
      preferences: "Einstellungen",
    },
    it: {
      subject: "Il tuo account è stato riattivato",
      heading: "Account riattivato!",
      greeting: "Ciao {{name}},",
      message:
        "Il tuo account è stato riattivato con successo. Ora puoi accedere e continuare a utilizzare Isign.eu.",
      buttonText: "Accedi ora",
      closingText: "Bentornato!",
      supportText: "Domande? Contattaci a",
      companyInfo: "i-sign.eu Inc.<br>1234 Business Street, Città, Stato 12345",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze",
    },
    el: {
      subject: "Ο λογαριασμός σας έχει επανενεργοποιηθεί",
      heading: "Ο λογαριασμός ενεργοποιήθηκε ξανά!",
      greeting: "Γεια σας {{name}},",
      message:
        "Ο λογαριασμός σας έχει επανενεργοποιηθεί με επιτυχία. Μπορείτε τώρα να συνδεθείτε και να συνεχίσετε να χρησιμοποιείτε το Isign.eu.",
      buttonText: "Συνδεθείτε τώρα",
      closingText: "Καλώς ορίσατε πίσω!",
      supportText: "Ερωτήσεις; Επικοινωνήστε μαζί μας στο",
      companyInfo:
        "i-sign.eu Inc.<br>1234 Business Street, Πόλη, Πολιτεία 12345",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις",
    },
  },
  receiverNotification: {
    en: {
      subject: "A Document Has Been Shared With You",
      heading: "A Document Was Shared With You",
      greeting: "Hello {{recipient_name}},",
      message:
        'You have been included as a final receiver for the document "<strong>{{package_name}}</strong>", sent by <strong>{{sender_name}}</strong>.',
      noActionRequired:
        "<strong>No action is required from you.</strong> You will receive a final, completed copy once all other parties have finished.",
      buttonText: "View Document (Read-Only)",
      footerText:
        "Questions for the sender? Reply to this email to contact them directly.",
      unsubscribe: "Unsubscribe",
    },
    es: {
      subject: "Se ha compartido un documento contigo",
      heading: "Se compartió un documento contigo",
      greeting: "Hola {{recipient_name}},",
      message:
        'Has sido incluido como destinatario final del documento "<strong>{{package_name}}</strong>", enviado por <strong>{{sender_name}}</strong>.',
      noActionRequired:
        "<strong>No se requiere ninguna acción por tu parte.</strong> Recibirás una copia final y completa una vez que todas las demás partes hayan terminado.",
      buttonText: "Ver documento (solo lectura)",
      footerText:
        "¿Preguntas para el remitente? Responde a este correo para contactarlo directamente.",
      unsubscribe: "Darse de baja",
    },
    fr: {
      subject: "Un document a été partagé avec vous",
      heading: "Un document a été partagé avec vous",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "Vous avez été inclus comme destinataire final pour le document « <strong>{{package_name}}</strong> », envoyé par <strong>{{sender_name}}</strong>.",
      noActionRequired:
        "<strong>Aucune action n'est requise de votre part.</strong> Vous recevrez une copie finale et complète une fois que toutes les autres parties auront terminé.",
      buttonText: "Afficher le document (lecture seule)",
      footerText:
        "Des questions pour l'expéditeur ? Répondez à cet e-mail pour le contacter directement.",
      unsubscribe: "Se désabonner",
    },
    de: {
      subject: "Ein Dokument wurde mit Ihnen geteilt",
      heading: "Ein Dokument wurde mit Ihnen geteilt",
      greeting: "Hallo {{recipient_name}},",
      message:
        "Sie wurden als endgültiger Empfänger für das Dokument „<strong>{{package_name}}</strong>“ hinzugefügt, gesendet von <strong>{{sender_name}}</strong>.",
      noActionRequired:
        "<strong>Von Ihnen ist keine Aktion erforderlich.</strong> Sie erhalten eine endgültige, ausgefüllte Kopie, sobald alle anderen Parteien fertig sind.",
      buttonText: "Dokument anzeigen (schreibgeschützt)",
      footerText:
        "Fragen an den Absender? Antworten Sie auf diese E-Mail, um ihn direkt zu kontaktieren.",
      unsubscribe: "Abmelden",
    },
    it: {
      subject: "Un documento è stato condiviso con te",
      heading: "Un documento è stato condiviso con te",
      greeting: "Ciao {{recipient_name}},",
      message:
        'Sei stato incluso come destinatario finale per il documento "<strong>{{package_name}}</strong>", inviato da <strong>{{sender_name}}</strong>.',
      noActionRequired:
        "<strong>Nessuna azione è richiesta da parte tua.</strong> Riceverai una copia finale e completa una volta che tutte le altre parti avranno terminato.",
      buttonText: "Visualizza documento (sola lettura)",
      footerText:
        "Domande per il mittente? Rispondi a questa email per contattarlo direttamente.",
      unsubscribe: "Annulla iscrizione",
    },
    el: {
      subject: "Ένα έγγραφο κοινοποιήθηκε σε εσάς",
      heading: "Ένα έγγραφο κοινοποιήθηκε σε εσάς",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Έχετε συμπεριληφθεί ως τελικός παραλήπτης για το έγγραφο «<strong>{{package_name}}</strong>», που στάλθηκε από τον/την <strong>{{sender_name}}</strong>.",
      noActionRequired:
        "<strong>Δεν απαιτείται καμία ενέργεια από εσάς.</strong> Θα λάβετε ένα τελικό, συμπληρωμένο αντίγραφο μόλις ολοκληρώσουν όλες οι άλλες πλευρές.",
      buttonText: "Προβολή εγγράφου (μόνο για ανάγνωση)",
      footerText:
        "Ερωτήσεις για τον αποστολέα; Απαντήστε σε αυτό το email για να επικοινωνήσετε απευθείας μαζί του.",
      unsubscribe: "Διαγραφή",
    },
  },
  actionRequiredNotification: {
    en: {
      subject: "Action Required on Document: {{package_name}}",
      heading: "Your Action is Required",
      greeting: "Hello {{recipient_name}},",
      message:
        '<strong>{{sender_name}}</strong> has sent you the document "<strong>{{package_name}}</strong>" which requires your input.',
      customMessageHeader: "A message from {{sender_name}}:",
      appButtonText: "Open in App",
      webButtonText: "Open in Browser",
      orText: "or",
      instructionText:
        "Click 'Open in App' if you have i-sign installed, or use 'Open in Browser' to access from any device.",
      footerText:
        "Questions about this document? Reply to this email to contact the sender directly.",
      unsubscribe: "Unsubscribe",
    },
    es: {
      subject: "Acción requerida en el documento: {{package_name}}",
      heading: "Se requiere tu acción",
      greeting: "Hola {{recipient_name}},",
      message:
        '<strong>{{sender_name}}</strong> te ha enviado el documento "<strong>{{package_name}}</strong>" que requiere tu intervención.',
      customMessageHeader: "Un mensaje de {{sender_name}}:",
      appButtonText: "Abrir en la aplicación",
      webButtonText: "Abrir en el navegador",
      orText: "o",
      instructionText:
        "Haz clic en 'Abrir en la aplicación' si tienes i-sign instalado, o usa 'Abrir en el navegador' para acceder desde cualquier dispositivo.",
      footerText:
        "¿Preguntas sobre este documento? Responde a este correo para contactar directamente al remitente.",
      unsubscribe: "Darse de baja",
    },
    fr: {
      subject: "Action requise sur le document : {{package_name}}",
      heading: "Votre action est requise",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "<strong>{{sender_name}}</strong> vous a envoyé le document « <strong>{{package_name}}</strong> » qui nécessite votre intervention.",
      customMessageHeader: "Un message de {{sender_name}} :",
      appButtonText: "Ouvrir dans l'application",
      webButtonText: "Ouvrir dans le navigateur",
      orText: "ou",
      instructionText:
        "Cliquez sur 'Ouvrir dans l'application' si vous avez i-sign installé, ou utilisez 'Ouvrir dans le navigateur' pour y accéder depuis n'importe quel appareil.",
      footerText:
        "Des questions sur ce document ? Répondez à cet e-mail pour contacter directement l'expéditeur.",
      unsubscribe: "Se désabonner",
    },
    de: {
      subject: "Handlung erforderlich für Dokument: {{package_name}}",
      heading: "Ihre Handlung ist erforderlich",
      greeting: "Hallo {{recipient_name}},",
      message:
        '<strong>{{sender_name}}</strong> hat Ihnen das Dokument „<strong>{{package_name}}</strong>" gesendet, das Ihre Eingabe erfordert.',
      customMessageHeader: "Eine Nachricht von {{sender_name}}:",
      appButtonText: "In App öffnen",
      webButtonText: "Im Browser öffnen",
      orText: "oder",
      instructionText:
        "Klicken Sie auf 'In App öffnen', wenn Sie i-sign installiert haben, oder verwenden Sie 'Im Browser öffnen', um von jedem Gerät aus darauf zuzugreifen.",
      footerText:
        "Fragen zu diesem Dokument? Antworten Sie auf diese E-Mail, um den Absender direkt zu kontaktieren.",
      unsubscribe: "Abmelden",
    },
    it: {
      subject: "Azione richiesta sul documento: {{package_name}}",
      heading: "È richiesta la tua azione",
      greeting: "Ciao {{recipient_name}},",
      message:
        '<strong>{{sender_name}}</strong> ti ha inviato il documento "<strong>{{package_name}}</strong>" che richiede il tuo intervento.',
      customMessageHeader: "Un messaggio da {{sender_name}}:",
      appButtonText: "Apri nell'app",
      webButtonText: "Apri nel browser",
      orText: "o",
      instructionText:
        "Fai clic su 'Apri nell'app' se hai i-sign installato, oppure usa 'Apri nel browser' per accedere da qualsiasi dispositivo.",
      footerText:
        "Domande su questo documento? Rispondi a questa email per contattare direttamente il mittente.",
      unsubscribe: "Annulla iscrizione",
    },
    el: {
      subject: "Απαιτείται ενέργεια στο έγγραφο: {{package_name}}",
      heading: "Απαιτείται η ενέργειά σας",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Ο/Η <strong>{{sender_name}}</strong> σας έχει στείλει το έγγραφο «<strong>{{package_name}}</strong>» το οποίο απαιτεί τη συμβολή σας.",
      customMessageHeader: "Ένα μήνυμα από τον/την {{sender_name}}:",
      appButtonText: "Άνοιγμα στην εφαρμογή",
      webButtonText: "Άνοιγμα στο πρόγραμμα περιήγησης",
      orText: "ή",
      instructionText:
        "Κάντε κλικ στο 'Άνοιγμα στην εφαρμογή' αν έχετε εγκαταστήσει το i-sign, ή χρησιμοποιήστε το 'Άνοιγμα στο πρόγραμμα περιήγησης' για πρόσβαση από οποιαδήποτε συσκευή.",
      footerText:
        "Ερωτήσεις σχετικά με αυτό το έγγραφο; Απαντήστε σε αυτό το email για να επικοινωνήσετε απευθείας με τον αποστολέα.",
      unsubscribe: "Διαγραφή",
    },
  },
  signatureOtp: {
    en: {
      subject: "Your Signature Verification Code",
      heading: "Your Verification Code",
      greeting: "Hello {{recipient_name}},",
      message:
        'Use the code below to securely complete your signature on "<strong>{{package_name}}</strong>".',
      expiryText:
        "For your security, this code will expire in 5 minutes. Do not share this code with anyone.",
      ignoreText:
        "If you did not request this verification code, you can safely ignore this email.",
    },
    es: {
      subject: "Tu código de verificación de firma",
      heading: "Tu código de verificación",
      greeting: "Hola {{recipient_name}},",
      message:
        'Usa el siguiente código para completar de forma segura tu firma en "<strong>{{package_name}}</strong>".',
      expiryText:
        "Por tu seguridad, este código expirará en 5 minutos. No compartas este código con nadie.",
      ignoreText:
        "Si no solicitaste este código de verificación, puedes ignorar este correo de forma segura.",
    },
    fr: {
      subject: "Votre code de vérification de signature",
      heading: "Votre code de vérification",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "Utilisez le code ci-dessous pour compléter en toute sécurité votre signature sur « <strong>{{package_name}}</strong> ».",
      expiryText:
        "Pour votre sécurité, ce code expirera dans 5 minutes. Ne partagez ce code avec personne.",
      ignoreText:
        "Si vous n'avez pas demandé ce code de vérification, vous pouvez ignorer cet e-mail en toute sécurité.",
    },
    de: {
      subject: "Ihr Bestätigungscode für die Unterschrift",
      heading: "Ihr Bestätigungscode",
      greeting: "Hallo {{recipient_name}},",
      message:
        "Verwenden Sie den folgenden Code, um Ihre Unterschrift auf „<strong>{{package_name}}</strong>“ sicher abzuschließen.",
      expiryText:
        "Zu Ihrer Sicherheit verfällt dieser Code in 5 Minuten. Teilen Sie diesen Code mit niemandem.",
      ignoreText:
        "Wenn Sie diesen Bestätigungscode nicht angefordert haben, können Sie diese E-Mail sicher ignorieren.",
    },
    it: {
      subject: "Il tuo codice di verifica per la firma",
      heading: "Il tuo codice di verifica",
      greeting: "Ciao {{recipient_name}},",
      message:
        'Usa il codice qui sotto per completare in modo sicuro la tua firma su "<strong>{{package_name}}</strong>".',
      expiryText:
        "Per la tua sicurezza, questo codice scadrà tra 5 minuti. Non condividere questo codice con nessuno.",
      ignoreText:
        "Se non hai richiesto questo codice di verifica, puoi tranquillamente ignorare questa email.",
    },
    el: {
      subject: "Ο κωδικός επαλήθευσης της υπογραφής σας",
      heading: "Ο κωδικός επαλήθευσής σας",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Χρησιμοποιήστε τον παρακάτω κωδικό για να ολοκληρώσετε με ασφάλεια την υπογραφή σας στο «<strong>{{package_name}}</strong>».",
      expiryText:
        "Για την ασφάλειά σας, αυτός ο κωδικός θα λήξει σε 5 λεπτά. Μην μοιράζεστε αυτόν τον κωδικό με κανέναν.",
      ignoreText:
        "Εάν δεν ζητήσατε αυτόν τον κωδικό επαλήθευσης, μπορείτε να αγνοήσετε με ασφάλεια αυτό το email.",
    },
  },
  documentCompleted: {
    en: {
      subject: "Document Completed: {{package_name}}",
      heading: "It's All Done!",
      greeting: "Hello {{recipient_name}},",
      message:
        'Good news! The document package "<strong>{{package_name}}</strong>", initiated by <strong>{{sender_name}}</strong>, has been fully completed by all participants.',
      buttonText: "View Completed Document",
      closingMessage:
        "A finalized copy has been made available to all participants for their records.",
      footerText:
        "You can access all your completed documents from your I-Sign.eu dashboard.",
      unsubscribe: "Unsubscribe from completion alerts",
    },
    es: {
      subject: "Documento completado: {{package_name}}",
      heading: "¡Todo listo!",
      greeting: "Hola {{recipient_name}},",
      message:
        '¡Buenas noticias! El paquete de documentos "<strong>{{package_name}}</strong>", iniciado por <strong>{{sender_name}}</strong>, ha sido completado por todos los participantes.',
      buttonText: "Ver documento completado",
      closingMessage:
        "Se ha puesto a disposición de todos los participantes una copia finalizada para sus archivos.",
      footerText:
        "Puedes acceder a todos tus documentos completados desde tu panel de I-Sign.eu.",
      unsubscribe: "Darse de baja de las alertas de finalización",
    },
    fr: {
      subject: "Document terminé : {{package_name}}",
      heading: "C'est terminé !",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "Bonne nouvelle ! Le paquet de documents « <strong>{{package_name}}</strong> », initié par <strong>{{sender_name}}</strong>, a été entièrement complété par tous les participants.",
      buttonText: "Voir le document terminé",
      closingMessage:
        "Une copie finalisée a été mise à la disposition de tous les participants pour leurs dossiers.",
      footerText:
        "Vous pouvez accéder à tous vos documents terminés depuis votre tableau de bord I-Sign.eu.",
      unsubscribe: "Se désabonner des alertes d'achèvement",
    },
    de: {
      subject: "Dokument abgeschlossen: {{package_name}}",
      heading: "Alles erledigt!",
      greeting: "Hallo {{recipient_name}},",
      message:
        "Gute Nachrichten! Das Dokumentenpaket „<strong>{{package_name}}</strong>“, initiiert von <strong>{{sender_name}}</strong>, wurde von allen Teilnehmern vollständig ausgefüllt.",
      buttonText: "Abgeschlossenes Dokument ansehen",
      closingMessage:
        "Eine endgültige Kopie wurde allen Teilnehmern für ihre Unterlagen zur Verfügung gestellt.",
      footerText:
        "Sie können auf alle Ihre abgeschlossenen Dokumente von Ihrem I-Sign.eu-Dashboard aus zugreifen.",
      unsubscribe: "Abmelden von Abschlussbenachrichtigungen",
    },
    it: {
      subject: "Documento completato: {{package_name}}",
      heading: "È tutto fatto!",
      greeting: "Ciao {{recipient_name}},",
      message:
        'Buone notizie! Il pacchetto di documenti "<strong>{{package_name}}</strong>", avviato da <strong>{{sender_name}}</strong>, è stato completato da tutti i partecipanti.',
      buttonText: "Visualizza documento completato",
      closingMessage:
        "Una copia finalizzata è stata messa a disposizione di tutti i partecipanti per i loro archivi.",
      footerText:
        "Puoi accedere a tutti i tuoi documenti completati dalla tua dashboard di I-Sign.eu.",
      unsubscribe: "Annulla l'iscrizione agli avvisi di completamento",
    },
    el: {
      subject: "Το έγγραφο ολοκληρώθηκε: {{package_name}}",
      heading: "Όλα ολοκληρώθηκαν!",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Καλά νέα! Το πακέτο εγγράφων «<strong>{{package_name}}</strong>», που ξεκίνησε από τον/την <strong>{{sender_name}}</strong>, έχει ολοκληρωθεί πλήρως από όλους τους συμμετέχοντες.",
      buttonText: "Προβολή ολοκληρωμένου εγγράφου",
      closingMessage:
        "Ένα οριστικοποιημένο αντίγραφο έχει διατεθεί σε όλους τους συμμετέχοντες για τα αρχεία τους.",
      footerText:
        "Μπορείτε να έχετε πρόσβαση σε όλα τα ολοκληρωμένα έγγραφά σας από τον πίνακα ελέγχου του I-Sign.eu.",
      unsubscribe: "Κατάργηση εγγραφής από τις ειδοποιήσεις ολοκλήρωσης",
    },
  },
  rejectionNotification: {
    en: {
      subject: "Document Rejected: {{package_name}}",
      heading: "Document Rejected",
      greeting: "Hello {{recipient_name}},",
      message:
        'The document "<strong>{{package_name}}</strong>", sent by <strong>{{sender_name}}</strong>, was rejected by <strong>{{rejector_name}}</strong>.',
      reasonHeader: "Reason for Rejection:",
      buttonText: "View Document Details",
      noActionRequired: "No further action is required from you.",
      footerText:
        "Questions for the sender? Reply to this email to contact them directly.",
      unsubscribe: "Unsubscribe",
    },
    es: {
      subject: "Documento rechazado: {{package_name}}",
      heading: "Documento rechazado",
      greeting: "Hola {{recipient_name}},",
      message:
        'El documento "<strong>{{package_name}}</strong>", enviado por <strong>{{sender_name}}</strong>, fue rechazado por <strong>{{rejector_name}}</strong>.',
      reasonHeader: "Motivo del rechazo:",
      buttonText: "Ver detalles del documento",
      noActionRequired: "No se requiere ninguna otra acción por tu parte.",
      footerText:
        "¿Preguntas para el remitente? Responde a este correo para contactarlo directamente.",
      unsubscribe: "Darse de baja",
    },
    fr: {
      subject: "Document rejeté : {{package_name}}",
      heading: "Document rejeté",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "Le document « <strong>{{package_name}}</strong> », envoyé par <strong>{{sender_name}}</strong>, a été rejeté par <strong>{{rejector_name}}</strong>.",
      reasonHeader: "Raison du rejet :",
      buttonText: "Voir les détails du document",
      noActionRequired: "Aucune autre action n'est requise de votre part.",
      footerText:
        "Des questions pour l'expéditeur ? Répondez à cet e-mail pour le contacter directement.",
      unsubscribe: "Se désabonner",
    },
    de: {
      subject: "Dokument abgelehnt: {{package_name}}",
      heading: "Dokument abgelehnt",
      greeting: "Hallo {{recipient_name}},",
      message:
        "Das von <strong>{{sender_name}}</strong> gesendete Dokument „<strong>{{package_name}}</strong>“ wurde von <strong>{{rejector_name}}</strong> abgelehnt.",
      reasonHeader: "Grund für die Ablehnung:",
      buttonText: "Dokumentdetails anzeigen",
      noActionRequired:
        "Es sind keine weiteren Maßnahmen von Ihnen erforderlich.",
      footerText:
        "Fragen an den Absender? Antworten Sie auf diese E-Mail, um ihn direkt zu kontaktieren.",
      unsubscribe: "Abmelden",
    },
    it: {
      subject: "Documento rifiutato: {{package_name}}",
      heading: "Documento rifiutato",
      greeting: "Ciao {{recipient_name}},",
      message:
        'Il documento "<strong>{{package_name}}</strong>", inviato da <strong>{{sender_name}}</strong>, è stato rifiutato da <strong>{{rejector_name}}</strong>.',
      reasonHeader: "Motivo del rifiuto:",
      buttonText: "Visualizza i dettagli del documento",
      noActionRequired: "Nessuna ulteriore azione è richiesta da parte tua.",
      footerText:
        "Domande per il mittente? Rispondi a questa email per contattarlo direttamente.",
      unsubscribe: "Annulla iscrizione",
    },
    el: {
      subject: "Το έγγραφο απορρίφθηκε: {{package_name}}",
      heading: "Το έγγραφο απορρίφθηκε",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Το έγγραφο «<strong>{{package_name}}</strong>», που στάλθηκε από τον/την <strong>{{sender_name}}</strong>, απορρίφθηκε από τον/την <strong>{{rejector_name}}</strong>.",
      reasonHeader: "Λόγος απόρριψης:",
      buttonText: "Προβολή λεπτομερειών εγγράφου",
      noActionRequired: "Δεν απαιτείται περαιτέρω ενέργεια από εσάς.",
      footerText:
        "Ερωτήσεις για τον αποστολέα; Απαντήστε σε αυτό το email για να επικοινωνήσετε απευθείας μαζί του.",
      unsubscribe: "Διαγραφή",
    },
  },
  reassignmentNotification: {
    en: {
      subject: "You've Been Assigned a Document: {{package_name}}",
      heading: "A Document Needs Your Attention",
      greeting: "Hello {{recipient_name}},",
      message:
        '<strong>{{reassigned_by_name}}</strong> has reassigned their tasks to you for the document "<strong>{{package_name}}</strong>".',
      originalSenderInfo:
        "This document was originally sent by <strong>{{sender_name}}</strong>.",
      buttonText: "Access Document",
      instructionText:
        "Please follow the link to complete your assigned tasks.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Se te ha asignado un documento: {{package_name}}",
      heading: "Un documento necesita tu atención",
      greeting: "Hola {{recipient_name}},",
      message:
        '<strong>{{reassigned_by_name}}</strong> te ha reasignado sus tareas para el documento "<strong>{{package_name}}</strong>".',
      originalSenderInfo:
        "Este documento fue enviado originalmente por <strong>{{sender_name}}</strong>.",
      buttonText: "Acceder al documento",
      instructionText:
        "Por favor, sigue el enlace para completar las tareas asignadas.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Un document vous a été assigné : {{package_name}}",
      heading: "Un document requiert votre attention",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "<strong>{{reassigned_by_name}}</strong> vous a réassigné ses tâches pour le document « <strong>{{package_name}}</strong> ».",
      originalSenderInfo:
        "Ce document a été envoyé initialement par <strong>{{sender_name}}</strong>.",
      buttonText: "Accéder au document",
      instructionText:
        "Veuillez suivre le lien pour accomplir les tâches qui vous sont assignées.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Ihnen wurde ein Dokument zugewiesen: {{package_name}}",
      heading: "Ein Dokument erfordert Ihre Aufmerksamkeit",
      greeting: "Hallo {{recipient_name}},",
      message:
        "<strong>{{reassigned_by_name}}</strong> hat Ihnen seine Aufgaben für das Dokument „<strong>{{package_name}}</strong>“ neu zugewiesen.",
      originalSenderInfo:
        "Dieses Dokument wurde ursprünglich von <strong>{{sender_name}}</strong> gesendet.",
      buttonText: "Dokument aufrufen",
      instructionText:
        "Bitte folgen Sie dem Link, um Ihre zugewiesenen Aufgaben zu erledigen.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Ti è stato assegnato un documento: {{package_name}}",
      heading: "Un documento richiede la tua attenzione",
      greeting: "Ciao {{recipient_name}},",
      message:
        '<strong>{{reassigned_by_name}}</strong> ti ha riassegnato i suoi compiti per il documento "<strong>{{package_name}}</strong>".',
      originalSenderInfo:
        "Questo documento è stato originariamente inviato da <strong>{{sender_name}}</strong>.",
      buttonText: "Accedi al documento",
      instructionText: "Segui il link per completare i compiti assegnati.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Σας έχει ανατεθεί ένα έγγραφο: {{package_name}}",
      heading: "Ένα έγγραφο χρειάζεται την προσοχή σας",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Ο/Η <strong>{{reassigned_by_name}}</strong> σας ανέθεσε εκ νέου τις εργασίες του/της για το έγγραφο «<strong>{{package_name}}</strong>».",
      originalSenderInfo:
        "Αυτό το έγγραφο στάλθηκε αρχικά από τον/την <strong>{{sender_name}}</strong>.",
      buttonText: "Πρόσβαση στο έγγραφο",
      instructionText:
        "Παρακαλούμε ακολουθήστε τον σύνδεσμο για να ολοκληρώσετε τις ανατεθειμένες εργασίες σας.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  reassignmentConfirmation: {
    en: {
      subject: "Reassignment Successful for: {{package_name}}",
      heading: "Reassignment Successful",
      greeting: "Hello {{recipient_name}},",
      message:
        'This email confirms that you have successfully reassigned your role for the document "<strong>{{package_name}}</strong>".',
      tasksTransferredTo: "Your tasks have been transferred to:",
      noActionRequired:
        "No further action is required from you for this document.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Reasignación exitosa para: {{package_name}}",
      heading: "Reasignación exitosa",
      greeting: "Hola {{recipient_name}},",
      message:
        'Este correo confirma que has reasignado correctamente tu rol para el documento "<strong>{{package_name}}</strong>".',
      tasksTransferredTo: "Tus tareas han sido transferidas a:",
      noActionRequired:
        "No se requiere ninguna otra acción de tu parte para este documento.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Réassignation réussie pour : {{package_name}}",
      heading: "Réassignation réussie",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "Cet e-mail confirme que vous avez réassigné avec succès votre rôle pour le document « <strong>{{package_name}}</strong> ».",
      tasksTransferredTo: "Vos tâches ont été transférées à :",
      noActionRequired:
        "Aucune autre action n'est requise de votre part pour ce document.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Neuzuweisung erfolgreich für: {{package_name}}",
      heading: "Neuzuweisung erfolgreich",
      greeting: "Hallo {{recipient_name}},",
      message:
        "Diese E-Mail bestätigt, dass Sie Ihre Rolle für das Dokument „<strong>{{package_name}}</strong>“ erfolgreich neu zugewiesen haben.",
      tasksTransferredTo: "Ihre Aufgaben wurden übertragen an:",
      noActionRequired:
        "Es sind keine weiteren Maßnahmen von Ihnen für dieses Dokument erforderlich.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Riassegnazione riuscita per: {{package_name}}",
      heading: "Riassegnazione riuscita",
      greeting: "Ciao {{recipient_name}},",
      message:
        'Questa email conferma che hai riassegnato con successo il tuo ruolo per il documento "<strong>{{package_name}}</strong>".',
      tasksTransferredTo: "I tuoi compiti sono stati trasferiti a:",
      noActionRequired:
        "Non è richiesta alcuna ulteriore azione da parte tua per questo documento.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Η επανα ανάθεση ολοκληρώθηκε με επιτυχία για: {{package_name}}",
      heading: "Επιτυχής επανα ανάθεση",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Αυτό το email επιβεβαιώνει ότι έχετε επανα αναθέσει με επιτυχία τον ρόλο σας για το έγγραφο «<strong>{{package_name}}</strong>».",
      tasksTransferredTo: "Οι εργασίες σας έχουν μεταφερθεί στον/στην:",
      noActionRequired:
        "Δεν απαιτείται περαιτέρω ενέργεια από εσάς για αυτό το έγγραφο.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  reassignmentOwnerNotification: {
    en: {
      subject: "Participant Reassignment on: {{package_name}}",
      heading: "Participant Role Reassigned",
      greeting: "Hello {{owner_name}},",
      message:
        'A participant has reassigned their tasks for the document "<strong>{{package_name}}</strong>".',
      originalParticipantHeader: "Original Participant:",
      newParticipantHeader: "New Participant:",
      reasonHeader: "Reason Provided:",
      buttonText: "View Document",
      noActionRequired:
        "No action is required from you. The new participant has been notified to complete their tasks.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Reasignación de participante en: {{package_name}}",
      heading: "Rol de participante reasignado",
      greeting: "Hola {{owner_name}},",
      message:
        'Un participante ha reasignado sus tareas para el documento "<strong>{{package_name}}</strong>".',
      originalParticipantHeader: "Participante original:",
      newParticipantHeader: "Nuevo participante:",
      reasonHeader: "Motivo proporcionado:",
      buttonText: "Ver documento",
      noActionRequired:
        "No se requiere ninguna acción de tu parte. El nuevo participante ha sido notificado para completar sus tareas.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Réassignation de participant sur : {{package_name}}",
      heading: "Rôle de participant réassigné",
      greeting: "Bonjour {{owner_name}},",
      message:
        "Un participant a réassigné ses tâches pour le document « <strong>{{package_name}}</strong> ».",
      originalParticipantHeader: "Participant d'origine :",
      newParticipantHeader: "Nouveau participant :",
      reasonHeader: "Raison fournie :",
      buttonText: "Voir le document",
      noActionRequired:
        "Aucune action n'est requise de votre part. Le nouveau participant a été notifié pour accomplir ses tâches.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Teilnehmer-Neuzuweisung für: {{package_name}}",
      heading: "Teilnehmerrolle neu zugewiesen",
      greeting: "Hallo {{owner_name}},",
      message:
        "Ein Teilnehmer hat seine Aufgaben für das Dokument „<strong>{{package_name}}</strong>“ neu zugewiesen.",
      originalParticipantHeader: "Ursprünglicher Teilnehmer:",
      newParticipantHeader: "Neuer Teilnehmer:",
      reasonHeader: "Angegebener Grund:",
      buttonText: "Dokument anzeigen",
      noActionRequired:
        "Von Ihnen ist keine Aktion erforderlich. Der neue Teilnehmer wurde benachrichtigt, seine Aufgaben zu erledigen.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Riassegnazione partecipante su: {{package_name}}",
      heading: "Ruolo partecipante riassegnato",
      greeting: "Ciao {{owner_name}},",
      message:
        'Un partecipante ha riassegnato i suoi compiti per il documento "<strong>{{package_name}}</strong>".',
      originalParticipantHeader: "Partecipante originale:",
      newParticipantHeader: "Nuovo partecipante:",
      reasonHeader: "Motivo fornito:",
      buttonText: "Visualizza documento",
      noActionRequired:
        "Nessuna azione è richiesta da parte tua. Il nuovo partecipante è stato avvisato di completare i suoi compiti.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Επανα ανάθεση συμμετέχοντα στο: {{package_name}}",
      heading: "Ο ρόλος του συμμετέχοντα ανατέθηκε εκ νέου",
      greeting: "Γεια σας {{owner_name}},",
      message:
        "Ένας συμμετέχων ανέθεσε εκ νέου τις εργασίες του για το έγγραφο «<strong>{{package_name}}</strong>».",
      originalParticipantHeader: "Αρχικός συμμετέχων:",
      newParticipantHeader: "Νέος συμμετέχων:",
      reasonHeader: "Παρεχόμενος λόγος:",
      buttonText: "Προβολή εγγράφου",
      noActionRequired:
        "Δεν απαιτείται καμία ενέργεια από εσάς. Ο νέος συμμετέχων έχει ειδοποιηθεί να ολοκληρώσει τις εργασίες του.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  documentExpired: {
    en: {
      subject: "Document Expired: {{package_name}}",
      heading: "This Document Has Expired",
      message:
        'The document "<strong>{{package_name}}</strong>", originally sent by <strong>{{initiator_name}}</strong>, has expired and is no longer available for signing or completion.',
      expiredOnLabel: "It expired on",
      atLabel: "at",
      noActionRequired:
        "No further action can be taken. If you believe this is an error, please contact the sender directly.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Documento caducado: {{package_name}}",
      heading: "Este documento ha caducado",
      message:
        'El documento "<strong>{{package_name}}</strong>", enviado originalmente por <strong>{{initiator_name}}</strong>, ha caducado y ya no está disponible para firmar o completar.',
      expiredOnLabel: "Caducó el",
      atLabel: "a las",
      noActionRequired:
        "No se puede realizar ninguna otra acción. Si crees que esto es un error, por favor contacta directamente al remitente.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Document expiré : {{package_name}}",
      heading: "Ce document a expiré",
      message:
        "Le document « <strong>{{package_name}}</strong> », envoyé initialement par <strong>{{initiator_name}}</strong>, a expiré et n'est plus disponible pour signature ou achèvement.",
      expiredOnLabel: "Il a expiré le",
      atLabel: "à",
      noActionRequired:
        "Aucune autre action ne peut être entreprise. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter directement l'expéditeur.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Dokument abgelaufen: {{package_name}}",
      heading: "Dieses Dokument ist abgelaufen",
      message:
        "Das ursprünglich von <strong>{{initiator_name}}</strong> gesendete Dokument „<strong>{{package_name}}</strong>“ ist abgelaufen und steht nicht mehr zur Unterzeichnung oder Vervollständigung zur Verfügung.",
      expiredOnLabel: "Es ist am",
      atLabel: "um",
      noActionRequired:
        "Es können keine weiteren Maßnahmen ergriffen werden. Wenn Sie glauben, dass dies ein Fehler ist, wenden Sie sich bitte direkt an den Absender.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Documento scaduto: {{package_name}}",
      heading: "Questo documento è scaduto",
      message:
        'Il documento "<strong>{{package_name}}</strong>", originariamente inviato da <strong>{{initiator_name}}</strong>, è scaduto e non è più disponibile per la firma o il completamento.',
      expiredOnLabel: "È scaduto il",
      atLabel: "alle",
      noActionRequired:
        "Non è possibile intraprendere ulteriori azioni. Se ritieni che si tratti di un errore, contatta direttamente il mittente.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Το έγγραφο έληξε: {{package_name}}",
      heading: "Αυτό το έγγραφο έχει λήξει",
      message:
        "Το έγγραφο «<strong>{{package_name}}</strong>», που στάλθηκε αρχικά από τον/την <strong>{{initiator_name}}</strong>, έχει λήξει και δεν είναι πλέον διαθέσιμο για υπογραφή ή συμπλήρωση.",
      expiredOnLabel: "Έληξε στις",
      atLabel: "στις",
      noActionRequired:
        "Δεν μπορεί να γίνει καμία περαιτέρω ενέργεια. Εάν πιστεύετε ότι πρόκειται για λάθος, επικοινωνήστε απευθείας με τον αποστολέα.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  expiryReminder: {
    en: {
      subject: "Reminder: Document Expiring Soon",
      heading: "A Document Is Expiring Soon",
      message:
        'This is a friendly reminder that the document "<strong>{{package_name}}</strong>", sent by <strong>{{initiator_name}}</strong>, is awaiting your action.',
      expiryInfo:
        "It is set to expire in <strong>{{time_until_expiry}}</strong> (on {{expires_at}}).",
      buttonText: "Review and Complete",
      instructionText:
        "Please complete your assigned tasks before it expires to ensure the process is not delayed.",
      timeUnits: { hour: "hour", hours: "hours", day: "day", days: "days" },
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Recordatorio: Documento a punto de caducar",
      heading: "Un documento caducará pronto",
      message:
        'Este es un recordatorio amistoso de que el documento "<strong>{{package_name}}</strong>", enviado por <strong>{{initiator_name}}</strong>, está esperando tu acción.',
      expiryInfo:
        "Está programado para caducar en <strong>{{time_until_expiry}}</strong> (el {{expires_at}}).",
      buttonText: "Revisar y completar",
      instructionText:
        "Por favor, completa tus tareas asignadas antes de que caduque para asegurar que el proceso no se retrase.",
      timeUnits: { hour: "hora", hours: "horas", day: "día", days: "días" },
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Rappel : Document expirant bientôt",
      heading: "Un document expire bientôt",
      message:
        "Ceci est un rappel amical que le document « <strong>{{package_name}}</strong> », envoyé par <strong>{{initiator_name}}</strong>, attend votre action.",
      expiryInfo:
        "Il expirera dans <strong>{{time_until_expiry}}</strong> (le {{expires_at}}).",
      buttonText: "Réviser et compléter",
      instructionText:
        "Veuillez accomplir vos tâches assignées avant qu'il n'expire pour éviter que le processus ne soit retardé.",
      timeUnits: { hour: "heure", hours: "heures", day: "jour", days: "jours" },
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Erinnerung: Dokument läuft bald ab",
      heading: "Ein Dokument läuft bald ab",
      message:
        "Dies ist eine freundliche Erinnerung, dass das von <strong>{{initiator_name}}</strong> gesendete Dokument „<strong>{{package_name}}</strong>“ auf Ihre Aktion wartet.",
      expiryInfo:
        "Es läuft in <strong>{{time_until_expiry}}</strong> ab (am {{expires_at}}).",
      buttonText: "Überprüfen und abschließen",
      instructionText:
        "Bitte erledigen Sie Ihre zugewiesenen Aufgaben, bevor es abläuft, um sicherzustellen, dass der Prozess nicht verzögert wird.",
      timeUnits: { hour: "Stunde", hours: "Stunden", day: "Tag", days: "Tage" },
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Promemoria: Documento in scadenza",
      heading: "Un documento sta per scadere",
      message:
        'Questo è un promemoria amichevole che il documento "<strong>{{package_name}}</strong>", inviato da <strong>{{initiator_name}}</strong>, è in attesa di una tua azione.',
      expiryInfo:
        "Scadrà tra <strong>{{time_until_expiry}}</strong> (il {{expires_at}}).",
      buttonText: "Rivedi e completa",
      instructionText:
        "Completa le tue attività assegnate prima della scadenza per garantire che il processo non subisca ritardi.",
      timeUnits: { hour: "ora", hours: "ore", day: "giorno", days: "giorni" },
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Υπενθύμιση: Το έγγραφο λήγει σύντομα",
      heading: "Ένα έγγραφο λήγει σύντομα",
      message:
        "Αυτή είναι μια φιλική υπενθύμιση ότι το έγγραφο «<strong>{{package_name}}</strong>», που στάλθηκε από τον/την <strong>{{initiator_name}}</strong>, αναμένει την ενέργειά σας.",
      expiryInfo:
        " πρόκειται να λήξει σε <strong>{{time_until_expiry}}</strong> (στις {{expires_at}}).",
      buttonText: "Ελέγξτε και ολοκληρώστε",
      instructionText:
        "Παρακαλούμε ολοκληρώστε τις ανατεθειμένες εργασίες σας πριν λήξει για να διασφαλίσετε ότι η διαδικασία δεν θα καθυστερήσει.",
      timeUnits: { hour: "ώρα", hours: "ώρες", day: "ημέρα", days: "ημέρες" },
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  documentRevoked: {
    en: {
      subject: "Document Revoked: {{package_name}}",
      heading: "Action No Longer Required",
      greeting: "Hello {{recipient_name}},",
      message:
        'Please be advised that the document "<strong>{{package_name}}</strong>" has been revoked by the sender, <strong>{{initiator_name}}</strong>.',
      noActionRequired:
        "No further action is required from you for this document. It is no longer available for signing or completion.",
      contactSenderInfo:
        "If you believe this was done in error, please contact the sender directly.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Documento revocado: {{package_name}}",
      heading: "Acción ya no requerida",
      greeting: "Hola {{recipient_name}},",
      message:
        'Te informamos que el documento "<strong>{{package_name}}</strong>" ha sido revocado por el remitente, <strong>{{initiator_name}}</strong>.',
      noActionRequired:
        "No se requiere ninguna otra acción de tu parte para este documento. Ya no está disponible para firmar o completar.",
      contactSenderInfo:
        "Si crees que esto se hizo por error, por favor contacta directamente al remitente.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Document révoqué : {{package_name}}",
      heading: "Action non requise",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "Veuillez noter que le document « <strong>{{package_name}}</strong> » a été révoqué par l'expéditeur, <strong>{{initiator_name}}</strong>.",
      noActionRequired:
        "Aucune autre action n'est requise de votre part pour ce document. Il n'est plus disponible pour signature ou achèvement.",
      contactSenderInfo:
        "Si vous pensez que cela a été fait par erreur, veuillez contacter directement l'expéditeur.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Dokument widerrufen: {{package_name}}",
      heading: "Keine Aktion mehr erforderlich",
      greeting: "Hallo {{recipient_name}},",
      message:
        "Bitte beachten Sie, dass das Dokument „<strong>{{package_name}}</strong>“ vom Absender, <strong>{{initiator_name}}</strong>, widerrufen wurde.",
      noActionRequired:
        "Für dieses Dokument sind keine weiteren Maßnahmen von Ihnen erforderlich. Es steht nicht mehr zur Unterzeichnung oder Vervollständigung zur Verfügung.",
      contactSenderInfo:
        "Wenn Sie glauben, dass dies irrtümlich geschehen ist, wenden Sie sich bitte direkt an den Absender.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Documento revocato: {{package_name}}",
      heading: "Azione non più richiesta",
      greeting: "Ciao {{recipient_name}},",
      message:
        'Si informa che il documento "<strong>{{package_name}}</strong>" è stato revocato dal mittente, <strong>{{initiator_name}}</strong>.',
      noActionRequired:
        "Nessuna ulteriore azione è richiesta da parte tua per questo documento. Non è più disponibile per la firma o il completamento.",
      contactSenderInfo:
        "Se ritieni che ciò sia stato fatto per errore, contatta direttamente il mittente.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Το έγγραφο ανακλήθηκε: {{package_name}}",
      heading: "Η ενέργεια δεν απαιτείται πλέον",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Σας ενημερώνουμε ότι το έγγραφο «<strong>{{package_name}}</strong>» έχει ανακληθεί από τον αποστολέα, <strong>{{initiator_name}}</strong>.",
      noActionRequired:
        "Δεν απαιτείται περαιτέρω ενέργεια από εσάς για αυτό το έγγραφο. Δεν είναι πλέον διαθέσιμο για υπογραφή ή συμπλήρωση.",
      contactSenderInfo:
        "Αν πιστεύετε ότι αυτό έγινε κατά λάθος, επικοινωνήστε απευθείας με τον αποστολέα.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  manualReminder: {
    en: {
      subject: "Reminder: Action Required on {{package_name}}",
      heading: "Friendly Reminder",
      greeting: "Hello {{recipient_name}},",
      message:
        'This is a reminder from <strong>{{initiator_name}}</strong> that the document "<strong>{{package_name}}</strong>" is still awaiting your action.',
      prompt:
        "Your prompt attention would be greatly appreciated to keep the process moving forward.",
      buttonText: "Review and Complete Document",
      instructionText:
        "Please follow the link above to complete your assigned tasks.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Recordatorio: Acción requerida en {{package_name}}",
      heading: "Recordatorio amistoso",
      greeting: "Hola {{recipient_name}},",
      message:
        'Este es un recordatorio de <strong>{{initiator_name}}</strong> de que el documento "<strong>{{package_name}}</strong>" todavía está esperando tu acción.',
      prompt:
        "Agradeceríamos enormemente tu pronta atención para que el proceso siga adelante.",
      buttonText: "Revisar y completar documento",
      instructionText:
        "Por favor, sigue el enlace de arriba para completar tus tareas asignadas.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Rappel : Action requise sur {{package_name}}",
      heading: "Rappel amical",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "Ceci est un rappel de <strong>{{initiator_name}}</strong> que le document « <strong>{{package_name}}</strong> » attend toujours votre action.",
      prompt:
        "Votre attention rapide serait grandement appréciée pour faire avancer le processus.",
      buttonText: "Réviser et compléter le document",
      instructionText:
        "Veuillez suivre le lien ci-dessus pour accomplir les tâches qui vous sont assignées.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Erinnerung: Handlung erforderlich bei {{package_name}}",
      heading: "Freundliche Erinnerung",
      greeting: "Hallo {{recipient_name}},",
      message:
        "Dies ist eine Erinnerung von <strong>{{initiator_name}}</strong>, dass das Dokument „<strong>{{package_name}}</strong>“ noch auf Ihre Aktion wartet.",
      prompt:
        "Ihre prompte Aufmerksamkeit wäre sehr willkommen, um den Prozess voranzutreiben.",
      buttonText: "Dokument überprüfen und vervollständigen",
      instructionText:
        "Bitte folgen Sie dem obigen Link, um Ihre zugewiesenen Aufgaben zu erledigen.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Promemoria: Azione richiesta su {{package_name}}",
      heading: "Promemoria amichevole",
      greeting: "Ciao {{recipient_name}},",
      message:
        'Questo è un promemoria da parte di <strong>{{initiator_name}}</strong> che il documento "<strong>{{package_name}}</strong>" è ancora in attesa di una tua azione.',
      prompt:
        "La tua pronta attenzione sarebbe molto apprezzata per far avanzare il processo.",
      buttonText: "Rivedi e completa il documento",
      instructionText:
        "Segui il link sopra per completare le tue attività assegnate.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Υπενθύμιση: Απαιτείται ενέργεια στο {{package_name}}",
      heading: "Φιλική υπενθύμιση",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Αυτή είναι μια υπενθύμιση από τον/την <strong>{{initiator_name}}</strong> ότι το έγγραφο «<strong>{{package_name}}</strong>» εξακολουθεί να αναμένει την ενέργειά σας.",
      prompt:
        "Η άμεση προσοχή σας θα εκτιμηθεί ιδιαίτερα για να προχωρήσει η διαδικασία.",
      buttonText: "Ελέγξτε και ολοκληρώστε το έγγραφο",
      instructionText:
        "Παρακαλούμε ακολουθήστε τον παραπάνω σύνδεσμο για να ολοκληρώσετε τις ανατεθειμένες εργασίες σας.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  newReceiverNotification: {
    en: {
      subject: "You've Been Added to a Document: {{package_name}}",
      heading: "You Have Access to a Document",
      greeting: "Hello {{recipient_name}},",
      message:
        '<strong>{{added_by_name}}</strong> has added you as a receiver for the document "<strong>{{package_name}}</strong>".',
      originalSenderInfo:
        "This document was originally sent by <strong>{{sender_name}}</strong>.",
      buttonText: "View Document",
      noActionRequired:
        "You have been granted access to view this document and its progress. No actions are required from you.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Te han añadido a un documento: {{package_name}}",
      heading: "Tienes acceso a un documento",
      greeting: "Hola {{recipient_name}},",
      message:
        '<strong>{{added_by_name}}</strong> te ha añadido como destinatario del documento "<strong>{{package_name}}</strong>".',
      originalSenderInfo:
        "Este documento fue enviado originalmente por <strong>{{sender_name}}</strong>.",
      buttonText: "Ver documento",
      noActionRequired:
        "Se te ha concedido acceso para ver este documento y su progreso. No se requieren acciones por tu parte.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Vous avez été ajouté à un document : {{package_name}}",
      heading: "Vous avez accès à un document",
      greeting: "Bonjour {{recipient_name}},",
      message:
        "<strong>{{added_by_name}}</strong> vous a ajouté comme destinataire du document « <strong>{{package_name}}</strong> ».",
      originalSenderInfo:
        "Ce document a été envoyé initialement par <strong>{{sender_name}}</strong>.",
      buttonText: "Voir le document",
      noActionRequired:
        "Vous avez obtenu l'accès pour consulter ce document et sa progression. Aucune action n'est requise de votre part.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Sie wurden zu einem Dokument hinzugefügt: {{package_name}}",
      heading: "Sie haben Zugriff auf ein Dokument",
      greeting: "Hallo {{recipient_name}},",
      message:
        "<strong>{{added_by_name}}</strong> hat Sie als Empfänger für das Dokument „<strong>{{package_name}}</strong>“ hinzugefügt.",
      originalSenderInfo:
        "Dieses Dokument wurde ursprünglich von <strong>{{sender_name}}</strong> gesendet.",
      buttonText: "Dokument anzeigen",
      noActionRequired:
        "Ihnen wurde der Zugriff zum Anzeigen dieses Dokuments und seines Fortschritts gewährt. Von Ihnen sind keine Maßnahmen erforderlich.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Sei stato aggiunto a un documento: {{package_name}}",
      heading: "Hai accesso a un documento",
      greeting: "Ciao {{recipient_name}},",
      message:
        '<strong>{{added_by_name}}</strong> ti ha aggiunto come destinatario del documento "<strong>{{package_name}}</strong>".',
      originalSenderInfo:
        "Questo documento è stato originariamente inviato da <strong>{{sender_name}}</strong>.",
      buttonText: "Visualizza documento",
      noActionRequired:
        "Ti è stato concesso l'accesso per visualizzare questo documento e i suoi progressi. Non è richiesta alcuna azione da parte tua.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Έχετε προστεθεί σε ένα έγγραφο: {{package_name}}",
      heading: "Έχετε πρόσβαση σε ένα έγγραφο",
      greeting: "Γεια σας {{recipient_name}},",
      message:
        "Ο/Η <strong>{{added_by_name}}</strong> σας έχει προσθέσει ως παραλήπτη για το έγγραφο «<strong>{{package_name}}</strong>».",
      originalSenderInfo:
        "Αυτό το έγγραφο στάλθηκε αρχικά από τον/την <strong>{{sender_name}}</strong>.",
      buttonText: "Προβολή εγγράφου",
      noActionRequired:
        "Σας έχει παραχωρηθεί πρόσβαση για την προβολή αυτού του εγγράφου και της προόδου του. Δεν απαιτούνται ενέργειες από εσάς.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  newReceiverOwnerNotification: {
    en: {
      subject: "New Receiver Added to Your Document: {{package_name}}",
      heading: "New Receiver Added",
      greeting: "Hello {{owner_name}},",
      message:
        'This is an automated notification for your document "<strong>{{package_name}}</strong>".',
      addedByHeader: "Added By:",
      newReceiverHeader: "New Receiver:",
      buttonText: "View Dashboard",
      noActionRequired:
        "No action is required from you. The new receiver has been notified.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Nuevo destinatario añadido a tu documento: {{package_name}}",
      heading: "Nuevo destinatario añadido",
      greeting: "Hola {{owner_name}},",
      message:
        'Esta es una notificación automática para tu documento "<strong>{{package_name}}</strong>".',
      addedByHeader: "Añadido por:",
      newReceiverHeader: "Nuevo destinatario:",
      buttonText: "Ver panel de control",
      noActionRequired:
        "No se requiere ninguna acción de tu parte. El nuevo destinatario ha sido notificado.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject:
        "Nouveau destinataire ajouté à votre document : {{package_name}}",
      heading: "Nouveau destinataire ajouté",
      greeting: "Bonjour {{owner_name}},",
      message:
        "Ceci est une notification automatique pour votre document « <strong>{{package_name}}</strong> ».",
      addedByHeader: "Ajouté par :",
      newReceiverHeader: "Nouveau destinataire :",
      buttonText: "Voir le tableau de bord",
      noActionRequired:
        "Aucune action n'est requise de votre part. Le nouveau destinataire a été notifié.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject:
        "Neuer Empfänger zu Ihrem Dokument hinzugefügt: {{package_name}}",
      heading: "Neuer Empfänger hinzugefügt",
      greeting: "Hallo {{owner_name}},",
      message:
        "Dies ist eine automatische Benachrichtigung für Ihr Dokument „<strong>{{package_name}}</strong>“.",
      addedByHeader: "Hinzugefügt von:",
      newReceiverHeader: "Neuer Empfänger:",
      buttonText: "Dashboard anzeigen",
      noActionRequired:
        "Von Ihnen ist keine Aktion erforderlich. Der neue Empfänger wurde benachrichtigt.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Nuovo destinatario aggiunto al tuo documento: {{package_name}}",
      heading: "Nuovo destinatario aggiunto",
      greeting: "Ciao {{owner_name}},",
      message:
        'Questa è una notifica automatica per il tuo documento "<strong>{{package_name}}</strong>".',
      addedByHeader: "Aggiunto da:",
      newReceiverHeader: "Nuovo destinatario:",
      buttonText: "Visualizza dashboard",
      noActionRequired:
        "Nessuna azione è richiesta da parte tua. Il nuovo destinatario è stato avvisato.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Νέος παραλήπτης προστέθηκε στο έγγραφό σας: {{package_name}}",
      heading: "Προστέθηκε νέος παραλήπτης",
      greeting: "Γεια σας {{owner_name}},",
      message:
        "Αυτή είναι μια αυτοματοποιημένη ειδοποίηση για το έγγραφό σας «<strong>{{package_name}}</strong>».",
      addedByHeader: "Προστέθηκε από:",
      newReceiverHeader: "Νέος παραλήπτης:",
      buttonText: "Προβολή πίνακα ελέγχου",
      noActionRequired:
        "Δεν απαιτείται καμία ενέργεια από εσάς. Ο νέος παραλήπτης έχει ειδοποιηθεί.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  subscriptionConfirmation: {
    en: {
      subject: "Your I-Sign Subscription is Active!",
      heading: "Your Subscription is Active!",
      greeting: "Hello {{user_name}},",
      message:
        "Thank you for subscribing! Your payment for the <strong>{{plan_name}}</strong> plan was successful and your account is now active.",
      planLabel: "Plan",
      amountLabel: "Amount Billed",
      renewalLabel: "Next Renewal",
      buttonText: "View Your Invoice",
      manageSubscriptionText:
        "You can manage your subscription at any time from your",
      billingPortalLinkText: "billing portal",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "¡Tu suscripción a I-Sign está activa!",
      heading: "¡Tu suscripción está activa!",
      greeting: "Hola {{user_name}},",
      message:
        "¡Gracias por suscribirte! Tu pago para el plan <strong>{{plan_name}}</strong> fue exitoso y tu cuenta ya está activa.",
      planLabel: "Plan",
      amountLabel: "Monto facturado",
      renewalLabel: "Próxima renovación",
      buttonText: "Ver tu factura",
      manageSubscriptionText:
        "Puedes gestionar tu suscripción en cualquier momento desde tu",
      billingPortalLinkText: "portal de facturación",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Votre abonnement I-Sign est actif !",
      heading: "Votre abonnement est actif !",
      greeting: "Bonjour {{user_name}},",
      message:
        "Merci de vous être abonné ! Votre paiement pour le forfait <strong>{{plan_name}}</strong> a réussi et votre compte est maintenant actif.",
      planLabel: "Forfait",
      amountLabel: "Montant facturé",
      renewalLabel: "Prochain renouvellement",
      buttonText: "Voir votre facture",
      manageSubscriptionText:
        "Vous pouvez gérer votre abonnement à tout moment depuis votre",
      billingPortalLinkText: "portail de facturation",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Ihr I-Sign-Abonnement ist aktiv!",
      heading: "Ihr Abonnement ist aktiv!",
      greeting: "Hallo {{user_name}},",
      message:
        "Danke für Ihr Abonnement! Ihre Zahlung für den <strong>{{plan_name}}</strong>-Plan war erfolgreich und Ihr Konto ist jetzt aktiv.",
      planLabel: "Plan",
      amountLabel: "Abgerechneter Betrag",
      renewalLabel: "Nächste Verlängerung",
      buttonText: "Ihre Rechnung ansehen",
      manageSubscriptionText: "Sie können Ihr Abonnement jederzeit in Ihrem",
      billingPortalLinkText: "Abrechnungsportal",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Il tuo abbonamento I-Sign è attivo!",
      heading: "Il tuo abbonamento è attivo!",
      greeting: "Ciao {{user_name}},",
      message:
        "Grazie per esserti iscritto! Il tuo pagamento per il piano <strong>{{plan_name}}</strong> è andato a buon fine e il tuo account è ora attivo.",
      planLabel: "Piano",
      amountLabel: "Importo fatturato",
      renewalLabel: "Prossimo rinnovo",
      buttonText: "Visualizza la tua fattura",
      manageSubscriptionText:
        "Puoi gestire il tuo abbonamento in qualsiasi momento dal tuo",
      billingPortalLinkText: "portale di fatturazione",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Η συνδρομή σας στο I-Sign είναι ενεργή!",
      heading: "Η συνδρομή σας είναι ενεργή!",
      greeting: "Γεια σας {{user_name}},",
      message:
        "Σας ευχαριστούμε για την εγγραφή σας! Η πληρωμή σας για το πρόγραμμα <strong>{{plan_name}}</strong> ήταν επιτυχής και ο λογαριασμός σας είναι πλέον ενεργός.",
      planLabel: "Πρόγραμμα",
      amountLabel: "Χρεωμένο ποσό",
      renewalLabel: "Επόμενη ανανέωση",
      buttonText: "Δείτε το τιμολόγιό σας",
      manageSubscriptionText:
        "Μπορείτε να διαχειριστείτε τη συνδρομή σας ανά πάσα στιγμή από την",
      billingPortalLinkText: "πύλη χρεώσεων",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  subscriptionCancellation: {
    en: {
      subject: "Your Subscription Cancellation is Confirmed",
      heading: "Your Subscription Will Be Canceled",
      greeting: "Hello {{user_name}},",
      message:
        "This email confirms that your <strong>{{plan_name}}</strong> plan will not automatically renew. Your subscription will remain active until <strong>{{expiry_date}}</strong>.",
      reactivatePrompt:
        "Changed your mind? You can reactivate your plan anytime before it expires.",
      buttonText: "Manage Your Subscription",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Se ha confirmado la cancelación de tu suscripción",
      heading: "Tu suscripción será cancelada",
      greeting: "Hola {{user_name}},",
      message:
        "Este correo confirma que tu plan <strong>{{plan_name}}</strong> no se renovará automáticamente. Tu suscripción permanecerá activa hasta el <strong>{{expiry_date}}</strong>.",
      reactivatePrompt:
        "¿Cambiaste de opinión? Puedes reactivar tu plan en cualquier momento antes de que expire.",
      buttonText: "Gestionar tu suscripción",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "La résiliation de votre abonnement est confirmée",
      heading: "Votre abonnement sera résilié",
      greeting: "Bonjour {{user_name}},",
      message:
        "Cet e-mail confirme que votre forfait <strong>{{plan_name}}</strong> ne sera pas renouvelé automatiquement. Votre abonnement restera actif jusqu'au <strong>{{expiry_date}}</strong>.",
      reactivatePrompt:
        "Vous avez changé d'avis ? Vous pouvez réactiver votre forfait à tout moment avant son expiration.",
      buttonText: "Gérer votre abonnement",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Ihre Abonnementkündigung ist bestätigt",
      heading: "Ihr Abonnement wird gekündigt",
      greeting: "Hallo {{user_name}},",
      message:
        "Diese E-Mail bestätigt, dass Ihr <strong>{{plan_name}}</strong>-Plan nicht automatisch verlängert wird. Ihr Abonnement bleibt bis zum <strong>{{expiry_date}}</strong> aktiv.",
      reactivatePrompt:
        "Haben Sie Ihre Meinung geändert? Sie können Ihren Plan jederzeit vor Ablauf reaktivieren.",
      buttonText: "Ihr Abonnement verwalten",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "La cancellazione del tuo abbonamento è confermata",
      heading: "Il tuo abbonamento verrà annullato",
      greeting: "Ciao {{user_name}},",
      message:
        "Questa email conferma che il tuo piano <strong>{{plan_name}}</strong> non si rinnoverà automaticamente. Il tuo abbonamento rimarrà attivo fino al <strong>{{expiry_date}}</strong>.",
      reactivatePrompt:
        "Hai cambiato idea? Puoi riattivare il tuo piano in qualsiasi momento prima della scadenza.",
      buttonText: "Gestisci il tuo abbonamento",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Η ακύρωση της συνδρομής σας επιβεβαιώθηκε",
      heading: "Η συνδρομή σας θα ακυρωθεί",
      greeting: "Γεια σας {{user_name}},",
      message:
        "Αυτό το email επιβεβαιώνει ότι το πρόγραμμά σας <strong>{{plan_name}}</strong> δεν θα ανανεωθεί αυτόματα. Η συνδρομή σας θα παραμείνει ενεργή μέχρι τις <strong>{{expiry_date}}</strong>.",
      reactivatePrompt:
        "Αλλάξατε γνώμη; Μπορείτε να ενεργοποιήσετε ξανά το πρόγραμμά σας ανά πάσα στιγμή πριν λήξει.",
      buttonText: "Διαχείριση της συνδρομής σας",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  subscriptionReactivation: {
    en: {
      subject: "Your Subscription Has Been Reactivated",
      heading: "Your Subscription is Reactivated!",
      greeting: "Hello {{user_name}},",
      message:
        "You have successfully reactivated your <strong>{{plan_name}}</strong> plan. It will now automatically renew on <strong>{{renewal_date}}</strong>.",
      buttonText: "Manage Your Subscription",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Tu suscripción ha sido reactivada",
      heading: "¡Tu suscripción está reactivada!",
      greeting: "Hola {{user_name}},",
      message:
        "Has reactivado correctamente tu plan <strong>{{plan_name}}</strong>. Ahora se renovará automáticamente el <strong>{{renewal_date}}</strong>.",
      buttonText: "Gestionar tu suscripción",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Votre abonnement a été réactivé",
      heading: "Votre abonnement est réactivé !",
      greeting: "Bonjour {{user_name}},",
      message:
        "Vous avez réactivé avec succès votre forfait <strong>{{plan_name}}</strong>. Il sera maintenant renouvelé automatiquement le <strong>{{renewal_date}}</strong>.",
      buttonText: "Gérer votre abonnement",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Ihr Abonnement wurde reaktiviert",
      heading: "Ihr Abonnement ist reaktiviert!",
      greeting: "Hallo {{user_name}},",
      message:
        "Sie haben Ihren <strong>{{plan_name}}</strong>-Plan erfolgreich reaktiviert. Er wird nun automatisch am <strong>{{renewal_date}}</strong> verlängert.",
      buttonText: "Ihr Abonnement verwalten",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Il tuo abbonamento è stato riattivato",
      heading: "Il tuo abbonamento è stato riattivato!",
      greeting: "Ciao {{user_name}},",
      message:
        "Hai riattivato con successo il tuo piano <strong>{{plan_name}}</strong>. Ora si rinnoverà automaticamente il <strong>{{renewal_date}}</strong>.",
      buttonText: "Gestisci il tuo abbonamento",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Η συνδρομή σας έχει ενεργοποιηθεί ξανά",
      heading: "Η συνδρομή σας ενεργοποιήθηκε ξανά!",
      greeting: "Γεια σας {{user_name}},",
      message:
        "Έχετε ενεργοποιήσει ξανά με επιτυχία το πρόγραμμά σας <strong>{{plan_name}}</strong>. Θα ανανεωθεί τώρα αυτόματα στις <strong>{{renewal_date}}</strong>.",
      buttonText: "Διαχείριση της συνδρομής σας",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  trialActivation: {
    en: {
      subject: "Your Free Trial is Active!",
      heading: "Your Free Trial is Active!",
      greeting: "Hello {{user_name}},",
      message:
        "Your free trial of the <strong>{{plan_name}}</strong> plan has been activated! You can now explore all the features and start creating documents right away.",
      planLabel: "Trial Plan",
      endDateLabel: "Trial Ends On",
      docLimitLabel: "Document Limit",
      docLimitUnit: "Documents",
      buttonText: "Go to Your Dashboard",
      manageSubscriptionText:
        "Ready to upgrade? You can manage your subscription at any time from your",
      billingPortalLinkText: "billing portal",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "¡Tu prueba gratuita está activa!",
      heading: "¡Tu prueba gratuita está activa!",
      greeting: "Hola {{user_name}},",
      message:
        "¡Tu prueba gratuita del plan <strong>{{plan_name}}</strong> ha sido activada! Ahora puedes explorar todas las funciones y empezar a crear documentos de inmediato.",
      planLabel: "Plan de prueba",
      endDateLabel: "La prueba termina el",
      docLimitLabel: "Límite de documentos",
      docLimitUnit: "Documentos",
      buttonText: "Ir a tu panel de control",
      manageSubscriptionText:
        "¿Listo para actualizar? Puedes gestionar tu suscripción en cualquier momento desde tu",
      billingPortalLinkText: "portal de facturación",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Votre essai gratuit est activé !",
      heading: "Votre essai gratuit est activé !",
      greeting: "Bonjour {{user_name}},",
      message:
        "Votre essai gratuit du forfait <strong>{{plan_name}}</strong> a été activé ! Vous pouvez maintenant explorer toutes les fonctionnalités et commencer à créer des documents sans tarder.",
      planLabel: "Forfait d'essai",
      endDateLabel: "L'essai se termine le",
      docLimitLabel: "Limite de documents",
      docLimitUnit: "Documents",
      buttonText: "Aller à votre tableau de bord",
      manageSubscriptionText:
        "Prêt à mettre à niveau ? Vous pouvez gérer votre abonnement à tout moment depuis votre",
      billingPortalLinkText: "portail de facturation",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Ihre kostenlose Testversion ist aktiv!",
      heading: "Ihre kostenlose Testversion ist aktiv!",
      greeting: "Hallo {{user_name}},",
      message:
        "Ihre kostenlose Testversion des <strong>{{plan_name}}</strong>-Plans wurde aktiviert! Sie können jetzt alle Funktionen erkunden und sofort mit der Erstellung von Dokumenten beginnen.",
      planLabel: "Testplan",
      endDateLabel: "Testversion endet am",
      docLimitLabel: "Dokumentenlimit",
      docLimitUnit: "Dokumente",
      buttonText: "Zum Dashboard gehen",
      manageSubscriptionText:
        "Bereit zum Upgrade? Sie können Ihr Abonnement jederzeit in Ihrem",
      billingPortalLinkText: "Abrechnungsportal",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "La tua prova gratuita è attiva!",
      heading: "La tua prova gratuita è attiva!",
      greeting: "Ciao {{user_name}},",
      message:
        "La tua prova gratuita del piano <strong>{{plan_name}}</strong> è stata attivata! Ora puoi esplorare tutte le funzionalità e iniziare subito a creare documenti.",
      planLabel: "Piano di prova",
      endDateLabel: "La prova termina il",
      docLimitLabel: "Limite documenti",
      docLimitUnit: "Documenti",
      buttonText: "Vai alla tua dashboard",
      manageSubscriptionText:
        "Pronto per l'aggiornamento? Puoi gestire il tuo abbonamento in qualsiasi momento dal tuo",
      billingPortalLinkText: "portale di fatturazione",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Η δωρεάν δοκιμή σας είναι ενεργή!",
      heading: "Η δωρεάν δοκιμή σας είναι ενεργή!",
      greeting: "Γεια σας {{user_name}},",
      message:
        "Η δωρεάν δοκιμή σας για το πρόγραμμα <strong>{{plan_name}}</strong> έχει ενεργοποιηθεί! Μπορείτε τώρα να εξερευνήσετε όλες τις δυνατότητες και να αρχίσετε να δημιουργείτε έγγραφα αμέσως.",
      planLabel: "Δοκιμαστικό πρόγραμμα",
      endDateLabel: "Η δοκιμή λήγει στις",
      docLimitLabel: "Όριο εγγράφων",
      docLimitUnit: "Έγγραφα",
      buttonText: "Μετάβαση στον πίνακα ελέγχου σας",
      manageSubscriptionText:
        "Έτοιμοι για αναβάθμιση; Μπορείτε να διαχειριστείτε τη συνδρομή σας ανά πάσα στιγμή από την",
      billingPortalLinkText: "πύλη χρεώσεων",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  subscriptionExpiryReminder: {
    en: {
      subject: "Your I-Sign Subscription Expires Tomorrow",
      heading: "Your Subscription Expires Soon",
      greeting: "Hello {{user_name}},",
      message:
        "Your <strong>{{plan_name}}</strong> subscription will expire on <strong>{{expiry_date}}</strong>. To continue enjoying uninterrupted access, please renew your subscription.",
      planLabel: "Current Plan",
      expiryLabel: "Expires On",
      documentsLabel: "Documents Used",
      buttonText: "Renew Subscription",
      manageSubscriptionText: "Manage your subscription from your",
      billingPortalLinkText: "billing portal",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Tu suscripción a I-Sign expira mañana",
      heading: "Tu suscripción expira pronto",
      greeting: "Hola {{user_name}},",
      message:
        "Tu suscripción <strong>{{plan_name}}</strong> expirará el <strong>{{expiry_date}}</strong>. Para seguir disfrutando de acceso ininterrumpido, renueva tu suscripción.",
      planLabel: "Plan actual",
      expiryLabel: "Expira el",
      documentsLabel: "Documentos utilizados",
      buttonText: "Renovar suscripción",
      manageSubscriptionText: "Gestiona tu suscripción desde tu",
      billingPortalLinkText: "portal de facturación",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Votre abonnement I-Sign expire demain",
      heading: "Votre abonnement expire bientôt",
      greeting: "Bonjour {{user_name}},",
      message:
        "Votre abonnement <strong>{{plan_name}}</strong> expirera le <strong>{{expiry_date}}</strong>. Pour continuer à profiter d’un accès ininterrompu, veuillez renouveler votre abonnement.",
      planLabel: "Forfait actuel",
      expiryLabel: "Expire le",
      documentsLabel: "Documents utilisés",
      buttonText: "Renouveler l’abonnement",
      manageSubscriptionText: "Gérez votre abonnement depuis votre",
      billingPortalLinkText: "portail de facturation",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },

    de: {
      subject: "Ihr I-Sign-Abonnement läuft morgen ab",
      heading: "Ihr Abonnement läuft bald ab",
      greeting: "Hallo {{user_name}},",
      message:
        "Ihr <strong>{{plan_name}}</strong>-Abonnement läuft am <strong>{{expiry_date}}</strong> ab. Um weiterhin ununterbrochenen Zugriff zu genießen, verlängern Sie bitte Ihr Abonnement.",
      planLabel: "Aktueller Plan",
      expiryLabel: "Läuft ab am",
      documentsLabel: "Verwendete Dokumente",
      buttonText: "Abonnement verlängern",
      manageSubscriptionText: "Verwalten Sie Ihr Abonnement in Ihrem",
      billingPortalLinkText: "Abrechnungsportal",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },

    it: {
      subject: "Il tuo abbonamento I-Sign scade domani",
      heading: "Il tuo abbonamento sta per scadere",
      greeting: "Ciao {{user_name}},",
      message:
        "Il tuo abbonamento al piano <strong>{{plan_name}}</strong> scadrà il <strong>{{expiry_date}}</strong>. Per continuare a usufruire dell’accesso senza interruzioni, rinnova il tuo abbonamento.",
      planLabel: "Piano attuale",
      expiryLabel: "Scade il",
      documentsLabel: "Documenti utilizzati",
      buttonText: "Rinnova abbonamento",
      manageSubscriptionText: "Gestisci il tuo abbonamento dal tuo",
      billingPortalLinkText: "portale di fatturazione",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento",
    },

    el: {
      subject: "Η συνδρομή σας στο I-Sign λήγει αύριο",
      heading: "Η συνδρομή σας λήγει σύντομα",
      greeting: "Γεια σας {{user_name}},",
      message:
        "Η συνδρομή σας στο πρόγραμμα <strong>{{plan_name}}</strong> θα λήξει στις <strong>{{expiry_date}}</strong>. Για να συνεχίσετε να έχετε απρόσκοπτη πρόσβαση, παρακαλούμε ανανεώστε τη συνδρομή σας.",
      planLabel: "Τρέχον πρόγραμμα",
      expiryLabel: "Λήγει στις",
      documentsLabel: "Έγγραφα που χρησιμοποιήθηκαν",
      buttonText: "Ανανέωση συνδρομής",
      manageSubscriptionText: "Διαχειριστείτε τη συνδρομή σας από την",
      billingPortalLinkText: "πύλη χρεώσεων",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },

    // Add other languages similarly...
  },
  subscriptionExpired: {
    en: {
      subject: "Your I-Sign Subscription Has Expired",
      heading: "Your Subscription Has Expired",
      greeting: "Hello {{user_name}},",
      message:
        "Your <strong>{{plan_name}}</strong> subscription expired on <strong>{{expiry_date}}</strong>. To regain access to all features, please renew your subscription.",
      planLabel: "Expired Plan",
      expiryLabel: "Expired On",
      documentsLabel: "Documents Used",
      buttonText: "Renew Now",
      manageSubscriptionText: "Renew your subscription from your",
      billingPortalLinkText: "billing portal",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Tu suscripción a I-Sign ha expirado",
      heading: "Tu suscripción ha expirado",
      greeting: "Hola {{user_name}},",
      message:
        "Tu suscripción <strong>{{plan_name}}</strong> expiró el <strong>{{expiry_date}}</strong>. Para recuperar el acceso a todas las funciones, renueva tu suscripción.",
      planLabel: "Plan expirado",
      expiryLabel: "Expiró el",
      documentsLabel: "Documentos utilizados",
      buttonText: "Renovar ahora",
      manageSubscriptionText: "Renueva tu suscripción desde tu",
      billingPortalLinkText: "portal de facturación",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Votre abonnement I-Sign a expiré",
      heading: "Votre abonnement a expiré",
      greeting: "Bonjour {{user_name}},",
      message:
        "Votre abonnement <strong>{{plan_name}}</strong> a expiré le <strong>{{expiry_date}}</strong>. Pour retrouver l’accès à toutes les fonctionnalités, veuillez renouveler votre abonnement.",
      planLabel: "Forfait expiré",
      expiryLabel: "Expiré le",
      documentsLabel: "Documents utilisés",
      buttonText: "Renouveler maintenant",
      manageSubscriptionText: "Renouvelez votre abonnement depuis votre",
      billingPortalLinkText: "portail de facturation",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },

    de: {
      subject: "Ihr I-Sign-Abonnement ist abgelaufen",
      heading: "Ihr Abonnement ist abgelaufen",
      greeting: "Hallo {{user_name}},",
      message:
        "Ihr <strong>{{plan_name}}</strong>-Abonnement ist am <strong>{{expiry_date}}</strong> abgelaufen. Um wieder vollen Zugriff auf alle Funktionen zu erhalten, verlängern Sie bitte Ihr Abonnement.",
      planLabel: "Abgelaufener Plan",
      expiryLabel: "Abgelaufen am",
      documentsLabel: "Verwendete Dokumente",
      buttonText: "Jetzt verlängern",
      manageSubscriptionText: "Verlängern Sie Ihr Abonnement in Ihrem",
      billingPortalLinkText: "Abrechnungsportal",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },

    it: {
      subject: "Il tuo abbonamento I-Sign è scaduto",
      heading: "Il tuo abbonamento è scaduto",
      greeting: "Ciao {{user_name}},",
      message:
        "Il tuo abbonamento al piano <strong>{{plan_name}}</strong> è scaduto il <strong>{{expiry_date}}</strong>. Per riottenere l’accesso completo, rinnova il tuo abbonamento.",
      planLabel: "Piano scaduto",
      expiryLabel: "Scaduto il",
      documentsLabel: "Documenti utilizzati",
      buttonText: "Rinnova ora",
      manageSubscriptionText: "Rinnova il tuo abbonamento dal tuo",
      billingPortalLinkText: "portale di fatturazione",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento",
    },

    el: {
      subject: "Η συνδρομή σας στο I-Sign έχει λήξει",
      heading: "Η συνδρομή σας έχει λήξει",
      greeting: "Γεια σας {{user_name}},",
      message:
        "Η συνδρομή σας στο πρόγραμμα <strong>{{plan_name}}</strong> έληξε στις <strong>{{expiry_date}}</strong>. Για να ανακτήσετε πρόσβαση σε όλες τις λειτουργίες, παρακαλούμε ανανεώστε τη συνδρομή σας.",
      planLabel: "Έληξε το πρόγραμμα",
      expiryLabel: "Έληξε στις",
      documentsLabel: "Έγγραφα που χρησιμοποιήθηκαν",
      buttonText: "Ανανέωση τώρα",
      manageSubscriptionText: "Ανανεώστε τη συνδρομή σας από την",
      billingPortalLinkText: "πύλη χρεώσεων",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
    // Add other languages similarly...
  },
  reviewRequest: {
    en: {
      subject: "We'd Love Your Feedback",
      heading: "We'd Love Your Feedback",
      greeting: "Hello {{participant_name}},",
      message:
        "We hope you had a great experience with the <strong>{{package_name}}</strong> package. Your feedback is important to us and helps us improve.",
      buttonText: "Leave a Review",
      closingMessage:
        "This should only take a moment. Thank you for helping us make I-Sign.eu better!",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Nos Encantaría Conocer Tu Opinión",
      heading: "Nos Encantaría Conocer Tu Opinión",
      greeting: "Hola {{participant_name}},",
      message:
        "Esperamos que hayas tenido una gran experiencia con el paquete <strong>{{package_name}}</strong>. Tu opinión es importante para nosotros y nos ayuda a mejorar.",
      buttonText: "Dejar una Reseña",
      closingMessage:
        "Esto solo tomará un momento. ¡Gracias por ayudarnos a hacer I-Sign.eu mejor!",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Nous Aimerions Votre Avis",
      heading: "Nous Aimerions Votre Avis",
      greeting: "Bonjour {{participant_name}},",
      message:
        "Nous espérons que vous avez eu une excellente expérience avec le package <strong>{{package_name}}</strong>. Votre avis est important pour nous et nous aide à nous améliorer.",
      buttonText: "Laisser un Avis",
      closingMessage:
        "Cela ne prendra qu'un instant. Merci de nous aider à améliorer I-Sign.eu !",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Wir Würden Uns Über Ihr Feedback Freuen",
      heading: "Wir Würden Uns Über Ihr Feedback Freuen",
      greeting: "Hallo {{participant_name}},",
      message:
        "Wir hoffen, dass Sie eine großartige Erfahrung mit dem Paket <strong>{{package_name}}</strong> gemacht haben. Ihr Feedback ist uns wichtig und hilft uns, uns zu verbessern.",
      buttonText: "Bewertung Abgeben",
      closingMessage:
        "Dies dauert nur einen Moment. Vielen Dank, dass Sie uns helfen, I-Sign.eu besser zu machen!",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Ci Piacerebbe Avere Il Tuo Feedback",
      heading: "Ci Piacerebbe Avere Il Tuo Feedback",
      greeting: "Ciao {{participant_name}},",
      message:
        "Speriamo che tu abbia avuto un'ottima esperienza con il pacchetto <strong>{{package_name}}</strong>. Il tuo feedback è importante per noi e ci aiuta a migliorare.",
      buttonText: "Lascia una Recensione",
      closingMessage:
        "Questo richiederà solo un momento. Grazie per aiutarci a rendere I-Sign.eu migliore!",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Θα Θέλαμε Τα Σχόλιά Σας",
      heading: "Θα Θέλαμε Τα Σχόλιά Σας",
      greeting: "Γεια σας {{participant_name}},",
      message:
        "Ελπίζουμε να είχατε μια εξαιρετική εμπειρία με το πακέτο <strong>{{package_name}}</strong>. Τα σχόλιά σας είναι σημαντικά για εμάς και μας βοηθούν να βελτιωθούμε.",
      buttonText: "Αφήστε μια Κριτική",
      closingMessage:
        "Αυτό θα πάρει μόνο μια στιγμή. Ευχαριστούμε που μας βοηθάτε να κάνουμε το I-Sign.eu καλύτερο!",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  reviewImprovement: {
    en: {
      subject: "Thank You For Your Feedback",
      heading: "Thank You For Your Honesty",
      greeting: "Hello {{reviewer_name}},",
      message:
        "We've received your feedback and we’re sorry to hear that your experience didn’t meet your expectations. We truly value your input, as it helps us identify areas where we can improve.",
      closingMessage:
        "Our team will be reviewing your comments to make I-Sign.eu better for everyone. Thank you again for taking the time to share your thoughts.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "Gracias por tus comentarios",
      heading: "Gracias por tu honestidad",
      greeting: "Hola {{reviewer_name}},",
      message:
        "Hemos recibido tus comentarios y lamentamos saber que tu experiencia no cumplió con tus expectativas. Valoramos mucho tu opinión, ya que nos ayuda a identificar áreas en las que podemos mejorar.",
      closingMessage:
        "Nuestro equipo revisará tus comentarios para hacer que I-Sign.eu sea mejor para todos. Gracias de nuevo por tomarte el tiempo de compartir tus pensamientos.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Merci pour vos commentaires",
      heading: "Merci pour votre honnêteté",
      greeting: "Bonjour {{reviewer_name}},",
      message:
        "Nous avons reçu vos commentaires et nous sommes désolés d'apprendre que votre expérience n'a pas répondu à vos attentes. Nous apprécions vraiment votre contribution, car elle nous aide à identifier les domaines où nous pouvons nous améliorer.",
      closingMessage:
        "Notre équipe examinera vos commentaires pour améliorer I-Sign.eu pour tout le monde. Merci encore d'avoir pris le temps de partager vos réflexions.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Danke für Ihr Feedback",
      heading: "Danke für Ihre Ehrlichkeit",
      greeting: "Hallo {{reviewer_name}},",
      message:
        "Wir haben Ihr Feedback erhalten und bedauern, dass Ihre Erfahrung nicht Ihren Erwartungen entsprochen hat. Wir schätzen Ihren Beitrag sehr, da er uns hilft, Bereiche zu identifizieren, in denen wir uns verbessern können.",
      closingMessage:
        "Unser Team wird Ihre Kommentare prüfen, um I-Sign.eu für alle besser zu machen. Vielen Dank noch einmal, dass Sie sich die Zeit genommen haben, Ihre Gedanken zu teilen.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Grazie per il tuo feedback",
      heading: "Grazie per la tua onestà",
      greeting: "Ciao {{reviewer_name}},",
      message:
        "Abbiamo ricevuto il tuo feedback e ci dispiace sapere che la tua esperienza non ha soddisfatto le tue aspettative. Apprezziamo molto il tuo contributo, poiché ci aiuta a identificare le aree in cui possiamo migliorare.",
      closingMessage:
        "Il nostro team esaminerà i tuoi commenti per rendere I-Sign.eu migliore per tutti. Grazie ancora per aver dedicato del tempo a condividere i tuoi pensieri.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Ευχαριστούμε για τα σχόλιά σας",
      heading: "Σας ευχαριστούμε για την ειλικρίνειά σας",
      greeting: "Γεια σας {{reviewer_name}},",
      message:
        "Λάβαμε τα σχόλιά σας και λυπούμαστε που η εμπειρία σας δεν ανταποκρίθηκε στις προσδοκίες σας. Εκτιμούμε πραγματικά τη συμβολή σας, καθώς μας βοηθά να εντοπίσουμε τομείς στους οποίους μπορούμε να βελτιωθούμε.",
      closingMessage:
        "Η ομάδα μας θα εξετάσει τα σχόλιά σας για να κάνει το I-Sign.eu καλύτερο για όλους. Σας ευχαριστούμε και πάλι που αφιερώσατε χρόνο για να μοιραστείτε τις σκέψεις σας.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  reviewAppreciation: {
    en: {
      subject: "Thank You for Your Feedback!",
      heading: "Thanks for the Great Review!",
      greeting: "Hello {{reviewer_name}},",
      message:
        "Thank you so much for your positive feedback! We're thrilled to hear that you had a great experience with our service.",
      closingMessage:
        "It was a pleasure working with you and we look forward to seeing you again soon.",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "¡Gracias por tus comentarios!",
      heading: "¡Gracias por la excelente reseña!",
      greeting: "Hola {{reviewer_name}},",
      message:
        "¡Muchas gracias por tus comentarios positivos! Estamos encantados de saber que tuviste una gran experiencia con nuestro servicio.",
      closingMessage:
        "Fue un placer trabajar contigo y esperamos verte de nuevo pronto.",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Merci pour vos commentaires !",
      heading: "Merci pour cette excellente évaluation !",
      greeting: "Bonjour {{reviewer_name}},",
      message:
        "Merci beaucoup pour vos commentaires positifs ! Nous sommes ravis d'apprendre que vous avez eu une excellente expérience avec notre service.",
      closingMessage:
        "Ce fut un plaisir de travailler avec vous et nous espérons vous revoir bientôt.",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Danke für Ihr Feedback!",
      heading: "Danke für die tolle Bewertung!",
      greeting: "Hallo {{reviewer_name}},",
      message:
        "Vielen Dank für Ihr positives Feedback! Wir freuen uns sehr zu hören, dass Sie eine großartige Erfahrung mit unserem Service gemacht haben.",
      closingMessage:
        "Es war uns eine Freude, mit Ihnen zu arbeiten, und wir freuen uns darauf, Sie bald wiederzusehen.",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Grazie per il tuo feedback!",
      heading: "Grazie per l'ottima recensione!",
      greeting: "Ciao {{reviewer_name}},",
      message:
        "Grazie mille per il tuo feedback positivo! Siamo entusiasti di sapere che hai avuto un'ottima esperienza con il nostro servizio.",
      closingMessage:
        "È stato un piacere lavorare con te e non vediamo l'ora di rivederti presto.",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Ευχαριστούμε για τα σχόλιά σας!",
      heading: "Ευχαριστούμε για την εξαιρετική κριτική!",
      greeting: "Γεια σας {{reviewer_name}},",
      message:
        "Σας ευχαριστούμε πολύ για τα θετικά σας σχόλια! Είμαστε ενθουσιασμένοι που ακούμε ότι είχατε μια εξαιρετική εμπειρία με την υπηρεσία μας.",
      closingMessage:
        "Ήταν χαρά μας που συνεργαστήκαμε μαζί σας και ανυπομονούμε να σας ξαναδούμε σύντομα.",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  participantAction: {
    en: {
      subject: "Progress Update on: {{package_name}}",
      heading: "Progress Update",
      greeting: "Hello {{initiator_name}},",
      message:
        'An action has just been completed by <strong>{{actor_name}}</strong> for the document package "<strong>{{package_name}}</strong>". Here is the current status of all participants:',
      completedHeader: "Completed Participants",
      pendingHeader: "Pending Participants",
      allCompleteMessage:
        "<p>All participants have now completed their actions!</p>",
      buttonText: "Track Document Progress",
      closingMessage:
        "You will receive another notification when the next participant acts or when the document is finalized.",
      footerText:
        "Questions about this document? Reply to this email to contact the sender directly.",
      unsubscribe: "Unsubscribe",
    },
    es: {
      subject: "Actualización de progreso en: {{package_name}}",
      heading: "Actualización de progreso",
      greeting: "Hola {{initiator_name}},",
      message:
        '<strong>{{actor_name}}</strong> acaba de completar una acción para el paquete de documentos "<strong>{{package_name}}</strong>". Este es el estado actual de todos los participantes:',
      completedHeader: "Participantes completados",
      pendingHeader: "Participantes pendientes",
      allCompleteMessage:
        "<p>¡Todos los participantes han completado sus acciones!</p>",
      buttonText: "Seguir el progreso del documento",
      closingMessage:
        "Recibirás otra notificación cuando el próximo participante actúe o cuando el documento esté finalizado.",
      footerText:
        "¿Preguntas sobre este documento? Responde a este correo para contactar directamente al remitente.",
      unsubscribe: "Darse de baja",
    },
    fr: {
      subject: "Mise à jour de la progression sur : {{package_name}}",
      heading: "Mise à jour de la progression",
      greeting: "Bonjour {{initiator_name}},",
      message:
        "Une action vient d'être complétée par <strong>{{actor_name}}</strong> pour le paquet de documents « <strong>{{package_name}}</strong> ». Voici le statut actuel de tous les participants :",
      completedHeader: "Participants ayant terminé",
      pendingHeader: "Participants en attente",
      allCompleteMessage:
        "<p>Tous les participants ont maintenant terminé leurs actions !</p>",
      buttonText: "Suivre la progression du document",
      closingMessage:
        "Vous recevrez une autre notification lorsque le prochain participant agira ou lorsque le document sera finalisé.",
      footerText:
        "Des questions sur ce document ? Répondez à cet e-mail pour contacter directement l'expéditeur.",
      unsubscribe: "Se désabonner",
    },
    de: {
      subject: "Fortschritts-Update zu: {{package_name}}",
      heading: "Fortschritts-Update",
      greeting: "Hallo {{initiator_name}},",
      message:
        "Eine Aktion wurde gerade von <strong>{{actor_name}}</strong> für das Dokumentenpaket „<strong>{{package_name}}</strong>“ abgeschlossen. Hier ist der aktuelle Status aller Teilnehmer:",
      completedHeader: "Abgeschlossene Teilnehmer",
      pendingHeader: "Ausstehende Teilnehmer",
      allCompleteMessage:
        "<p>Alle Teilnehmer haben ihre Aktionen abgeschlossen!</p>",
      buttonText: "Dokumentenfortschritt verfolgen",
      closingMessage:
        "Sie erhalten eine weitere Benachrichtigung, wenn der nächste Teilnehmer handelt oder wenn das Dokument fertiggestellt ist.",
      footerText:
        "Fragen zu diesem Dokument? Antworten Sie auf diese E-Mail, um den Absender direkt zu kontaktieren.",
      unsubscribe: "Abmelden",
    },
    it: {
      subject: "Aggiornamento sullo stato di avanzamento di: {{package_name}}",
      heading: "Aggiornamento sullo stato di avanzamento",
      greeting: "Ciao {{initiator_name}},",
      message:
        'Un\'azione è stata appena completata da <strong>{{actor_name}}</strong> per il pacchetto di documenti "<strong>{{package_name}}</strong>". Ecco lo stato attuale di tutti i partecipanti:',
      completedHeader: "Partecipanti che hanno completato",
      pendingHeader: "Partecipanti in attesa",
      allCompleteMessage:
        "<p>Tutti i partecipanti hanno completato le loro azioni!</p>",
      buttonText: "Traccia i progressi del documento",
      closingMessage:
        "Riceverai un'altra notifica quando il prossimo partecipante agirà o quando il documento sarà finalizzato.",
      footerText:
        "Domande su questo documento? Rispondi a questa email per contattare direttamente il mittente.",
      unsubscribe: "Annulla iscrizione",
    },
    el: {
      subject: "Ενημέρωση προόδου για: {{package_name}}",
      heading: "Ενημέρωση προόδου",
      greeting: "Γεια σας {{initiator_name}},",
      message:
        "Μια ενέργεια μόλις ολοκληρώθηκε από τον/την <strong>{{actor_name}}</strong> για το πακέτο εγγράφων «<strong>{{package_name}}</strong>». Ακολουθεί η τρέχουσα κατάσταση όλων των συμμετεχόντων:",
      completedHeader: "Ολοκληρωμένοι συμμετέχοντες",
      pendingHeader: "Εκκρεμείς συμμετέχοντες",
      allCompleteMessage:
        "<p>Όλοι οι συμμετέχοντες έχουν ολοκληρώσει τις ενέργειές τους!</p>",
      buttonText: "Παρακολούθηση προόδου εγγράφου",
      closingMessage:
        "Θα λάβετε άλλη ειδοποίηση όταν ο επόμενος συμμετέχων ενεργήσει ή όταν οριστικοποιηθεί το έγγραφο.",
      footerText:
        "Ερωτήσεις σχετικά με αυτό το έγγραφο; Απαντήστε σε αυτό το email για να επικοινωνήσετε απευθείας με τον αποστολέα.",
      unsubscribe: "Διαγραφή",
    },
  },
  initiatorCompletion: {
    en: {
      subject: "Completed: Your document '{{package_name}}' is done!",
      heading: "All Actions Completed!",
      greeting: "Hello {{initiator_name}},",
      message:
        'Great news! The document "<strong>{{package_name}}</strong>" has been fully completed by all participants.',
      buttonText: "View Dashboard",
      closingMessage:
        "You can access the completed document and download a copy from your dashboard.",
      footerText:
        "All participants have received their copy of the completed document.",
      unsubscribe: "Unsubscribe from completion alerts",
    },
    es: {
      subject: "Completado: ¡Tu documento '{{package_name}}' está listo!",
      heading: "¡Todas las acciones completadas!",
      greeting: "Hola {{initiator_name}},",
      message:
        '¡Buenas noticias! El documento "<strong>{{package_name}}</strong>" ha sido completado por todos los participantes.',
      buttonText: "Ver panel de control",
      closingMessage:
        "Puedes acceder al documento completado y descargar una copia desde tu panel de control.",
      footerText:
        "Todos los participantes han recibido su copia del documento completado.",
      unsubscribe: "Darse de baja de las alertas de finalización",
    },
    fr: {
      subject: "Terminé : Votre document '{{package_name}}' est prêt !",
      heading: "Toutes les actions sont terminées !",
      greeting: "Bonjour {{initiator_name}},",
      message:
        "Bonne nouvelle ! Le document « <strong>{{package_name}}</strong> » a été entièrement complété par tous les participants.",
      buttonText: "Voir le tableau de bord",
      closingMessage:
        "Vous pouvez accéder au document terminé et télécharger une copie depuis votre tableau de bord.",
      footerText:
        "Tous les participants ont reçu leur copie du document terminé.",
      unsubscribe: "Se désabonner des alertes d'achèvement",
    },
    de: {
      subject: "Abgeschlossen: Ihr Dokument '{{package_name}}' ist fertig!",
      heading: "Alle Aktionen abgeschlossen!",
      greeting: "Hallo {{initiator_name}},",
      message:
        "Gute Nachrichten! Das Dokument „<strong>{{package_name}}</strong>“ wurde von allen Teilnehmern vollständig ausgefüllt.",
      buttonText: "Dashboard anzeigen",
      closingMessage:
        "Sie können auf das abgeschlossene Dokument zugreifen und eine Kopie von Ihrem Dashboard herunterladen.",
      footerText:
        "Alle Teilnehmer haben ihre Kopie des abgeschlossenen Dokuments erhalten.",
      unsubscribe: "Abmelden von Abschlussbenachrichtigungen",
    },
    it: {
      subject: "Completato: il tuo documento '{{package_name}}' è pronto!",
      heading: "Tutte le azioni completate!",
      greeting: "Ciao {{initiator_name}},",
      message:
        'Buone notizie! Il documento "<strong>{{package_name}}</strong>" è stato completato da tutti i partecipanti.',
      buttonText: "Visualizza dashboard",
      closingMessage:
        "Puoi accedere al documento completato e scaricare una copia dalla tua dashboard.",
      footerText:
        "Tutti i partecipanti hanno ricevuto la loro copia del documento completato.",
      unsubscribe: "Annulla l'iscrizione agli avvisi di completamento",
    },
    el: {
      subject: "Ολοκληρώθηκε: Το έγγραφό σας '{{package_name}}' είναι έτοιμο!",
      heading: "Όλες οι ενέργειες ολοκληρώθηκαν!",
      greeting: "Γεια σας {{initiator_name}},",
      message:
        "Καλά νέα! Το έγγραφο «<strong>{{package_name}}</strong>» έχει ολοκληρωθεί πλήρως από όλους τους συμμετέχοντες.",
      buttonText: "Προβολή πίνακα ελέγχου",
      closingMessage:
        "Μπορείτε να έχετε πρόσβαση στο ολοκληρωμένο έγγραφο και να κατεβάσετε ένα αντίγραφο από τον πίνακα ελέγχου σας.",
      footerText:
        "Όλοι οι συμμετέχοντες έχουν λάβει το αντίγραφό τους του ολοκληρωμένου εγγράφου.",
      unsubscribe: "Κατάργηση εγγραφής από τις ειδοποιήσεις ολοκλήρωσης",
    },
  },
  enterpriseInquiry: {
    en: {
      subject: "New Enterprise Inquiry from {{companyName}}",
      heading: "New Enterprise Inquiry",
      subheading: "You have received a new enterprise contact form submission.",
      nameLabel: "Full Name",
      emailLabel: "Business Email",
      companyLabel: "Company Name",
      phoneLabel: "Phone Number",
      messageLabel: "Message",
      notProvided: "Not provided",
      replyButton: "Reply to Inquiry",
      submittedOn:
        "This inquiry was submitted via the Enterprise Contact form on {{submission_date}}.",
      footerText: "© 2025 iSign. All rights reserved.",
    },
    es: {
      subject: "Nueva consulta de empresa de {{companyName}}",
      heading: "Nueva consulta de empresa",
      subheading:
        "Has recibido un nuevo envío del formulario de contacto de empresa.",
      nameLabel: "Nombre completo",
      emailLabel: "Correo electrónico de la empresa",
      companyLabel: "Nombre de la empresa",
      phoneLabel: "Número de teléfono",
      messageLabel: "Mensaje",
      notProvided: "No proporcionado",
      replyButton: "Responder a la consulta",
      submittedOn:
        "Esta consulta fue enviada a través del formulario de contacto de empresa el {{submission_date}}.",
      footerText: "© 2025 iSign. Todos los derechos reservados.",
    },
    fr: {
      subject: "Nouvelle demande d'entreprise de {{companyName}}",
      heading: "Nouvelle demande d'entreprise",
      subheading:
        "Vous avez reçu une nouvelle soumission du formulaire de contact d'entreprise.",
      nameLabel: "Nom complet",
      emailLabel: "E-mail professionnel",
      companyLabel: "Nom de l'entreprise",
      phoneLabel: "Numéro de téléphone",
      messageLabel: "Message",
      notProvided: "Non fourni",
      replyButton: "Répondre à la demande",
      submittedOn:
        "Cette demande a été soumise via le formulaire de contact d'entreprise le {{submission_date}}.",
      footerText: "© 2025 iSign. Tous droits réservés.",
    },
    de: {
      subject: "Neue Unternehmensanfrage von {{companyName}}",
      heading: "Neue Unternehmensanfrage",
      subheading:
        "Sie haben eine neue Anfrage über das Unternehmenskontaktformular erhalten.",
      nameLabel: "Vollständiger Name",
      emailLabel: "Geschäftliche E-Mail-Adresse",
      companyLabel: "Firmenname",
      phoneLabel: "Telefonnummer",
      messageLabel: "Nachricht",
      notProvided: "Nicht angegeben",
      replyButton: "Auf Anfrage antworten",
      submittedOn:
        "Diese Anfrage wurde über das Unternehmenskontaktformular am {{submission_date}} gesendet.",
      footerText: "© 2025 iSign. Alle Rechte vorbehalten.",
    },
    it: {
      subject: "Nuova richiesta aziendale da {{companyName}}",
      heading: "Nuova richiesta aziendale",
      subheading:
        "Hai ricevuto una nuova richiesta dal modulo di contatto aziendale.",
      nameLabel: "Nome completo",
      emailLabel: "Email aziendale",
      companyLabel: "Nome dell'azienda",
      phoneLabel: "Numero di telefono",
      messageLabel: "Messaggio",
      notProvided: "Non fornito",
      replyButton: "Rispondi alla richiesta",
      submittedOn:
        "Questa richiesta è stata inviata tramite il modulo di contatto aziendale il {{submission_date}}.",
      footerText: "© 2025 iSign. Tutti i diritti riservati.",
    },
    el: {
      subject: "Νέο αίτημα επιχείρησης από {{companyName}}",
      heading: "Νέο αίτημα επιχείρησης",
      subheading: "Λάβατε μια νέα υποβολή φόρμας επικοινωνίας επιχείρησης.",
      nameLabel: "Ονοματεπώνυμο",
      emailLabel: "Εταιρικό email",
      companyLabel: "Όνομα εταιρείας",
      phoneLabel: "Αριθμός τηλεφώνου",
      messageLabel: "Μήνυμα",
      notProvided: "Δεν παρασχέθηκε",
      replyButton: "Απάντηση στο αίτημα",
      submittedOn:
        "Αυτό το αίτημα υποβλήθηκε μέσω της φόρμας επικοινωνίας για επιχειρήσεις στις {{submission_date}}.",
      footerText: "© 2025 iSign. Με την επιφύλαξη παντός δικαιώματος.",
    },
  },
  trialToActive: {
    en: {
      subject: "Your Subscription is Now Active!",
      heading: "Your Subscription is Now Active!",
      greeting: "Hello {{user_name}},",
      message:
        "Your free trial has ended, and your subscription to the <strong>{{plan_name}}</strong> plan is now active. We've successfully processed your first payment.",
      planLabel: "Plan",
      amountLabel: "Amount Billed",
      billedOnLabel: "Billed On",
      renewalLabel: "Next Renewal",
      buttonText: "View Your Invoice",
      manageSubscriptionText:
        "You can manage your subscription details and view past invoices at any time from your",
      billingPortalLinkText: "billing portal",
      unsubscribe: "Unsubscribe",
      preferences: "Unsubscribe Preferences",
    },
    es: {
      subject: "¡Tu suscripción ya está activa!",
      heading: "¡Tu suscripción ya está activa!",
      greeting: "Hola {{user_name}},",
      message:
        "Tu prueba gratuita ha finalizado y tu suscripción al plan <strong>{{plan_name}}</strong> ya está activa. Hemos procesado tu primer pago correctamente.",
      planLabel: "Plan",
      amountLabel: "Monto facturado",
      billedOnLabel: "Facturado el",
      renewalLabel: "Próxima renovación",
      buttonText: "Ver tu factura",
      manageSubscriptionText:
        "Puedes gestionar los detalles de tu suscripción y ver facturas pasadas en cualquier momento desde tu",
      billingPortalLinkText: "portal de facturación",
      unsubscribe: "Darse de baja",
      preferences: "Preferencias de cancelación",
    },
    fr: {
      subject: "Votre abonnement est maintenant actif !",
      heading: "Votre abonnement est maintenant actif !",
      greeting: "Bonjour {{user_name}},",
      message:
        "Votre essai gratuit est terminé et votre abonnement au forfait <strong>{{plan_name}}</strong> est maintenant actif. Nous avons traité avec succès votre premier paiement.",
      planLabel: "Forfait",
      amountLabel: "Montant facturé",
      billedOnLabel: "Facturé le",
      renewalLabel: "Prochain renouvellement",
      buttonText: "Voir votre facture",
      manageSubscriptionText:
        "Vous pouvez gérer les détails de votre abonnement et consulter les factures passées à tout moment depuis votre",
      billingPortalLinkText: "portail de facturation",
      unsubscribe: "Se désabonner",
      preferences: "Préférences de désabonnement",
    },
    de: {
      subject: "Ihr Abonnement ist jetzt aktiv!",
      heading: "Ihr Abonnement ist jetzt aktiv!",
      greeting: "Hallo {{user_name}},",
      message:
        "Ihre kostenlose Testphase ist beendet und Ihr Abonnement für den <strong>{{plan_name}}</strong>-Plan ist jetzt aktiv. Wir haben Ihre erste Zahlung erfolgreich verarbeitet.",
      planLabel: "Plan",
      amountLabel: "Abgerechneter Betrag",
      billedOnLabel: "Abgerechnet am",
      renewalLabel: "Nächste Verlängerung",
      buttonText: "Ihre Rechnung ansehen",
      manageSubscriptionText:
        "Sie können Ihre Abonnementdetails jederzeit in Ihrem",
      billingPortalLinkText: "Abrechnungsportal",
      unsubscribe: "Abmelden",
      preferences: "Abmelde-Einstellungen",
    },
    it: {
      subject: "Il tuo abbonamento è ora attivo!",
      heading: "Il tuo abbonamento è ora attivo!",
      greeting: "Ciao {{user_name}},",
      message:
        "La tua prova gratuita è terminata e il tuo abbonamento al piano <strong>{{plan_name}}</strong> è ora attivo. Abbiamo elaborato con successo il tuo primo pagamento.",
      planLabel: "Piano",
      amountLabel: "Importo fatturato",
      billedOnLabel: "Fatturato il",
      renewalLabel: "Prossimo rinnovo",
      buttonText: "Visualizza la tua fattura",
      manageSubscriptionText:
        "Puoi gestire i dettagli del tuo abbonamento e visualizzare le fatture passate in qualsiasi momento dal tuo",
      billingPortalLinkText: "portale di fatturazione",
      unsubscribe: "Annulla iscrizione",
      preferences: "Preferenze di annullamento iscrizione",
    },
    el: {
      subject: "Η συνδρομή σας είναι πλέον ενεργή!",
      heading: "Η συνδρομή σας είναι πλέον ενεργή!",
      greeting: "Γεια σας {{user_name}},",
      message:
        "Η δωρεάν δοκιμή σας έληξε και η συνδρομή σας στο πρόγραμμα <strong>{{plan_name}}</strong> είναι πλέον ενεργή. Επεξεργαστήκαμε με επιτυχία την πρώτη σας πληρωμή.",
      planLabel: "Πρόγραμμα",
      amountLabel: "Χρεωμένο ποσό",
      billedOnLabel: "Χρεώθηκε στις",
      renewalLabel: "Επόμενη ανανέωση",
      buttonText: "Δείτε το τιμολόγιό σας",
      manageSubscriptionText:
        "Μπορείτε να διαχειριστείτε τα στοιχεία της συνδρομής σας και να δείτε προηγούμενα τιμολόγια ανά πάσα στιγμή από την",
      billingPortalLinkText: "πύλη χρεώσεων",
      unsubscribe: "Διαγραφή",
      preferences: "Προτιμήσεις διαγραφής",
    },
  },
  // Add more email types here later (verification, password reset, etc.)
};

/**
 * Get content for a specific email type and language
 * @param {string} emailType - Type of email (e.g., 'welcome', 'verification')
 * @param {string} language - Language code (e.g., 'en', 'es')
 * @returns {object} Content object for the email
 */
function getEmailContent(emailType, language = "en") {
  const supportedLanguages = ["en", "es", "fr", "de", "it", "el"];
  const lang = supportedLanguages.includes(language) ? language : "en";

  if (!emailContent[emailType]) {
    throw new Error(
      `Email type "${emailType}" not found in email content configuration`
    );
  }

  return emailContent[emailType][lang] || emailContent[emailType]["en"];
}

module.exports = { getEmailContent };
