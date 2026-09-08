# Revenue Guardian

I am building a full-stack web application called "RecoverAI".

RecoverAI is an AI-powered Revenue Recovery and Customer Retention platform.

The purpose of the application is to help businesses identify customers at risk of losing revenue, analyze failed payments and churn risk, recommend recovery actions, track recovered revenue, and provide analytics and AI-generated insights.

IMPORTANT:

I already have a working React + Vite frontend and Node.js + Express backend.

DO NOT recreate the project from scratch.

WORK WITH THE EXISTING PROJECT.

Current structure:

ai-revenue-recovery/

│

├── frontend/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── App.css

│   │   └── main.jsx

│   ├── package.json

│   └── ...

│

└── backend/

    ├── server.js

    ├── database.js

    ├── recoverai.db

    ├── package.json

    └── ...

Technology:

Frontend:

- React

- Vite

- JavaScript/JSX

- CSS

- Lucide React icons

Backend:

- Node.js

- Express

- CORS

- better-sqlite3

Database:

- SQLite

DO NOT introduce TypeScript.

DO NOT introduce Tailwind unless absolutely necessary.

DO NOT replace React/Vite.

DO NOT replace SQLite.

DO NOT introduce Kubernetes.

Keep the architecture simple and suitable for a college/project demonstration.

==================================================

1. EXISTING VISUAL DESIGN

==================================================

The existing application already has a clean professional dashboard.

Maintain the current visual identity:

Application name:

RecoverAI

Theme:

- Light background

- White cards

- Blue primary accent

- Dark text

- Soft grey secondary text

- Rounded cards

- Subtle borders

- Minimal shadows

- Professional SaaS dashboard appearance

The sidebar should remain approximately like:

RecoverAI

MENU

Dashboard

Customers

Recovery

Analytics

AI TOOLS

AI Insights

Risk Detection

The top header should show:

- Current page title

- Short description

- Admin profile

- Administrator subtitle

Do not destroy the current design.

Improve it rather than replacing it.

==================================================

2. APPLICATION LAYOUT

==================================================

Create a reusable application layout.

Files should be organized approximately as:

frontend/src/

│

├── App.jsx

├── App.css

├── main.jsx

│

├── components/

│   ├── Sidebar.jsx

│   ├── Header.jsx

│   ├── MetricCard.jsx

│   ├── CustomerTable.jsx

│   ├── CustomerModal.jsx

│   ├── RecoveryCard.jsx

│   ├── RiskBadge.jsx

│   ├── ChartCard.jsx

│   ├── EmptyState.jsx

│   ├── LoadingSpinner.jsx

│   └── Notification.jsx

│

├── pages/

│   ├── Dashboard.jsx

│   ├── Customers.jsx

│   ├── Recovery.jsx

│   ├── Analytics.jsx

│   ├── AIInsights.jsx

│   └── RiskDetection.jsx

│

└── services/

    └── api.js

Backend:

backend/

│

├── server.js

├── database.js

│

├── routes/

│   ├── dashboardRoutes.js

│   ├── customerRoutes.js

│   ├── recoveryRoutes.js

│   ├── analyticsRoutes.js

│   ├── insightRoutes.js

│   └── riskRoutes.js

│

├── services/

│   ├── recoveryService.js

│   ├── analyticsService.js

│   ├── riskService.js

│   └── insightService.js

│

└── recoverai.db

If the current project is still mostly contained in App.jsx, gradually refactor it into these files without breaking functionality.

==================================================

3. DATABASE

==================================================

Use SQLite.

Create these tables:

customers

payments

recovery_actions

risk_scores

notifications

Customers table:

id

name

email

amount

status

risk

created_at

Payments table:

id

customer_id

amount

payment_date

payment_status

payment_method

failure_reason

Recovery actions table:

id

customer_id

action_type

status

amount_recovered

created_at

Risk scores table:

id

customer_id

risk_score

risk_level

reason

created_at

Notifications table:

id

title

message

type

read

created_at

Use foreign keys where appropriate.

Insert realistic sample data so the application looks populated immediately.

Do not use fake data directly inside React.

All customer/payment/recovery information must come from the backend/database.

==================================================

4. DASHBOARD

==================================================

The Dashboard is the main page.

Keep the existing four metric cards:

1. Revenue Recovered

2. Revenue at Risk

3. Recovery Rate

4. Customers Saved

These values must come from the backend.

Do NOT hard-code the values in React.

Backend endpoint:

GET /api/dashboard

Return:

revenueRecovered

revenueAtRisk

recoveryRate

customersSaved

Dashboard should show:

Metric cards.

Then:

AI Recovery Opportunities

Show cards such as:

HIGH

Failed subscription payments

AI detected customers whose recurring payments failed.

Amount at risk.

MEDIUM

Customers likely to churn

AI detected early signs of customer cancellation.

Amount at risk.

LOW

Payment method issues

Customers experiencing repeated payment problems.

Each recovery opportunity should have:

- Risk badge

- Title

- Description

- Amount

- View Customers button

"View Customers" should navigate to the Customers page and optionally apply a filter.

Add:

Revenue Recovery Trend

Use a clean chart showing:

- Date

- Revenue recovered

- Revenue at risk

Use a suitable React chart library only if already installed. If not, add a lightweight chart dependency.

Add:

Recent Recovery Activity

Show:

- Customer

- Action

- Amount

- Status

- Date

Add:

AI Summary

Example:

"RecoverAI detected 24 high-risk customers today. Automated payment retries could potentially recover ₹84,200."

The summary should be generated from actual database statistics, not permanently hard-coded.

==================================================

5. CUSTOMERS PAGE

==================================================

Sidebar button:

Customers

When clicked, show the Customers page.

Header:

Customers

"Monitor customers at risk of revenue loss."

Features:

Search customers.

Search by:

- name

- email

Filters:

- All

- High Risk

- Medium Risk

- Low Risk

- Failed Payment

- At Risk

- Active

Customer table columns:

Name

Email

Amount

Status

Risk

Actions

Each row should have:

View

Recover

View:

Open a customer details modal/page.

Customer details should show:

Name

Email

Total amount at risk

Risk level

Risk score

Payment history

Previous recovery actions

Failure reasons

Recover:

Open recovery action dialog.

==================================================

6. ADD CUSTOMER

==================================================

Keep the existing:

+ Add Customer

button.

Clicking it should open a professional modal/form.

Fields:

Name

Email

Amount

Status

Risk

Status options:

Failed Payment

At Risk

Active

Risk options:

High

Medium

Low

On submit:

React

→ POST /api/customers

→ Express

→ SQLite

Return the newly created customer.

Immediately update the table without requiring a page reload.

Validate:

- Required fields

- Valid email

- Positive amount

- Duplicate email prevention

Show friendly error messages.

==================================================

7. EDIT CUSTOMER

==================================================

Add:

Edit Customer

When clicked:

Open modal.

Allow changing:

Name

Email

Amount

Status

Risk

Backend:

PUT /api/customers/:id

Update SQLite.

Refresh the customer in the frontend.

==================================================

8. DELETE CUSTOMER

==================================================

Add a Delete option inside the customer details/actions menu.

Do NOT immediately delete.

Show confirmation:

"Are you sure you want to remove this customer?"

Buttons:

Cancel

Delete

Backend:

DELETE /api/customers/:id

Use proper error handling.

==================================================

9. RECOVERY PAGE

==================================================

Sidebar:

Recovery

Purpose:

Show customers who need recovery actions.

Top metrics:

Total At Risk

Potential Recovery

Recovered This Month

Recovery Success Rate

Sections:

Urgent Recovery

High-risk customers.

Suggested Actions

For each customer show:

Customer

Amount

Risk

Reason

Recommended Action

Actions:

Retry Payment

Send Reminder

Contact Customer

Mark as Recovered

==================================================

10. RECOVERY ACTION FLOW

==================================================

When user clicks:

Retry Payment

Do NOT actually charge a card.

This is a project simulation.

Create a recovery action record.

Example:

Action:

Payment Retry

Status:

Completed

Amount recovered:

Customer amount

Update:

customer status → Recovered

Create:

recovery_actions record.

Show notification:

"Payment recovery simulated successfully."

==================================================

11. SEND REMINDER

==================================================

When user clicks:

Send Reminder

This is also a simulation.

Open a dialog:

Send Payment Reminder

Choose:

Email Reminder

SMS Reminder

In-App Reminder

Message preview.

Button:

Send Reminder

After clicking:

Create recovery action.

Show:

"Reminder sent successfully."

Do not integrate real SMS/email providers unless explicitly requested.

==================================================

12. MARK AS RECOVERED

==================================================

When clicked:

Mark as Recovered

Update customer status.

Create recovery action.

Increase recovered revenue.

Update dashboard metrics.

Show success notification.

==================================================

13. ANALYTICS PAGE

==================================================

Sidebar:

Analytics

Show:

Revenue Recovery Overview

Charts:

Revenue Recovered Over Time

Revenue At Risk Over Time

Recovery Success Rate

Customer Risk Distribution

Payment Failure Reasons

Recovery Action Performance

Use real SQLite data.

Include filters:

7 Days

30 Days

90 Days

All Time

Analytics should be calculated by backend.

Example APIs:

GET /api/analytics/overview

GET /api/analytics/revenue

GET /api/analytics/risk

GET /api/analytics/recovery

==================================================

14. AI INSIGHTS PAGE

==================================================

Sidebar:

AI Insights

This page should feel like an AI analysis center.

Show:

AI Executive Summary

Example:

"RecoverAI analyzed 1,284 customer payment events and identified 84 customers with elevated revenue-loss risk."

Sections:

Revenue Risk Summary

Top Recovery Opportunities

Customer Behavior Patterns

Payment Failure Patterns

Recommended Actions

Potential Revenue Recovery

Use backend calculations.

If an AI API is configured, AI can generate natural-language summaries.

IMPORTANT:

The application must still work if the AI API is unavailable.

Implement fallback logic.

Do not make the entire application dependent on an external AI API.

==================================================

15. RISK DETECTION PAGE

==================================================

Sidebar:

Risk Detection

Purpose:

Identify customers who may cause future revenue loss.

Show:

Risk Overview

High Risk

Medium Risk

Low Risk

Customer risk table:

Customer

Risk Score

Risk Level

Amount at Risk

Reason

Recommended Action

Risk score should be calculated from available customer/payment data.

Example scoring logic:

Failed payment:

+40

Multiple failed payments:

+20

High amount:

+15

Recent payment failure:

+15

Repeated recovery failure:

+10

Maximum:

100

Risk levels:

0-30 = Low

31-60 = Medium

61-100 = High

The backend should calculate these scores.

Endpoint:

GET /api/risk/customers

==================================================

16. CUSTOMER RISK DETAILS

==================================================

When clicking a customer's risk score:

Show:

Risk Score:

82/100

Risk Level:

High

Reasons:

- Recent payment failure

- Multiple failed attempts

- High outstanding amount

Recommended actions:

1. Retry payment

2. Send reminder

3. Contact customer

Also show payment history.

==================================================

17. SEARCH

==================================================

Global/customer search should work properly.

Search should filter without breaking the UI.

Search fields:

Name

Email

Use case-insensitive matching.

==================================================

18. NOTIFICATIONS

==================================================

Add a small notification area.

Examples:

"Payment recovery successful."

"New high-risk customer detected."

"Reminder sent successfully."

"Customer added successfully."

Use temporary toast notifications.

Create:

components/Notification.jsx

==================================================

19. LOADING STATES

==================================================

Every API call should have a loading state.

Examples:

Loading customers...

Loading analytics...

Analyzing risk...

Fetching insights...

Do not leave blank white screens.

Use a simple spinner or skeleton.

==================================================

20. ERROR HANDLING

==================================================

If backend is unavailable:

Show:

"Unable to connect to RecoverAI server."

Do not crash the React application.

All fetch requests should use try/catch.

Backend should return useful HTTP status codes.

400:

Invalid request

404:

Not found

409:

Duplicate customer

500:

Server error

==================================================

21. API SERVICE

==================================================

Create:

frontend/src/services/api.js

Put API calls in this file instead of scattering fetch() everywhere.

Example:

const API_URL = "http://localhost:5000/api";

export async function getCustomers() {

    ...

}

export async function addCustomer(customer) {

    ...

}

export async function updateCustomer(id, customer) {

    ...

}

export async function deleteCustomer(id) {

    ...

}

export async function getDashboard() {

    ...

}

export async function getAnalytics() {

    ...

}

export async function getRiskCustomers() {

    ...

}

export async function getInsights() {

    ...

}

Use these functions from React pages/components.

==================================================

22. BACKEND API

==================================================

Implement:

GET /api/dashboard

GET /api/customers

GET /api/customers/:id

POST /api/customers

PUT /api/customers/:id

DELETE /api/customers/:id

GET /api/recovery

POST /api/recovery

POST /api/recovery/:customerId/retry

POST /api/recovery/:customerId/reminder

POST /api/recovery/:customerId/recovered

GET /api/analytics/overview

GET /api/analytics/revenue

GET /api/analytics/risk

GET /api/risk/customers

GET /api/insights

==================================================

23. FRONTEND NAVIGATION

==================================================

Sidebar buttons must actually work.

Dashboard:

Show dashboard.

Customers:

Show customers.

Recovery:

Show recovery management.

Analytics:

Show charts and reports.

AI Insights:

Show AI analysis.

Risk Detection:

Show risk scoring.

Do not allow buttons that visually look clickable but do nothing.

==================================================

24. VIEW CUSTOMERS BUTTON

==================================================

The Dashboard:

View Customers

button must work.

When clicked:

Navigate to Customers page.

Optionally automatically apply:

High Risk

filter.

==================================================

25. RESPONSIVE DESIGN

==================================================

The UI should work on:

Desktop

Laptop

Tablet

Sidebar should collapse appropriately on smaller screens.

Do not allow horizontal overflow.

Tables should become scrollable on small screens.

==================================================

26. PROFESSIONAL UI

==================================================

Maintain:

White cards

Soft grey background

Blue primary buttons

Rounded corners

Consistent spacing

Clean typography

Buttons:

Primary:

blue

Secondary:

white with border

Danger:

red only when necessary

Success:

green for successful recovery

Risk:

High:

red/pink badge

Medium:

orange/yellow badge

Low:

green badge

==================================================

27. SECURITY / DATA VALIDATION

==================================================

Never trust frontend input.

Validate all backend requests.

Use parameterized SQL queries.

Never concatenate user input directly into SQL.

Do not expose database internals to frontend.

Do not put secret API keys in React source code.

Use environment variables for secrets.

Create:

backend/.env

if necessary.

==================================================

28. SAMPLE DATA

==================================================

Seed realistic customers.

At least 10-20 customers.

Include different:

names

amounts

statuses

risk levels

payment failures

recovery actions

Do not make every customer high risk.

Create realistic variation.

==================================================

29. DEMO ACCOUNT

==================================================

Keep the current demo login functionality.

The application should open the dashboard after demo login.

Do not break the existing login screen.

Authentication can remain simulated for the project unless a real authentication system is explicitly requested.

==================================================

30. IMPORTANT CURRENT FUNCTIONALITY

==================================================

The existing application already has:

- RecoverAI branding

- Dashboard

- Customers

- Recovery

- Analytics

- AI Insights

- Risk Detection

- Demo login

- Dashboard metrics

- Customer search

- Customer API

- Dashboard API

- SQLite database

- Add customer backend API

Preserve all of these.

Do not remove working functionality.

==================================================

31. CODE QUALITY

==================================================

Use clean React components.

Avoid putting the entire application into one enormous App.jsx.

Separate reusable components.

Use meaningful variable names.

Avoid duplicated code.

Add comments only where they help.

Do not generate unnecessary complexity.

==================================================

32. TESTING REQUIREMENT

==================================================

After implementing each feature:

Check that:

1. Frontend starts with:

npm run dev

2. Backend starts with:

node server.js

3. Dashboard loads.

4. Customers load.

5. Customer search works.

6. Add Customer works.

7. New customer is saved in SQLite.

8. Refreshing the browser does not delete the customer.

9. Restarting backend does not delete the customer.

10. Dashboard still loads.

11. Recovery actions work.

12. Analytics loads.

13. Risk Detection loads.

14. AI Insights loads.

15. Navigation works.

==================================================

33. DO NOT BREAK EXISTING PROJECT

==================================================

Before changing code:

Inspect the existing files.

Do not blindly overwrite working files.

If a component already exists, improve it.

If functionality already exists, preserve it.

If a required dependency is missing, install it.

If there is an existing CSS class, reuse it where appropriate.

==================================================

34. FINAL EXPECTED APPLICATION

==================================================

The final RecoverAI application should feel like a real SaaS revenue recovery platform.

User flow:

LOGIN

 ↓

DASHBOARD

 ↓

See revenue metrics

 ↓

See AI recovery opportunities

 ↓

View Customers

 ↓

Filter high-risk customers

 ↓

Open customer

 ↓

View risk details

 ↓

Choose recovery action

 ↓

Retry payment / Send reminder / Mark recovered

 ↓

Store action in SQLite

 ↓

Update customer

 ↓

Update recovered revenue

 ↓

Update dashboard

 ↓

Analytics reflects the change

 ↓

AI Insights reflects updated data

The application should demonstrate a complete business workflow rather than being only a static UI.

==================================================

35. IMPLEMENTATION INSTRUCTIONS

==================================================

First inspect the existing project structure.

Then implement the application in logical stages.

Do not output huge explanations.

Tell me which files you are changing.

For each changed file, provide the complete final code if necessary.

Do not leave TODO placeholders.

Do not create fake buttons.

Every visible button must perform an actual action.

Every API must connect to SQLite where appropriate.

Every page must be functional.

At the end, provide:

1. List of files created

2. List of files modified

3. npm packages required

4. Commands to run backend

5. Commands to run frontend

6. API endpoints

7. Database tables

8. Testing checklist

Most importantly:

DO NOT destroy my existing RecoverAI GUI.

Build on top of it.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://claim-ai-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f244c801-83a7-4b0f-96bc-ff7f3319921c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
