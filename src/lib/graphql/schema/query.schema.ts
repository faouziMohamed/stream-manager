export const querySchema = /* GraphQL */ `
    type Query {
        # Services
        services: [Service!]!
        service(id: ID!): Service

        # Plans
        plans(serviceId: ID, promotionId: ID): [Plan!]!
        plan(id: ID!): Plan

        # Promotions
        promotions: [Promotion!]!
        promotion(id: ID!): Promotion

        # Clients
        clients: [Client!]!
        client(id: ID!): Client

        # Subscriptions
        subscriptions(clientId: ID, status: SubscriptionStatus): [Subscription!]!
        subscription(id: ID!): Subscription

        # Payments
        payments(
            subscriptionId: ID
            status: PaymentStatus
            fromDate: Date
            toDate: Date
        ): [Payment!]!
        payment(id: ID!): Payment

        # Dashboard
        dashboardStats: DashboardStats!

        # Analytics
        analytics(months: Int): AnalyticsData!

        # Settings
        appSetting(key: String!): AppSetting
        defaultCurrency: String!
        smtpSettings: SmtpSettings!
        cloudinarySettings: CloudinarySettings!
        cloudinaryMedia(folder: String): [CloudinaryResource!]!

        # Summary links
        summaryLinks: [SummaryLink!]!
        summaryByToken(token: String!): SummaryData

        # Streaming accounts & profiles
        streamingAccounts(serviceId: ID): [StreamingAccount!]!
        streamingAccount(id: ID!): StreamingAccount
        streamingProfiles(accountId: ID!): [StreamingProfile!]!
        subscriptionAssignment(subscriptionId: ID!): SubscriptionProfileAssignment
    }

    type SummaryData {
        stats: DashboardStats!
        showSensitiveInfo: Boolean!
    }
`;
