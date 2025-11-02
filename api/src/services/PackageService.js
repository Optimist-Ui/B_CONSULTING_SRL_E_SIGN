class PackageService {
  constructor({
    Package,
    Contact,
    Template,
    User,
    OTP,
    emailService,
    smsService,
    pdfModificationService,
    packageEventEmitter,
    s3Service,
  }) {
    this.Package = Package;
    this.Contact = Contact;
    this.Template = Template;
    this.User = User;
    this.OTP = OTP;
    this.EmailService = emailService;
    this.SmsService = smsService;
    this.pdfModifier = pdfModificationService;
    this.packageEventEmitter = packageEventEmitter;
    this.s3Service = s3Service; // 👈 ADD THIS
  }

  async uploadPackage(userId, s3File) {
    if (!s3File) {
      throw new Error("No file uploaded.");
    }
    const existingPackage = await this.Package.findOne({
      ownerId: userId,
      attachment_uuid: s3File.attachment_uuid,
    });
    if (existingPackage) {
      throw new Error("A package with this attachment UUID already exists.");
    }
    return {
      attachment_uuid: s3File.attachment_uuid,
      originalFileName: s3File.originalName,
      fileUrl: s3File.url, // S3 URL
      s3Key: s3File.key, // ✅ S3 key for operations
    };
  }

  async createPackage(userId, packageData) {
    const {
      attachment_uuid,
      name,
      fileUrl,
      fields,
      receivers,
      options,
      templateId,
      customMessage,
      status,
      s3Key,
    } = packageData;

    if (templateId) {
      const template = await this.Template.findOne({
        _id: templateId,
        ownerId: userId,
      });
      if (!template) {
        throw new Error(
          "Template not found or you do not have permission to use it."
        );
      }
      if (
        template.attachment_uuid !== attachment_uuid ||
        template.fileUrl !== fileUrl
      ) {
        throw new Error(
          "Attachment UUID and file URL must match the selected template."
        );
      }
    }

    if (!s3Key) {
      throw new Error("S3 key is required to create a package.");
    }

    const allContactIds = [
      ...new Set([
        ...fields.flatMap((field) =>
          (field.assignedUsers || []).map((au) => au.contactId)
        ),
        ...receivers.map((rec) => rec.contactId),
      ]),
    ];
    const contacts = await this.Contact.find({
      _id: { $in: allContactIds },
      ownerId: userId,
    });
    if (contacts.length !== allContactIds.length) {
      throw new Error(
        "One or more contact IDs are invalid or not owned by the user."
      );
    }

    const newPackage = await this.Package.create({
      ownerId: userId,
      templateId,
      attachment_uuid,
      name,
      fileUrl,
      s3Key,
      fields,
      receivers,
      options,
      customMessage,
      status: status || "Draft",
    });

    // If the package was successfully created with a 'Sent' status, send the notifications.
    if (newPackage && newPackage.status === "Sent") {
      // 🔥 NEW: Calculate credits based on unique signers
      const { uniqueSignerCount, creditsNeeded } =
        this._calculateDocumentCredits(newPackage);

      console.log(
        `Package has ${uniqueSignerCount} unique signer(s), consuming ${creditsNeeded} credit(s)`
      );

      // Fetch the user and increment usage by the calculated credits
      const user = await this.User.findById(userId);
      if (user) {
        // Increment multiple times based on credits needed
        for (let i = 0; i < creditsNeeded; i++) {
          const success = user.incrementDocumentUsage();
          if (!success) {
            throw new Error(
              `Insufficient document credits. This package requires ${creditsNeeded} credit(s) but you don't have enough remaining.`
            );
          }
        }
        await user.save();
      }

      const packageCreator = await this.User.findById(userId);
      const senderName = `${packageCreator.firstName} ${packageCreator.lastName}`;
      await this._sendInitialNotifications(newPackage, senderName);
    }

    return newPackage;
  }

  async getPackages(userId, filters, pagination, sort) {
    const { name, status } = filters;
    const { page, limit } = pagination;
    const { sortKey, sortDirection } = sort;

    // 1. Build the dynamic Mongoose query
    const query = { ownerId: userId };
    if (name) {
      query.name = { $regex: name, $options: "i" }; // Case-insensitive regex search
    }

    // Map frontend statuses to the backend schema's statuses
    if (status && status !== "All") {
      const statusMap = {
        Pending: "Sent",
        Finished: "Completed",
        Draft: "Draft",
        Rejected: "Rejected",
        Expired: "Expired",
        // 'Revoked' status does not exist in your schema, so we ignore it.
      };
      if (statusMap[status]) {
        query.status = statusMap[status];
      }
    }

    // Map frontend sort keys to backend schema fields
    const sortFieldMap = {
      name: "name",
      status: "status",
      addedOn: "createdAt",
    };

    const sortQuery = {};
    if (sortKey && sortFieldMap[sortKey]) {
      sortQuery[sortFieldMap[sortKey]] = sortDirection === "asc" ? 1 : -1;
    } else {
      sortQuery.createdAt = -1; // Default sort
    }

    try {
      // 2. Fetch documents and total count in parallel for efficiency
      const [packages, totalDocuments] = await Promise.all([
        this.Package.find(query)
          .populate("ownerId", "firstName lastName email phone")
          .sort(sortQuery)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        this.Package.countDocuments(query),
      ]);

      // 👈 ADD THIS - Generate signed URLs for all packages
      const packagesWithSignedUrls = await Promise.all(
        packages.map(async (pkg) => {
          if (pkg.s3Key) {
            try {
              pkg.downloadUrl = await this.s3Service.getSignedUrl(
                pkg.s3Key,
                3600 // 1 hour
              );
            } catch (error) {
              console.error(
                `Failed to generate signed URL for package ${pkg._id}:`,
                error
              );
              pkg.downloadUrl = pkg.fileUrl; // Fallback
            }
          }
          return pkg;
        })
      );

      // 3. Transform the raw DB data into the exact format the frontend expects
      const transformedDocuments = await this._transformPackagesForFrontend(
        packages
      );

      // 4. Return the complete, structured response object
      return {
        documents: transformedDocuments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalDocuments / limit),
          totalDocuments,
          limit,
        },
      };
    } catch (error) {
      console.error("Error during getPackages service execution:", error);
      throw new Error("Failed to retrieve and process packages.");
    }
  }
  async getPackageById(userId, packageId) {
    const packageData = await this.Package.findOne({
      _id: packageId,
      ownerId: userId,
    }).populate("templateId", "name attachment_uuid fileUrl");

    if (!packageData) {
      throw new Error(
        "Package not found or you do not have permission to view it."
      );
    }

    const packageObj = packageData.toObject();

    // 👈 ADD THIS - Generate signed URL for downloading
    if (packageData.s3Key) {
      try {
        packageObj.downloadUrl = await this.s3Service.getSignedUrl(
          packageData.s3Key,
          3600 // 1 hour
        );
      } catch (error) {
        console.error(
          `Failed to generate signed URL for package ${packageData._id}:`,
          error
        );
        packageObj.downloadUrl = packageData.fileUrl; // Fallback
      }
    }

    return packageObj;
  }

  async updatePackage(userId, packageId, updateData) {
    // Fetch the package first to see its status before the update.
    const packageBeforeUpdate = await this.Package.findOne({
      _id: packageId,
      ownerId: userId,
    });
    if (!packageBeforeUpdate) {
      throw new Error(
        "Package not found or you do not have permission to edit it."
      );
    }

    const safeUpdateData = { ...updateData };
    delete safeUpdateData.attachment_uuid;
    delete safeUpdateData.ownerId;
    delete safeUpdateData._id;
    delete safeUpdateData.templateId;
    delete safeUpdateData.s3Key;
    delete safeUpdateData.fileUrl;

    if (safeUpdateData.fields || safeUpdateData.receivers) {
      const allContactIds = [
        ...new Set([
          ...(safeUpdateData.fields || []).flatMap((field) =>
            (field.assignedUsers || []).map((au) => au.contactId)
          ),
          ...(safeUpdateData.receivers || []).map((rec) => rec.contactId),
        ]),
      ];
      const contacts = await this.Contact.find({
        _id: { $in: allContactIds },
        ownerId: userId,
      });
      if (contacts.length !== allContactIds.length) {
        throw new Error(
          "One or more contact IDs are invalid or not owned by the user."
        );
      }
    }

    const packageData = await this.Package.findOneAndUpdate(
      { _id: packageId, ownerId: userId },
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    );

    if (!packageData) {
      throw new Error(
        "Package not found or you do not have permission to edit it."
      );
    }

    // Check if status changed from a non-sent state to "Sent"
    if (
      packageBeforeUpdate.status !== "Sent" &&
      packageData.status === "Sent"
    ) {
      // 🔥 NEW: Calculate credits based on unique signers
      const { uniqueSignerCount, creditsNeeded } =
        this._calculateDocumentCredits(packageData);

      console.log(
        `Package has ${uniqueSignerCount} unique signer(s), consuming ${creditsNeeded} credit(s)`
      );

      // Fetch the user and increment usage by the calculated credits
      const user = await this.User.findById(userId);
      if (user) {
        // Increment multiple times based on credits needed
        for (let i = 0; i < creditsNeeded; i++) {
          const success = user.incrementDocumentUsage();
          if (!success) {
            throw new Error(
              `Insufficient document credits. This package requires ${creditsNeeded} credit(s) but you don't have enough remaining.`
            );
          }
        }
        await user.save();
      }

      const packageCreator = await this.User.findById(userId);
      const senderName = `${packageCreator.firstName} ${packageCreator.lastName}`;

      await this._sendInitialNotifications(packageData, senderName);
    }

    // Return with signed URL
    const packageObj = packageData.toObject();
    if (packageData.s3Key) {
      try {
        packageObj.downloadUrl = await this.s3Service.getSignedUrl(
          packageData.s3Key,
          3600
        );
      } catch (error) {
        console.error("Failed to generate signed URL:", error);
      }
    }

    return packageData;
  }

  async deletePackage(userId, packageId) {
    const packageData = await this.Package.findOne({
      _id: packageId,
      ownerId: userId,
    });
    if (!packageData) {
      throw new Error(
        "Package not found or you do not have permission to delete it."
      );
    }

    // 👈 ADD THIS - Delete file from S3
    if (packageData.s3Key) {
      try {
        await this.s3Service.deleteFile(packageData.s3Key);
        console.log(`Deleted package file from S3: ${packageData.s3Key}`);
      } catch (error) {
        console.error("Failed to delete package file from S3:", error);
        // Continue with DB deletion even if S3 deletion fails
      }
    }

    await this.Package.deleteOne({ _id: packageId, ownerId: userId });
    return { message: "Package deleted successfully.", packageId };
  }

  async getPackageForParticipant(packageId, participantId) {
    const pkg = await this.Package.findById(packageId);

    if (!pkg) {
      throw new Error("Package not found.");
    }

    if (
      pkg.status !== "Sent" &&
      pkg.status !== "Completed" &&
      pkg.status !== "Rejected" &&
      pkg.status !== "Expired"
    ) {
      throw new Error("This package is not currently active or available.");
    }

    // --- NEW: Step 1 - Efficiently Fetch All Contact Data ---
    // Get all unique participant Contact IDs from the entire package
    const allParticipantEntries = [
      ...pkg.fields.flatMap((f) =>
        f.assignedUsers.map((user) => user.toObject())
      ),
      ...pkg.receivers.map((rec) => ({ ...rec.toObject(), role: "Receiver" })), // Ensure receivers are also plain objects
    ];

    const allContactIds = [
      ...new Set(allParticipantEntries.map((p) => p.contactId.toString())),
    ];

    // Fetch the corresponding contacts from the database in one query, selecting only the phone
    const contacts = await this.Contact.find({
      _id: { $in: allContactIds },
    }).select("_id phone");

    // Create a lookup map for fast access: { 'contactId': 'phone_number' }
    const contactPhoneMap = new Map();
    contacts.forEach((contact) => {
      contactPhoneMap.set(contact._id.toString(), contact.phone);
    });
    // --- END of NEW SECTION ---

    // Step 2. Find the current participant's specific assignment from the pre-computed entries
    const initialParticipantAssignment = allParticipantEntries.find(
      (p) => p.id === participantId
    );

    if (!initialParticipantAssignment) {
      throw new Error("You are not a valid participant for this package.");
    }
    const participantContactId =
      initialParticipantAssignment.contactId.toString();

    // Step 3. Fetch ancillary data
    const packageOwner = await this.User.findById(pkg.ownerId).select(
      "firstName lastName email"
    );
    const packageForParticipant = pkg.toObject();

    // 👈 ADD THIS - Generate signed URL for downloading
    if (pkg.s3Key) {
      try {
        packageForParticipant.downloadUrl = await this.s3Service.getSignedUrl(
          pkg.s3Key,
          3600 // 1 hour
        );
      } catch (error) {
        console.error(
          `Failed to generate signed URL for package ${pkg._id}:`,
          error
        );
        packageForParticipant.downloadUrl = pkg.fileUrl; // Fallback
      }
    }

    // Step 4. Process fields to add necessary frontend data
    packageForParticipant.fields = pkg.fields.map((field) => {
      const fieldObj = field.toObject();

      const isAssigned = (fieldObj.assignedUsers || []).some(
        (user) => user.contactId.toString() === participantContactId
      );

      if (fieldObj.type === "signature") {
        const signer = fieldObj.assignedUsers.find((u) => u.signed === true);
        if (signer) {
          const signedMethod = signer.signedMethod || "Email OTP";

          // Base value object
          const signatureValue = {
            signedBy: signer.contactName,
            date: signer.signedAt.toISOString(),
            method: signedMethod,
          };
          // --- Conditionally add the OTP code to the response ---
          if (signer.signedWithOtp) {
            signatureValue.otpCode = signer.signedWithOtp;
          }

          // Conditionally add email or phone based on the method used
          if (signedMethod === "SMS OTP") {
            signatureValue.phone =
              contactPhoneMap.get(signer.contactId.toString()) ||
              "Phone not found";
          } else {
            signatureValue.email = signer.contactEmail;
          }

          fieldObj.value = signatureValue;
        }
      }

      if (!isAssigned) {
        delete fieldObj.value; // Security: User can't see values for fields they aren't assigned to
      }

      // --- MODIFICATION: Inject phone number into the assignedUsers array ---
      const processedAssignedUsers = (fieldObj.assignedUsers || []).map(
        (user) => ({
          ...user,
          contactPhone: contactPhoneMap.get(user.contactId.toString()) || null,
        })
      );

      return {
        ...fieldObj,
        isAssignedToCurrentUser: isAssigned,
        // Security: Only return detailed assignment info if the current user is assigned to this field
        assignedUsers: processedAssignedUsers,
      };
    });

    // Step 5. Build the comprehensive list of all participants for the UI
    const participantsMap = new Map();

    for (const assignment of allParticipantEntries) {
      const contactId = assignment.contactId.toString();
      if (!participantsMap.has(contactId)) {
        // --- MODIFICATION: Inject phone number when creating the participant entry ---
        participantsMap.set(contactId, {
          contactId: contactId,
          contactName: assignment.contactName,
          contactEmail: assignment.contactEmail,
          contactPhone: contactPhoneMap.get(contactId) || null,
          roles: new Set(),
        });
      }
      if (assignment.role) {
        participantsMap.get(contactId).roles.add(assignment.role);
      }
    }

    const allParticipantsList = [];
    for (const participant of participantsMap.values()) {
      const theirRequiredFields = pkg.fields.filter(
        (field) =>
          field.required &&
          field.assignedUsers.some(
            (user) => user.contactId.toString() === participant.contactId
          )
      );

      let status = "Pending";
      if (
        participant.roles.has("Receiver") &&
        theirRequiredFields.length === 0
      ) {
        status = "Not Applicable";
      } else if (theirRequiredFields.length === 0) {
        status = "Completed";
      } else {
        const areAllTasksDone = theirRequiredFields.every((field) => {
          if (field.type === "signature") {
            const userAssignment = field.assignedUsers.find(
              (u) => u.contactId.toString() === participant.contactId
            );
            return userAssignment && userAssignment.signed;
          }
          return (
            field.value !== undefined &&
            field.value !== null &&
            field.value !== "" &&
            field.value !== false
          );
        });
        status = areAllTasksDone ? "Completed" : "Pending";
      }

      allParticipantsList.push({
        ...participant,
        roles: Array.from(participant.roles),
        status: status,
      });
    }

    // Step 6. Assemble and return the final payload
    // --- MODIFICATION: Inject phone into `currentUser` object ---
    packageForParticipant.currentUser = {
      ...initialParticipantAssignment,
      contactPhone: contactPhoneMap.get(participantContactId) || null,
    };

    packageForParticipant.owner = packageOwner;
    packageForParticipant.allParticipants = allParticipantsList;
    delete packageForParticipant.receivers;

    return packageForParticipant;
  }

  async sendOTP(packageId, participantId, fieldId, email) {
    const pkg = await this.Package.findById(packageId);
    if (!pkg || pkg.status !== "Sent") {
      throw new Error("Package not found or not active.");
    }
    this.checkPackageExpiry(pkg);

    const field = pkg.fields.find(
      (f) => f.id === fieldId && f.type === "signature"
    );
    if (!field) throw new Error("Signature field not found.");

    const assignedUser = field.assignedUsers.find(
      (au) => au.id === participantId
    );
    if (
      !assignedUser ||
      assignedUser.role !== "Signer" ||
      !assignedUser.signatureMethods.includes("Email OTP") ||
      assignedUser.signed
    ) {
      throw new Error(
        "Invalid participant, this signature method is not enabled, or the signature is already completed."
      );
    }

    if (assignedUser.contactEmail !== email) {
      throw new Error("Email does not match assigned participant.");
    }

    // --- NEW: Fetch Contact to get language preference ---
    const contact = await this.Contact.findById(assignedUser.contactId).select(
      "language"
    );
    // Add language to the assignedUser object, defaulting to 'en'
    assignedUser.language = contact ? contact.language : "en";
    // --- END NEW ---

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes (to match email text)

    await this.OTP.deleteMany({ packageId, fieldId, participantId });
    await this.OTP.create({
      packageId,
      fieldId,
      participantId,
      otp,
      method: "Email OTP",
      expiresAt,
    });

    // Send email using the updated method signature
    await this.EmailService.sendSignatureOtp(
      assignedUser, // Pass the entire enriched object
      pkg.name,
      otp
    );

    return { message: "OTP sent to your email." };
  }

  async verifyOTP(packageId, participantId, fieldId, otp, ip) {
    const otpDoc = await this.OTP.findOne({
      packageId,
      fieldId,
      participantId,
    });

    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      throw new Error("Invalid or expired OTP.");
    }
    if (otpDoc.attempts >= 4) {
      await this.OTP.deleteOne({ _id: otpDoc._id });
      throw new Error("Maximum OTP attempts exceeded.");
    }
    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      throw new Error("Incorrect OTP.");
    }

    // --- All checks passed ---
    await this.OTP.deleteOne({ _id: otpDoc._id });

    const pkg = await this.Package.findById(packageId).populate(
      "ownerId",
      "email"
    );
    if (!pkg) {
      throw new Error("Package not found after OTP verification.");
    }
    this.checkPackageExpiry(pkg);

    // 🔥 NEW LOGIC: Find the current field and participant
    const currentField = pkg.fields.find((f) => f.id === fieldId);
    const assignedUser = currentField.assignedUsers.find(
      (au) => au.id === participantId
    );

    const signDate = new Date();
    const participantContactId = assignedUser.contactId.toString();

    // 🔥 NEW: Find ALL signature fields assigned to this participant
    const allSignatureFieldsForParticipant = pkg.fields.filter(
      (field) =>
        field.type === "signature" &&
        field.assignedUsers.some(
          (user) =>
            user.contactId.toString() === participantContactId &&
            user.role === "Signer" &&
            !user.signed // Only apply to unsigned fields
        )
    );

    // 🔥 Apply the signature to ALL matching fields at once
    allSignatureFieldsForParticipant.forEach((field) => {
      const userAssignment = field.assignedUsers.find(
        (user) =>
          user.contactId.toString() === participantContactId &&
          user.role === "Signer"
      );

      if (userAssignment) {
        // Update audit trail properties
        userAssignment.signed = true;
        userAssignment.signedAt = signDate;
        userAssignment.signedMethod = "Email OTP";
        userAssignment.signedIP = ip;
        userAssignment.signedWithOtp = otp;

        // Store signature details in field value for UI
        field.value = {
          signedBy: userAssignment.contactName,
          email: userAssignment.contactEmail,
          date: signDate.toISOString(),
          method: "Email OTP",
          otpCode: otp,
        };
      }
    });

    // Check if the whole package is now completed
    if (this.isPackageCompleted(pkg)) {
      pkg.status = "Completed";
      const packageCreator = await this.User.findById(pkg.ownerId);
      const initiatorName = `${packageCreator.firstName} ${packageCreator.lastName}`;
      await this._sendCompletionNotifications(pkg, initiatorName);
    } else {
      await this._sendActionUpdateNotification(pkg, assignedUser);
    }

    await pkg.save();
    await this.emitPackageUpdate(pkg);

    const updatedPackageForParticipant = await this.getPackageForParticipant(
      packageId,
      participantId
    );

    return {
      message: `Signature completed for ${allSignatureFieldsForParticipant.length} field(s).`,
      package: updatedPackageForParticipant,
      fieldsSignedCount: allSignatureFieldsForParticipant.length,
    };
  }

  // SMS OTP METHODS
  async verifySmsOTP(packageId, participantId, fieldId, otp, ip) {
    const otpDoc = await this.OTP.findOne({
      packageId,
      fieldId,
      participantId,
      method: "SMS OTP",
    });

    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      throw new Error("Invalid or expired SMS OTP.");
    }
    if (otpDoc.attempts >= 4) {
      await this.OTP.deleteOne({ _id: otpDoc._id });
      throw new Error("Maximum SMS OTP attempts exceeded.");
    }
    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      throw new Error("Incorrect SMS OTP.");
    }

    // Clean up OTP
    await this.OTP.deleteOne({ _id: otpDoc._id });

    const pkg = await this.Package.findById(packageId).populate(
      "ownerId",
      "email"
    );
    if (!pkg) {
      throw new Error("Package not found after OTP verification.");
    }
    this.checkPackageExpiry(pkg);

    // 🔥 NEW LOGIC: Find the current field and participant
    const currentField = pkg.fields.find((f) => f.id === fieldId);
    const assignedUser = currentField.assignedUsers.find(
      (au) => au.id === participantId
    );

    const signDate = new Date();
    const participantContactId = assignedUser.contactId.toString();

    // 🔥 NEW: Find ALL signature fields assigned to this participant
    const allSignatureFieldsForParticipant = pkg.fields.filter(
      (field) =>
        field.type === "signature" &&
        field.assignedUsers.some(
          (user) =>
            user.contactId.toString() === participantContactId &&
            user.role === "Signer" &&
            !user.signed
        )
    );

    // 🔥 Apply the signature to ALL matching fields at once
    allSignatureFieldsForParticipant.forEach((field) => {
      const userAssignment = field.assignedUsers.find(
        (user) =>
          user.contactId.toString() === participantContactId &&
          user.role === "Signer"
      );

      if (userAssignment) {
        // Update audit trail properties
        userAssignment.signed = true;
        userAssignment.signedAt = signDate;
        userAssignment.signedMethod = "SMS OTP";
        userAssignment.signedIP = ip;
        userAssignment.signedWithOtp = otp;

        // Store signature details in field value for UI
        field.value = {
          signedBy: userAssignment.contactName,
          email: userAssignment.contactEmail,
          date: signDate.toISOString(),
          method: "SMS OTP",
          ip: ip,
          otpCode: otp,
        };
      }
    });

    // Check if package is completed
    if (this.isPackageCompleted(pkg)) {
      pkg.status = "Completed";
      const packageCreator = await this.User.findById(pkg.ownerId);
      const initiatorName = `${packageCreator.firstName} ${packageCreator.lastName}`;
      await this._sendCompletionNotifications(pkg, initiatorName);
    } else {
      await this._sendActionUpdateNotification(pkg, assignedUser);
    }

    await pkg.save();
    await this.emitPackageUpdate(pkg);

    const updatedPackageForParticipant = await this.getPackageForParticipant(
      packageId,
      participantId
    );

    return {
      message: `SMS OTP signature completed for ${allSignatureFieldsForParticipant.length} field(s).`,
      package: updatedPackageForParticipant,
      signatureDetails: {
        method: "SMS OTP",
        signedAt: signDate.toISOString(),
        signedBy: assignedUser.contactName,
        fieldsSignedCount: allSignatureFieldsForParticipant.length,
      },
    };
  }

  async verifySmsOTP(packageId, participantId, fieldId, otp, ip) {
    const otpDoc = await this.OTP.findOne({
      packageId,
      fieldId,
      participantId,
      method: "SMS OTP",
    });

    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      throw new Error("Invalid or expired SMS OTP.");
    }
    if (otpDoc.attempts >= 4) {
      await this.OTP.deleteOne({ _id: otpDoc._id });
      throw new Error("Maximum SMS OTP attempts exceeded.");
    }
    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      throw new Error("Incorrect SMS OTP.");
    }

    return await this._completeSignature(
      packageId,
      participantId,
      fieldId,
      ip,
      "SMS OTP",
      otp,
      otpDoc._id
    );
  }

  async submitFields(packageId, participantId, fieldValues, ip) {
    const pkg = await this.Package.findById(packageId);
    if (!pkg || pkg.status !== "Sent") {
      throw new Error("This package is not currently active for submissions.");
    }
    this.checkPackageExpiry(pkg);

    // Find the participant's stable contactId based on the unique assignment ID (participantId)
    const participantContactId = pkg.fields
      .flatMap((f) => f.assignedUsers)
      .find((u) => u.id === participantId)
      ?.contactId.toString();

    if (!participantContactId) {
      throw new Error("You are not a valid participant for this package.");
    }

    const submissionDate = new Date();

    // Iterate over the field values submitted from the frontend
    for (const fieldId in fieldValues) {
      const field = pkg.fields.find((f) => f.id === fieldId);

      if (
        field &&
        field.assignedUsers.some(
          (u) => u.contactId.toString() === participantContactId
        )
      ) {
        // Set the field value
        field.value = fieldValues[fieldId];

        // Find the current user's assignment for this field
        const userAssignment = field.assignedUsers.find(
          (u) => u.contactId.toString() === participantContactId
        );

        if (userAssignment) {
          // For "Approver" checkboxes, set the audit trail
          if (field.type === "checkbox" && userAssignment.role === "Approver") {
            userAssignment.signed = true;
            userAssignment.signedAt = submissionDate;
            userAssignment.signedMethod = "Form Submission";
            userAssignment.signedIP = ip;
          }

          // 🔥 NEW: For "FormFiller" role, mark as signed when they fill required fields
          if (userAssignment.role === "FormFiller" && field.required) {
            // Check if the field has a valid value
            const hasValidValue =
              field.value !== undefined &&
              field.value !== null &&
              field.value !== "" &&
              field.value !== false;

            if (hasValidValue) {
              userAssignment.signed = true;
              userAssignment.signedAt = submissionDate;
              userAssignment.signedMethod = "Form Submission";
              userAssignment.signedIP = ip;
            }
          }
        }
      } else {
        console.log(`Field ${fieldId} not found or not assigned to user`);
      }
    }

    // After updating values, check if the whole document is now complete
    if (this.isPackageCompleted(pkg)) {
      pkg.status = "Completed";
      const packageCreator = await this.User.findById(pkg.ownerId);
      const initiatorName = `${packageCreator.firstName} ${packageCreator.lastName}`;
      await this._sendCompletionNotifications(pkg, initiatorName);
    } else {
      // --- ADD THIS BLOCK ---
      // Find the participant who acted to include their name in the notification
      const actor = pkg.fields
        .flatMap((f) => f.assignedUsers)
        .find((u) => u.contactId.toString() === participantContactId);

      if (actor) {
        await this._sendActionUpdateNotification(pkg, actor);
      }
      // --- END OF NEW BLOCK ---
    }

    // Save the package with the updated field values
    await pkg.save();

    // Emit real-time update to initiator
    await this.emitPackageUpdate(pkg);

    // Get the fully processed package to send back (this should include the saved values)
    const updatedPackageForParticipant = await this.getPackageForParticipant(
      packageId,
      participantId
    );

    return {
      message: "Your changes have been saved.",
      package: updatedPackageForParticipant,
    };
  }

  async rejectPackage(packageId, participantId, reason, ip) {
    const pkg = await this.Package.findById(packageId).populate(
      "ownerId",
      "email firstName lastName"
    );
    if (!pkg) {
      throw new Error("Package not found.");
    }
    this.checkPackageExpiry(pkg);
    if (pkg.status !== "Sent") {
      throw new Error("This package is not currently active for rejection.");
    }

    const allAssignments = pkg.fields.flatMap((f) => f.assignedUsers || []);
    const participant = allAssignments.find((p) => p.id === participantId);

    if (!participant) {
      throw new Error("You are not a valid participant for this package.");
    }

    const rejectionDate = new Date();
    pkg.status = "Rejected";
    pkg.rejectionDetails = {
      rejectedBy: {
        contactId: participant.contactId,
        contactName: participant.contactName,
        contactEmail: participant.contactEmail,
      },
      reason: reason,
      rejectedAt: rejectionDate,
      rejectedIP: ip,
    };

    const updatedPackage = await pkg.save();

    // Emit real-time update to initiator
    await this.emitPackageUpdate(pkg);

    const packageCreator = await this.User.findById(pkg.ownerId);
    const initiatorName = `${packageCreator.firstName} ${packageCreator.lastName}`;
    await this._sendRejectionNotifications(
      pkg,
      initiatorName,
      participant.contactName,
      reason
    );

    const updatedPackageForParticipant = await this.getPackageForParticipant(
      packageId,
      participantId
    );

    return {
      message: "Package rejected successfully.",
      package: updatedPackageForParticipant,
    };
  }

  /**
   * Register a new contact for reassignment purposes
   * This contact will belong to the package owner and can be used for reassignment
   */
  async registerReassignmentContact(packageId, participantId, contactData, ip) {
    // 1. Find the package and validate reassignment is allowed
    const pkg = await this.Package.findById(packageId);
    if (!pkg) {
      throw new Error("Package not found.");
    }
    if (!pkg.options.allowReassign) {
      throw new Error("Reassignment is not allowed for this package.");
    }
    if (pkg.status !== "Sent") {
      throw new Error("Reassignment is only available for sent packages.");
    }

    // 2. Validate the current participant has permission to reassign
    const participant = this._findParticipant(pkg, participantId);
    if (!participant) {
      throw new Error("You are not a valid participant for this package.");
    }

    // 3. Create the new contact under the package owner's account
    const { firstName, lastName, email, title, phone } = contactData;
    const lowerCaseEmail = email.toLowerCase();

    // 4. PREVENT CONFLICT: Check if the email belongs to ANY registered user in the system.
    // This is the critical check to prevent creating a contact that conflicts with a user account.
    const existingUser = await this.User.findOne({ email: lowerCaseEmail });
    if (existingUser) {
      throw new Error(
        "This email address belongs to a registered user and cannot be used to create a contact."
      );
    }

    // Check if contact already exists for this owner
    const existingContact = await this.Contact.findOne({
      ownerId: pkg.ownerId,
      email: email.toLowerCase(),
    });

    if (existingContact) {
      throw new Error("A contact with this email already exists.");
    }

    // Create new contact
    const newContact = await this.Contact.create({
      ownerId: pkg.ownerId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      title,
      phone,
    });

    return {
      contact: newContact,
      message: "Contact registered successfully for reassignment.",
    };
  }

  /**
   * List all available contacts for reassignment
   * Returns contacts owned by the package owner, excluding current participants
   */
  async listReassignmentContacts(packageId, participantId) {
    // 1. Find the package and validate
    const pkg = await this.Package.findById(packageId);
    if (!pkg) {
      throw new Error("Package not found.");
    }
    if (!pkg.options.allowReassign) {
      throw new Error("Reassignment is not allowed for this package.");
    }

    // 2. Find the current participant
    const participant = this._findParticipant(pkg, participantId);
    if (!participant) {
      throw new Error("You are not a valid participant for this package.");
    }

    // 3. Get all contacts owned by the package owner
    const contacts = await this.Contact.find({
      ownerId: pkg.ownerId,
    }).select("firstName lastName email title phone");

    // 4. Exclude contacts that are already participants in this package
    const allParticipantContactIds = new Set([
      ...pkg.fields.flatMap((f) =>
        f.assignedUsers.map((u) => u.contactId.toString())
      ),
      ...pkg.receivers.map((r) => r.contactId.toString()),
    ]);

    const availableContacts = contacts.filter(
      (contact) => !allParticipantContactIds.has(contact._id.toString())
    );

    return availableContacts;
  }

  /**
   * Perform the actual reassignment from one participant to another
   */
  async performReassignment(
    packageId,
    participantId,
    newContactId,
    reason,
    ip
  ) {
    // 1. Find and validate the package
    const pkg = await this.Package.findById(packageId);
    if (!pkg) {
      throw new Error("Package not found.");
    }
    this.checkPackageExpiry(pkg);
    if (!pkg.options.allowReassign) {
      throw new Error("Reassignment is not allowed for this package.");
    }
    if (pkg.status !== "Sent") {
      throw new Error("Reassignment is only available for sent packages.");
    }

    // 2. Find the current participant
    const currentParticipant = this._findParticipant(pkg, participantId);
    if (!currentParticipant) {
      throw new Error("You are not a valid participant for this package.");
    }

    // 3. Validate the new contact belongs to the package owner
    const newContact = await this.Contact.findOne({
      _id: newContactId,
      ownerId: pkg.ownerId,
    });
    if (!newContact) {
      throw new Error("New contact not found or invalid.");
    }

    // 4. Check if new contact is already a participant
    const allParticipantContactIds = new Set([
      ...pkg.fields.flatMap((f) =>
        f.assignedUsers.map((u) => u.contactId.toString())
      ),
      ...pkg.receivers.map((r) => r.contactId.toString()),
    ]);

    if (allParticipantContactIds.has(newContactId)) {
      throw new Error(
        "The selected contact is already a participant in this package."
      );
    }

    // 5. Check for signed/completed fields
    const participantFields = pkg.fields.filter((field) =>
      field.assignedUsers.some((user) => user.id === participantId)
    );

    const completedFields = participantFields.filter((field) =>
      field.assignedUsers.some(
        (user) => user.id === participantId && user.signed
      )
    );

    if (completedFields.length > 0) {
      const completedFieldNames = completedFields
        .map((f) => f.label)
        .join(", ");
      throw new Error(
        `Cannot reassign because these fields have already been completed: ${completedFieldNames}`
      );
    }

    // 6. Generate new participant ID for the new contact
    const { v4: uuidv4 } = require("uuid");
    const newParticipantId = uuidv4();

    // 7. Perform the reassignment for fields
    let fieldsReassigned = 0;
    for (const field of pkg.fields) {
      const userIndex = field.assignedUsers.findIndex(
        (u) => u.id === participantId
      );

      if (userIndex !== -1) {
        const originalUser = field.assignedUsers[userIndex];

        // Create new assignment with same role and properties
        const newAssignment = {
          id: newParticipantId,
          contactId: newContact._id,
          contactName: `${newContact.firstName} ${newContact.lastName}`,
          contactEmail: newContact.email,
          role: originalUser.role,
          signatureMethods: originalUser.signatureMethods,
          signed: false,
        };

        // Replace the old assignment
        field.assignedUsers[userIndex] = newAssignment;
        fieldsReassigned++;
      }
    }

    // 8. Update receivers if current participant is a receiver
    let receiverReassigned = false;
    const receiverIndex = pkg.receivers.findIndex(
      (r) => r.id === participantId
    );
    if (receiverIndex !== -1) {
      pkg.receivers[receiverIndex] = {
        id: newParticipantId,
        contactId: newContact._id,
        contactName: `${newContact.firstName} ${newContact.lastName}`,
        contactEmail: newContact.email,
      };
      receiverReassigned = true;
    }

    // 9. Add to reassignment history
    pkg.reassignmentHistory.push({
      reassignedFrom: {
        contactId: currentParticipant.contactId,
        contactName: currentParticipant.contactName,
        contactEmail: currentParticipant.contactEmail,
      },
      reassignedTo: {
        contactId: newContact._id,
        contactName: `${newContact.firstName} ${newContact.lastName}`,
        contactEmail: newContact.email,
      },
      reassignedBy: {
        participantId: participantId,
        contactName: currentParticipant.contactName,
        contactEmail: currentParticipant.contactEmail,
      },
      reason: reason || "No reason provided",
      reassignedAt: new Date(),
      reassignedIP: ip,
    });

    // 10. Save the package
    await pkg.save();

    // Emit real-time update to initiator
    await this.emitPackageUpdate(pkg);

    // 11. Send notifications
    await this._sendReassignmentNotifications(
      pkg,
      currentParticipant,
      newContact,
      newParticipantId,
      reason
    );

    return {
      message: "Reassignment completed successfully.",
      newParticipantId: newParticipantId,
      fieldsReassigned: fieldsReassigned,
      receiverReassigned: receiverReassigned,
    };
  }

  /**
   * Get reassignment history for a package (for owner/admin view)
   */
  async getReassignmentHistory(userId, packageId) {
    const pkg = await this.Package.findOne({
      _id: packageId,
      ownerId: userId,
    }).select("reassignmentHistory name");

    if (!pkg) {
      throw new Error(
        "Package not found or you do not have permission to view it."
      );
    }

    return {
      packageName: pkg.name,
      reassignmentHistory: pkg.reassignmentHistory.map((history) => ({
        id: history._id,
        reassignedFrom: history.reassignedFrom,
        reassignedTo: history.reassignedTo,
        reassignedBy: history.reassignedBy,
        reason: history.reason,
        reassignedAt: history.reassignedAt,
      })),
    };
  }

  /**
   * Enhanced getPackageForParticipant that includes reassignment info
   */
  async getPackageForParticipantWithReassignmentInfo(packageId, participantId) {
    const packageData = await this.getPackageForParticipant(
      packageId,
      participantId
    );

    // Add reassignment capability check
    const reassignmentCheck = this.canParticipantReassign(
      packageData,
      participantId
    );
    packageData.reassignmentInfo = reassignmentCheck;

    // Add reassignment history related to this participant
    const participantReassignments =
      packageData.reassignmentHistory?.filter(
        (history) =>
          history.reassignedBy.participantId === participantId ||
          history.reassignedFrom.contactId.toString() ===
            packageData.currentUser.contactId.toString() ||
          history.reassignedTo.contactId.toString() ===
            packageData.currentUser.contactId.toString()
      ) || [];

    packageData.participantReassignmentHistory = participantReassignments;

    return packageData;
  }

  async downloadPackageForParticipant(packageId, participantId) {
    // 1. Fetch the package and its related data
    const pkg = await this.Package.findById(packageId).populate(
      "ownerId",
      "firstName lastName"
    );
    if (!pkg) {
      throw new Error("Package not found.");
    }

    const allAssignments = [
      ...pkg.fields.flatMap((f) => f.assignedUsers || []),
      ...pkg.receivers,
    ];
    const participant = allAssignments.find((p) => p.id === participantId);
    if (!participant) {
      const isOwner = pkg.ownerId._id.toString() === participantId;
      if (!isOwner)
        throw new Error("You are not a valid participant for this package.");
    }

    // 2. Permission check based on status
    const isDocumentFinalized =
      pkg.status === "Completed" || pkg.status === "Rejected";
    if (!isDocumentFinalized && !pkg.options.allowDownloadUnsigned) {
      throw new Error(
        "This document cannot be downloaded until it is completed or rejected."
      );
    }

    // 3. Download file from S3
    if (!pkg.s3Key) {
      throw new Error("Package file not found in S3.");
    }

    let pdfBuffer;
    try {
      // Get the file from S3
      const { GetObjectCommand } = require("@aws-sdk/client-s3");
      const command = new GetObjectCommand({
        Bucket: this.s3Service.bucket,
        Key: pkg.s3Key,
      });

      const response = await this.s3Service.s3.send(command);

      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      pdfBuffer = Buffer.concat(chunks);

      console.log(`Successfully downloaded PDF from S3: ${pkg.s3Key}`);
    } catch (error) {
      console.error("Error downloading from S3:", error);
      throw new Error(
        `Failed to download package file from S3: ${error.message}`
      );
    }

    // 4. Process the PDF with modifications (add audit trail, signatures, etc.)
    try {
      pdfBuffer = await this.pdfModifier.generatePdf(pkg, pdfBuffer);
      console.log(`Successfully processed PDF with modifications`);
    } catch (error) {
      console.error("Error modifying PDF:", error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }

    // 5. Prepare proper file name
    let sanitizedName = pkg.name
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 80);

    if (!sanitizedName || sanitizedName.length === 0) {
      sanitizedName = "document";
    }

    const statusSuffix = pkg.status.toLowerCase();
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `${sanitizedName}_${statusSuffix}_${timestamp}.pdf`;

    return { pdfBuffer, fileName };
  }

  async revokePackage(packageId, userId, reason, ip) {
    const pkg = await this.Package.findOne({
      _id: packageId,
      ownerId: userId, // CRITICAL: Only the owner can revoke.
    }).populate("ownerId", "firstName lastName email");

    if (!pkg) {
      throw new Error(
        "Package not found or you do not have permission to revoke it."
      );
    }

    // You can't revoke a document that is already finished or in a terminal state
    const terminalStates = ["Completed", "Revoked", "Expired", "Rejected"];
    if (terminalStates.includes(pkg.status)) {
      throw new Error(
        `Cannot revoke this package as it is already in a '${pkg.status}' state.`
      );
    }

    // 1. Update package status and audit trail
    pkg.status = "Revoked";
    pkg.revocationDetails = {
      revokedBy: {
        userId: pkg.ownerId._id,
        name: `${pkg.ownerId.firstName} ${pkg.ownerId.lastName}`,
        email: pkg.ownerId.email,
      },
      reason: reason, // This will be optional
      revokedAt: new Date(),
      revokedIP: ip,
    };

    const updatedPackage = await pkg.save();

    // 2. Send email notifications to everyone
    await this._sendRevocationNotifications(updatedPackage);

    // 3. Emit real-time update to the initiator's dashboard
    await this.emitPackageUpdate(updatedPackage);

    // Return the updated document data
    return updatedPackage;
  }

  /**
   * Allows the package owner to send a manual reminder email
   * to all participants who have not yet completed their required actions.
   */
  async sendManualReminder(packageId, userId) {
    const pkg = await this.Package.findOne({
      _id: packageId,
      ownerId: userId,
    }).populate("ownerId", "firstName lastName");

    if (!pkg) {
      throw new Error(
        "Package not found or you do not have permission to send reminders."
      );
    }
    if (pkg.status !== "Sent") {
      throw new Error(
        `Reminders can only be sent for packages with 'Sent' status. Current status: '${pkg.status}'.`
      );
    }

    const initiatorName = `${pkg.ownerId.firstName} ${pkg.ownerId.lastName}`;

    // Determine which participants have incomplete required tasks
    const allParticipants = new Map();
    (pkg.fields || []).forEach((field) => {
      (field.assignedUsers || []).forEach((user) => {
        if (!allParticipants.has(user.contactId.toString())) {
          allParticipants.set(user.contactId.toString(), {
            ...user.toObject(),
            isComplete: true, // Assume complete initially
          });
        }
      });
    });

    allParticipants.forEach((participant) => {
      const theirRequiredFields = pkg.fields.filter(
        (f) =>
          f.required &&
          f.assignedUsers.some(
            (u) => u.contactId.toString() === participant.contactId.toString()
          )
      );
      if (theirRequiredFields.length === 0) return;
      const areAllTasksDone = theirRequiredFields.every((field) => {
        const assignment = field.assignedUsers.find(
          (u) => u.contactId.toString() === participant.contactId.toString()
        );
        return assignment && assignment.signed;
      });
      if (!areAllTasksDone) participant.isComplete = false;
    });

    const pendingParticipants = Array.from(allParticipants.values()).filter(
      (p) => !p.isComplete
    );

    if (pendingParticipants.length === 0) {
      throw new Error(
        "All participants have already completed their actions. No reminders sent."
      );
    }

    // --- NEW: Efficiently fetch language preferences ---
    const contactIdsToRemind = pendingParticipants.map((p) => p.contactId);
    const contacts = await this.Contact.find({
      _id: { $in: contactIdsToRemind },
    }).select("language");
    const languageMap = new Map(
      contacts.map((c) => [c._id.toString(), c.language])
    );

    // Add language to each participant object
    pendingParticipants.forEach((p) => {
      p.language = languageMap.get(p.contactId.toString()) || "en";
    });
    // --- END NEW ---

    // Send the email to each pending participant
    for (const participant of pendingParticipants) {
      const actionLink = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${participant.id}`;

      // Pass the entire enriched participant object
      await this.EmailService.sendManualReminderNotification(
        participant,
        initiatorName,
        pkg.name,
        actionLink
      );
    }

    return {
      success: true,
      message: `Reminders sent to ${pendingParticipants.length} pending participant(s).`,
    };
  }

  /**
   * Allows a participant with the 'Receiver' role to add another contact as a receiver.
   */
  async addReceiverByParticipant(packageId, participantId, newContactId, ip) {
    const pkg = await this.Package.findById(packageId);
    if (!pkg) {
      throw new Error("Package not found.");
    }

    // --- PERMISSION CHECKS ---
    if (!pkg.options.allowReceiversToAdd) {
      throw new Error("This feature is not enabled for this package.");
    }
    if (pkg.status !== "Sent") {
      throw new Error("Receivers can only be added to active packages.");
    }

    const currentParticipant = this._findParticipant(pkg, participantId);
    if (
      !currentParticipant ||
      !pkg.receivers.some((r) => r.id === participantId)
    ) {
      throw new Error("You must be a Receiver to add other receivers.");
    }

    // --- VALIDATION CHECKS ---
    const newContact = await this.Contact.findOne({
      _id: newContactId,
      ownerId: pkg.ownerId,
    });
    if (!newContact) {
      throw new Error(
        "The selected contact is invalid or not associated with the package owner."
      );
    }

    const allParticipantContactIds = new Set([
      ...pkg.fields.flatMap((f) =>
        f.assignedUsers.map((u) => u.contactId.toString())
      ),
      ...pkg.receivers.map((r) => r.contactId.toString()),
    ]);
    if (allParticipantContactIds.has(newContactId)) {
      throw new Error(
        "The selected contact is already a participant in this package."
      );
    }

    // --- PERFORM ACTION ---
    const { v4: uuidv4 } = require("uuid");
    const newReceiver = {
      id: uuidv4(),
      contactId: newContact._id,
      contactName: `${newContact.firstName} ${newContact.lastName}`,
      contactEmail: newContact.email,
    };

    pkg.receivers.push(newReceiver);

    pkg.receiverHistory.push({
      addedBy: {
        participantId: currentParticipant.id,
        contactName: currentParticipant.contactName,
        contactEmail: currentParticipant.contactEmail,
      },
      newReceiver: {
        contactId: newContact._id,
        contactName: newReceiver.contactName,
        contactEmail: newReceiver.contactEmail,
      },
      addedAt: new Date(),
      addedIP: ip,
    });

    await pkg.save();
    await this.emitPackageUpdate(pkg);

    // --- SEND NOTIFICATIONS ---
    await this._sendNewReceiverNotifications(
      pkg,
      currentParticipant,
      newReceiver
    );

    return { message: "Receiver added successfully.", receiver: newReceiver };
  }

  //Helpers

  async _completeSignature(
    packageId,
    participantId,
    fieldId,
    ip,
    method,
    otp,
    otpDocId
  ) {
    // Clean up OTP
    await this.OTP.deleteOne({ _id: otpDocId });

    // Get package with owner info
    const pkg = await this.Package.findById(packageId).populate(
      "ownerId",
      "email"
    );
    if (!pkg) {
      throw new Error("Package not found after OTP verification.");
    }
    this.checkPackageExpiry(pkg);

    const field = pkg.fields.find((f) => f.id === fieldId);
    const assignedUser = field.assignedUsers.find(
      (au) => au.id === participantId
    );

    const signDate = new Date();

    // Update audit trail properties
    assignedUser.signed = true;
    assignedUser.signedAt = signDate;
    assignedUser.signedMethod = method;
    assignedUser.signedIP = ip;
    assignedUser.signedWithOtp = otp;

    // Store signature details in field value for UI
    field.value = {
      signedBy: assignedUser.contactName,
      email: assignedUser.contactEmail,
      date: signDate.toISOString(),
      method: method,
      ip: ip, // Additional audit info
      otpCode: otp,
    };

    // Check if package is completed
    if (this.isPackageCompleted(pkg)) {
      pkg.status = "Completed";
      const packageCreator = await this.User.findById(pkg.ownerId);
      const initiatorName = `${packageCreator.firstName} ${packageCreator.lastName}`;
      await this._sendCompletionNotifications(pkg, initiatorName);
    }

    // Save changes
    await pkg.save();

    // Emit real-time update
    await this.emitPackageUpdate(pkg);

    // ✅ FIX: Get the processed package with signed URL
    const updatedPackageForParticipant = await this.getPackageForParticipant(
      packageId,
      participantId
    );

    return {
      message: `Signature completed via ${method}.`,
      package: updatedPackageForParticipant,
      signatureDetails: {
        method: method,
        signedAt: signDate.toISOString(),
        signedBy: assignedUser.contactName,
      },
    };
  }

  _maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) return phoneNumber;
    const visible = phoneNumber.slice(-4);
    const masked = "*".repeat(phoneNumber.length - 4);
    return masked + visible;
  }

  /**
   * Check if all required fields in the package are completed
   * This method validates ALL field types, not just signatures
   */
  isPackageCompleted(pkg) {
    return pkg.fields.every((field) => {
      // Handle signature fields - ALWAYS check if assigned users have signed
      // Signatures with assigned users must be completed regardless of required flag
      if (field.type === "signature") {
        // If there are assigned users, they ALL must sign
        if (field.assignedUsers && field.assignedUsers.length > 0) {
          return field.assignedUsers.every((au) => au.signed === true);
        }
        // If no assigned users and not required, consider it complete
        return !field.required;
      }

      // Handle checkbox fields with Approver role
      if (field.type === "checkbox") {
        const approvers = field.assignedUsers.filter(
          (au) => au.role === "Approver"
        );

        // If there are approvers, they must have signed
        if (approvers.length > 0) {
          return approvers.every((au) => au.signed === true);
        }

        // For checkboxes without approvers, check required flag
        if (!field.required) {
          return true;
        }

        // Required checkbox must have a valid value
        return field.value === true;
      }

      // For all other field types (text, textarea, date, dropdown, radio)
      // Only check if they're required
      if (!field.required) {
        return true;
      }

      // Required fields must have a valid, non-empty value
      if (
        field.type === "text" ||
        field.type === "textarea" ||
        field.type === "date" ||
        field.type === "dropdown" ||
        field.type === "radio"
      ) {
        return (
          field.value !== undefined &&
          field.value !== null &&
          field.value !== "" &&
          field.value.toString().trim() !== ""
        );
      }

      // For any other field types, check if they have a value
      return (
        field.value !== undefined &&
        field.value !== null &&
        field.value !== "" &&
        field.value !== false
      );
    });
  }

  /**
   * Sends notifications when a package is completed.
   * @private
   */
  async _sendCompletionNotifications(pkg, initiatorName) {
    const packageOwner = await this.User.findById(pkg.ownerId).select(
      "firstName lastName email language"
    );
    const allRecipients = new Map();

    // 1. Gather all participants and, crucially, their contactId
    pkg.fields.forEach((field) => {
      field.assignedUsers.forEach((user) => {
        if (!allRecipients.has(user.contactEmail)) {
          allRecipients.set(user.contactEmail, {
            contactId: user.contactId, // <-- Important for language lookup
            participantId: user.id,
            email: user.contactEmail,
            name: user.contactName,
            role: user.role,
          });
        }
      });
    });

    pkg.receivers.forEach((receiver) => {
      if (!allRecipients.has(receiver.contactEmail)) {
        allRecipients.set(receiver.contactEmail, {
          contactId: receiver.contactId, // <-- Important for language lookup
          participantId: receiver.id,
          email: receiver.contactEmail,
          name: receiver.contactName,
          role: "Receiver",
        });
      }
    });

    // 2. Efficiently fetch language preferences for all participants
    const allContactIds = Array.from(allRecipients.values())
      .map((r) => r.contactId)
      .filter((id) => id);
    if (allContactIds.length > 0) {
      const contacts = await this.Contact.find({
        _id: { $in: allContactIds },
      }).select("language");
      const languageMap = new Map(
        contacts.map((c) => [c._id.toString(), c.language])
      );

      // Add language preference to each recipient object
      for (const recipient of allRecipients.values()) {
        recipient.language =
          languageMap.get(recipient.contactId.toString()) || "en";
      }
    }

    // 3. Send completion notifications to all PARTICIPANTS (excluding initiator)
    for (const recipient of allRecipients.values()) {
      const universalAccessLink = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${recipient.participantId}`;

      // The recipient object now contains the 'language' property
      await this.EmailService.sendDocumentCompletedNotification(
        recipient,
        initiatorName,
        pkg.name,
        universalAccessLink
      );
    }

    // 4. Send special completion notification to INITIATOR
    if (packageOwner) {
      const dashboardLink = `${process.env.CLIENT_URL}/dashboard`;
      await this.EmailService.sendInitiatorCompletionNotification(
        packageOwner, // Pass the entire owner object
        pkg.name,
        dashboardLink
      );
    }
  }

  /**
   * @private
   * A helper method that groups all participants and sends a single consolidated
   * notification to action-takers and a separate notification to receivers.
   * @param {object} pkg - The full package document.
   * @param {string} senderName - The name of the package initiator.
   */
  async _sendInitialNotifications(pkg, senderName) {
    const actionTakers = new Map();
    const notificationReceivers = new Map();

    // 1. Separate all participants into two groups.
    for (const field of pkg.fields) {
      if (field.assignedUsers) {
        for (const user of field.assignedUsers) {
          if (!actionTakers.has(user.contactEmail)) {
            actionTakers.set(user.contactEmail, user);
          }
        }
      }
    }

    if (pkg.receivers) {
      for (const receiver of pkg.receivers) {
        if (!actionTakers.has(receiver.contactEmail)) {
          notificationReceivers.set(receiver.contactEmail, receiver);
        }
      }
    }

    // 2. EFFICIENTLY FETCH LANGUAGES FOR ALL RECIPIENTS (ACTION-TAKERS & RECEIVERS)
    const allContactIds = [
      ...Array.from(actionTakers.values()).map((u) => u.contactId),
      ...Array.from(notificationReceivers.values()).map((r) => r.contactId),
    ].filter((id) => id); // Filter out any null/undefined IDs

    if (allContactIds.length === 0) return; // No one to notify

    const contacts = await this.Contact.find({
      _id: { $in: allContactIds },
    }).select("language");
    const languageMap = new Map(
      contacts.map((c) => [c._id.toString(), c.language])
    );

    // 3. Send the "Action Required" email to all unique action-takers.
    for (const user of actionTakers.values()) {
      const actionUrl = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${user.id}`;
      // Add the fetched language to the user object before sending
      user.language = languageMap.get(user.contactId.toString()) || "en";

      // NOTE: This assumes `sendActionRequiredNotification` will be updated to use the `user.language` property.
      await this.EmailService.sendActionRequiredNotification(
        user,
        pkg,
        senderName,
        actionUrl,
        pkg.customMessage
      );
    }

    // 4. Send the "For Your Records" email to all unique notification-only receivers.
    for (const receiver of notificationReceivers.values()) {
      const actionUrl = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${receiver.id}`;
      // Add the fetched language to the receiver object before sending
      receiver.language =
        languageMap.get(receiver.contactId.toString()) || "en";

      await this.EmailService.sendReceiverNotification(
        receiver,
        pkg,
        senderName,
        actionUrl
      );
    }
  }

  /**
   * @private
   * Sends rejection notifications to the owner and all participants.
   */
  async _sendRejectionNotifications(
    pkg,
    initiatorName,
    rejectorName,
    rejectionReason
  ) {
    // The package owner is already populated on pkg from the rejectPackage method
    const packageOwner = pkg.ownerId;
    const allRecipients = new Map();

    // 1. Gather all participants and their contactIds
    pkg.fields.forEach((field) => {
      (field.assignedUsers || []).forEach((user) => {
        if (!allRecipients.has(user.contactEmail)) {
          allRecipients.set(user.contactEmail, {
            contactId: user.contactId, // <-- Important for language lookup
            participantId: user.id,
            name: user.contactName,
            email: user.contactEmail,
            isOwner: false,
          });
        }
      });
    });

    pkg.receivers.forEach((receiver) => {
      if (!allRecipients.has(receiver.contactEmail)) {
        allRecipients.set(receiver.contactEmail, {
          contactId: receiver.contactId, // <-- Important for language lookup
          participantId: receiver.id,
          name: receiver.contactName,
          email: receiver.contactEmail,
          isOwner: false,
        });
      }
    });

    // 2. Add the package owner to the list
    if (packageOwner && !allRecipients.has(packageOwner.email)) {
      allRecipients.set(packageOwner.email, {
        // No contactId needed for owner, language is on the User object
        participantId: packageOwner._id.toString(),
        name: initiatorName,
        email: packageOwner.email,
        isOwner: true,
      });
    }

    // 3. Efficiently fetch language preferences for all NON-OWNER participants
    const contactIds = Array.from(allRecipients.values())
      .filter((r) => !r.isOwner && r.contactId)
      .map((r) => r.contactId);

    const contacts = await this.Contact.find({
      _id: { $in: contactIds },
    }).select("language");
    const languageMap = new Map(
      contacts.map((c) => [c._id.toString(), c.language])
    );

    // 4. Loop through all recipients and send notifications
    for (const recipient of allRecipients.values()) {
      // Determine the correct language for this recipient
      if (recipient.isOwner) {
        recipient.language = packageOwner.language || "en";
      } else {
        recipient.language =
          languageMap.get(recipient.contactId.toString()) || "en";
      }

      const accessLink = recipient.isOwner
        ? `${process.env.CLIENT_URL}/package/${pkg._id}`
        : `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${recipient.participantId}`;

      // Pass the entire enriched recipient object to the email service
      await this.EmailService.sendRejectionNotification(
        recipient,
        initiatorName,
        pkg.name,
        rejectorName,
        rejectionReason,
        accessLink
      );
    }
  }
  /**
   * Helper method to find a participant in the package
   */
  _findParticipant(pkg, participantId) {
    // Check in field assignments
    for (const field of pkg.fields) {
      const user = field.assignedUsers.find((u) => u.id === participantId);
      if (user) return user;
    }

    // Check in receivers
    const receiver = pkg.receivers.find((r) => r.id === participantId);
    return receiver;
  }

  /**
   * Check if a participant can reassign their assignments
   */
  canParticipantReassign(pkg, participantId) {
    // Check package-level settings
    if (!pkg.options.allowReassign) {
      return {
        canReassign: false,
        reason: "Reassignment is disabled for this package",
      };
    }

    if (pkg.status !== "Sent") {
      return {
        canReassign: false,
        reason: "Package must be in 'Sent' status for reassignment",
      };
    }

    // Find participant's assignments
    const participantFields = pkg.fields.filter((field) =>
      field.assignedUsers.some((user) => user.id === participantId)
    );

    if (participantFields.length === 0) {
      // Check if they're a receiver
      const isReceiver = pkg.receivers.some((r) => r.id === participantId);
      if (!isReceiver) {
        return {
          canReassign: false,
          reason: "No assignments found for this participant",
        };
      }
    }

    // Check if any assigned fields are already completed
    const completedFields = participantFields.filter((field) =>
      field.assignedUsers.some(
        (user) => user.id === participantId && user.signed
      )
    );

    if (completedFields.length > 0) {
      return {
        canReassign: false,
        reason: `Cannot reassign because ${completedFields.length} field(s) have been completed`,
      };
    }

    return {
      canReassign: true,
      assignedFields: participantFields.length,
      pendingFields: participantFields.length,
    };
  }

  /**
   * Send notifications about the reassignment
   */
  async _sendReassignmentNotifications(
    pkg,
    originalParticipant,
    newContact,
    newParticipantId,
    reason
  ) {
    try {
      // Get package owner details
      const packageOwner = await this.User.findById(pkg.ownerId);
      const ownerName = `${packageOwner.firstName} ${packageOwner.lastName}`;

      // --- NEW: Fetch language for the original participant ---
      const originalContact = await this.Contact.findById(
        originalParticipant.contactId
      ).select("language");
      originalParticipant.language = originalContact
        ? originalContact.language
        : "en";
      // --- END NEW ---

      // 1. Notify the original participant (confirmation) - THIS CALL IS UPDATED
      await this.EmailService.sendReassignmentConfirmation(
        originalParticipant, // Pass the entire enriched object
        ownerName,
        pkg.name,
        `${newContact.firstName} ${newContact.lastName}`,
        reason
      );

      // 2. Notify the new assignee - THIS CALL IS UPDATED
      const actionUrl = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${newParticipantId}`;
      await this.EmailService.sendReassignmentNotification(
        newContact, // Pass the entire newContact object
        ownerName,
        pkg.name,
        originalParticipant.contactName,
        actionUrl
      );

      // 3. Notify the package owner - THIS CALL IS UPDATED
      await this.EmailService.sendReassignmentOwnerNotification(
        packageOwner, // Pass the entire owner object
        pkg.name,
        originalParticipant.contactName,
        `${newContact.firstName} ${newContact.lastName}`,
        reason,
        pkg._id // Pass packageId for the link
      );
    } catch (error) {
      console.error("Error sending reassignment notifications:", error);
    }
  }

  /**
   * Check if package is expired before any action
   */
  checkPackageExpiry(pkg) {
    if (pkg.status === "Expired") {
      throw new Error(
        "This document has expired and cannot be modified or completed."
      );
    }

    if (pkg.options.expiresAt && new Date() > pkg.options.expiresAt) {
      throw new Error(
        "This document has expired and cannot be modified or completed."
      );
    }
  }

  /**
   * @private
   * A helper method to transform a list of database packages into the required frontend 'Document' structure.
   */
  async _transformPackagesForFrontend(packages) {
    // Collect all unique contact IDs from all packages to fetch their phone numbers in one go
    const allContactIds = new Set();
    packages.forEach((pkg) => {
      pkg.fields.forEach((f) =>
        f.assignedUsers.forEach((u) =>
          allContactIds.add(u.contactId.toString())
        )
      );
      pkg.receivers.forEach((r) => allContactIds.add(r.contactId.toString()));
    });

    // Fetch contacts in a single query and map them for quick lookup
    const contacts = await this.Contact.find({
      _id: { $in: Array.from(allContactIds) },
    })
      .select("phone")
      .lean();
    const contactPhoneMap = new Map(
      contacts.map((c) => [c._id.toString(), c.phone || ""])
    );

    // 🔥 NEW: Helper function to determine participant status FOR A SPECIFIC ROLE
    const getParticipantStatusForRole = (contactId, role, pkg) => {
      // Get fields assigned to this participant with THIS SPECIFIC ROLE
      const assignedFieldsForRole = pkg.fields.filter((field) =>
        field.assignedUsers.some(
          (user) =>
            user.contactId.toString() === contactId.toString() &&
            user.role === role
        )
      );

      if (assignedFieldsForRole.length === 0) {
        return pkg.status === "Sent" ? "In Progress" : "Not Sent";
      }

      // Check each assigned field to see if this participant completed it
      const completedFields = assignedFieldsForRole.filter((field) => {
        const userAssignment = field.assignedUsers.find(
          (user) =>
            user.contactId.toString() === contactId.toString() &&
            user.role === role
        );

        if (!userAssignment) return false;

        // For signature fields, check if signed
        if (field.type === "signature") {
          return userAssignment.signed === true;
        }

        // For checkbox fields with Approver role, check if signed
        if (field.type === "checkbox" && userAssignment.role === "Approver") {
          return userAssignment.signed === true;
        }

        // For FormFiller role on required fields, check the signed flag
        if (userAssignment.role === "FormFiller" && field.required) {
          return userAssignment.signed === true;
        }

        // For non-required FormFiller fields, check if value exists
        if (userAssignment.role === "FormFiller" && !field.required) {
          return (
            field.value !== undefined &&
            field.value !== null &&
            field.value !== "" &&
            field.value !== false
          );
        }

        // For other cases, check if value exists
        return (
          field.value !== undefined &&
          field.value !== null &&
          field.value !== "" &&
          field.value !== false
        );
      });

      // Determine status based on completion FOR THIS ROLE
      if (completedFields.length === assignedFieldsForRole.length) {
        return "Completed";
      } else if (pkg.status === "Sent") {
        return "In Progress";
      } else {
        return "Not Sent";
      }
    };

    return packages.map((pkg) => {
      const participants = new Map(); // Use a Map to easily group participants

      // Iterate through fields to group all assigned users
      (pkg.fields || []).forEach((field) => {
        (field.assignedUsers || []).forEach((user) => {
          if (!participants.has(user.contactId.toString())) {
            participants.set(user.contactId.toString(), {
              contactId: user.contactId.toString(),
              contactName: user.contactName,
              contactEmail: user.contactEmail,
              roles: new Set(),
              signed: false,
              signedAt: null,
            });
          }
          const p = participants.get(user.contactId.toString());
          p.roles.add(user.role);
          if (user.signed) p.signed = true;
          if (
            user.signedAt &&
            (!p.signedAt || new Date(user.signedAt) > new Date(p.signedAt))
          ) {
            p.signedAt = user.signedAt;
          }
        });
      });

      // Transform the grouped participant data into the final 'RoleDetail' structure
      const roleDetails = { formFillers: [], approvers: [], signers: [] };
      participants.forEach((p) => {
        // 🔥 CRITICAL FIX: Create separate roleDetail for EACH role with role-specific status
        if (p.roles.has("FormFiller")) {
          roleDetails.formFillers.push({
            user: {
              id: p.contactId,
              name: p.contactName,
              email: p.contactEmail,
              phone: contactPhoneMap.get(p.contactId) || "",
            },
            status: getParticipantStatusForRole(p.contactId, "FormFiller", pkg),
            lastUpdated: p.signedAt ? new Date(p.signedAt).toISOString() : "",
          });
        }

        if (p.roles.has("Approver")) {
          roleDetails.approvers.push({
            user: {
              id: p.contactId,
              name: p.contactName,
              email: p.contactEmail,
              phone: contactPhoneMap.get(p.contactId) || "",
            },
            status: getParticipantStatusForRole(p.contactId, "Approver", pkg),
            lastUpdated: p.signedAt ? new Date(p.signedAt).toISOString() : "",
          });
        }

        if (p.roles.has("Signer")) {
          roleDetails.signers.push({
            user: {
              id: p.contactId,
              name: p.contactName,
              email: p.contactEmail,
              phone: contactPhoneMap.get(p.contactId) || "",
            },
            status: getParticipantStatusForRole(p.contactId, "Signer", pkg),
            lastUpdated: p.signedAt ? new Date(p.signedAt).toISOString() : "",
          });
        }
      });

      // Handle notification-only receivers
      const receiverDetails = (pkg.receivers || []).map((rec) => ({
        user: {
          id: rec.contactId.toString(),
          name: rec.contactName,
          email: rec.contactEmail,
          phone: contactPhoneMap.get(rec.contactId.toString()) || "",
        },
        status: "Not Sent",
        lastUpdated: "",
      }));

      // Map backend package status to frontend status
      const statusMap = {
        Sent: "Pending",
        Completed: "Finished",
        Draft: "Draft",
        Rejected: "Rejected",
        Expired: "Expired",
        Archived: "Finished",
        Revoked: "Revoked",
      };

      const initiator = pkg.ownerId;

      // Construct the final object
      return {
        id: pkg._id.toString(),
        name: pkg.name,
        status: statusMap[pkg.status] || "Draft",
        addedOn: new Date(pkg.createdAt).toISOString(),
        initiator: {
          id: initiator._id.toString(),
          name: `${initiator.firstName} ${initiator.lastName}`,
          email: initiator.email,
          phone: initiator.phone || "",
        },
        formFillers: roleDetails.formFillers,
        approvers: roleDetails.approvers,
        signers: roleDetails.signers,
        receivers: receiverDetails,
        participantsSummary: Array.from(participants.values())
          .map((p) => p.contactName)
          .concat(receiverDetails.map((r) => r.user.name)),
      };
    });
  }

  /**
   * @private
   * A helper to send revocation notifications to all participants.
   */
  async _sendRevocationNotifications(pkg) {
    const owner = pkg.ownerId; // Already populated from revokePackage
    const initiatorName = `${owner.firstName} ${owner.lastName}`;

    const allRecipients = new Map();

    // 1. Gather all participants (action-takers and receivers)
    (pkg.fields || []).forEach((f) => {
      (f.assignedUsers || []).forEach((u) => {
        if (!allRecipients.has(u.contactEmail)) {
          allRecipients.set(u.contactEmail, {
            contactId: u.contactId,
            name: u.contactName,
            email: u.contactEmail,
            isOwner: false,
          });
        }
      });
    });
    (pkg.receivers || []).forEach((r) => {
      if (!allRecipients.has(r.contactEmail)) {
        allRecipients.set(r.contactEmail, {
          contactId: r.contactId,
          name: r.contactName,
          email: r.contactEmail,
          isOwner: false,
        });
      }
    });

    // 2. Add the owner to the list
    if (!allRecipients.has(owner.email)) {
      allRecipients.set(owner.email, {
        name: initiatorName,
        email: owner.email,
        isOwner: true,
      });
    }

    // 3. Efficiently fetch language preferences for all non-owner contacts
    const contactIds = Array.from(allRecipients.values())
      .filter((r) => !r.isOwner && r.contactId)
      .map((r) => r.contactId);

    const contacts = await this.Contact.find({
      _id: { $in: contactIds },
    }).select("language");
    const languageMap = new Map(
      contacts.map((c) => [c._id.toString(), c.language])
    );

    // 4. Loop through recipients and send notifications
    for (const recipient of allRecipients.values()) {
      // Determine the correct language
      if (recipient.isOwner) {
        recipient.language = owner.language || "en";
      } else {
        recipient.language =
          languageMap.get(recipient.contactId.toString()) || "en";
      }

      await this.EmailService.sendDocumentRevokedNotification(
        recipient, // Pass the entire enriched object
        initiatorName,
        pkg.name
      );
    }
  }

  /**
   * A private helper method to determine if a given participant can add receivers.
   */
  _canParticipantAddReceivers(pkg, participantId) {
    if (!pkg.options.allowReceiversToAdd) {
      return { canAdd: false, reason: "Feature disabled by sender." };
    }
    if (pkg.status !== "Sent") {
      return { canAdd: false, reason: "Package is not currently active." };
    }

    // Check if the current user is a Receiver in the receivers list.
    const isReceiver = pkg.receivers.some((r) => r.id === participantId);
    if (!isReceiver) {
      return {
        canAdd: false,
        reason: "Only participants with a 'Receiver' role can add others.",
      };
    }

    return { canAdd: true };
  }

  /**
   * Sends notifications when a new receiver is added by another participant.
   */
  async _sendNewReceiverNotifications(pkg, addedBy, newReceiver) {
    const packageOwner = await this.User.findById(pkg.ownerId).select(
      "firstName lastName email language"
    );
    const ownerName = `${packageOwner.firstName} ${packageOwner.lastName}`;
    const viewUrl = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${newReceiver.id}`;

    // --- NEW: Fetch language for the new receiver ---
    const newContact = await this.Contact.findById(
      newReceiver.contactId
    ).select("language");
    newReceiver.language = newContact ? newContact.language : "en";

    await this.EmailService.sendNewReceiverNotification(
      newReceiver, // Pass the entire enriched object
      ownerName,
      addedBy.contactName,
      pkg.name,
      viewUrl
    );

    // 2. Notify the package owner - THIS CALL IS UPDATED
    await this.EmailService.sendNewReceiverOwnerNotification(
      packageOwner, // Pass the entire owner object
      newReceiver.contactName,
      addedBy.contactName,
      pkg.name
    );
  }

  /**
   * @private
   * Sends a progress update to the initiator when a participant completes an action,
   * but the document is not yet fully completed.
   */
  async _sendActionUpdateNotification(pkg, actor) {
    try {
      // 1. Get the initiator (package owner)
      const owner = await this.User.findById(pkg.ownerId).select(
        "email firstName lastName language"
      );
      if (!owner) return;

      const initiatorName = `${owner.firstName} ${owner.lastName}`;
      const actorName = actor.contactName;

      // 2. Build a comprehensive list of all participants and their status
      const participants = new Map();
      pkg.fields.forEach((field) => {
        field.assignedUsers.forEach((user) => {
          if (!participants.has(user.contactId.toString())) {
            participants.set(user.contactId.toString(), {
              name: user.contactName,
              contactId: user.contactId.toString(),
              isComplete: false, // Default to pending
            });
          }
        });
      });

      // 3. Determine the true status of each participant
      for (const p of participants.values()) {
        const requiredFields = pkg.fields.filter(
          (f) =>
            f.required &&
            f.assignedUsers.some((u) => u.contactId.toString() === p.contactId)
        );

        // If a participant has no required fields, they are considered complete by default.
        if (requiredFields.length === 0) {
          p.isComplete = true;
          continue;
        }

        // Check if all their required fields are signed/filled
        p.isComplete = requiredFields.every((field) => {
          const assignment = field.assignedUsers.find(
            (u) => u.contactId.toString() === p.contactId
          );
          return assignment && assignment.signed; // `signed` flag indicates completion
        });
      }

      // 3. Create ARRAYS of names for the email template (NOT HTML)
      const completedNames = [];
      const pendingNames = [];

      participants.forEach((p) => {
        if (p.isComplete) {
          completedNames.push(p.name);
        } else {
          pendingNames.push(p.name);
        }
      });

      // 4. Send the email using the updated service method
      const actionLink = `${process.env.CLIENT_URL}/dashboard`;
      await this.EmailService.sendParticipantActionNotification(
        owner, // Pass the entire owner object
        pkg.name,
        actorName,
        completedNames, // Pass the array of names
        pendingNames, // Pass the array of names
        actionLink
      );
    } catch (error) {
      console.error("Failed to send action update notification:", error);
    }
  }

  /**
   * Calculate how many document credits should be consumed based on unique signers
   * Formula: 1 credit per 2 unique signers (rounded up)
   * Examples: 1-2 signers = 1 credit, 3-4 signers = 2 credits, 5-6 signers = 3 credits
   */
  _calculateDocumentCredits(pkg) {
    // Get all unique signer contact IDs across all signature fields
    const uniqueSignerIds = new Set();

    pkg.fields.forEach((field) => {
      if (field.type === "signature") {
        field.assignedUsers.forEach((user) => {
          if (user.role === "Signer") {
            uniqueSignerIds.add(user.contactId.toString());
          }
        });
      }
    });

    const uniqueSignerCount = uniqueSignerIds.size;

    // Calculate credits: 1 credit per 2 signers (rounded up)
    // Math.ceil ensures: 1-2 signers = 1, 3-4 = 2, 5-6 = 3, etc.
    const creditsNeeded = Math.ceil(uniqueSignerCount / 2);

    return {
      uniqueSignerCount,
      creditsNeeded,
    };
  }

  // New helper method to emit package update
  async emitPackageUpdate(pkg) {
    try {
      // Find the document again with all necessary data populated, ensuring it's the freshest state.
      const populatedPkg = await this.Package.findById(pkg._id)
        .populate("ownerId", "firstName lastName email phone")
        .lean();

      if (!populatedPkg) {
        console.error(
          `emitPackageUpdate: Could not find package ${pkg._id} after update.`
        );
        return;
      }

      // Reuse your existing, powerful transformation logic.
      const transformedDocument = (
        await this._transformPackagesForFrontend([populatedPkg])
      )[0];
      // Pass the complete, transformed document to the event emitter.
      this.packageEventEmitter.emitPackageUpdated(
        pkg.ownerId._id.toString(),
        transformedDocument
      );
    } catch (error) {
      console.error(`Failed to emit package update for ${pkg._id}:`, error);
    }
  }
}

module.exports = PackageService;
