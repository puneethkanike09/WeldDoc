transcript of the meeting : 

NotesVendor Qualification and Welder Certification Process

The meeting focused on defining a detailed vendor qualification and welder certification workflow based on ISO and other standards.





Structured Welder Qualification Plan Established (00:24)



The qualification document auto-generates a unique report number daily, e.g., 142 on January 5, incrementing sequentially.

Key data includes welder name, ID, welding process type (limited to five to six key processes initially), and joint types such as butt weld (BW) and fillet weld (FW).

Each qualification plan spans two pages covering separate joint types with material and procedure (WPS) details.

A checklist includes visual testing, radiography, and ultrasonic testing with remarks, signed by the manufacturer and third-party examiner (TV India).

Certification complies with EN ISO 9606-1:2017, with updates every three years as per standard revisions.







Certification Lifecycle and Revalidation Procedures (16:57)



The welder qualification certificate is valid for two years with mandatory six-monthly validations (up to four times within two years).

Renewal requires submitting welding reports before the six-month expiry, with approval and stamping by the original examiner.

After two years, renewal at the government level extends certification by another two years, allowing up to four years of certified welding without retesting.

Three revalidation methods from the standard were discussed: 9.3A, 9.3B (company’s choice), and 9.3C for ISO 3834-certified companies, each defining different expiry and renewal rules.







Certificate Generation and Data Handling Requirements (45:39)



Welder registration form collects around 15–16 data variables to generate certificates, QR codes, and ID cards.

QR codes link directly to the welder’s certificate or ID card, with options for companies to control what is shown.

The certificate includes company logo and manufacturer details, adaptable for resale to other companies.

Expiry tracking includes email reminders sent one week before expiry dates to ensure timely renewals.







Master List and Statistical Reporting Needs (47:19)



A master Excel sheet consolidates all welder data with filters for processes, joint types, and qualification ranges.

Statistical summaries with visual charts will show vendor counts, welder counts by process, and other key metrics on a dashboard.

The system should support filtering data by date or process for customer reporting and internal tracking.







Product Development Roadmap and Standards Integration

The software development will focus initially on one standard before expanding to others, with a clear phased delivery plan.





Initial Focus on ISO 9606 Standard for MVP (55:54)



The first development phase targets ISO 9606 certification workflows exclusively for initial market entry.

Deliverables include welder registration, QR code generation, certificate and ID card creation, expiry tracking, master list and statistics generation.

Ram Korada emphasized starting with this single standard for clarity and faster market readiness.

Subsequent modules will cover other standards like ASME and AWS, with welding procedure qualification (WPS) as a second module.







Competitive Market Analysis to Inform Product Design (33:40)



Competitor research includes three key players: Weld I, Weld Trace, and Weld Note, with TWI excluded as they do not sell software.

The team will study competitor websites and product videos to identify features and UI/UX strengths.

Ram aims to offer a competitive, feature-rich solution at a lower price tailored to the Indian market.

The product name “Weld Doc” was chosen to resonate with welding documentation and management.







Phased Delivery and Customer Demo Preparation (50:43)



A demo version covering only the ISO 9606 standard will be created first to present to customers.

Subsequent releases will add other standards and features incrementally.

Initial delivery will include core functionalities to validate feasibility and gather customer feedback.







UX and Branding Considerations Discussed (01:02:28)



Hariprasad requested a sleek, Apple-like design for the user experience.

Domain name registration for “Welldoc.in” or similar is planned but not yet secured; it may take up to a week.

Further UX design discussions are planned, with potential involvement of a UX expert named C for guidance.

Hariprasad will provide branding assets like logo and color schemes soon.







Technical and Functional Specifications

The team outlined specific technical details and system requirements needed to implement the welding management software effectively.





Data Entry and Automation Requirements (11:31)



All qualification data including process types, joint types, materials, and procedures will be entered via dropdowns and tables to reduce errors.

Qualification ranges and standards clauses will be captured automatically from standards documents, potentially via AI-assisted extraction.

Ram will provide standard documents in PDF to enable AI parsing of qualification ranges and grouping numbers.

Variables such as material group, filler material, and joint position will be configurable for each welder entry.







Certificate and QR Code Generation (14:13)



Upon welder registration, a unique QR code and personal ID number will be created.

The QR code links to dynamically generated certificates and ID cards, selectable by the company for visibility preferences.

Certificates and ID cards must include welder photo, registration number, and expiry validation info.

The system will support uploading existing certificates for welders with prior qualification data.







Expiry and Notification System (46:02)



The software will track multiple expiry types: six-month validations, two-year certifications, and four-year renewals.

Automated email reminders will be sent one week prior to expiry to the relevant stakeholders.

System will allow manual entry of renewal reports and experience certificates to extend qualification validity.

All expiry and revalidation data will be logged with date, signature, and examiner stamps as per standards.







Master List and Reporting Features (47:19)



A master list will compile all welder qualification data with filtering by date, process, and other criteria.

Real-time statistics and visual charts will summarize welder counts by process and joint type.

Export options will allow generating filtered reports for customer submission or internal audits.

The master list acts as a dashboard for managing large volumes of welder data across vendors.







Team Roles, Collaboration, and Next Steps

The meeting clarified responsibilities, collaboration plans, and immediate action points for software development.





Ram Korada Leading Technical and Planning Aspects (01:00:25)



Ram will handle planning, schema design, competitor research, coding, and quality checks.

He manages project direction and will onboard a junior developer to assist with research and minor tasks.

Ram will guide the junior but retains final accountability for deliverables.







Hariprasad’s Role in UX and Coordination (01:02:28)



Hariprasad will provide design input focusing on sleek UX and branding elements.

He will coordinate domain registration and user experience discussions, including consulting a UX expert ©.

Hariprasad will also facilitate communication and ensure alignment on deliverables.







Next Meeting Scheduled for Sunday (57:33)



The next review will focus on presenting initial research findings and a minimum viable product prototype.

Deliverables expected include welder registration workflow, QR code generation, and certificate creation for two welders.

The team will discuss feedback and plan further incremental development steps.







Research and Market Analysis Assigned as Immediate Task (58:03)



Hariprasad to conduct detailed competitor website and product feature research over two days.

Findings will inform the design and functional scope of the MVP.

Ram and Hariprasad will jointly evaluate and integrate research insights into development plans.







Action ItemsRam Korada



Provide PDF copies of welding standards (EN ISO 9606-1, ASME, AWS D1.1) for AI parsing and software use (26:01)

Guide on dataset preparation for qualification ranges and tables to be used in software input (13:31)

Deliver sample certificates and ID card templates for integration and QR code linkage (58:41)

Continue managing welder registration process including QR code generation and certificate issuance logic (45:47)

Monitor expiry tracking system and generate one-week-before reminder emails for welder certificate renewals (46:02)

Conduct competitor research on WellTrace, WeldNote, and others, reviewing their platforms and features for benchmarking (34:40)

Coordinate with team on user experience design to ensure sleek, corporate feel (01:03:35)

Prepare and provide master list and statistical display requirements for welding qualification data (47:19)



Hariprasad K



Undertake competitor website and product video research for UX/UI inspiration and benchmarking (56:33)

Initiate development of software MVP focused on EN ISO 9606-1 standard including welder registration, QR code, certificate and ID card generation, expiry date tracking, and master list management (56:40)

Explore domain name availability for “Welldoc” or alternative branding as per discussion (37:43)

Prepare design and user experience proposals and coordinate with Ram Korada for requirements clarification (01:03:59)

Schedule and participate in next meeting on Sunday with a demo of initial development progress (57:33)







