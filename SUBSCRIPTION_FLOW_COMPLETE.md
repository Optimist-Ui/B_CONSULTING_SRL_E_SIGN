# Complete Subscription Flow - For Flutter Development

This document describes the **entire subscription flow** from checking subscription status to purchasing plans and managing subscriptions. Use this guide to implement subscription functionality in your Flutter application.

## Table of Contents

1. [Overview](#overview)
2. [Subscription Status Flow](#subscription-status-flow)
3. [Subscription States & Scenarios](#subscription-states--scenarios)
4. [Plan Selection Flow](#plan-selection-flow)
5. [Payment Method Management](#payment-method-management)
6. [Subscription Purchase Flow](#subscription-purchase-flow)
7. [Trial Subscription Flow](#trial-subscription-flow)
8. [Subscription Management](#subscription-management)
9. [Document Credits & Limits](#document-credits--limits)
10. [API Endpoints Reference](#api-endpoints-reference)
11. [Flutter Implementation Guide](#flutter-implementation-guide)
12. [Error Handling](#error-handling)

---

## Overview

### Key Concepts

1. **Subscription Status Check**: Determines if user can create documents
2. **Subscription States**: `trialing`, `active`, `past_due`, `canceled`, `incomplete`, `unpaid`
3. **Document Credits**: Each document uses credits based on signers (1 credit = 2 signers)
4. **Free Trial**: 14-day trial available once per user (fingerprint-based)
5. **Payment Method**: Required for all subscriptions (Stripe)

### Critical Rules

- ✅ **Active subscription REQUIRED** to create documents
- ✅ **Document limit** checks prevent exceeding plan limits
- ✅ **Trial eligibility** based on fingerprint (IP + device)
- ✅ **Payment method required** for all subscriptions
- ✅ **Cache status** for 5 minutes to reduce API calls

---

## Subscription Status Flow

### Step 1: Check Subscription Status

**Purpose**: Determine if user can access features and create documents

**Endpoint**: `GET /api/plans/status`

**Authentication**: Required (JWT token)

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "hasActiveSubscription": true,
    "canCreatePackages": true,
    "status": "ACTIVE",
    "documentsUsed": 5,
    "documentLimit": 50,
    "reason": "Subscription is active."
  }
}
```

**Status Values**:
- `ACTIVE`: User has active subscription and can create documents
- `INACTIVE`: No subscription or subscription not active
- `LIMIT_REACHED`: Subscription active but document limit reached

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `hasActiveSubscription` | boolean | True if subscription exists and is `active` or `trialing` |
| `canCreatePackages` | boolean | True if user can create new documents |
| `status` | string | `ACTIVE`, `INACTIVE`, or `LIMIT_REACHED` |
| `documentsUsed` | number | Number of documents user has created (optional) |
| `documentLimit` | number | Maximum documents allowed on current plan (optional) |
| `reason` | string | Human-readable explanation of status |

### Step 2: Interpret Status

**Logic Flow**:
```dart
if (!status.hasActiveSubscription) {
  // Show: "Subscribe to create documents"
  // Redirect to subscription page
  return SubscriptionState.NO_SUBSCRIPTION;
}

if (!status.canCreatePackages) {
  if (status.status == "LIMIT_REACHED") {
    // Show: "Document limit reached. Upgrade plan."
    return SubscriptionState.LIMIT_REACHED;
  }
  // Show: "Cannot create packages"
  return SubscriptionState.CANNOT_CREATE;
}

// User can proceed
return SubscriptionState.ACTIVE;
```

### Step 3: Cache Management

**Caching Strategy**:
- Cache status for **5 minutes**
- Force refresh after subscription purchase
- Force refresh when user creates document
- Show cached data immediately while fetching new data

**Implementation**:
```dart
class SubscriptionStatusCache {
  SubscriptionStatus? cachedStatus;
  DateTime? lastFetch;
  static const cacheDuration = Duration(minutes: 5);

  bool get isValid {
    if (cachedStatus == null || lastFetch == null) return false;
    return DateTime.now().difference(lastFetch!) < cacheDuration;
  }

  Future<SubscriptionStatus> getStatus({bool forceRefresh = false}) async {
    if (!forceRefresh && isValid) {
      return cachedStatus!;
    }
    
    final status = await api.get('/api/plans/status');
    cachedStatus = status;
    lastFetch = DateTime.now();
    return status;
  }

  void invalidate() {
    cachedStatus = null;
    lastFetch = null;
  }
}
```

---

## Subscription States & Scenarios

### Scenario 1: No Subscription

**Status**: `INACTIVE`

**Conditions**:
- User never subscribed
- Subscription expired
- Subscription canceled and ended

**Response**:
```json
{
  "hasActiveSubscription": false,
  "canCreatePackages": false,
  "status": "INACTIVE",
  "reason": "No subscription found."
}
```

**User Actions**:
- Navigate to subscription page
- Cannot access:
  - Dashboard (`/dashboard`)
  - Create documents (`/add-document`)
  - My Documents (`/my-documents`)
  - Contacts (`/contacts`)
  - Templates (`/templates`)

**UI Behavior**:
- Show "Subscribe Now" button
- Redirect to subscription selection

---

### Scenario 2: Active Trial

**Status**: `ACTIVE` (subscription.status = `trialing`)

**Conditions**:
- User started 14-day free trial
- Trial period not expired
- Payment method on file

**Response**:
```json
{
  "hasActiveSubscription": true,
  "canCreatePackages": true,
  "status": "ACTIVE",
  "documentsUsed": 2,
  "documentLimit": 10,
  "reason": "Subscription is active."
}
```

**User Actions**:
- Can create documents (within limits)
- Trial will auto-convert to paid after 14 days
- Can end trial early to convert immediately

**UI Behavior**:
- Show "Trial: X days remaining" banner
- Show option to "End Trial Early"

---

### Scenario 3: Active Paid Subscription

**Status**: `ACTIVE` (subscription.status = `active`)

**Conditions**:
- Paid subscription active
- Payment successful
- Current period valid

**Response**:
```json
{
  "hasActiveSubscription": true,
  "canCreatePackages": true,
  "status": "ACTIVE",
  "documentsUsed": 15,
  "documentLimit": 50,
  "reason": "Subscription is active."
}
```

**User Actions**:
- Full access to all features
- Can create documents up to limit
- Can upgrade/downgrade plans
- Can cancel (at period end)

---

### Scenario 4: Document Limit Reached

**Status**: `LIMIT_REACHED`

**Conditions**:
- Subscription active
- User created `documentLimit` documents
- No credits remaining

**Response**:
```json
{
  "hasActiveSubscription": true,
  "canCreatePackages": false,
  "status": "LIMIT_REACHED",
  "documentsUsed": 50,
  "documentLimit": 50,
  "reason": "You have reached your document limit."
}
```

**User Actions**:
- Cannot create new documents
- Can top-up or upgrade plan
- Can view existing documents
- Can manage subscription

**UI Behavior**:
- Show "Limit Reached" banner
- Show "Upgrade Plan" or "Top-up" button
- Disable "Create Document" button

---

### Scenario 5: Payment Issues

**Status**: `INACTIVE`

**Conditions**:
- Subscription status: `past_due`, `unpaid`, `incomplete`
- Payment failed
- Card declined

**Response**:
```json
{
  "hasActiveSubscription": false,
  "canCreatePackages": false,
  "status": "INACTIVE",
  "reason": "Your subscription is currently past_due. An active plan is required."
}
```

**User Actions**:
- Update payment method
- Cannot create documents until payment succeeds
- Subscription may be canceled by Stripe

**UI Behavior**:
- Show "Payment Required" alert
- Prompt to update payment method
- Show subscription details

---

## Plan Selection Flow

### Step 1: Fetch Available Plans

**Endpoint**: `GET /api/plans`

**Authentication**: **Public** (no auth required)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "plan_id_1",
      "name": "Starter",
      "monthlyPrice": 9.99,
      "yearlyPrice": 99.99,
      "monthlyPriceId": "price_monthly_starter",
      "yearlyPriceId": "price_yearly_starter",
      "documentLimit": 10,
      "features": [
        "10 documents per month",
        "Email support",
        "Basic templates"
      ]
    },
    {
      "_id": "plan_id_2",
      "name": "Pro",
      "monthlyPrice": 29.99,
      "yearlyPrice": 299.99,
      "monthlyPriceId": "price_monthly_pro",
      "yearlyPriceId": "price_yearly_pro",
      "documentLimit": 50,
      "features": [
        "50 documents per month",
        "Priority support",
        "Advanced templates",
        "API access"
      ]
    },
    {
      "_id": "plan_id_3",
      "name": "Enterprise",
      "monthlyPrice": 99.99,
      "yearlyPrice": 999.99,
      "monthlyPriceId": "price_monthly_enterprise",
      "yearlyPriceId": "price_yearly_enterprise",
      "documentLimit": -1,
      "features": [
        "Unlimited documents",
        "Dedicated support",
        "Custom templates",
        "Full API access",
        "White-label options"
      ]
    }
  ]
}
```

**Plan Structure**:
```dart
class Plan {
  final String id;
  final String name; // "Starter", "Pro", "Enterprise"
  final double monthlyPrice;
  final double yearlyPrice;
  final String monthlyPriceId; // Stripe Price ID
  final String yearlyPriceId; // Stripe Price ID
  final int documentLimit; // -1 means unlimited
  final List<String> features;
}
```

### Step 2: Display Plans

**UI Components Needed**:

1. **Billing Toggle**: Monthly vs Yearly
   - Show "Save 20%" badge on yearly
   - Highlight selected billing cycle

2. **Plan Cards**: One card per plan
   - Plan name
   - Price (monthly or yearly based on toggle)
   - Document limit (or "Unlimited")
   - Feature list
   - "Popular" badge for middle plan
   - Action button (see below)

3. **Action Button Text Logic**:

```dart
String getButtonText(Plan plan, Subscription? currentSubscription, bool hasHadTrial, bool isYearly) {
  // If user has no subscription
  if (currentSubscription == null) {
    if (!hasHadTrial && plan.monthlyPrice > 0) {
      return "Start 14-Day Free Trial";
    }
    return "Choose Plan";
  }

  final currentPlanName = currentSubscription.planName;
  final currentInterval = currentSubscription.planInterval; // "month" or "year"
  final selectedInterval = isYearly ? "year" : "month";

  // If selecting same plan and interval
  if (plan.name == currentPlanName && selectedInterval == currentInterval) {
    return "Top-up"; // Add more documents
  }

  // If selecting same plan, different interval
  if (plan.name == currentPlanName) {
    return "Switch to ${isYearly ? 'Yearly' : 'Monthly'} Billing";
  }

  // Different plan
  return "Switch to ${plan.name}";
}
```

4. **Plan Selection**:
   - User clicks "Choose Plan" or "Start Trial"
   - Opens payment method selection modal

---

## Payment Method Management

### Step 1: Fetch Payment Methods

**Endpoint**: `GET /api/payment-methods`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_xxxxx",
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025,
      "isDefault": true
    }
  ]
}
```

**Payment Method Structure**:
```dart
class PaymentMethod {
  final String id; // Stripe payment method ID
  final String brand; // "visa", "mastercard", etc.
  final String last4; // Last 4 digits
  final int expMonth;
  final int expYear;
  final bool isDefault;
}
```

### Step 2: Add New Payment Method

**Using Stripe SDK**:

```dart
// 1. Create payment method with Stripe
final paymentMethod = await Stripe.instance.createPaymentMethod(
  PaymentMethodParams.card(
    paymentMethodData: PaymentMethodData(
      billingDetails: BillingDetails(
        email: userEmail,
      ),
    ),
  ),
);

// 2. Attach to user account
final response = await api.post('/api/payment-methods/attach', {
  'paymentMethodId': paymentMethod.id,
});
```

**Endpoint**: `POST /api/payment-methods/attach`

**Request**:
```json
{
  "paymentMethodId": "pm_xxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "pm_xxxxx",
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2025,
    "isDefault": true
  }
}
```

### Step 3: Select Payment Method

**In Purchase Modal**:
- Show list of saved payment methods
- User selects one (default is pre-selected)
- Show "Add New Card" option
- If no payment methods, show card form directly

---

## Subscription Purchase Flow

### Regular Subscription Purchase

**Endpoint**: `POST /api/plans/create`

**Authentication**: Required

**Request**:
```json
{
  "priceId": "price_monthly_pro",
  "paymentMethodId": "pm_xxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "sub_xxxxx",
    "status": "active",
    "latest_invoice": {
      "payment_intent": {
        "client_secret": "pi_xxxxx_secret_xxxxx",
        "status": "succeeded"
      }
    }
  }
}
```

**Flow Steps**:

1. **Validate Input**:
   ```dart
   if (priceId.isEmpty || paymentMethodId.isEmpty) {
     throw ValidationError('Price ID and Payment Method ID are required');
   }
   ```

2. **Call API**:
   ```dart
   final response = await api.post('/api/plans/create', {
     'priceId': selectedPriceId,
     'paymentMethodId': selectedPaymentMethodId,
   });
   ```

3. **Handle 3D Secure** (if required):
   ```dart
   final subscription = response.data;
   final paymentIntent = subscription['latest_invoice']?['payment_intent'];
   
   if (paymentIntent != null && paymentIntent['status'] == 'requires_action') {
     // Confirm payment with 3D Secure
     await Stripe.instance.confirmPayment(
       paymentIntent['client_secret'],
       paymentMethodData: PaymentMethodData(),
     );
   }
   ```

4. **Invalidate Cache & Refresh**:
   ```dart
   subscriptionCache.invalidate();
   await refreshSubscriptionStatus();
   await refreshSubscriptionDetails();
   ```

5. **Navigate to Dashboard**:
   ```dart
   Navigator.pushReplacementNamed(context, '/dashboard');
   ```

---

## Trial Subscription Flow

### Trial Eligibility Check

**Requirements**:
1. User has not had a trial before (`hasHadTrial = false`)
2. Plan has price > 0 (free plans don't have trials)
3. Valid payment method provided

**Fingerprint Check**:
- Backend checks IP address + device fingerprint
- Prevents multiple trials from same device/IP

### Starting Trial

**Endpoint**: `POST /api/plans/create-trial`

**Authentication**: Required

**Request**:
```json
{
  "priceId": "price_monthly_pro",
  "paymentMethodId": "pm_xxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "sub_xxxxx",
    "status": "trialing",
    "trial_end": 1704067200
  }
}
```

**Flow Steps**:

1. **Check Eligibility** (on frontend):
   ```dart
   if (user.hasHadTrial) {
     showError('You have already used your free trial');
     return;
   }
   ```

2. **Call Trial API**:
   ```dart
   final response = await api.post('/api/plans/create-trial', {
     'priceId': selectedPriceId,
     'paymentMethodId': selectedPaymentMethodId,
   });
   ```

3. **Handle Errors**:
   ```dart
   catch (e) {
     if (e.message.contains('trial')) {
       showError('Trial not available. You may have already used it.');
     }
   }
   ```

4. **Show Success**:
   - Display "Trial Started" message
   - Show trial end date
   - Navigate to dashboard

### Trial Conversion

**Automatic**:
- Trial converts to paid after 14 days
- Charged automatically using saved payment method
- Webhook handles conversion (`customer.subscription.updated`)

**Manual (End Trial Early)**:
**Endpoint**: `PATCH /api/plans/end-trial`

**Purpose**: Convert trial to paid immediately

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "active",
    "message": "Trial ended. Subscription is now active."
  }
}
```

---

## Subscription Management

### Get Current Subscription

**Endpoint**: `GET /api/plans/my-subscription`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "subscriptionId": "sub_xxxxx",
    "planName": "Pro",
    "planInterval": "month",
    "status": "active",
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z",
    "trial_end": null,
    "isTrialing": false
  }
}
```

**Subscription Structure**:
```dart
class Subscription {
  final String subscriptionId;
  final String planName;
  final String planInterval; // "month" or "year"
  final String status; // "trialing", "active", "canceled", etc.
  final DateTime currentPeriodStart;
  final DateTime currentPeriodEnd;
  final DateTime? trialEnd;
  final bool isTrialing;
}
```

### Cancel Subscription

**Endpoint**: `PATCH /api/plans/cancel`

**Authentication**: Required

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "canceled",
    "cancel_at_period_end": true,
    "message": "Subscription will be canceled at the end of the billing period."
  }
}
```

**Behavior**:
- Subscription remains active until `current_period_end`
- User can continue using service until period ends
- Cannot create new documents after period ends
- Can reactivate before period ends

**Flow**:
```dart
// 1. Show confirmation dialog
final confirm = await showDialog<bool>(
  context: context,
  builder: (context) => AlertDialog(
    title: Text('Cancel Subscription?'),
    content: Text('Your subscription will remain active until ${formatDate(periodEnd)}. You can reactivate anytime before then.'),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context, false), child: Text('No')),
      TextButton(onPressed: () => Navigator.pop(context, true), child: Text('Yes, Cancel')),
    ],
  ),
);

if (confirm == true) {
  // 2. Cancel subscription
  await api.patch('/api/plans/cancel');
  
  // 3. Refresh status
  await refreshSubscriptionStatus();
  
  // 4. Show success
  showSuccess('Subscription will be canceled at the end of the billing period.');
}
```

### Reactivate Subscription

**Endpoint**: `PATCH /api/plans/reactivate`

**Authentication**: Required

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "active",
    "message": "Subscription reactivated successfully."
  }
}
```

**Conditions**:
- Subscription must be in "canceled" state
- Must be within current billing period
- Payment method must be valid

**Flow**:
```dart
await api.patch('/api/plans/reactivate');
await refreshSubscriptionStatus();
showSuccess('Subscription reactivated!');
```

### Get Invoices

**Endpoint**: `GET /api/plans/invoices`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "in_xxxxx",
      "amount": 2999,
      "currency": "eur",
      "status": "paid",
      "created": 1704067200,
      "invoice_pdf": "https://..."
    }
  ]
}
```

---

## Document Credits & Limits

### Understanding Document Credits

**Credit Calculation**:
- 1 credit = up to 2 unique signers
- Formula: `Math.ceil(uniqueSigners / 2)`
- Minimum: 1 credit per document

**Examples**:
- 1 signer = 1 credit
- 2 signers = 1 credit
- 3 signers = 2 credits
- 5 signers = 3 credits

### Document Limit by Plan

| Plan | Document Limit | Notes |
|------|---------------|-------|
| Starter | 10 | Monthly limit |
| Pro | 50 | Monthly limit |
| Enterprise | -1 (unlimited) | No limit |

### Checking Document Usage

**From Subscription Status**:
```dart
final status = await getSubscriptionStatus();

if (status.documentsUsed != null && status.documentLimit != null) {
  final remaining = status.documentLimit! - status.documentsUsed!;
  final percentage = (status.documentsUsed! / status.documentLimit!) * 100;
  
  print('Used: ${status.documentsUsed}/${status.documentLimit}');
  print('Remaining: $remaining');
  print('Percentage: ${percentage.toStringAsFixed(1)}%');
}
```

### Top-Up Functionality

**What is Top-up?**:
- Adding more documents to current plan
- Same plan, same billing cycle
- Extends document limit immediately

**Flow**:
1. User clicks "Top-up" on current plan
2. Opens payment modal (same as purchase)
3. Selects payment method
4. Processes payment
5. Document limit increases
6. Status cache invalidated

---

## API Endpoints Reference

### Public Endpoints

#### Get Plans
```
GET /api/plans
```

**Response**: Array of plans

---

### Protected Endpoints (Require Auth)

#### Get Subscription Status
```
GET /api/plans/status
```

**Response**: SubscriptionStatus object

#### Get Current Subscription
```
GET /api/plans/my-subscription
```

**Response**: Subscription object

#### Create Subscription
```
POST /api/plans/create
Body: { "priceId": string, "paymentMethodId": string }
```

**Response**: Stripe subscription object

#### Create Trial Subscription
```
POST /api/plans/create-trial
Body: { "priceId": string, "paymentMethodId": string }
```

**Response**: Stripe subscription object

#### Cancel Subscription
```
PATCH /api/plans/cancel
```

**Response**: Updated subscription object

#### Reactivate Subscription
```
PATCH /api/plans/reactivate
```

**Response**: Updated subscription object

#### End Trial Early
```
PATCH /api/plans/end-trial
```

**Response**: Updated subscription object

#### Get Invoices
```
GET /api/plans/invoices
```

**Response**: Array of invoice objects

---

## Flutter Implementation Guide

### 1. Setup Stripe

**Add Dependency**:
```yaml
dependencies:
  flutter_stripe: ^10.0.0
```

**Initialize Stripe**:
```dart
import 'package:flutter_stripe/flutter_stripe.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  Stripe.publishableKey = "pk_test_xxxxx"; // From environment
  Stripe.merchantIdentifier = "merchant.com.yourapp";
  
  runApp(MyApp());
}
```

### 2. Subscription Status Service

```dart
class SubscriptionService {
  SubscriptionStatus? _cachedStatus;
  DateTime? _lastFetch;
  static const _cacheDuration = Duration(minutes: 5);

  Future<SubscriptionStatus> getStatus({bool forceRefresh = false}) async {
    if (!forceRefresh && _isCacheValid) {
      return _cachedStatus!;
    }

    try {
      final response = await api.get('/api/plans/status');
      final status = SubscriptionStatus.fromJson(response.data['data']);
      
      _cachedStatus = status;
      _lastFetch = DateTime.now();
      
      return status;
    } catch (e) {
      if (_cachedStatus != null) {
        return _cachedStatus!;
      }
      rethrow;
    }
  }

  bool get _isCacheValid {
    if (_cachedStatus == null || _lastFetch == null) return false;
    return DateTime.now().difference(_lastFetch!) < _cacheDuration;
  }

  void invalidateCache() {
    _cachedStatus = null;
    _lastFetch = null;
  }
}
```

### 3. Plan Selection Widget

```dart
class PlanSelectionScreen extends StatefulWidget {
  @override
  _PlanSelectionScreenState createState() => _PlanSelectionScreenState();
}

class _PlanSelectionScreenState extends State<PlanSelectionScreen> {
  List<Plan> plans = [];
  bool isYearly = false;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlans();
  }

  Future<void> _loadPlans() async {
    try {
      final response = await api.get('/api/plans');
      setState(() {
        plans = (response.data['data'] as List)
            .map((json) => Plan.fromJson(json))
            .toList();
        isLoading = false;
      });
    } catch (e) {
      // Handle error
    }
  }

  void _onPlanSelected(Plan plan) {
    Navigator.pushNamed(
      context,
      '/payment-method-selection',
      arguments: {'plan': plan, 'isYearly': isYearly},
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: Text('Choose Your Plan')),
      body: Column(
        children: [
          // Billing Toggle
          _buildBillingToggle(),
          
          // Plan Cards
          Expanded(
            child: ListView.builder(
              itemCount: plans.length,
              itemBuilder: (context, index) {
                return _buildPlanCard(plans[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillingToggle() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildToggleButton('Monthly', !isYearly),
          _buildToggleButton('Yearly', isYearly),
        ],
      ),
    );
  }

  Widget _buildToggleButton(String label, bool isSelected) {
    return GestureDetector(
      onTap: () => setState(() => isYearly = label == 'Yearly'),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue : Colors.grey[200],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildPlanCard(Plan plan) {
    final price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    final priceId = isYearly ? plan.yearlyPriceId : plan.monthlyPriceId;

    return Card(
      margin: EdgeInsets.all(16),
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(plan.name, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('€${price.toStringAsFixed(2)}', style: TextStyle(fontSize: 32)),
            Text(isYearly ? '/year' : '/month'),
            SizedBox(height: 16),
            Text('${plan.documentLimit == -1 ? "Unlimited" : plan.documentLimit} documents'),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => _onPlanSelected(plan),
              child: Text('Choose Plan'),
              style: ElevatedButton.styleFrom(
                minimumSize: Size(double.infinity, 50),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 4. Payment Method Selection

```dart
class PaymentMethodSelectionScreen extends StatefulWidget {
  final Plan plan;
  final bool isYearly;

  PaymentMethodSelectionScreen({required this.plan, required this.isYearly});

  @override
  _PaymentMethodSelectionScreenState createState() => _PaymentMethodSelectionScreenState();
}

class _PaymentMethodSelectionScreenState extends State<PaymentMethodSelectionScreen> {
  List<PaymentMethod> paymentMethods = [];
  PaymentMethod? selectedPaymentMethod;
  bool isAddingNewCard = false;

  @override
  void initState() {
    super.initState();
    _loadPaymentMethods();
  }

  Future<void> _loadPaymentMethods() async {
    try {
      final response = await api.get('/api/payment-methods');
      setState(() {
        paymentMethods = (response.data['data'] as List)
            .map((json) => PaymentMethod.fromJson(json))
            .toList();
        if (paymentMethods.isNotEmpty) {
          selectedPaymentMethod = paymentMethods.firstWhere(
            (pm) => pm.isDefault,
            orElse: () => paymentMethods.first,
          );
        }
      });
    } catch (e) {
      // Handle error
    }
  }

  Future<void> _addNewPaymentMethod() async {
    try {
      final paymentMethod = await Stripe.instance.createPaymentMethod(
        PaymentMethodParams.card(
          paymentMethodData: PaymentMethodData(),
        ),
      );

      await api.post('/api/payment-methods/attach', {
        'paymentMethodId': paymentMethod.id,
      });

      await _loadPaymentMethods();
      setState(() => isAddingNewCard = false);
    } catch (e) {
      // Handle error
    }
  }

  Future<void> _processSubscription(bool isTrial) async {
    if (selectedPaymentMethod == null) {
      showError('Please select a payment method');
      return;
    }

    try {
      final priceId = widget.isYearly
          ? widget.plan.yearlyPriceId
          : widget.plan.monthlyPriceId;

      final endpoint = isTrial
          ? '/api/plans/create-trial'
          : '/api/plans/create';

      final response = await api.post(endpoint, {
        'priceId': priceId,
        'paymentMethodId': selectedPaymentMethod!.id,
      });

      // Handle 3D Secure if needed
      final paymentIntent = response.data['data']?['latest_invoice']?['payment_intent'];
      if (paymentIntent != null && paymentIntent['status'] == 'requires_action') {
        await Stripe.instance.confirmPayment(
          paymentIntent['client_secret'],
        );
      }

      // Invalidate cache and refresh
      subscriptionService.invalidateCache();
      await subscriptionService.getStatus(forceRefresh: true);

      // Navigate to dashboard
      Navigator.pushReplacementNamed(context, '/dashboard');
      showSuccess(isTrial ? 'Trial started!' : 'Subscription created!');
    } catch (e) {
      showError(e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isAddingNewCard) {
      return _buildCardForm();
    }

    return Scaffold(
      appBar: AppBar(title: Text('Select Payment Method')),
      body: Column(
        children: [
          Expanded(
            child: paymentMethods.isEmpty
                ? Center(
                    child: ElevatedButton(
                      onPressed: _addNewPaymentMethod,
                      child: Text('Add Payment Method'),
                    ),
                  )
                : ListView.builder(
                    itemCount: paymentMethods.length,
                    itemBuilder: (context, index) {
                      final pm = paymentMethods[index];
                      return RadioListTile<PaymentMethod>(
                        title: Text('${pm.brand.toUpperCase()} •••• ${pm.last4}'),
                        subtitle: Text('Expires ${pm.expMonth}/${pm.expYear}'),
                        value: pm,
                        groupValue: selectedPaymentMethod,
                        onChanged: (value) => setState(() => selectedPaymentMethod = value),
                      );
                    },
                  ),
          ),
          Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                ElevatedButton(
                  onPressed: () => setState(() => isAddingNewCard = true),
                  child: Text('Add New Card'),
                ),
                SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => _processSubscription(false),
                  child: Text('Subscribe Now'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardForm() {
    return Scaffold(
      appBar: AppBar(title: Text('Add Payment Method')),
      body: CardFormField(
        onCardChanged: (card) {
          // Handle card input
        },
      ),
    );
  }
}
```

### 5. Route Protection

```dart
class SubscriptionRequiredRoute extends StatelessWidget {
  final Widget child;
  final bool requiresActiveSubscription;
  final bool requiresPackageCreation;

  SubscriptionRequiredRoute({
    required this.child,
    this.requiresActiveSubscription = false,
    this.requiresPackageCreation = false,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<SubscriptionStatus>(
      future: subscriptionService.getStatus(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasError || !snapshot.hasData) {
          return SubscriptionRequiredScreen();
        }

        final status = snapshot.data!;

        if (requiresActiveSubscription && !status.hasActiveSubscription) {
          return SubscriptionRequiredScreen();
        }

        if (requiresPackageCreation && !status.canCreatePackages) {
          return SubscriptionRequiredScreen(
            reason: status.status == 'LIMIT_REACHED'
                ? 'Document limit reached'
                : 'Cannot create packages',
          );
        }

        return child;
      },
    );
  }
}
```

---

## Error Handling

### Common Errors

1. **No Payment Method**
   ```json
   {
     "error": "Payment method is required"
   }
   ```
   **Solution**: Prompt user to add payment method

2. **Trial Already Used**
   ```json
   {
     "error": "You have already used your free trial"
   }
   ```
   **Solution**: Show regular subscription option only

3. **Payment Failed**
   ```json
   {
     "error": "Payment failed. Please update your payment method."
   }
   ```
   **Solution**: Prompt to update payment method

4. **Invalid Price ID**
   ```json
   {
     "error": "Invalid price ID"
   }
   ```
   **Solution**: Refresh plans and try again

5. **Document Limit Reached**
   ```json
   {
     "status": "LIMIT_REACHED",
     "reason": "You have reached your document limit."
   }
   ```
   **Solution**: Show upgrade/top-up options

---

## Summary Checklist

### Implementation Checklist

- [ ] Setup Stripe SDK
- [ ] Implement subscription status service with caching
- [ ] Create plan selection screen
- [ ] Implement payment method management
- [ ] Handle subscription purchase flow
- [ ] Handle trial subscription flow
- [ ] Implement 3D Secure handling
- [ ] Create route protection
- [ ] Add subscription management (cancel/reactivate)
- [ ] Display subscription details
- [ ] Show document usage/limits
- [ ] Handle all error scenarios
- [ ] Implement cache invalidation
- [ ] Add loading states
- [ ] Test all flows

### Key Points to Remember

1. ✅ **Always check subscription status** before allowing document creation
2. ✅ **Cache status for 5 minutes** to reduce API calls
3. ✅ **Handle 3D Secure** for payments requiring authentication
4. ✅ **Invalidate cache** after subscription changes
5. ✅ **Show clear error messages** for payment failures
6. ✅ **Display trial countdown** for trialing users
7. ✅ **Handle document limits** and show upgrade options
8. ✅ **Allow top-ups** for users on same plan

This completes the subscription flow documentation. Use this guide to implement a fully functional subscription system in Flutter.

