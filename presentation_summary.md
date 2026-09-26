# Beckn-Enabled Open Skill Verification Network
## Presentation / Pitch Deck Content

---

### Slide 1: The Problem Statement
- **Walled Gardens**: Currently, candidate skills and certifications are locked inside isolated hiring platforms (LinkedIn, Naukri, Indeed) and universities.
- **Redundant Effort**: Candidates have to manually upload PDFs to each individual platform.
- **Verification Bottleneck**: Hiring platforms have no unified, open way to independently verify if a candidate's uploaded credential is real or forged without building expensive, point-to-point API integrations with hundreds of certification providers.

---

### Slide 2: Our Solution (The MVP)
- **Decentralized Verification**: We built a Skill Verification Provider prototype using the **ONEST (Open Network for Education and Skilling Transactions) Beckn Protocol**.
- **The Open Network**: Instead of forcing hiring platforms to integrate with us manually, our platform acts as a node on the open network.
- **Interoperability**: Candidates verify their external credentials (like AWS/Credly badges) on our platform. Hiring platforms (BAPs) can then seamlessly query the network to discover the candidate's verified "Trust Score" instantly.

---

### Slide 3: Core Features
- **Dynamic Candidate Onboarding:** Candidates sign up and build dynamic profiles (capturing education, college, graduation year, and skills).
- **Real-Time Credly Integration:** Candidates provide a Credly Badge URL. Our backend makes a real-time HTTP request to the Credly servers, reads the HTML DOM to detect if the badge is real, fake, or revoked, and securely syncs verified badges.
- **Employer Discovery Dashboard:** Employers can search for skills (e.g., "Java"). The dashboard displays a grid of candidates, their verified competency levels (Beginner, Intermediate, Advanced), and a calculated **Confidence Score (0-100%)**.
- **Mock 3+ Hiring Platform Sync:** Demonstrates true interoperability by allowing the candidate to sync their verified Beckn profile outward to multiple mock platforms (LinkedIn, Naukri, Indeed).

---

### Slide 4: Technical Architecture & The Beckn Protocol
- **The Verification Engine:** Calculates an aggregated "Confidence Score" based on auxiliary education data and credential validity.
- **Beckn Transaction Simulation:** The backend fully simulates the asynchronous Beckn protocol workflow.
- **The 4-Step Transaction Flow:**
  1. `search` -> `on_search` (Discovering providers)
  2. `select` -> `on_select` (Choosing requirements)
  3. `init` -> `on_init` (Providing consent)
  4. `confirm` -> `on_confirm` (Returning the final Verified Status)

---

### Slide 5: Technology Stack
- **Frontend:** React.js, Vite, Tailwind CSS, Lucide Icons, Axios. (Optimized with Lazy Loading, Suspense, and Glassmorphism UI design).
- **Backend:** Java 17, Spring Boot, Spring Data JPA, REST APIs.
- **Database:** MySQL (Highly normalized ERD including `CandidateSkill`, `VerificationRecord`, and `BecknTransaction` tables).
- **Version Control:** fully open-sourced on GitHub.

---

### Slide 6: Future Scope & Scalability
- Integrating actual cryptographic Web3 signatures (JSON-LD Verifiable Credentials).
- Connecting to the live production ONEST Gateway instead of internal protocol simulation.
- Expanding beyond Credly to automatically parse and verify GitHub contribution graphs and LeetCode rankings.
