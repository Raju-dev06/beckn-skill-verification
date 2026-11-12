package com.beckn.skill_verification.config;

import com.beckn.skill_verification.entity.*;
import com.beckn.skill_verification.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CandidateProfileRepository profileRepository;
    private final SkillRepository skillRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final CredentialRepository credentialRepository;
    private final VerificationRecordRepository verificationRecordRepository;
    private final ConsentRepository consentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed Users if not present
        if (userRepository.count() == 0) {
            User candidate = new User();
            candidate.setName("Rahul Kumar");
            candidate.setEmail("candidate@test.com");
            candidate.setPassword(passwordEncoder.encode("password"));
            candidate.setRole("CANDIDATE");
            candidate = userRepository.save(candidate);

            User alex = new User();
            alex.setName("Alex Mercer");
            alex.setEmail("alex@test.com");
            alex.setPassword(passwordEncoder.encode("password"));
            alex.setRole("CANDIDATE");
            alex = userRepository.save(alex);

            User sarah = new User();
            sarah.setName("Sarah Jenkins");
            sarah.setEmail("sarah@test.com");
            sarah.setPassword(passwordEncoder.encode("password"));
            sarah.setRole("CANDIDATE");
            sarah = userRepository.save(sarah);

            User employer = new User();
            employer.setName("Demo Employer");
            employer.setEmail("employer@test.com");
            employer.setPassword(passwordEncoder.encode("password"));
            employer.setRole("EMPLOYER");
            userRepository.save(employer);

            // Seed Profiles
            CandidateProfile profile = new CandidateProfile();
            profile.setUserId(candidate.getId());
            profile.setPhone("1234567890");
            profile.setEducation("B.Tech CSE");
            profile.setCollege("ANITS");
            profile.setGraduationYear(2027);
            profileRepository.save(profile);

            CandidateProfile alexProfile = new CandidateProfile();
            alexProfile.setUserId(alex.getId());
            alexProfile.setPhone("9876543210");
            alexProfile.setEducation("M.S. Computer Science");
            alexProfile.setCollege("Georgia Tech");
            alexProfile.setGraduationYear(2025);
            profileRepository.save(alexProfile);

            CandidateProfile sarahProfile = new CandidateProfile();
            sarahProfile.setUserId(sarah.getId());
            sarahProfile.setPhone("5551234567");
            sarahProfile.setEducation("B.S. Software Engineering");
            sarahProfile.setCollege("Stanford University");
            sarahProfile.setGraduationYear(2026);
            profileRepository.save(sarahProfile);

            // Seed Skills
            Skill java = new Skill(); java.setName("Java"); java.setCategory("Programming");
            Skill spring = new Skill(); spring.setName("Spring Boot"); spring.setCategory("Backend Development");
            Skill sql = new Skill(); sql.setName("SQL"); sql.setCategory("Database");
            Skill react = new Skill(); react.setName("React"); react.setCategory("Frontend Development");
            Skill aws = new Skill(); aws.setName("AWS Cloud Infrastructure"); aws.setCategory("Cloud & DevOps");
            skillRepository.saveAll(List.of(java, spring, sql, react, aws));

            // Assign Skills to Rahul
            CandidateSkill cs1 = new CandidateSkill(); cs1.setCandidateId(candidate.getId()); cs1.setSkillId(java.getId()); cs1.setVerificationStatus("VERIFIED"); cs1.setConfidenceScore(95); cs1.setCompetencyLevel("Advanced");
            CandidateSkill cs2 = new CandidateSkill(); cs2.setCandidateId(candidate.getId()); cs2.setSkillId(spring.getId()); cs2.setVerificationStatus("VERIFIED"); cs2.setConfidenceScore(92); cs2.setCompetencyLevel("Advanced");
            CandidateSkill cs3 = new CandidateSkill(); cs3.setCandidateId(candidate.getId()); cs3.setSkillId(sql.getId()); cs3.setVerificationStatus("PENDING");
            CandidateSkill cs4 = new CandidateSkill(); cs4.setCandidateId(candidate.getId()); cs4.setSkillId(react.getId()); cs4.setVerificationStatus("PENDING");
            CandidateSkill cs5 = new CandidateSkill(); cs5.setCandidateId(candidate.getId()); cs5.setSkillId(aws.getId()); cs5.setVerificationStatus("VERIFIED"); cs5.setConfidenceScore(95); cs5.setCompetencyLevel("Advanced");
            candidateSkillRepository.saveAll(List.of(cs1, cs2, cs3, cs4, cs5));

            // Assign Skills to Alex
            CandidateSkill as1 = new CandidateSkill(); as1.setCandidateId(alex.getId()); as1.setSkillId(aws.getId()); as1.setVerificationStatus("VERIFIED"); as1.setConfidenceScore(95); as1.setCompetencyLevel("Advanced");
            CandidateSkill as2 = new CandidateSkill(); as2.setCandidateId(alex.getId()); as2.setSkillId(java.getId()); as2.setVerificationStatus("VERIFIED"); as2.setConfidenceScore(94); as2.setCompetencyLevel("Advanced");
            candidateSkillRepository.saveAll(List.of(as1, as2));

            // Assign Skills to Sarah
            CandidateSkill ss1 = new CandidateSkill(); ss1.setCandidateId(sarah.getId()); ss1.setSkillId(react.getId()); ss1.setVerificationStatus("VERIFIED"); ss1.setConfidenceScore(95); ss1.setCompetencyLevel("Advanced");
            candidateSkillRepository.save(ss1);
        }

        // Seed sample verified credentials if empty
        if (credentialRepository.count() == 0) {
            User candidate = userRepository.findByEmail("candidate@test.com").orElse(null);
            if (candidate != null) {
                Skill java = skillRepository.findByName("Java").orElse(null);
                Skill spring = skillRepository.findByName("Spring Boot").orElse(null);
                Skill aws = skillRepository.findByName("AWS Cloud Infrastructure").orElse(null);

                if (java != null) {
                    Credential c1 = new Credential();
                    c1.setCandidateId(candidate.getId());
                    c1.setSkillId(java.getId());
                    c1.setCertificateName("Oracle Certified Professional: Java SE 17 Developer");
                    c1.setCredentialId("OCP-JAVA-8849201");
                    c1.setIssuer("Oracle University");
                    c1.setStatus("VERIFIED");
                    credentialRepository.save(c1);

                    VerificationRecord vr1 = new VerificationRecord();
                    vr1.setCandidateId(candidate.getId());
                    vr1.setSkillId(java.getId());
                    vr1.setCredentialStatus("VERIFIED");
                    vr1.setEducationStatus("VERIFIED");
                    vr1.setAssessmentStatus("VERIFIED");
                    vr1.setFinalStatus("VERIFIED");
                    vr1.setConfidenceScore(95);
                    vr1.setCompetencyLevel("Advanced");
                    vr1.setVerifiedAt(LocalDateTime.now().minusDays(2));
                    verificationRecordRepository.save(vr1);
                }

                if (aws != null) {
                    Credential c2 = new Credential();
                    c2.setCandidateId(candidate.getId());
                    c2.setSkillId(aws.getId());
                    c2.setCertificateName("AWS Certified Solutions Architect – Associate");
                    c2.setCredentialId("798b8316-2680-4d47-9e95-90bd2c424455");
                    c2.setIssuer("Credly Acclaim (Amazon Web Services)");
                    c2.setStatus("VERIFIED");
                    credentialRepository.save(c2);

                    VerificationRecord vr2 = new VerificationRecord();
                    vr2.setCandidateId(candidate.getId());
                    vr2.setSkillId(aws.getId());
                    vr2.setCredentialStatus("VERIFIED");
                    vr2.setEducationStatus("VERIFIED");
                    vr2.setAssessmentStatus("VERIFIED");
                    vr2.setFinalStatus("VERIFIED");
                    vr2.setConfidenceScore(95);
                    vr2.setCompetencyLevel("Advanced");
                    vr2.setVerifiedAt(LocalDateTime.now().minusDays(1));
                    verificationRecordRepository.save(vr2);
                }

                if (spring != null) {
                    Credential c3 = new Credential();
                    c3.setCandidateId(candidate.getId());
                    c3.setSkillId(spring.getId());
                    c3.setCertificateName("Spring Professional Certification");
                    c3.setCredentialId("VMW-SPRING-99214");
                    c3.setIssuer("VMware Tanzu Academy");
                    c3.setStatus("VERIFIED");
                    credentialRepository.save(c3);

                    VerificationRecord vr3 = new VerificationRecord();
                    vr3.setCandidateId(candidate.getId());
                    vr3.setSkillId(spring.getId());
                    vr3.setCredentialStatus("VERIFIED");
                    vr3.setEducationStatus("VERIFIED");
                    vr3.setAssessmentStatus("VERIFIED");
                    vr3.setFinalStatus("VERIFIED");
                    vr3.setConfidenceScore(92);
                    vr3.setCompetencyLevel("Advanced");
                    vr3.setVerifiedAt(LocalDateTime.now().minusHours(12));
                    verificationRecordRepository.save(vr3);
                }
            }
        }

        System.out.println("Data seeding complete with authentic verified credentials.");
    }
}
