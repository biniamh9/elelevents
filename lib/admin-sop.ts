export type AdminSopStage = {
  title: string;
  crmStatus: string;
  adminScreen: string;
  purpose: string;
  adminSteps: string[];
  checklist: string[];
  screenshotPlaceholder: string;
};

export const adminSopWorkflowStages: AdminSopStage[] = [
  {
    title: "New Inquiry",
    crmStatus: "New Inquiry",
    adminScreen: "Dashboard Overview / Leads & Inquiries",
    purpose: "Capture the request, confirm contact details, and assign the first next step.",
    adminSteps: [
      "Open the new inquiry from Overview or Leads / Inquiries.",
      "Confirm customer name, event type, event date, guest count, venue, and requested services.",
      "Review inspiration uploads, consultation preference, and investment range.",
      "Assign the owner or team member responsible for follow-up.",
      "Set the next action and initial follow-up date.",
    ],
    checklist: [
      "Inquiry data is complete enough to contact the client.",
      "Owner is assigned.",
      "Next action is set.",
      "Any missing details are noted for follow-up.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: New inquiry record in Leads / Inquiries.",
  },
  {
    title: "Consultation Scheduled",
    crmStatus: "Consultation Scheduled",
    adminScreen: "Inquiry Detail / Calendar",
    purpose: "Lock the consultation plan so the team can move from intake to discovery.",
    adminSteps: [
      "Set consultation date, time, type, and meeting location.",
      "Send the consultation confirmation email.",
      "Add agenda notes and any known design priorities.",
      "Verify the event date does not conflict with a confirmed booking risk.",
    ],
    checklist: [
      "Consultation date and type are saved.",
      "Client confirmation was sent.",
      "Calendar entry is visible.",
      "Design agenda or discovery notes are attached.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Consultation details on inquiry detail and calendar.",
  },
  {
    title: "Quote Sent",
    crmStatus: "Quote Sent",
    adminScreen: "Sales / Quotes / CRM Lead Detail",
    purpose: "Move the opportunity into a formal proposal stage with clear pricing and scope.",
    adminSteps: [
      "Create or revise the quote from the inquiry or CRM hub.",
      "Confirm line items, rentals, delivery/setup fees, discounts, and deposit expectations.",
      "Generate the client-facing PDF and send it.",
      "Log the follow-up date and expected reply window.",
    ],
    checklist: [
      "Quote is itemized and accurate.",
      "Deposit amount is defined.",
      "Quote status is marked sent.",
      "Follow-up reminder is scheduled.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Quote workspace, PDF preview, and CRM sales record.",
  },
  {
    title: "Contract Sent",
    crmStatus: "Contract Sent",
    adminScreen: "Sales / Contracts",
    purpose: "Convert the approved quote into a contractual agreement and expected payment structure.",
    adminSteps: [
      "Create the contract from the inquiry or approved quote.",
      "Confirm contract total, deposit amount, balance due, and due dates.",
      "Send the contract for signature or upload the signed draft manually if needed.",
      "Set the next action for signature follow-up.",
    ],
    checklist: [
      "Contract amount matches the approved scope.",
      "Deposit due is defined.",
      "Contract status is sent.",
      "Signature follow-up is scheduled.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Contract detail with send action and payment structure.",
  },
  {
    title: "Contract Signed",
    crmStatus: "Contract Signed",
    adminScreen: "Sales / Contracts / CRM Customer Hub",
    purpose: "Confirm the event is legally approved and ready for deposit collection.",
    adminSteps: [
      "Mark the contract signed or confirm the signature sync.",
      "Verify signed date and file attachment.",
      "Review deposit due date and receipt plan.",
      "Advance the CRM stage and notify the owner if a payment reminder is next.",
    ],
    checklist: [
      "Signed date is saved.",
      "Executed contract file is accessible.",
      "Deposit obligation is visible in Finance.",
      "CRM stage is updated.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Signed contract status and customer financials tab.",
  },
  {
    title: "Deposit Paid",
    crmStatus: "Deposit Paid",
    adminScreen: "Finance / Contracts / CRM Customer Hub",
    purpose: "Confirm actual cash collection and secure the booking.",
    adminSteps: [
      "Use Record Deposit from Finance or the contract detail page.",
      "Enter payment method, paid date, and notes.",
      "Generate or send the receipt if needed.",
      "Confirm contract deposit state and CRM stage sync.",
    ],
    checklist: [
      "Deposit payment is marked paid.",
      "Receipt exists or is ready to send.",
      "Outstanding balance updates correctly.",
      "Booking stage advances to reserved/booked.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Deposit action in Finance and paid state on contract.",
  },
  {
    title: "Event Reserved",
    crmStatus: "Event Reserved",
    adminScreen: "Events / Projects / Calendar",
    purpose: "Protect the date and move from sales into confirmed event execution.",
    adminSteps: [
      "Open the event project record from CRM.",
      "Confirm reserved/confirmed booking state.",
      "Check the calendar for load warnings or overlapping event pressure.",
      "Attach internal setup, venue, and staffing context.",
    ],
    checklist: [
      "Event date is protected.",
      "Project record is linked to the customer and documents.",
      "Calendar reflects the booking.",
      "Operational notes are visible to the team.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Event project hub and booking entry on calendar.",
  },
  {
    title: "Planning In Progress",
    crmStatus: "Planning In Progress",
    adminScreen: "CRM Customer Hub / Events / Rentals",
    purpose: "Coordinate design decisions, rentals, files, and operational details before the event.",
    adminSteps: [
      "Track notes, inspiration, design revisions, and vendor needs in the project record.",
      "Confirm rental inventory availability and package selections.",
      "Upload updated files, layout notes, and client approvals.",
      "Keep the next action current so no planning item gets missed.",
    ],
    checklist: [
      "Design scope is current.",
      "Rental items are confirmed and available.",
      "Files and notes are organized in the customer/project hub.",
      "Next action is still current.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Customer timeline, files, and rental planning workflow.",
  },
  {
    title: "Final Payment Due",
    crmStatus: "Final Payment Due",
    adminScreen: "Finance / Sales / Customer Financials",
    purpose: "Collect the remaining balance before the event while keeping finance and CRM aligned.",
    adminSteps: [
      "Review the outstanding balance on the contract and invoice.",
      "Send the final payment reminder if needed.",
      "Record the final payment when cash is received.",
      "Issue the receipt and confirm the balance reaches zero.",
    ],
    checklist: [
      "Final invoice is accurate.",
      "Reminder has been sent if payment is still open.",
      "Payment status matches the actual cash state.",
      "Balance due is zero once paid.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Final balance tracking in Finance and customer financials.",
  },
  {
    title: "Completed",
    crmStatus: "Completed",
    adminScreen: "Events / Projects / CRM Customer Hub",
    purpose: "Close the event execution, capture outcomes, and preserve the customer record.",
    adminSteps: [
      "Mark the event completed after setup, breakdown, and billing are closed.",
      "Confirm receipts, final notes, and any refund or damage-deposit items.",
      "Upload final event files or approved gallery selections if applicable.",
      "Add follow-up or testimonial request tasks if needed.",
    ],
    checklist: [
      "Event status is completed.",
      "All payments and receipts are resolved.",
      "Final notes are saved.",
      "Follow-up actions are scheduled where relevant.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Completed event/project record with timeline closed out.",
  },
  {
    title: "Archived",
    crmStatus: "Archived",
    adminScreen: "CRM / Leads & Inquiries / Customer Hub",
    purpose: "Preserve history without cluttering active operations.",
    adminSteps: [
      "Archive the inquiry or customer-facing record when no active work remains.",
      "Confirm all documents, payments, and files remain linked and searchable.",
      "Use archive instead of hard delete whenever historical records matter.",
      "Only allow hard delete if related records are absent and the action is truly safe.",
    ],
    checklist: [
      "Record is hidden from active views.",
      "History remains accessible.",
      "Delete protections are respected.",
      "No active task or payment is left unresolved.",
    ],
    screenshotPlaceholder: "Screenshot placeholder: Archived record filter and preserved CRM history.",
  },
];

export const adminSopOverviewChecklist = [
  "Use Dashboard Overview for priorities, alerts, and recent activity only.",
  "Use CRM Pipeline as the source of truth for lifecycle status.",
  "Use the Customer Hub or Event Project as the durable operating record.",
  "Use Sales for quotes, invoices, receipts, contracts, and payments.",
  "Use Finance only for actual cash movement, expenses, and outstanding balances.",
];
