# Beckn Skill Verification with ONEST Framework
## Reviewer Defense, Viva & Technical Interview Q&A Guide

This guide contains **in-depth questions** across all use cases and architectural components of the project, complete with the **exact technical answers** you can give to reviewers, professors, or technical interviewers.

---

## Table of Contents
1. [General Architecture & ONEST / Beckn Protocol Questions](#1-general-architecture--onest--beckn-protocol-questions)
2. [Use Case 1: Authentication, Authorization & JWT](#2-use-case-1-authentication-authorization--jwt)
3. [Use Case 2: Candidate Dashboard & Trust Score Calculation](#3-use-case-2-candidate-dashboard--trust-score-calculation)
4. [Use Case 3: Credential Evidence Upload & Security Hardening](#4-use-case-3-credential-evidence-upload--security-hardening)
5. [Use Case 4: Optical QR & Certificate Verification Engine](#5-use-case-4-optical-qr--certificate-verification-engine)
6. [Use Case 5: Automated Resume Parsing & Live Registry Verification](#6-use-case-5-automated-resume-parsing--live-registry-verification)
7. [Use Case 6: Digital Badge Verification (Credly Bridge)](#7-use-case-6-digital-badge-verification-credly-bridge)
8. [Use Case 7: Decentralized Beckn ONEST 4-Step Handshake & Ed25519 Signatures](#8-use-case-7-decentralized-beckn-onest-4-step-handshake--ed25519-signatures)
9. [Use Case 8: Real-Time Polling & Verification Results Presentation](#9-use-case-8-real-time-polling--verification-results-presentation)
10. [Use Case 9 & 10: Employer Talent Discovery & Open Hiring Network](#10-use-case-9--10-employer-talent-discovery--open-hiring-network)
11. [Tough Edge Cases, Scalability & Production Readiness](#11-tough-edge-cases-scalability--production-readiness)

---

## 1. General Architecture & ONEST / Beckn Protocol Questions

### Q1.1: "Why did you use the Beckn Protocol instead of building standard REST APIs between candidates and universities?"
* **Why the Reviewer Asks This:** To check if you understand decentralized architecture vs centralized point-to-point APIs.
* **How to Answer:**
  > *"Standard REST APIs create closed walled gardens. If our platform had to verify credentials point-to-point, we would need direct API integrations with every single university, Credly, Coursera, and certifier, requiring $N \times M$ separate connections.
  > By adopting the open **Beckn Protocol v1.1.0** with the **ONEST (Open Network for Education & Skilling Transactions)** specification, our platform operates as a decentralized Beckn Application Platform (BAP). Any accredited credential issuer running a Beckn Provider Platform (BPP) can fulfill verification requests without custom bilateral agreements. It scales the network using standard JSON schema discovery (`/search`), order initialization (`/init`), and final verification contracts (`/confirm`)."*

---

### Q1.2: "What is the difference between Beckn and ONEST in your application?"
* **Why the Reviewer Asks This:** To ensure you don't confuse the transport protocol with the domain taxonomy.
* **How to Answer:**
  > *"**Beckn** is the underlying open transport protocol that defines the asynchronous message exchange pattern (`search` $\rightarrow$ `on_search`, `init` $\rightarrow$ `on_init`, `confirm` $\rightarrow$ `on_confirm`) and asymmetric Ed25519 digital signatures.
  > **ONEST** is the domain-specific application layer running on top of Beckn. In `application.properties`, our domain is set to `onest:work-opportunities`. ONEST defines the taxonomy for skill competencies, NSDC registry codes, W3C Verifiable Credentials (`urn:onest:credential:registry:...`), and educational accreditation standards."*

---

### Q1.3: "How does your system run both BAP and BPP locally for testing?"
* **Why the Reviewer Asks This:** To verify you know how the components communicate over the network.
* **How to Answer:**
  > *"Both the BAP and BPP nodes run in our Spring Boot container on port 8081 as decoupled architectural modules. When a candidate initiates verification, `RealBecknClient` sends a real HTTP POST request to `http://localhost:8081/api/bpp/search`. The `BecknBppController` receives this request, processes it on an asynchronous scheduled thread pool (`ScheduledExecutorService`), and dispatches signed HTTP callbacks back to the BAP webhook at `http://localhost:8081/api/beckn/on_search`. They communicate purely over HTTP envelopes as independent nodes."*

---

## 2. Use Case 1: Authentication, Authorization & JWT

### Q2.1: "Why do you use stateless JWT instead of traditional HTTP Sessions with cookies?"
* **Why the Reviewer Asks This:** Tests your understanding of distributed scalability and microservice architecture.
* **How to Answer:**
  > *"HTTP Sessions require server-side state in memory or sticky sessions behind a load balancer. Because our platform is designed to scale horizontally across multiple instances or containers, we use stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 in `JwtTokenProvider.java`. Every request carries the token in the `Authorization: Bearer <token>` header, verified independently by `JwtAuthenticationFilter.java` without database lookups on every route."*

---

### Q2.2: "What happens if an attacker captures the JWT token? How is it protected?"
* **Why the Reviewer Asks This:** Tests security best practices and token lifecycle management.
* **How to Answer:**
  > *"First, tokens have a finite time-to-live (`app.jwt.expiration-ms = 86400000`, 24 hours) after which they expire. Second, in production, tokens are only transmitted over TLS/HTTPS encrypted channels. Third, sensitive operations (such as initiating ONEST verification) require explicit per-transaction consent logged in the database, meaning a stolen token cannot verify new skills without candidate consent records."*

---

## 3. Use Case 2: Candidate Dashboard & Trust Score Calculation

### Q3.1: "Explain the exact mathematical formula behind the Unified Trust Score."
* **Why the Reviewer Asks This:** To verify you actually wrote the business logic and didn't hardcode dummy numbers.
* **How to Answer:**
  > *"In `CandidateService.java`, the trust score is calculated dynamically based only on authenticated skills:
  > $$\text{Unified Trust Score} = \min\left(\frac{\sum_{\text{verified}} \text{ConfidenceScore}}{N_{\text{verified}}}, 95\right)$$
  > If a candidate has no verified skills, their score is 0%. When a skill is verified by an accredited authority, it receives a score of 95%. We take the arithmetic mean of all verified skills and strictly cap it at 95% using `Math.min(average, 95)`."*

---

### Q3.2: "Why did you cap the score at 95% instead of allowing 100%?"
* **Why the Reviewer Asks This:** Tests your knowledge of credential verification standards.
* **How to Answer:**
  > *"In real-world cryptographic credential architectures (including W3C Verifiable Credentials and ONEST), automated algorithms never claim 100% certainty. Reserving a 5% margin accounts for statistical error, revocation latency, and prevents mathematical score inflation. A capped 95% score is the industry benchmark for highest-tier authenticated confidence."*

---

## 4. Use Case 3: Credential Evidence Upload & Security Hardening

### Q4.1: "What prevents a malicious user from uploading an executable file like a `.jsp` or `.exe` script to compromise your server?"
* **Why the Reviewer Asks This:** Checks if you understand file upload vulnerabilities (CWE-434).
* **How to Answer:**
  > *"In `CandidateController.java` (`addCredential` method), we implement strict backend file extension whitelisting:
  > ```java
  > String ext = cleanFilename.contains(".") ? cleanFilename.substring(cleanFilename.lastIndexOf(".")).toLowerCase() : "";
  > if (!List.of(".pdf", ".png", ".jpg", ".jpeg", ".webp").contains(ext)) {
  >     return ResponseEntity.badRequest().build();
  > }
  > ```
  > Even if a user renames an executable or bypasses client-side checks, the backend rejects any file whose extension is not in the strict whitelist with an immediate `HTTP 400 Bad Request`."*

---

### Q4.2: "How do you protect against Path Traversal attacks (e.g., `../../etc/passwd` or `..\Windows\System32`)?"
* **Why the Reviewer Asks This:** Checks if you know how to defend against Directory Traversal (CWE-22).
* **How to Answer:**
  > *"We apply three layers of defense in `CandidateController.java`:
  > 1. We strip non-alphanumeric characters: `rawFilename.replaceAll(\"[^a-zA-Z0-9._-]\", \"_\")`.
  > 2. We prepend a cryptographically random UUID: `UUID.randomUUID().toString() + \"_\" + cleanFilename`.
  > 3. We normalize the file path using `Path.normalize()` and assert:
  > ```java
  > Path targetPath = uploadDir.resolve(safeFileName).normalize();
  > if (!targetPath.startsWith(uploadDir)) {
  >     throw new SecurityException(\"Directory traversal attempt blocked\");
  > }
  > ```
  > This guarantees files can never escape the designated `uploads/` directory."*

---

## 5. Use Case 4: Optical QR & Certificate Verification Engine

### Q5.1: "How does your system scan a QR code if the uploaded certificate is a multi-page PDF document?"
* **Why the Reviewer Asks This:** Standard QR scanners only accept image files (`.png`, `.jpg`), not raw PDFs.
* **How to Answer:**
  > *"We use **Apache PDFBox** (`PDDocument` and `PDFRenderer`) in `QrCertificateVerificationService.java`. When a PDF is uploaded:
  > 1. We render the first pages into in-memory `BufferedImage` bitmaps at **200 DPI**. If that fails to decode, we re-render at **300 DPI** to resolve fine QR matrix modules.
  > 2. If rendering fails due to vector smoothing, we scan the PDF's internal resource dictionary (`PDResources.getXObjectNames()`) to extract the exact lossless raster image stream (`PDImageXObject`) uploaded by the issuer.
  > 3. We pass the resulting `BufferedImage` into ZXing's optical reader."*

---

### Q5.2: "What is the difference between `HybridBinarizer` and `GlobalHistogramBinarizer` in your QR pipeline?"
* **Why the Reviewer Asks This:** Tests your understanding of computer vision and image binarization.
* **How to Answer:**
  > *"In `QrCertificateVerificationService.java`, we implement a multi-pass binarization pipeline:
  > * **`HybridBinarizer` (Pass 1)**: Calculates local luminance thresholds across 8x8 pixel sub-blocks. This is crucial for real-world certificate photos taken with phone cameras that have shadows, lens glare, or gradient lighting.
  > * **`GlobalHistogramBinarizer` (Pass 2)**: Computes a single global histogram across the entire image. This is faster and more accurate for clean digital certificates with low overall contrast.
  > If both full-image passes fail, we crop the image into **4 sub-quadrants** (corners) and scan each quadrant independently."*

---

### Q5.3: "What happens if a candidate uploads a certificate that has no QR code at all?"
* **Why the Reviewer Asks This:** Checks if you handled certificates issued by Oracle, Microsoft, or NPTEL that only use printed serial numbers.
* **How to Answer:**
  > *"Our engine has a built-in fallback: `extractCertificateIdFromText()`. If no optical QR code is detected, Apache PDFBox's `PDFTextStripper` extracts the printed text on the certificate and applies targeted regular expressions:
  > - Oracle eCertificate serials: `([0-9]{8,15}[A-Za-z0-9]{4,10})`
  > - Accredited certificate numbers: `(?:e?Certificate\\s*(?:No|Number|ID)?[:#\\s]*)([A-Za-z0-9_-]{8,30})`
  > If a printed certificate serial number is found, it is authenticated as `PRINTED CERTIFICATE ID DETECTED` and forwarded to the Beckn BPP for verification."*

---

### Q5.4: "How do you detect counterfeit certificates that have a real QR code pointing to a fake or dummy link?"
* **Why the Reviewer Asks This:** To see if you understand credential fraud detection beyond simple decoding.
* **How to Answer:**
  > *"In `verifyPayloadDirectly()`, once the QR code is decoded into a string, we run an **anti-fraud filter**:
  > 1. **Deceptive Redirect Filter**: If the decoded URL points to generic domains like `google.com`, `youtube.com`, `facebook.com`, or search engines, it is immediately flagged with `isValid: false` and Status: `\"INVALID / DUMMY QR\"`.
  > 2. **Blacklist Token Filter**: If the payload contains keywords like `fake`, `dummy`, `fraud`, or `counterfeit`, it is rejected.
  > Only payloads conforming to accredited registries (Credly, Coursera, Cisco, Oracle) or W3C standards (`urn:onest:`, `did:`) are marked valid."*

---

## 6. Use Case 5: Automated Resume Parsing & Live Registry Verification

### Q6.1: "How do you extract hyperlinks from a resume if the URL is hidden behind clickable anchor words like 'View Certificate'?"
* **Why the Reviewer Asks This:** Plain text extraction using standard regex completely misses clickable PDF hyperlinks.
* **How to Answer:**
  > *"In `ResumeVerificationService.java`, we implement dual-layer extraction:
  > 1. **Text Layer**: `PDFTextStripper` extracts visible text and matches `URL_PATTERN`.
  > 2. **Annotation Layer**: We inspect the PDF document's interactive tree. For every page, we call `page.getAnnotations()`, filter for `PDAnnotationLink`, and inspect its action:
  > ```java
  > if (annotation instanceof PDAnnotationLink link) {
  >     if (link.getAction() instanceof PDActionURI uriAction) {
  >         String hiddenUri = uriAction.getURI();
  >         extractedUrls.add(cleanUrl(hiddenUri));
  >     }
  > }
  > ```
  > This guarantees we capture URLs even if the candidate wrote 'Link' or embedded the URL in an icon."*

---

### Q6.2: "How do you verify whether an extracted Coursera or HackerRank certificate link is real or fabricated without an API key?"
* **Why the Reviewer Asks This:** Tests your knowledge of live network probing and HTML signature analysis.
* **How to Answer:**
  > *"In `verifyCertificateLink()`, the server opens an `HttpURLConnection` to the extracted URL with a browser User-Agent header and inspects the HTTP response:
  > 1. If HTTP status is 404, 403, or 500 $\rightarrow$ Marked `INVALID`.
  > 2. If HTTP status is 200, we read the HTML stream and check for issuer-specific error signatures:
  >    * **Coursera**: If the page contains `\"We couldn't find that certificate\"` or `\"Invalid Certificate Code\"` $\rightarrow$ Marked `INVALID / FAKE`.
  >    * **HackerRank**: If the page contains `\"Certificate Not Found\"` $\rightarrow$ Marked `INVALID / FAKE`.
  >    * **Credly**: If the page contains `\"Unable to verify badge\"` $\rightarrow$ Marked `INVALID / REVOKED`.
  > If no error signatures are found, the badge is active, and we extract the official course title using `<title>(.*?)</title>`."*

---

## 7. Use Case 6: Digital Badge Verification (Credly Bridge)

### Q7.1: "Why can't the React frontend call `fetch('https://www.credly.com/badges/...')` directly?"
* **Why the Reviewer Asks This:** Tests fundamental browser security (CORS) principles.
* **How to Answer:**
  > *"Web browsers enforce the **Same-Origin Policy (SOP)**. Because `credly.com` does not include `Access-Control-Allow-Origin: *` headers for arbitrary third-party web clients, any direct `fetch()` call from our frontend running on `localhost:5173` would be blocked by the browser.
  > To solve this, our frontend calls our Spring Boot endpoint `/api/candidates/verify-external-badge?id={id}`, which acts as a secure server-side proxy that contacts Credly server-to-server where CORS restrictions do not apply."*

---

### Q7.2: "Why do you compute a client-side SHA-256 hash in `BadgeVerify.jsx`?"
* **Why the Reviewer Asks This:** Checks if you understand client-side tamper detection.
* **How to Answer:**
  > *"In `BadgeVerify.jsx`, when a badge is verified, we compute an immediate SHA-256 digest of the badge ID using the browser's native `window.crypto.subtle.digest('SHA-256', data)`. This creates an immutable cryptographic fingerprint stored in `localStorage` audit history (`badge_lookup_history_v1`), allowing the candidate to prove when they verified the badge even before syncing to the backend."*

---

## 8. Use Case 7: Decentralized Beckn ONEST 4-Step Handshake & Ed25519 Signatures

### Q8.1: "Walk me through the 4 steps of the Beckn ONEST verification protocol in your code."
* **Why the Reviewer Asks This:** The core question of any Beckn evaluation.
* **How to Answer:**
  > *"The protocol executes in 4 distinct phases between BAP (`VerificationService`) and BPP (`BecknBppController`):
  > 1. **Consent Recording**: Candidate grants explicit consent on `/api/verification/{candidateId}/{skillId}/consent`.
  > 2. **Discovery (`/search` $\rightarrow$ `/on_search`)**: BAP signs and dispatches `/search` with domain `onest:work-opportunities`. BPP returns `/on_search` callback with an accredited provider catalog (`ONEST_NSDC_REGISTRY`).
  > 3. **Initialization (`/init` $\rightarrow$ `/on_init`)**: BAP sends the candidate's `credentialId` under ONEST contract terms. BPP acknowledges terms and responds with `/on_init`.
  > 4. **Confirmation & Scoring (`/confirm` $\rightarrow$ `/on_confirm`)**: BAP dispatches `/confirm`. BPP evaluates the credential against registry rules, generates a W3C Verifiable Credential URN (`urn:onest:credential:registry:<UUID>`), assigns an authenticated 95% Confidence Score, and dispatches `/on_confirm`."*

---

### Q8.2: "How does the RFC 8032 Ed25519 digital signature work in your Beckn implementation?"
* **Why the Reviewer Asks This:** Tests your understanding of cryptographic identity and tamper resistance.
* **How to Answer:**
  > *"In `BecknAuthService.java`:
  > 1. We compute a cryptographic digest of the JSON payload using BLAKE-512 or SHA-256: `Digest: BLAKE-512=<base64>`.
  > 2. We construct an RFC 8032 signing string containing the request target, creation epoch timestamp, expiration epoch, and payload digest:
  >    `(request-target): post /search\ncreated: 1714567890\nexpires: 1714567920\ndigest: BLAKE-512=...`
  > 3. We sign this string using our platform's **Ed25519 private key** with BouncyCastle (`Ed25519Signer`).
  > 4. We attach it to the HTTP `Authorization` header:
  >    `Signature keyId=\"key-1\",algorithm=\"ed25519\",headers=\"...\",signature=\"...\"`
  > When the receiver gets the request, it verifies the signature against the sender's public key to guarantee the request was not altered in transit."*

---

## 9. Use Case 8: Real-Time Polling & Verification Results Presentation

### Q9.1: "Why did you use HTTP polling instead of WebSockets for verification status?"
* **Why the Reviewer Asks This:** Checks your trade-off analysis between polling and WebSockets.
* **How to Answer:**
  > *"We evaluated both. WebSockets maintain persistent full-duplex TCP connections, which introduce state overhead on load balancers and require connection re-establishment on mobile drops.
  > Because a Beckn transaction completes within 2 to 3 seconds, a lightweight 1-second HTTP polling loop (`GET /api/verification/{candidateId}/{skillId}/result` in `VerificationProcess.jsx`) with a maximum of 12 attempts is completely stateless, works cleanly across all corporate firewalls, and terminates immediately once `status === 'VERIFIED'`."*

---

### Q9.2: "What is the 3-Pillar Verification Model displayed on the Result page?"
* **Why the Reviewer Asks This:** Tests your domain knowledge of comprehensive skilling trust.
* **How to Answer:**
  > *"Rather than relying solely on a certificate, our system evaluates credentials across 3 distinct pillars:
  > 1. **Credential Authenticity**: Cryptographic validity of the digital certificate or QR payload.
  > 2. **Institutional Alignment**: Verification that the issuing authority is recognized on the ONEST national registry.
  > 3. **Assessment Competency**: Candidate competency level (e.g., Advanced, Intermediate) based on verified score."*

---

## 10. Use Case 9 & 10: Employer Talent Discovery & Open Hiring Network

### Q10.1: "How does the recruiter search feature prevent hiring fraud?"
* **Why the Reviewer Asks This:** To understand the value proposition for enterprise recruiters.
* **How to Answer:**
  > *"In traditional platforms (LinkedIn/Naukri), skills are self-reported. Recruiters have no way of knowing if a candidate actually knows a skill without conducting costly interviews.
  > In `EmployerDashboard.jsx` and `EmployerService.java`:
  > - Recruiters search candidates by skill (e.g. `Spring Boot`).
  > - Candidates only appear with **Verified Badges** if their credentials have passed the Beckn ONEST handshake.
  > - Recruiters can filter by minimum Trust Score threshold ($\ge 85\%$).
  > - Clicking **'View Verified Profile'** opens `EmployerProfileView.jsx`, rendering the candidate's W3C Verifiable Credential URN, issuer authority, and cryptographic audit records directly without needing to contact original universities."*

---

## 11. Tough Edge Cases, Scalability & Production Readiness

### Q11.1: "What happens if MySQL database connection pool gets exhausted during high load?"
* **Why the Reviewer Asks This:** Tests backend scalability and database tuning.
* **How to Answer:**
  > *"In `application.properties`, we configured **HikariCP** connection pooling parameters:
  > - `spring.datasource.hikari.maximum-pool-size=25`
  > - `spring.datasource.hikari.minimum-idle=5`
  > - `spring.datasource.hikari.connection-timeout=20000` (20 seconds)
  > - `spring.datasource.hikari.idle-timeout=30000`
  > This guarantees fast connection reuse and prevents database socket exhaustion during concurrent candidate uploads."*

---

### Q11.2: "How would you deploy this platform in a live production environment across multiple servers?"
* **Why the Reviewer Asks This:** Tests real-world cloud architecture.
* **How to Answer:**
  > *"For production deployment:
  > 1. **Containerization**: Package backend and frontend into Docker containers using multi-stage builds.
  > 2. **Gateway Registration**: Register the BAP subscriber ID (`skill-verification-bap.onest.network`) and public Ed25519 key on the official ONEST production registry (`registry.onest.network`).
  > 3. **SSL/TLS & Reverse Proxy**: Place Spring Boot behind Nginx or AWS Application Load Balancer with SSL termination on port 443.
  > 4. **Storage**: Mount an S3 bucket or distributed volume for the `uploads/` directory instead of local filesystem storage."*

