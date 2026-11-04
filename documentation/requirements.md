# Software Requirement Specification (SRS)
## Home Services Booking SaaS Platform

**Document version:** 1.0  
**Document status:** Requirements baseline (proposed)  
**Project type:** Full-stack SaaS web application  
**Date:** 4 November 2026

---

## Document Purpose

This document defines the proposed requirements for a Home Services Booking SaaS Platform. It describes the business objectives, scope, users, permissions, functional and non-functional requirements, user stories, booking and payment workflows, data requirements, API expectations, MVP, testing, risks, and unresolved business decisions.

It is intended to guide product planning, UI/UX design, database design, backend and frontend development, testing, and deployment. It is a requirements document only; it does not contain application code.

## 1. Project Overview

### 1.1 Product Description

The Home Services Booking SaaS Platform is a web application that connects customers who need home services with service providers who offer those services.

Example services include:

- Plumbing
- Electrical repairs
- AC installation and repair
- Home cleaning
- Pest control
- Painting
- Carpentry
- Appliance repair

Customers can discover services, compare providers, schedule appointments, track bookings, make payments, and submit reviews.

Service providers can register their businesses, publish services, manage availability and bookings, assign technicians, and monitor earnings.

Technicians can view assigned jobs, access relevant customer and location information, update work progress, and mark jobs as completed.

The Super Admin manages the platform, users, provider verification, service categories, bookings, payments, commissions, complaints, and reports.

### 1.2 Business Problem

Many home-service businesses currently manage requests through phone calls, messaging applications, spreadsheets, or manual records. This can lead to:

- Difficulty finding reliable professionals.
- Limited visibility into provider credentials and ratings.
- Manual and time-consuming appointment management.
- Poor communication about booking progress.
- Inconsistent payment and commission records.
- Scheduling conflicts for providers and technicians.
- Limited business performance reporting.

The proposed platform centralizes these activities.

### 1.3 Business Objectives

1. Provide a centralized marketplace for home services.
2. Help customers discover suitable and verified providers.
3. Give providers tools to manage their services and daily operations.
4. Allow providers to assign work to technicians.
5. Support online booking and appointment scheduling.
6. Record payments, refunds, provider earnings, and platform commissions.
7. Improve trust through ratings, reviews, and provider verification.
8. Give administrators oversight of the complete platform.
9. Support multiple independent service providers on one platform.

### 1.4 Proposed Business Model

The platform may generate revenue through:

- Commission on completed bookings.
- Monthly or yearly provider subscriptions.
- Featured service listings.
- Promotional placements or advertisements.

Commission rates, subscription prices, settlement timing, and other commercial rules must be configurable and approved by the business owner. They are not fixed by this SRS.

## 2. Technology Stack and Architecture

### 2.1 Technology

| Layer / Purpose | Technology |
|---|---|
| Frontend | React.js |
| Styling | Tailwind CSS |
| Backend | Python FastAPI |
| Database | MySQL |
| ORM | SQLAlchemy |
| Authentication | JWT |
| API testing | Postman |
| Browser automation | Playwright |
| Payment gateway | Razorpay Test Mode |
| File and image storage | Cloudinary |
| Version control | Git and GitHub |
| Potential frontend hosting | Vercel or Netlify |
| Potential backend hosting | Render or another suitable host |

### 2.2 High-Level Architecture

The system follows a three-layer architecture:

1. **Presentation layer:** React.js and Tailwind CSS provide the user interface, dashboards, forms, and booking screens.
2. **Application layer:** FastAPI handles API requests, authentication, authorization, validation, business rules, and application logic. SQLAlchemy maps application objects to database records.
3. **Data layer:** MySQL stores users, profiles, services, bookings, assignments, payments, reviews, and other records.

Typical request flow:

1. A user performs an action in the React application.
2. React sends an HTTP request to a FastAPI endpoint.
3. FastAPI authenticates the user and checks permissions.
4. FastAPI validates the request and applies business rules.
5. SQLAlchemy performs the required database operations.
6. MySQL stores or retrieves the data.
7. FastAPI returns a response.
8. React displays the result.

### 2.3 Technology Responsibilities

- **React.js:** Build interactive pages and role-specific dashboards.
- **Tailwind CSS:** Provide consistent, responsive styling.
- **FastAPI:** Expose REST APIs and implement backend business logic.
- **MySQL:** Persist application data.
- **SQLAlchemy:** Manage database interactions through Python models and queries.
- **JWT:** Identify authenticated users when they access protected APIs.
- **Razorpay Test Mode:** Demonstrate payment gateway integration without collecting real payments.
- **Cloudinary:** Store service images and approved document assets.
- **Postman and Playwright:** Test API behavior and user journeys.
- **Git and GitHub:** Maintain source control and project history.

## 3. Scope

### 3.1 In-Scope Features

**Customer**
- Register and log in.
- Manage profile and addresses.
- Browse and search services.
- Filter services by category and location.
- View service and provider details.
- View ratings and reviews.
- Check available appointment slots.
- Select a date, time, and service address.
- Describe the problem and optionally upload images.
- Create and track bookings.
- Cancel eligible bookings.
- Make payments and view payment history.
- Download receipts.
- Submit reviews after eligible completed bookings.
- Raise complaints or support requests.

**Service Provider**
- Register a business.
- Submit identity and business verification documents.
- View verification status and rejection reason.
- Manage business profile.
- Create, update, and deactivate service listings.
- Select service categories.
- Define descriptions, pricing, duration, and service areas.
- Manage working hours and availability.
- Accept or reject booking requests.
- Assign technicians.
- Monitor job progress.
- View relevant customer information for bookings.
- Upload before-and-after service images.
- View reviews, booking history, earnings, and commissions.

**Technician**
- Log in.
- View assigned jobs.
- View relevant booking and customer details.
- View service address and appointment information.
- Update job progress.
- Upload before-and-after images where required.
- Mark assigned work as completed.
- View completed job history.

**Super Admin**
- Log in to the administration panel.
- View platform dashboard and analytics.
- Manage customers, providers, and accounts.
- Review provider verification documents.
- Approve or reject providers.
- Manage service categories and listings.
- Monitor all bookings.
- View transactions, refunds, and commissions.
- Manage complaints and disputes.
- Manage coupons and offers.
- Manage provider subscription plans.
- Generate and export reports.

### 3.2 Out of Scope for Initial Release

The following are proposed future enhancements, not MVP requirements:

- Native Android and iOS applications.
- Live GPS tracking of technicians.
- Real-time video consultations.
- AI-based automatic technician allocation.
- Advanced route optimization.
- Multi-country and multi-currency support.
- Machine-learning recommendations.
- Automated recurring service subscriptions.
- Advanced accounting or ERP integration.
- Full real-time chat between customers and providers.

### 3.3 Assumptions

The following assumptions are used for planning and must be confirmed:

1. The first release will operate in India.
2. Prices will initially be displayed in Indian Rupees (INR).
3. The first release will be a responsive web application.
4. Each account will have one primary role.
5. Providers must be approved before publishing publicly visible services.
6. Customers must be authenticated before creating bookings.
7. Providers are responsible for creating and managing their technicians.
8. Razorpay Test Mode will be used for initial payment demonstrations.
9. Cloudinary will be used for relevant images and document storage.
10. Super Admin will control platform-wide configuration and business rules.

### 3.4 Constraints

- The frontend and backend must communicate through documented APIs.
- Backend authorization must be enforced independently of frontend visibility.
- Payment status must be based on trusted gateway verification.
- Uploaded files must be validated and access-controlled.
- Booking and payment records must preserve important history.
- Secrets and API keys must not be committed to source control.

## 4. User Roles and Permissions

The system has four primary roles.

### 4.1 Super Admin

The Super Admin owns or administers the platform and has platform-wide management permissions.

Responsibilities:
- Manage users and accounts.
- Verify service providers.
- Manage categories and oversee service listings.
- Monitor all bookings.
- Review payments, refunds, and commissions.
- Manage complaints and disputes.
- Manage coupons and subscription plans.
- View platform-wide analytics and reports.

### 4.2 Customer

A customer is a person who needs a home service.

Responsibilities:
- Manage personal profile and addresses.
- Browse services and providers.
- Compare service descriptions, prices, ratings, and availability.
- Create and track bookings.
- Make payments.
- Cancel eligible bookings.
- Download receipts.
- Submit reviews and complaints.

### 4.3 Service Provider

A service provider is a business or professional offering services through the platform.

Responsibilities:
- Register and verify the business.
- Manage business profile and service listings.
- Define prices, service areas, and working hours.
- Accept or reject booking requests.
- Manage technicians and assign jobs.
- Monitor booking progress.
- View reviews, earnings, and commissions.

### 4.4 Technician

A technician is a worker assigned to physically perform a booked service.

Responsibilities:
- View assigned jobs.
- View necessary customer and service-location details.
- Start assigned work.
- Update job progress.
- Upload required work evidence.
- Mark the job as completed.

### 4.5 Permission Matrix

| Capability | Super Admin | Customer | Provider | Technician |
|---|---|---|---|---|
| Manage own profile | Yes | Yes | Yes | Yes |
| Manage all users | Yes | No | No | No |
| Browse services | Yes | Yes | Yes | No |
| Create service listings | Oversight | No | Own listings | No |
| Approve providers | Yes | No | No | No |
| Create bookings | No | Yes | No | No |
| View all bookings | Yes | No | No | No |
| View own bookings | As authorized | Yes | Own business | Assigned only |
| Accept or reject bookings | Intervention | No | Own bookings | No |
| Assign technicians | Oversight | No | Own technicians | No |
| Update job status | Intervention | No | Limited oversight | Assigned jobs |
| View payment records | All | Own payments | Own earnings | No |
| Manage commissions | Yes | No | View own | No |
| Submit reviews | No | Yes | No | No |
| Raise complaints | Manage | Yes | Respond where relevant | No |
| View platform analytics | Yes | No | Own business | Own jobs only |

**Authorization rule:** Access must be checked on the backend. Hiding a button in React is not sufficient. For example, a customer must not be able to access another customer's booking by changing an ID in a URL or API request.

## 5. Functional Requirements

Functional requirements define what the system must do. Each requirement has an identifier for traceability and testing.

### 5.1 Authentication and Authorization

- **FR-AUTH-01:** The system shall allow customers to register.
- **FR-AUTH-02:** The system shall allow service providers to submit registration details.
- **FR-AUTH-03:** Authorized providers or administrators shall be able to create technician accounts.
- **FR-AUTH-04:** The system shall enforce unique registered email addresses and/or phone numbers according to the selected registration policy.
- **FR-AUTH-05:** Users shall be able to log in using valid credentials.
- **FR-AUTH-06:** The backend shall issue a JWT access token after successful authentication.
- **FR-AUTH-07:** The system shall identify the authenticated user and their role.
- **FR-AUTH-08:** Protected endpoints shall enforce role-based and record-ownership permissions.
- **FR-AUTH-09:** Unauthenticated requests to protected endpoints shall receive an HTTP 401 response.
- **FR-AUTH-10:** Authenticated users without the required permission shall receive an HTTP 403 response.
- **FR-AUTH-11:** Passwords shall be stored using a secure password hashing algorithm such as bcrypt or Argon2.
- **FR-AUTH-12:** Users shall be able to change their passwords.
- **FR-AUTH-13:** The system shall provide a secure password reset process.
- **FR-AUTH-14:** Users shall be able to update their own profile information.
- **FR-AUTH-15:** Authorized administrators shall be able to suspend or deactivate accounts.

### 5.2 User Management

- **FR-USER-01:** Super Admin shall be able to view registered users.
- **FR-USER-02:** Super Admin shall be able to search users by name, email, phone, or role.
- **FR-USER-03:** Super Admin shall be able to activate, deactivate, or suspend accounts.
- **FR-USER-04:** Customers shall be able to update their personal details.
- **FR-USER-05:** Providers shall be able to update business details.
- **FR-USER-06:** Providers shall be able to manage their technician profiles, subject to account permissions.

### 5.3 Service Category Management

- **FR-CAT-01:** Super Admin shall be able to create service categories.
- **FR-CAT-02:** Super Admin shall be able to update category details.
- **FR-CAT-03:** Super Admin shall be able to activate or deactivate categories.
- **FR-CAT-04:** Customers shall be able to browse services by category.
- **FR-CAT-05:** Providers shall only be able to publish services under active categories.

### 5.4 Service Management

A service category represents a broad type of work. A service listing is a specific offering by a provider.

Example:
- Category: Plumbing
- Service: Bathroom Tap Repair
- Provider: ABC Plumbing Services
- Price: ₹499

Requirements:

- **FR-SERVICE-01:** Providers shall be able to create service listings.
- **FR-SERVICE-02:** Providers shall be able to add service descriptions and images.
- **FR-SERVICE-03:** Providers shall be able to define service prices.
- **FR-SERVICE-04:** Providers shall be able to define estimated service duration.
- **FR-SERVICE-05:** Providers shall be able to define supported service areas.
- **FR-SERVICE-06:** Providers shall be able to update or deactivate their own listings.
- **FR-SERVICE-07:** Customers shall be able to view active service listings.
- **FR-SERVICE-08:** Customers shall be able to search services by name, category, and location.
- **FR-SERVICE-09:** The system shall preserve the agreed price on an existing booking when a provider later changes the listing price.

### 5.5 Provider Verification

- **FR-PROV-01:** Providers shall be able to submit business registration details.
- **FR-PROV-02:** Providers shall be able to upload identity and verification documents.
- **FR-PROV-03:** Super Admin shall be able to review submitted provider information and documents.
- **FR-PROV-04:** Super Admin shall be able to approve or reject provider applications.
- **FR-PROV-05:** The system shall record the decision, administrator, and timestamp.
- **FR-PROV-06:** Rejected providers shall be able to view the rejection reason.
- **FR-PROV-07:** Only approved and active providers shall be able to publish publicly visible services.

### 5.6 Booking Management

- **FR-BOOK-01:** Customers shall be able to select an active service.
- **FR-BOOK-02:** Customers shall be able to select a provider offering that service.
- **FR-BOOK-03:** Customers shall be able to select an available date and time slot.
- **FR-BOOK-04:** Customers shall be able to select or add a service address.
- **FR-BOOK-05:** Customers shall be able to describe the service problem.
- **FR-BOOK-06:** Customers shall be able to upload relevant problem images.
- **FR-BOOK-07:** The backend shall calculate and validate the booking amount.
- **FR-BOOK-08:** The system shall generate a unique booking reference.
- **FR-BOOK-09:** The system shall notify the selected provider about a new booking request.
- **FR-BOOK-10:** Providers shall be able to accept or reject eligible booking requests.
- **FR-BOOK-11:** Providers shall be able to assign eligible technicians to accepted bookings.
- **FR-BOOK-12:** Customers shall be able to view booking progress.
- **FR-BOOK-13:** Customers shall be able to cancel bookings according to the configured cancellation policy.
- **FR-BOOK-14:** Super Admin shall be able to view and monitor all bookings.
- **FR-BOOK-15:** The system shall prevent overlapping confirmed appointments for the same provider or technician.
- **FR-BOOK-16:** The system shall maintain booking status history, including actor and timestamp.
- **FR-BOOK-17:** The system shall prevent duplicate booking creation caused by repeated submissions or retries.

### 5.7 Technician Management

- **FR-TECH-01:** Providers shall be able to create technician profiles.
- **FR-TECH-02:** Providers shall be able to update technician details.
- **FR-TECH-03:** Providers shall be able to assign eligible technicians to bookings.
- **FR-TECH-04:** Technicians shall be able to view their assigned jobs.
- **FR-TECH-05:** Technicians shall be able to view relevant booking details.
- **FR-TECH-06:** Technicians shall be able to update job status within permitted transitions.
- **FR-TECH-07:** Technicians shall be able to upload before-and-after images where required.
- **FR-TECH-08:** Technicians shall not be able to access unassigned bookings.
- **FR-TECH-09:** The system shall check technician availability before confirming an assignment.

### 5.8 Payment Management

- **FR-PAY-01:** Customers shall be able to initiate payment through the configured payment gateway.
- **FR-PAY-02:** The system shall store payment transaction references and relevant gateway identifiers.
- **FR-PAY-03:** The backend shall verify payment confirmation using the gateway's trusted verification mechanism.
- **FR-PAY-04:** The system shall maintain payment history.
- **FR-PAY-05:** Customers shall be able to view and download payment receipts.
- **FR-PAY-06:** Super Admin shall be able to view platform transactions.
- **FR-PAY-07:** The system shall calculate platform commission using configured rules.
- **FR-PAY-08:** Providers shall be able to view their earnings and commission deductions.
- **FR-PAY-09:** The system shall record refunds according to the configured refund policy.
- **FR-PAY-10:** Duplicate gateway notifications shall not create duplicate successful transactions.
- **FR-PAY-11:** Normal users shall not be able to directly set a payment to Paid.
- **FR-PAY-12:** The system shall support payment attempts that fail or remain pending without incorrectly marking the booking as paid.

### 5.9 Reviews and Ratings

- **FR-REV-01:** Customers shall be able to submit reviews for eligible completed bookings.
- **FR-REV-02:** Customers shall be able to rate providers from 1 to 5 stars.
- **FR-REV-03:** Customers shall be able to submit written feedback.
- **FR-REV-04:** Providers shall be able to view reviews related to their services.
- **FR-REV-05:** Super Admin shall be able to moderate inappropriate reviews.
- **FR-REV-06:** The system shall calculate average provider ratings.

### 5.10 Notifications

The system shall generate notifications for important events.

| Event | Intended recipient |
|---|---|
| Registration successful | User |
| Provider verification decision | Provider |
| New booking request | Provider |
| Booking accepted or rejected | Customer |
| Technician assigned | Customer and Technician |
| Service started | Customer |
| Service completed | Customer and Provider |
| Payment successful | Customer and Provider |
| Booking cancelled | Relevant parties |
| New complaint | Super Admin |

For the MVP, in-app notifications are sufficient. Email and SMS notifications can be added later.

### 5.11 Dashboards and Reports

**Super Admin dashboard**
- Total customers.
- Total providers.
- Total technicians.
- Total bookings.
- Pending bookings.
- Completed bookings.
- Cancelled bookings.
- Successful payment value.
- Refund value.
- Platform commission.

**Customer dashboard**
- Total bookings.
- Upcoming appointments.
- Completed services.
- Cancelled bookings.
- Recent payments.

**Provider dashboard**
- Total services.
- New booking requests.
- Accepted bookings.
- Active jobs.
- Completed jobs.
- Earnings.
- Commission deductions.

**Technician dashboard**
- Assigned jobs.
- Upcoming jobs.
- In-progress jobs.
- Completed jobs.

## 6. User Stories and Acceptance Criteria

A user story describes a feature from the user's perspective. Common format:

> As a [user], I want to [action], so that [benefit].

### 6.1 Super Admin User Stories

| ID | User story | Priority |
|---|---|---|
| US-SA-01 | As an admin, I want to log in securely so that I can access the administration panel. | High |
| US-SA-02 | I want to view platform statistics so that I can monitor business performance. | High |
| US-SA-03 | I want to view and manage customers so that I can maintain platform accounts. | High |
| US-SA-04 | I want to approve or reject providers so that only verified providers can operate. | High |
| US-SA-05 | I want to manage service categories so that the marketplace remains organized. | High |
| US-SA-06 | I want to monitor all bookings so that I can track platform activity. | High |
| US-SA-07 | I want to view payments and commissions so that I can monitor platform revenue. | High |
| US-SA-08 | I want to manage complaints so that customer issues can be resolved. | Medium |
| US-SA-09 | I want to create coupons so that I can run promotions. | Medium |
| US-SA-10 | I want to manage subscription plans so that providers can use different packages. | Medium |

**Acceptance criteria for US-SA-04:**
- Admin can view pending provider applications.
- Admin can open an application and view submitted information.
- Admin can review permitted documents.
- Admin can approve or reject the application.
- The decision and timestamp are recorded.
- The provider can see the result and any rejection reason.

### 6.2 Customer User Stories

| ID | User story | Priority |
|---|---|---|
| US-CU-01 | As a customer, I want to register so that I can use the platform. | High |
| US-CU-02 | I want to browse home services so that I can find the service I need. | High |
| US-CU-03 | I want to search by category so that I can find relevant services. | High |
| US-CU-04 | I want to view provider profiles so that I can compare providers. | High |
| US-CU-05 | I want to check availability so that I can choose a suitable appointment. | High |
| US-CU-06 | I want to book a service so that a professional can visit my home. | High |
| US-CU-07 | I want to upload problem images so that the provider can understand the issue. | Medium |
| US-CU-08 | I want to track my booking so that I know its progress. | High |
| US-CU-09 | I want to pay online so that I can complete the transaction conveniently. | High |
| US-CU-10 | I want to cancel an eligible booking so that I can manage unexpected changes. | High |
| US-CU-11 | I want to download receipts so that I have payment records. | Medium |
| US-CU-12 | I want to submit ratings and reviews so that I can share my experience. | Medium |
| US-CU-13 | I want to raise complaints so that I can report service problems. | Medium |

**Acceptance criteria for US-CU-06:**
- Customer must be authenticated.
- Customer must select an active service and eligible provider.
- Customer must enter a valid service address.
- Customer must select an available appointment slot.
- The system must display the price before confirmation.
- The backend must validate the booking details and price.
- The system must generate a unique booking reference.
- The customer must receive a clear success or failure result.

### 6.3 Service Provider User Stories

| ID | User story | Priority |
|---|---|---|
| US-SP-01 | As a provider, I want to register my business so that I can offer services. | High |
| US-SP-02 | I want to upload verification documents so that the platform can verify my business. | High |
| US-SP-03 | I want to manage my business profile so that customers can view my information. | High |
| US-SP-04 | I want to add services and prices so that customers can book them. | High |
| US-SP-05 | I want to define service locations so that I receive bookings from supported areas. | High |
| US-SP-06 | I want to manage working hours so that customers can choose suitable slots. | High |
| US-SP-07 | I want to accept or reject bookings so that I can manage my workload. | High |
| US-SP-08 | I want to assign technicians so that jobs can be completed by my team. | High |
| US-SP-09 | I want to monitor service progress so that I can manage daily operations. | High |
| US-SP-10 | I want to view earnings and commissions so that I understand business revenue. | High |
| US-SP-11 | I want to view customer reviews so that I can improve service quality. | Medium |
| US-SP-12 | I want to view booking history so that I can analyze previous work. | Medium |

**Acceptance criteria for US-SP-08:**
- Provider can view accepted bookings requiring assignment.
- Provider can view eligible technicians belonging to that provider.
- Provider can assign an available technician.
- The system checks for scheduling conflicts.
- The assignment is stored.
- The technician receives a notification.
- The provider cannot assign a technician belonging to another provider.

### 6.4 Technician User Stories

| ID | User story | Priority |
|---|---|---|
| US-TE-01 | As a technician, I want to log in so that I can view assigned jobs. | High |
| US-TE-02 | I want to see assigned bookings so that I know my work schedule. | High |
| US-TE-03 | I want to view relevant customer contact details so that I can coordinate the visit. | High |
| US-TE-04 | I want to view the service address so that I can reach the customer. | High |
| US-TE-05 | I want to start a job so that the system records the beginning of service. | High |
| US-TE-06 | I want to upload service images so that I can provide work evidence. | Medium |
| US-TE-07 | I want to mark a job completed so that the provider and customer know the work is finished. | High |
| US-TE-08 | I want to view completed jobs so that I can review my work history. | Medium |

**Acceptance criteria for US-TE-07:**
- Technician must be assigned to the booking.
- The booking must be in a status that permits completion.
- Technician can mark the job completed.
- Completion time and actor are recorded.
- Required evidence is uploaded if policy requires it.
- Customer and provider are notified.
- Technician cannot modify payment status.

## 7. Booking Workflow

### 7.1 Example Scenario

A customer needs an AC repair service.

Participants:
- Customer: Rahul.
- Service Provider: ABC AC Services.
- Technician: Amit.
- Super Admin: HomeServe Administrator.

### 7.2 Booking Steps

1. **Discover service:** Rahul searches for AC repair services.
2. **Select provider:** Rahul views available providers, service descriptions, prices, and ratings.
3. **Select appointment:** Rahul chooses a date, time slot, and service address.
4. **Submit request:** Rahul describes the problem and may upload images.
5. **Create booking:** The system creates a unique booking reference and sets the booking status to Pending.
6. **Provider decision:** ABC AC Services accepts or rejects the request.
7. **Technician assignment:** If accepted, the provider assigns Amit.
8. **Start work:** Amit visits the customer and updates the booking to In Progress.
9. **Complete work:** Amit uploads required evidence and marks the service Completed.
10. **Payment and feedback:** Rahul completes any outstanding payment and submits a review if eligible.

### 7.3 Booking Statuses

| Status | Meaning |
|---|---|
| Pending | Booking submitted; provider has not decided. |
| Accepted | Provider accepted the booking. |
| Rejected | Provider rejected the request. |
| Technician Assigned | A technician has been assigned. |
| In Progress | Technician has started the service. |
| Completed | Technician has completed the service. |
| Cancelled | Booking has been cancelled. |

### 7.4 Permitted Status Transitions

| Current status | Next status | Authorized actor |
|---|---|---|
| Pending | Accepted | Provider |
| Pending | Rejected | Provider |
| Pending | Cancelled | Customer or Admin, subject to policy |
| Accepted | Technician Assigned | Provider |
| Accepted | Cancelled | Eligible Customer or Admin |
| Technician Assigned | In Progress | Assigned Technician |
| Technician Assigned | Cancelled | Admin under exception policy |
| In Progress | Completed | Assigned Technician |

Additional rules:
- Rejected and cancelled bookings cannot be restarted.
- Completed bookings cannot be cancelled.
- Only an authorized provider can assign its technicians.
- Only the assigned technician can update the operational job status.
- Every status change must record the actor and timestamp.
- Customers must receive notifications for important status changes.
- Exceptional administrative changes must be auditable.

**Important:** Booking status and payment status must be separate fields. A booking can be Accepted while payment is still Pending. This prevents service progress and financial state from being confused.

## 8. Payment Workflow

### 8.1 Example Calculation

Assume a service price of ₹1,000 and an illustrative platform commission of 10%.

| Description | Amount |
|---|---:|
| Service price | ₹1,000 |
| Example platform commission | ₹100 |
| Provider earning before other adjustments | ₹900 |
| Customer payment | ₹1,000 |

The 10% commission is only an example. The actual rate and calculation basis must be decided by the business.

### 8.2 Payment Steps

1. Customer confirms the booking amount.
2. Backend creates a payment order with Razorpay.
3. Customer completes payment through the gateway interface.
4. Gateway returns transaction details.
5. Backend verifies the signature or trusted gateway notification.
6. Backend updates the payment record.
7. System generates a receipt.
8. System records commission and provider earnings.

### 8.3 Payment Statuses

| Status | Meaning |
|---|---|
| Pending | Payment has not been completed. |
| Processing | Payment is being processed. |
| Paid | Payment has been successfully verified. |
| Failed | Payment attempt failed. |
| Refunded | Payment has been refunded. |
| Partially Refunded | Part of the payment has been refunded. |

### 8.4 Payment Business Rules

- Customers must see the amount before paying.
- The backend must calculate and validate the authoritative amount.
- The frontend must not be trusted to determine the final payable amount.
- Each payment must have a unique transaction reference.
- Gateway signatures or trusted notifications must be verified.
- Payment status must not be changed by ordinary users through direct API requests.
- Duplicate payment notifications must be handled idempotently.
- Failed payments must never be marked Paid.
- Refunds must be recorded against the relevant payment.
- Commission calculations must be traceable.
- Sensitive card information should be handled by the payment gateway, not stored by the application.

### 8.5 Recommended MVP Payment Model

For the first release:
1. Customer initiates an online test payment.
2. Backend verifies the gateway result.
3. Application records the payment.
4. Application calculates and records platform commission and provider earnings.
5. Super Admin can view payment records.
6. Provider can view earnings.

Recording provider earnings in the application does not mean that money has automatically been transferred to the provider. Automatic payouts can be a future enhancement.

## 9. Super Admin Workflow

### 9.1 Admin Operations

The Super Admin should be able to:
- Log in securely.
- View dashboard statistics.
- Manage users and account status.
- Review and approve or reject provider applications.
- Manage categories.
- Monitor service listings.
- View and filter all bookings.
- Monitor payment status and refunds.
- View commissions and provider earnings.
- Manage complaints and disputes.
- Manage coupons and subscription plans.
- Export business reports.

### 9.2 Provider Approval Workflow

1. Provider submits registration.
2. Provider uploads required documents.
3. Application receives Pending Verification status.
4. Admin reviews information and documents.
5. Admin approves or rejects the application.
6. The decision and reason are stored.
7. Provider receives a notification.
8. Approved provider can publish services.

### 9.3 Booking Monitoring Workflow

Admin should be able to:
- View all bookings.
- Filter by date and status.
- Search by booking reference.
- View relevant customer and provider information.
- View assigned technician.
- Monitor payment status.
- Review booking complaints.
- Intervene in disputes when permitted.

### 9.4 Financial Administration

Admin should be able to:
- View gross booking value.
- View successful payments.
- View failed payments.
- View refunds.
- View platform commission.
- View provider earnings.
- Export financial reports.

### 9.5 Complaint Management

Example: A customer reports that an AC repair was not completed correctly.

Admin should be able to:
1. Open the complaint.
2. Review the related booking.
3. Review customer feedback and evidence.
4. Review the provider's response.
5. Request additional information if needed.
6. Record a resolution.
7. Close the complaint.

The resolution, responsible administrator, and relevant timestamps should be retained.

## 10. Non-Functional Requirements

Non-functional requirements describe how well the application should operate.

### 10.1 Performance

- **NFR-PER-01:** Normal API requests should target a response time of approximately two seconds under expected load.
- **NFR-PER-02:** Dashboard pages should load efficiently.
- **NFR-PER-03:** Database queries should use suitable indexes.
- **NFR-PER-04:** Large result lists should use pagination.
- **NFR-PER-05:** Images should be optimized for display.
- **NFR-PER-06:** Booking creation should prevent duplicate submissions.

These are initial targets and must be validated through performance testing.

### 10.2 Security

- **NFR-SEC-01:** Passwords must be hashed using bcrypt or Argon2.
- **NFR-SEC-02:** JWTs must be handled securely, with suitable expiry and validation.
- **NFR-SEC-03:** Role-based access control must be enforced by the backend.
- **NFR-SEC-04:** Users must only access records they are authorized to view.
- **NFR-SEC-05:** Incoming API data must be validated.
- **NFR-SEC-06:** SQL injection must be prevented through parameterized ORM queries.
- **NFR-SEC-07:** API keys and secrets must be stored in environment variables or an appropriate secret manager.
- **NFR-SEC-08:** Production communication must use HTTPS.
- **NFR-SEC-09:** Uploaded files must have type and size validation.
- **NFR-SEC-10:** Payment gateway callbacks and webhooks must be verified.
- **NFR-SEC-11:** Sensitive endpoints should use rate limiting.
- **NFR-SEC-12:** Security-related events should be logged.
- **NFR-SEC-13:** Sensitive documents must have restricted access.
- **NFR-SEC-14:** Password reset and account recovery must use secure verification.

### 10.3 Usability

- The interface should be beginner-friendly.
- Navigation should be consistent.
- Forms should display clear validation errors.
- Buttons should have meaningful labels.
- Important actions should provide confirmation or feedback.
- Dashboards should be consistent across roles.
- The booking process should avoid unnecessary steps.

### 10.4 Reliability

- Unexpected errors should be handled without exposing sensitive information.
- Database transactions should protect important multi-step operations.
- Failed operations should not leave inconsistent booking or payment records.
- Duplicate payment notifications should be safe to process.
- Regular database backups should be maintained.
- Application errors should be logged for investigation.

### 10.5 Scalability

- Backend modules should have clear responsibilities.
- Database relationships should support multiple providers.
- The system should support increasing users and bookings.
- Images should use external file storage.
- APIs and infrastructure should be designed to allow future scaling.

### 10.6 Maintainability

- Code should follow consistent naming conventions.
- Frontend components should be reusable.
- Backend routes, schemas, models, and business logic should be organized.
- Database models should be documented.
- APIs should have clear documentation.
- Git should be used for version control.
- Environment-specific settings should be separated from source code.

### 10.7 Compatibility

- The application should support modern Chrome, Edge, and Firefox browsers.
- The interface should be responsive on desktop, tablet, and mobile screens.
- The application should support modern JavaScript-enabled browsers.

### 10.8 Privacy and Data Handling

- Customers' personal information must not be exposed to unrelated users.
- Providers should only access customer information relevant to their bookings.
- Technicians should only access information necessary for assigned jobs.
- Payment card data should be handled by the payment gateway.
- Identity documents must have restricted access.
- Data retention, account deletion, and privacy policies must be defined before production launch.

## 11. Database Requirements

MySQL will store the platform's data. SQLAlchemy will be used for database access.

### 11.1 Proposed Logical Entities

| No. | Entity / Table | Purpose |
|---:|---|---|
| 1 | users | Common account and login information |
| 2 | customer_profiles | Customer-specific details |
| 3 | provider_profiles | Provider business information |
| 4 | technician_profiles | Technician-specific information |
| 5 | provider_documents | References to verification documents |
| 6 | service_categories | Service categories |
| 7 | services | Provider service listings |
| 8 | service_areas | Supported service locations |
| 9 | provider_availability | Working hours and availability |
| 10 | addresses | Customer service addresses |
| 11 | bookings | Customer booking records |
| 12 | booking_images | Booking-related image references |
| 13 | booking_status_history | Booking status changes |
| 14 | technician_assignments | Technician job assignments |
| 15 | payments | Payment transaction records |
| 16 | refunds | Refund information |
| 17 | commissions | Platform commission records |
| 18 | reviews | Customer ratings and feedback |
| 19 | complaints | Customer complaints and resolutions |
| 20 | notifications | User notifications |
| 21 | coupons | Promotional offers |
| 22 | subscription_plans | Provider subscription plans |
| 23 | provider_subscriptions | Provider subscription records |

This is a logical starting point, not a final physical schema. Some entities may be combined or split during detailed database design. For example, a separate `technicians` table may not be needed if `technician_profiles` already represents technician accounts.

### 11.2 Important Relationships

1. One customer can create multiple bookings.
2. One provider can offer multiple services.
3. One category can contain multiple services.
4. One service can receive multiple bookings.
5. One booking belongs to one customer.
6. One booking belongs to one selected provider and service.
7. One booking may have multiple assignment records over time if reassignment is supported.
8. One booking may have multiple payment attempts.
9. One completed booking may have an eligible customer review.
10. One provider can manage multiple technicians.

### 11.3 Data Design Rules

- Important tables should have primary keys.
- Foreign keys should enforce relationships.
- Important records should include `created_at` and `updated_at` where appropriate.
- Booking and payment history should be retained.
- Monetary values should use decimal data types, not floating-point types.
- Booking references should be unique.
- Sensitive documents should be stored as protected file references.
- Financial records should be auditable.
- Booking creation and slot reservation should use safe transaction and concurrency controls.

## 12. API Requirements

The frontend and backend will communicate through REST APIs.

### 12.1 Proposed API Groups

| API group | Example endpoint | Purpose |
|---|---|---|
| Authentication | `POST /api/v1/auth/register` | Register a user |
| Authentication | `POST /api/v1/auth/login` | Authenticate a user |
| Authentication | `POST /api/v1/auth/refresh` | Refresh an access token, if implemented |
| Users | `GET /api/v1/users/me` | View own profile |
| Users | `PUT /api/v1/users/me` | Update own profile |
| Categories | `GET /api/v1/categories` | List categories |
| Services | `GET /api/v1/services` | Browse services |
| Services | `POST /api/v1/services` | Create a service listing |
| Providers | `POST /api/v1/providers/register` | Submit provider registration |
| Providers | `PATCH /api/v1/admin/providers/{id}/approve` | Approve a provider |
| Bookings | `POST /api/v1/bookings` | Create a booking |
| Bookings | `GET /api/v1/bookings` | List authorized bookings |
| Bookings | `PATCH /api/v1/bookings/{id}/status` | Change booking status |
| Assignments | `POST /api/v1/bookings/{id}/assign` | Assign a technician |
| Payments | `POST /api/v1/payments/create-order` | Create a payment order |
| Payments | `POST /api/v1/payments/verify` | Verify a payment |
| Reviews | `POST /api/v1/reviews` | Submit a review |
| Complaints | `POST /api/v1/complaints` | Submit a complaint |
| Notifications | `GET /api/v1/notifications` | View notifications |

These are proposed endpoint names. The final API contract must define request fields, response schemas, authentication requirements, permissions, validation, and error behavior.

### 12.2 HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication required or invalid |
| 403 | Permission denied |
| 404 | Resource not found |
| 409 | Conflict, such as an unavailable slot |
| 422 | Input validation failed |
| 500 | Internal server error |

## 13. MVP Requirements

### 13.1 MVP Definition

MVP means Minimum Viable Product: the smallest useful release that demonstrates the core business workflow. The first release should prioritize a working booking process over advanced features.

### 13.2 MVP Feature List

| Module | MVP features |
|---|---|
| Authentication | Registration, login, JWT, role-based access |
| Customer | Profile, browse services, create bookings, booking history |
| Provider | Registration, verification, service listings, pricing, booking management |
| Technician | Login, assigned jobs, job status updates |
| Admin | Dashboard, user management, provider approval, categories, booking monitoring |
| Booking | Create, accept, reject, assign technician, complete, cancel |
| Payment | Razorpay test payment, payment verification, transaction records |
| Reviews | Customer ratings and reviews |
| Notifications | Basic in-app notifications |
| Dashboards | Basic statistics for each role |

### 13.3 Future Enhancements

- Live technician GPS tracking.
- AI-based service recommendations.
- Advanced analytics.
- Automated subscription billing.
- Automatic provider payouts.
- Android and iOS applications.
- Referral programs and advanced coupons.
- Real-time customer-provider chat.
- Route optimization.

### 13.4 MVP Completion Criteria

The MVP should be considered functionally complete when all of the following work end to end:

1. Super Admin can log in.
2. Customer can register and log in.
3. Provider can register and submit verification documents.
4. Super Admin can approve the provider.
5. Approved provider can create service listings.
6. Customer can browse and select a service.
7. Customer can create a booking with date, time, and address.
8. Provider can accept or reject the booking.
9. Provider can assign a technician.
10. Technician can view the assigned booking.
11. Technician can start and complete the service.
12. Customer can make a test payment.
13. Backend can verify the payment.
14. Admin can view booking and payment records.
15. Customer can submit an eligible review.
16. All roles are restricted to their authorized data.

## 14. Development Phases

| Phase | Activity | Expected output |
|---|---|---|
| 1 | Requirement analysis and planning | Approved SRS and backlog |
| 2 | UI/UX design | Screens and navigation flow |
| 3 | Database design | Schema and ER diagram |
| 4 | Backend development | FastAPI APIs and business logic |
| 5 | Frontend development | React pages and dashboards |
| 6 | Integration | Frontend connected to backend |
| 7 | Payment integration | Razorpay test payments |
| 8 | Testing and security | Test reports and security checks |
| 9 | Version control and documentation | GitHub repository and project documentation |
| 10 | Deployment | Live application and backend |

### 14.1 Recommended Implementation Order

1. Project setup and configuration.
2. Authentication and authorization.
3. User profiles and role-specific dashboards.
4. Provider registration, documents, and approval.
5. Categories and service listings.
6. Provider availability and booking creation.
7. Booking status transitions.
8. Technician management and assignments.
9. Payment integration and commission records.
10. Reviews and notifications.
11. Testing, security review, and deployment.

## 15. Testing Requirements

### 15.1 Unit Testing

Test individual functions and components, including:
- Commission calculation.
- Booking price calculation.
- Password validation.
- Booking status transitions.
- Availability calculations.

### 15.2 API Testing

Use Postman or an equivalent tool to test:
- Valid and invalid login.
- Customer access to admin APIs.
- Provider service creation.
- Customer booking creation.
- Technician access to unassigned bookings.
- Payment verification.
- Invalid request payloads and expected error codes.

### 15.3 Integration Testing

Test that:
- React communicates correctly with FastAPI.
- FastAPI communicates correctly with MySQL.
- Booking creation is stored correctly.
- Payment gateway integration works in test mode.
- File uploads work and enforce restrictions.
- Notifications are generated for important events.

### 15.4 End-to-End Testing

Test the full journey:

Customer registration → Login → Service search → Booking → Provider acceptance → Technician assignment → Service completion → Payment → Review.

### 15.5 Security Testing

- Verify role-based permissions.
- Verify record ownership checks.
- Test JWT expiration and invalid tokens.
- Test invalid payment signatures.
- Test file upload validation.
- Test duplicate booking prevention.
- Test customer and provider data isolation.

**Recommended tools:** Pytest, Postman, and Playwright.

## 16. Risks and Mitigations

| Risk | Potential impact | Recommended mitigation |
|---|---|---|
| Unauthorized access | Exposure of private data | Backend RBAC and ownership checks |
| Double booking | Scheduling conflicts | Transactional booking and availability validation |
| Payment verification failure | Incorrect financial records | Gateway signature and webhook verification |
| Provider document misuse | Privacy and security risk | Restricted document access |
| Incorrect commission | Financial disputes | Centralized, auditable commission calculation |
| Technician scheduling conflicts | Missed or delayed jobs | Assignment and availability validation |
| Database inconsistency | Incorrect application state | Foreign keys and database transactions |
| Poor performance | Slow user experience | Indexing, pagination, and load testing |
| Image storage problems | Missing or exposed files | Managed storage and upload validation |
| Notification failure | Poor communication | Notification logs and retry strategy |

## 17. Business Rules

| ID | Rule |
|---|---|
| BR-01 | A customer must be authenticated before creating a booking. |
| BR-02 | Only approved providers can publish services. |
| BR-03 | A service must belong to an active category. |
| BR-04 | A booking must reference a valid customer, service, and provider. |
| BR-05 | A booking must use an available appointment slot. |
| BR-06 | A provider can manage only its own services and technicians. |
| BR-07 | A technician can update only assigned jobs. |
| BR-08 | A customer can view only their own bookings and payment records. |
| BR-09 | Booking status changes must follow permitted transitions. |
| BR-10 | Payment status can be updated only after trusted payment verification. |
| BR-11 | Commission must follow the platform's configured rules. |
| BR-12 | Only eligible completed bookings can receive customer reviews. |
| BR-13 | Important booking status changes must be recorded. |
| BR-14 | Important administrator actions should be auditable. |
| BR-15 | Rejected or cancelled bookings must not be counted as completed revenue. |
| BR-16 | Price changes to a service listing must not silently change an existing booking's agreed price. |

## 18. Open Business Decisions

These questions must be resolved by the business owner before the affected features are finalized. The recommendations below are starting points, not confirmed policies.

| No. | Open question | Suggested starting point |
|---:|---|---|
| 1 | Can one user have multiple roles? | One primary role per account for MVP |
| 2 | Who registers technicians? | Service Provider |
| 3 | When is payment collected? | Choose a defined stage, such as at booking or after service |
| 4 | Can customers pay after service completion? | Decide before implementing payment rules |
| 5 | What happens when a provider rejects a booking? | Notify customer and release the slot |
| 6 | Can customers cancel after technician assignment? | Define a cancellation policy |
| 7 | Can providers change service prices? | Yes, but preserve existing booking prices |
| 8 | Can technicians work for multiple providers? | No for the initial version |
| 9 | How is commission calculated? | Configurable percentage or fixed amount |
| 10 | Who approves refunds? | Super Admin for the initial version |
| 11 | How are provider payouts handled? | Manual settlement initially |
| 12 | Are provider subscriptions part of MVP? | Defer until core booking works |
| 13 | How long can a provider take to respond? | Define a booking request expiry period |
| 14 | What happens if a technician does not arrive? | Define provider/admin escalation |
| 15 | Are services fixed-price or inspection-based? | Start with fixed price and define extra charges separately |
| 16 | What is the cancellation and refund policy? | Obtain business approval and communicate it before booking |
| 17 | What happens if payment succeeds but booking creation fails? | Define reconciliation and recovery behavior |
| 18 | What is the time zone and appointment-slot policy? | Use the service location's local time and define slot duration |

## 19. Project Deliverables

| No. | Deliverable | Description |
|---:|---|---|
| 1 | SRS document | Software requirements |
| 2 | UI/UX design | Dashboard and user interface designs |
| 3 | Database ER diagram | Database relationships |
| 4 | Database schema | Tables and field definitions |
| 5 | Backend application | FastAPI source code |
| 6 | Frontend application | React source code |
| 7 | API documentation | Endpoint documentation |
| 8 | Testing documentation | Test cases and reports |
| 9 | Security checklist | Security implementation verification |
| 10 | GitHub repository | Version-controlled project |
| 11 | Deployment | Live application and backend |
| 12 | Final documentation | Setup and usage instructions |
| 13 | Presentation | Final project demonstration |

## 20. Final Project Summary

The proposed Home Services Booking SaaS Platform will connect customers with verified home-service providers, simplify booking management, support technician assignments, and provide transparent payment tracking through a centralized application.

**Technology stack**
- Frontend: React.js and Tailwind CSS.
- Backend: Python FastAPI.
- Database: MySQL.
- ORM: SQLAlchemy.
- Authentication: JWT.
- Payment: Razorpay Test Mode.
- File storage: Cloudinary.

**Primary roles**
1. Super Admin.
2. Customer.
3. Service Provider.
4. Technician.

**Core MVP objective:** Deliver a working end-to-end service booking process with role-based access, provider approval, service listings, technician assignment, payment verification, and customer reviews.

## 21. Recommended Next SDLC Documents

After reviewing and approving this SRS, prepare the following documents in order:

1. **Database Design Document:** Tables, columns, data types, primary keys, foreign keys, constraints, and indexes.
2. **ER Diagram:** Visual representation of database relationships.
3. **UI/UX Design Document:** Pages, layouts, dashboards, forms, and navigation for all four roles.
4. **API Specification Document:** FastAPI endpoints, request bodies, responses, permissions, and error codes.
5. **Development Task Breakdown:** Modules, user stories, acceptance criteria, tasks, dependencies, and milestones.

**Recommendation:** Do not begin full application development until the business decisions affecting booking, cancellation, payment, refunds, and provider payouts are agreed. The next technical planning step should be the database design and ER diagram because the application depends heavily on relationships between customers, providers, services, bookings, technicians, and payments.

---

**End of Document**
