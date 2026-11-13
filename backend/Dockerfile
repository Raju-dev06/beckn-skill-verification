# ==========================================
# Multi-Stage Dockerfile for Spring Boot
# ==========================================

# --- Stage 1: Build JAR ---
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Cache Maven dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build executable JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Lightweight JRE Runtime ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Run as non-root user for container security
RUN addgroup -S spring && adduser -S spring -G spring
RUN mkdir -p /app/uploads && chown -R spring:spring /app

USER spring:spring

# Copy built artifact from builder stage
COPY --from=builder /build/target/*.jar app.jar

# JVM memory management optimized for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
ENV SERVER_PORT=8081

EXPOSE 8081 10000

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

