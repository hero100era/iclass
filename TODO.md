# maritime Vessel Certification System - Development Plan

## 1. System Architecture & Security
- [ ] **Row Level Security (RLS)**
    - [ ] Define RLS policies for `iclass` schema tables.
    - [ ] Ensure `employees` have full read/write access (or scoped by department).
    - [ ] Ensure `customers` can only read/write data related to their `company_id`.
- [ ] **API Security**
    - [ ] Expose secure views in `api` schema rather than direct table access where possible.
    - [ ] Implement secure functions for complex actions (e.g., `issue_certificate`, `approve_survey`) to encapsulate business logic.

## 2. Backend Development (Database & Logic)
- [ ] **Core Logic**
    - [ ] Create triggers/functions to automatically update `certificate_status` driven by `expiry_date`.
    - [ ] Implement logic to calculate `next_due_date` for surveys based on `last_held_date` and survey intervals (Annual, Intermediate, etc.).
- [ ] **Document Generation**
    - [ ] Implement a service (or Edge Function) to render certificates/reports using the templates stored in `certificate_templates` (RML/HTML).
    - [ ] Store generated documents (e.g., in S3 or blob storage) and link them to `certificates`.

## 3. Frontend Development (React/Remix)
- [ ] **Layout & Navigation**
    - [ ] Create a persistent "Dashboard Layout" with sidebar navigation.
    - [ ] Add role-based menu items (Admin vs Customer views).
- [ ] **Vessel Management**
    - [ ] `VesselList`: Searchable/Filterable table of ships.
    - [ ] `VesselDetail`: Comprehensive view showing particulars, owner info, status.
    - [ ] `VesselEdit`: Form to update vessel details (Validation with Zod).
- [ ] **Certificate Management**
    - [ ] `CertificateList`: Tab in Vessel Detail showing all certs.
    - [ ] `IssueCertificate`: Wizard-style form to issue a new cert (Select Template -> Fill Data -> Preview -> Issue).
- [ ] **Survey & Audit Management**
    - [ ] `SurveyDashboard`: Calendar/List view of upcoming/overdue surveys.
    - [ ] `SurveyReport`: Interface for surveyors to input findings/checklist items.
    - [ ] `DeficiencyTracker`: managing findings (Non-conformities, Observations).

## 4. User Experience & Design
- [ ] **Dashboard Widgets**
    - [ ] "Fleet Status" summary (Healthy, Overdue, Detained).
    - [ ] "Upcoming Surveys" list (Next 30/60/90 days).
- [ ] **Notifications**
    - [ ] In-app alerts for expiring certificates.
    - [ ] Email notifications (via external service) for critical deadlines.

## 5. Testing & Verification
- [ ] **Backend Tests**: pgTAP tests for RLS policies and stored procedures.
- [ ] **Frontend Tests**: Integration tests for critical flows (Issue Certificate, Vessel Registration).
