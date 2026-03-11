export const mutationSchema = /* GraphQL */ `
    type Mutation {
        # Services
        createService(input: CreateServiceInput!): Service!
        updateService(id: ID!, input: UpdateServiceInput!): Service!
        deleteService(id: ID!): Boolean!

        # Plans
        createPlan(input: CreatePlanInput!): Plan!
        updatePlan(id: ID!, input: UpdatePlanInput!): Plan!
        deletePlan(id: ID!): Boolean!

        # Promotions
        createPromotion(input: CreatePromotionInput!): Promotion!
        updatePromotion(id: ID!, input: UpdatePromotionInput!): Promotion!
        deletePromotion(id: ID!): Boolean!

        # Clients
        createClient(input: CreateClientInput!): Client!
        updateClient(id: ID!, input: UpdateClientInput!): Client!
        deleteClient(id: ID!): Boolean!

        # Subscriptions
        createSubscription(input: CreateSubscriptionInput!): Subscription!
        updateSubscription(id: ID!, input: UpdateSubscriptionInput!): Subscription!
        deleteSubscription(id: ID!): Boolean!
        renewSubscription(input: RenewSubscriptionInput!): Subscription!

        # Payments
        updatePayment(id: ID!, input: UpdatePaymentInput!): Payment!
        markPaymentPaid(id: ID!, paidDate: Date): Payment!

        # Settings
        setAppSetting(key: String!, value: String!): AppSetting!
        setSmtpSettings(input: SmtpSettingsInput!): SmtpSettings!
        setCloudinarySettings(input: CloudinarySettingsInput!): CloudinarySettings!
        testSmtp(toEmail: String!): TestResult!
        testCloudinary: CloudinaryTestResult!
        uploadToCloudinary(base64: String!, filename: String): CloudinaryTestResult!
        deleteFromCloudinary(publicId: String!): TestResult!
        replaceCloudinaryImage(oldPublicId: String!, base64: String!, filename: String): CloudinaryTestResult!

        # Contact inquiries (public — no auth)
        createInquiry(input: CreateInquiryInput!): Boolean!

        # Summary links
        createSummaryLink(label: String, showSensitiveInfo: Boolean!, expiresAt: DateTime): SummaryLink!
        deleteSummaryLink(id: ID!): Boolean!
        toggleSummaryLink(id: ID!, isActive: Boolean!): SummaryLink!

        # Streaming accounts & profiles
        createAccount(input: CreateAccountInput!): StreamingAccount!
        updateAccount(id: ID!, input: UpdateAccountInput!): StreamingAccount!
        deleteAccount(id: ID!): Boolean!
        createProfile(input: CreateProfileInput!): StreamingProfile!
        updateProfile(id: ID!, input: UpdateProfileInput!): StreamingProfile!
        deleteProfile(id: ID!): Boolean!
        assignProfile(input: AssignProfileInput!): SubscriptionProfileAssignment!
        removeAssignment(subscriptionId: ID!): Boolean!
    }
`;
