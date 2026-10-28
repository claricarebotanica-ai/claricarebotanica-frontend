# ClariCare frontend

A customer-facing ClariCare website and separate company workspace built with Vite.

The public website has separate Home, About us, Our products, Contact us and Updates pages. The product page reads the current catalog from the backend; Updates lists the newest catalog additions and shows an empty state when the catalog has no products.

## Run locally

1. Install Node.js LTS from [nodejs.org](https://nodejs.org/) if `node` and `npm` are not recognized, then reopen PowerShell.
2. Install frontend dependencies with `npm.cmd install`.
3. Start the frontend with `npm.cmd run dev` and open the URL Vite prints (normally `http://localhost:5173`).
4. The frontend connects to the deployed ClariCare backend at `https://claricarebotanica-backend.onrender.com/api`.

The frontend server does not start the backend. Features report API errors when the backend is unreachable.

Open `http://localhost:5173/employee` for employee sign-in or `http://localhost:5173/referrer` for referrer sign-in. Employee and referrer portal links are available on the sign-in screens. The longer `/employee-login` and `/referrer-login` routes remain available too.

## Features supported by the current backend

- Public product catalog with product-detail quick views, manually entered product brands, measurement/price options, usage instructions, ingredients, and benefits. Customers can choose an option, keep it with the matching price in their cart, and view the ClariCare delivery and returns policy.
- ClariCare Chatbot answers common product, delivery, returns, service, and contact questions using published site details and the live product catalog. It does not use an external AI provider or invent medical advice; unknown product details are referred to the team.
- User registration/login, department and position creation, admin-assigned agreements, drawn electronic signatures, typed signer names, explicit consent, and signed-agreement records. Referrers review and sign the referral agreement before their invitation activates. Admins can assign the supplied employee team-participation template; employees fill in the effective date, role, and vesting start date before signing. The employee's typed signing name fills the team-member name, and the digital signature/timestamp replaces separate CEO and witness signature blocks.
- Admin-managed company structure with seeded ClariCare departments and internal role titles. Admins can add departments and positions, mark a position as an open public vacancy if desired, and must assign each employee invitation to a matching department and internal position. The assignment is shown on the invitation and employee dashboard; the initial structure is a practical starting point and can be extended by administrators.
- Applicant recruitment portal at `/applicant-login` and `/applicant`: applicants can register, sign in, submit detailed applications with a required CV/résumé upload, and view their application status history. The application is saved as a draft before the CV is uploaded and submitted. Administrators can review applications, update progress using backend-supported statuses, and send a note with the status email. Admins can enable or disable the Foundational Team application track; the track is presented as conditional and not guaranteed ownership. Applicant submission and status emails require SMTP configuration; the API reports whether each notification was sent.
- Contact form message and callback-request submission, recorded through `POST /api/customers/messages`.
- Admin inventory and production workspace for material stock and purchases, equipment assets and depreciation, product formulas, batch costing, production records, and expenses. These protected accounting endpoints record figures in KES.
- Legacy ingredient-purchase records through `POST /api/accounting/ingredients/purchases`; the frontend converts total purchase cost to the backend's required `unitCost`.
- Sales records and summary through `POST /api/accounting/sales` and `GET /api/accounting/summary`. Trend data is grouped into daily, weekly or monthly chart bars in the browser. The backend does not specify a currency or payment settlement status.
- A local-only product price estimate using manually entered batch costs. This estimate is separate from saved inventory formulas/costing and does not update a catalog product price.
- Manual referral records through `POST /api/referrals`; the backend returns a 5% commission calculation.
- Recent customer-message view for employee accounts through `GET /api/dashboard/employee`. Admin dashboard provides only a message count, not message contents.
- Role-specific dashboard views for admin, employee, customer and referrer accounts through their protected dashboard endpoints. Signed-in non-admin roles only see their dashboard and account page in the workspace; admins retain the full workspace navigation.
- Referrer dashboard showing only that user's referral records and backend-calculated totals for referrals, sales and commission.

## Implemented API routes used here

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/company/structure`, `POST /api/company/departments`, `POST /api/recruitment/positions`
- `GET /api/recruitment/settings`, `PATCH /api/recruitment/settings`, `GET /api/recruitment/positions`, `POST /api/recruitment/applications`, `POST /api/recruitment/applications/:id/documents`, `POST /api/recruitment/applications/:id/submit`, `GET /api/recruitment/applications`, `PATCH /api/recruitment/applications/:id`, `GET /api/dashboard/applicant`
- `POST /api/agreements`, `GET /api/agreements/:id`, `GET /api/agreements/mine`, `POST /api/agreements/:id/sign`
- `GET /api/auth/invitation`, `POST /api/auth/accept-invitation`
- `GET /api/catalog/products`, `POST /api/catalog/products`
- `GET /api/catalog/products/:productId`
- `POST /api/cart/add`, `GET /api/cart`, `DELETE /api/cart/items/:itemId`, `POST /api/cart/checkout`
- `POST /api/customers/messages`
- `POST /api/accounting/ingredients/purchases`
- `POST /api/accounting/sales`, `GET /api/accounting/summary`
- `POST /api/accounting/materials`, `GET /api/accounting/inventory`, `POST /api/accounting/materials/:materialId/purchases`
- `GET /api/accounting/equipment`, `POST /api/accounting/equipment`, `PATCH /api/accounting/equipment/:id`, `DELETE /api/accounting/equipment/:id`
- `POST /api/accounting/products/:productId/formulas`, `GET /api/accounting/products/:productId/costing`
- `GET /api/accounting/production`, `POST /api/accounting/production`, `POST /api/accounting/expenses`
- `POST /api/referrals`
- `GET /api/dashboard/admin`, `GET /api/dashboard/employee`, `GET /api/dashboard/customer`, `GET /api/dashboard/referrer`

The backend also provides interview question management, interview invitations and recording endpoints, private HR notes, and application-document access URLs. Those recruitment interview/review features are not yet exposed in this frontend.

## Not supported by the current backend

There is no payment-provider integration or automated WhatsApp ordering. The delivery and returns policy is presented by the frontend and does not provide courier tracking or order-status management. The employee equity/contribution agreement is the supplied business draft, not legal advice; it should be reviewed by qualified Kenyan counsel before use. Referrer terms describe the agreed 5% commission and seven-day attribution window, but automated referral-code attribution and commission payouts are not yet implemented. Other unsupported features include live message threads or replies; automatic updates to a product's catalog selling price from its cost formula; currency conversion; referral-code/link generation, attribution, eligibility enforcement, or payouts. The manual referral endpoint accepts a provided sale amount and timestamp and calculates 5%, but does not enforce the attribution window, verify payment, or settle payouts.

Dashboard endpoints require a Bearer token and backend role authorization. Other current write routes, including sales and referrals, do not enforce equivalent role authorization on the server; hiding controls in the frontend is not a security boundary.
