package com.beckn.skill_verification.service;

import com.beckn.skill_verification.dto.ExtractedCertificateDto;
import com.beckn.skill_verification.dto.ResumeVerificationResponse;
import com.beckn.skill_verification.entity.Skill;
import com.beckn.skill_verification.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeVerificationService {

    private final SkillRepository skillRepository;

    private static final Pattern URL_PATTERN = Pattern.compile(
        "https?://[^\\s\"'<>\\[\\]{}()\\\\^`]+",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern CREDLY_BADGE_ID_PATTERN = Pattern.compile(
        "credly\\.com/badges/([a-zA-Z0-9_-]+)",
        Pattern.CASE_INSENSITIVE
    );

    public ResumeVerificationResponse verifyResumeFile(MultipartFile file) throws Exception {
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "uploaded_resume.pdf";
        Set<String> extractedUrls = new LinkedHashSet<>();

        if (fileName.toLowerCase().endsWith(".pdf")) {
            try (InputStream is = file.getInputStream();
                 PDDocument document = PDDocument.load(is)) {

                // 1. Extract plain text from PDF and find URLs
                PDFTextStripper stripper = new PDFTextStripper();
                String fullText = stripper.getText(document);
                extractUrlsFromString(fullText, extractedUrls);

                // 2. Extract embedded hyperlink annotations (clickable links)
                for (PDPage page : document.getPages()) {
                    List<PDAnnotation> annotations = page.getAnnotations();
                    if (annotations != null) {
                        for (PDAnnotation annotation : annotations) {
                            if (annotation instanceof PDAnnotationLink link) {
                                if (link.getAction() instanceof PDActionURI uriAction) {
                                    String uri = uriAction.getURI();
                                    if (uri != null && uri.startsWith("http")) {
                                        extractedUrls.add(cleanUrl(uri));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Text or other document formats
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                extractUrlsFromString(sb.toString(), extractedUrls);
            }
        }

        return processExtractedUrls(extractedUrls, fileName);
    }

    public ResumeVerificationResponse verifyResumeText(String resumeText) {
        Set<String> extractedUrls = new LinkedHashSet<>();
        extractUrlsFromString(resumeText, extractedUrls);
        return processExtractedUrls(extractedUrls, "pasted_resume_text");
    }

    private void extractUrlsFromString(String text, Set<String> targetSet) {
        if (text == null) return;
        Matcher matcher = URL_PATTERN.matcher(text);
        while (matcher.find()) {
            String rawUrl = matcher.group();
            String cleaned = cleanUrl(rawUrl);
            if (cleaned.length() > 8) {
                targetSet.add(cleaned);
            }
        }
    }

    private String cleanUrl(String url) {
        if (url == null) return "";
        return url.replaceAll("[.,;:\\?!)\\]}>]+$", "").trim();
    }

    private ResumeVerificationResponse processExtractedUrls(Set<String> allUrls, String fileName) {
        List<ExtractedCertificateDto> certificateResults = new ArrayList<>();
        List<String> ignoredLinks = new ArrayList<>();
        List<Skill> availableSkills = skillRepository.findAll();

        int validCount = 0;
        int invalidCount = 0;

        for (String url : allUrls) {
            String category = classifyUrl(url);

            if ("CERTIFICATE".equals(category)) {
                ExtractedCertificateDto certDto = verifyCertificateLink(url, availableSkills);
                certificateResults.add(certDto);
                if (certDto.isValid()) {
                    validCount++;
                } else {
                    invalidCount++;
                }
            } else {
                ignoredLinks.add(url + " (" + category + ")");
            }
        }

        String summary = String.format(
            "Found %d total links in resume. Extracted %d certificate credentials (%d Verified, %d Invalid) and filtered out %d non-certificate links.",
            allUrls.size(),
            certificateResults.size(),
            validCount,
            invalidCount,
            ignoredLinks.size()
        );

        return ResumeVerificationResponse.builder()
                .fileName(fileName)
                .totalLinksFound(allUrls.size())
                .validCertificatesCount(validCount)
                .invalidCertificatesCount(invalidCount)
                .extractedCertificates(certificateResults)
                .ignoredLinks(ignoredLinks)
                .summary(summary)
                .build();
    }

    /**
     * Categorizes URL: distinguishes certificate links from profiles, repos, and social links.
     */
    private String classifyUrl(String url) {
        String lower = url.toLowerCase();

        // 1. Explicit ignore filters
        if (lower.contains("github.com")) return "Ignored: Source Code Repository";
        if (lower.contains("linkedin.com/in/")) return "Ignored: Personal LinkedIn Profile";
        if (lower.contains("twitter.com") || lower.contains("x.com")) return "Ignored: Social Media";
        if (lower.contains("facebook.com") || lower.contains("instagram.com")) return "Ignored: Social Media";
        if (lower.contains("medium.com") || lower.contains("dev.to")) return "Ignored: Blog / Article";
        if (lower.contains("youtube.com") || lower.contains("youtu.be")) return "Ignored: Video Link";
        if (lower.contains("gmail.com") || lower.contains("mailto:")) return "Ignored: Contact Info";

        // 2. Certificate whitelist patterns
        if (lower.contains("credly.com/badges/") || lower.contains("youracclaim.com/badges/") || lower.contains("credly.com/org/")) {
            return "CERTIFICATE";
        }
        if (lower.contains("coursera.org/verify") || lower.contains("coursera.org/account/accomplishments/verify")) {
            return "CERTIFICATE";
        }
        if (lower.contains("linkedin.com/learning/certificates/")) {
            return "CERTIFICATE";
        }
        if (lower.contains("udemy.com/certificate/")) {
            return "CERTIFICATE";
        }
        if (lower.contains("hackerrank.com/certificates/")) {
            return "CERTIFICATE";
        }
        if (lower.contains("credential.net/") || lower.contains("accredible.com/")) {
            return "CERTIFICATE";
        }
        if (lower.contains("freecodecamp.org/certification/")) {
            return "CERTIFICATE";
        }
        if (lower.contains("learn.microsoft.com") && lower.contains("credentials")) {
            return "CERTIFICATE";
        }

        // 3. Generic certificate/badge path keywords
        if (lower.contains("/certificate/") || lower.contains("/verify/") || lower.contains("/badge/") || lower.contains("/credential/")) {
            return "CERTIFICATE";
        }

        return "Ignored: General Web Link";
    }

    /**
     * Live network verification of the extracted certificate link.
     */
    private ExtractedCertificateDto verifyCertificateLink(String url, List<Skill> availableSkills) {
        String issuer = detectIssuer(url);
        String badgeId = extractBadgeId(url);

        boolean isValid = false;
        String status = "INVALID";
        String details = "Verification failed";
        String extractedTitle = null;

        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");
            connection.setConnectTimeout(4000);
            connection.setReadTimeout(4000);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestMethod("GET");

            int responseCode = connection.getResponseCode();

            if (responseCode >= 200 && responseCode < 400) {
                try (BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                    StringBuilder content = new StringBuilder();
                    String inputLine;
                    while ((inputLine = in.readLine()) != null) {
                        content.append(inputLine);
                    }
                    String html = content.toString();

                    // Specific check for Credly (matches CandidateController exactly)
                    if (url.toLowerCase().contains("credly.com") || url.toLowerCase().contains("youracclaim.com")) {
                        if (html.contains("Unable to verify badge") || html.contains("error-view__title")) {
                            isValid = false;
                            status = "INVALID / REVOKED";
                            details = "Credly server returned: Badge UUID not found or revoked";
                        } else {
                            isValid = true;
                            status = "VERIFIED";
                            details = "Live network verified: Active Credly badge";
                            extractedTitle = extractHtmlTitle(html);
                        }
                    } else if (url.toLowerCase().contains("coursera.org")) {
                        if (html.contains("We couldn't find that certificate") || html.contains("Invalid Certificate Code") || html.contains("\"eqpData\":null") || html.contains("404: Page not found")) {
                            isValid = false;
                            status = "INVALID / FAKE";
                            details = "Coursera server returned: Invalid or non-existent certificate code";
                        } else {
                            isValid = true;
                            status = "VERIFIED";
                            details = "Live network verified: Active Coursera credential";
                            extractedTitle = extractHtmlTitle(html);
                        }
                    } else if (url.toLowerCase().contains("udemy.com")) {
                        if (html.contains("Page not found") || html.contains("We can’t seem to find the page")) {
                            isValid = false;
                            status = "INVALID / 404";
                            details = "Udemy server returned: Certificate not found or revoked";
                        } else {
                            isValid = true;
                            status = "VERIFIED";
                            details = "Live network verified: Active Udemy certificate";
                            extractedTitle = extractHtmlTitle(html);
                        }
                    } else if (url.toLowerCase().contains("hackerrank.com")) {
                        if (html.contains("Certificate Not Found") || html.contains("certificate does not exist")) {
                            isValid = false;
                            status = "INVALID / FAKE";
                            details = "HackerRank server returned: Certificate does not exist";
                        } else {
                            isValid = true;
                            status = "VERIFIED";
                            details = "Live network verified: Active HackerRank certification";
                            extractedTitle = extractHtmlTitle(html);
                        }
                    } else if (url.toLowerCase().contains("freecodecamp.org")) {
                        if (html.contains("Page not found") || html.contains("could not be found")) {
                            isValid = false;
                            status = "INVALID / 404";
                            details = "freeCodeCamp server returned: Certification record not found";
                        } else {
                            isValid = true;
                            status = "VERIFIED";
                            details = "Live network verified: Active freeCodeCamp certification";
                            extractedTitle = extractHtmlTitle(html);
                        }
                    } else if (url.toLowerCase().contains("credential.net") || url.toLowerCase().contains("accredible.com")) {
                        if (html.contains("Credential not found") || html.contains("has been revoked") || html.contains("expired")) {
                            isValid = false;
                            status = "INVALID / REVOKED";
                            details = "Accredible server returned: Credential not found or revoked";
                        } else {
                            isValid = true;
                            status = "VERIFIED";
                            details = "Live network verified: Active Accredible credential";
                            extractedTitle = extractHtmlTitle(html);
                        }
                    } else {
                        // General provider fallback check
                        String title = extractHtmlTitle(html);
                        String lowerTitle = title != null ? title.toLowerCase() : "";
                        if (lowerTitle.contains("404") || lowerTitle.contains("not found") || lowerTitle.contains("error") || lowerTitle.contains("page missing")) {
                            isValid = false;
                            status = "INVALID / 404";
                            details = "Remote page title indicates non-existent link: " + title;
                        } else {
                            isValid = true;
                            status = "VERIFIED";
                            details = "Live network verified: HTTP " + responseCode + " OK";
                            extractedTitle = title;
                        }
                    }
                }
            } else {
                isValid = false;
                status = "INVALID / 404";
                details = "Remote server returned HTTP " + responseCode;
            }
            connection.disconnect();
        } catch (Exception e) {
            log.warn("Network verification error for URL {}: {}", url, e.getMessage());
            isValid = false;
            status = "UNREACHABLE";
            details = "Connection failed: " + (e.getMessage() != null ? e.getMessage() : "Timeout");
        }

        // Clean up extracted title or generate fallback
        if (extractedTitle == null || extractedTitle.isBlank() || extractedTitle.length() < 3) {
            extractedTitle = issuer + " Certificate " + (badgeId != null ? "(" + badgeId + ")" : "");
        } else {
            extractedTitle = cleanTitle(extractedTitle, issuer);
        }

        // Match with candidate skill database
        String matchedSkillName = matchSkill(extractedTitle, url, availableSkills);

        return ExtractedCertificateDto.builder()
                .url(url)
                .issuer(issuer)
                .title(extractedTitle)
                .badgeId(badgeId)
                .isValid(isValid)
                .status(status)
                .details(details)
                .matchedSkill(matchedSkillName)
                .build();
    }

    private String detectIssuer(String url) {
        String lower = url.toLowerCase();
        if (lower.contains("credly.com") || lower.contains("youracclaim.com")) return "Credly";
        if (lower.contains("coursera.org")) return "Coursera";
        if (lower.contains("udemy.com")) return "Udemy";
        if (lower.contains("linkedin.com")) return "LinkedIn Learning";
        if (lower.contains("hackerrank.com")) return "HackerRank";
        if (lower.contains("credential.net") || lower.contains("accredible.com")) return "Accredible";
        if (lower.contains("freecodecamp.org")) return "freeCodeCamp";
        if (lower.contains("microsoft.com")) return "Microsoft";
        return "External Certificate";
    }

    private String extractBadgeId(String url) {
        Matcher matcher = CREDLY_BADGE_ID_PATTERN.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash != -1 && lastSlash < url.length() - 1) {
            String tail = url.substring(lastSlash + 1).split("[?#]")[0];
            if (tail.length() >= 5) return tail;
        }
        return null;
    }

    private String extractHtmlTitle(String html) {
        try {
            Matcher m = Pattern.compile("<title>([^<]+)</title>", Pattern.CASE_INSENSITIVE).matcher(html);
            if (m.find()) {
                return m.group(1).trim();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String cleanTitle(String rawTitle, String issuer) {
        return rawTitle
                .replaceAll("(?i)\\|\\s*Credly", "")
                .replaceAll("(?i)\\|\\s*Coursera", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String matchSkill(String title, String url, List<Skill> skills) {
        String combined = (title + " " + url).toLowerCase();
        for (Skill s : skills) {
            if (combined.contains(s.getName().toLowerCase())) {
                return s.getName();
            }
        }
        // Common matches
        if (combined.contains("aws") || combined.contains("cloud")) return "AWS";
        if (combined.contains("java")) return "Java";
        if (combined.contains("python")) return "Python";
        if (combined.contains("react")) return "React";
        if (combined.contains("docker") || combined.contains("kubernetes")) return "DevOps";
        return "General Skill";
    }
}
