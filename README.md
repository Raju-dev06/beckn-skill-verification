# Beckn-Based Skill Verification Network Prototype

## Project Objective
This project is a working MVP prototype for a Beckn-Based Skill Verification Network. It allows a candidate to upload their credentials, give consent for verification, and uses mock external providers (ONEST/Credential Provider, Certification Provider, Assessment Provider) to verify the skills and map competency levels. Employers can then search for candidates and view their verified profiles and evidence.

## Architecture

```mermaid
graph TD
    subgraph Frontend Application
        UI[React.js + Tailwind CSS UI]
        API_Layer[Axios API Interceptors]
        UI --> API_Layer
    end
    
    subgraph Spring Boot Backend Core
        Controllers[Auth & Feature Controllers]
        Services[Business Logic Services]
        DB[(MySQL Database)]
        
        Controllers --> Services
        Services --> DB
    end
    
    API_Layer -->|REST over HTTP| Controllers
    
    subgraph Beckn Integration Layer
        Beckn_Controller[Beckn BAP/BPP Controller]
        Beckn_Service[Protocol Simulation Service]
        Services <--> Beckn_Service
        Beckn_Controller --> Beckn_Service
    end
    
    subgraph External Networks
        ONEST[ONEST / ONDC Network]
        Credly[Credly Badge API]
        Hiring_Platforms[LinkedIn / Naukri / Indeed]
        
        Beckn_Service <-->|JSON Payloads| ONEST
        ONEST -.-> Credly
        ONEST -.-> Hiring_Platforms
    end
```

## Beckn Protocol Workflow (Verification Sequence)

```mermaid
sequenceDiagram
    participant Candidate as Candidate
    participant Backend as Core Backend
    participant Beckn as Beckn Network Node

    Candidate->>Backend: Request Skill Verification
    Backend->>Backend: Generate Beckn Transaction ID
    Backend->>Beckn: Search (Find verifiable sources)
    Beckn-->>Backend: on_search (Providers found)
    Backend->>Beckn: Select (Choose Verification Provider)
    Beckn-->>Backend: on_select (Quotation/Requirements)
    Backend->>Beckn: Init (Consent and init verification)
    Beckn-->>Backend: on_init (Processing)
    Backend->>Beckn: Confirm (Finalize execution)
    Beckn-->>Backend: on_confirm (Status: VERIFIED + Trust Score)
    Backend->>Candidate: Return Verified Status
```

## Database Schema (ERD)

```mermaid
erDiagram
    USER ||--o| CANDIDATE_PROFILE : "owns"
    USER ||--o{ CANDIDATE_SKILL : "acquires"
    USER ||--o{ CREDENTIAL : "uploads"
    USER ||--o{ CONSENT : "gives"
    USER ||--o{ VERIFICATION_RECORD : "receives"
    USER ||--o{ VERIFICATION_HISTORY : "tracks"
    
    SKILL ||--o{ CANDIDATE_SKILL : "defined by"
    SKILL ||--o{ CREDENTIAL : "associated with"
    SKILL ||--o{ CONSENT : "has consent for"
    SKILL ||--o{ VERIFICATION_RECORD : "recorded for"
    SKILL ||--o{ VERIFICATION_HISTORY : "tracked for"

    USER {
        Long id PK
        String name
        String email
        String password
        String role "CANDIDATE | EMPLOYER"
    }

    CANDIDATE_PROFILE {
        Long id PK
        Long userId FK
        String phone
        String education
        String college
        Integer graduationYear
    }

    SKILL {
        Long id PK
        String name "e.g., Java, AWS"
        String category "e.g., Cloud, Frontend"
    }

    CANDIDATE_SKILL {
        Long id PK
        Long candidateId FK
        Long skillId FK
        String competencyLevel "Beginner | Advanced"
        String verificationStatus "VERIFIED | NOT VERIFIED"
        Integer confidenceScore "0-100%"
    }

    CREDENTIAL {
        Long id PK
        Long candidateId FK
        Long skillId FK
        String certificateName
        String credentialId
        String status
    }

    CONSENT {
        Long id PK
        Long candidateId FK
        Long skillId FK
        Boolean consentGiven
        LocalDateTime consentTimestamp
    }

    VERIFICATION_RECORD {
        Long id PK
        Long candidateId FK
        Long skillId FK
        String finalStatus
        Integer confidenceScore
        LocalDateTime verifiedAt
    }

    BECKN_TRANSACTION {
        Long id PK
        String transactionId "UUID"
        String action "search | init | confirm"
        String requestPayload "JSON"
        String status "SENT | ACK"
    }
```

## Technology Stack
- **Backend:** Java 17, Spring Boot (Web, Data JPA), MySQL
- **Frontend:** React, Vite, Tailwind CSS, React Router, Axios

## Setup & Running Locally

### 1. Database Setup (MySQL)
1. Ensure MySQL is running on `localhost:3306`.
2. Create a database named `skill_verification`:
   ```sql
   CREATE DATABASE skill_verification;
   ```
3. The backend is configured to use username `root` and an empty password by default. If your credentials differ, update them in `backend/src/main/resources/application.properties`.
4. The database schema will be automatically generated, and mock data (users, skills) will be seeded on the first startup.

### 2. Run Backend
```bash
cd backend
mvn spring-boot:run
```
The backend runs on `http://localhost:8080`.

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend runs on `http://localhost:5173`.

## Demo Credentials
- **Candidate:** Sign up to create a custom dynamic profile! (Demo candidate removed for realistic testing).
- **Employer:** `employer@test.com` / `password`

## Prototype Limitations
- **Real ONEST/Beckn:** This prototype uses mock service classes (`MockONESTCredentialProvider`, etc.) to simulate external providers. In a real application, these interfaces would be implemented to communicate over the Beckn protocol.
- **Authentication:** A simplified mock authentication is used instead of real JWT/OAuth.
- **Infrastructure:** Complex microservices, Kafka, Redis, and Kubernetes have been intentionally avoided to keep the MVP simple, runnable, and focused on the core workflow.
