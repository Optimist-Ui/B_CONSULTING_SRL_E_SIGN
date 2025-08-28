# B_CONSULTING_E-SIGN – MERN DevOps Reference Architecture

> “One mono-repo, two EC2 instances, three environments, infinite scale.”

This repository contains the **B_CONSULTING_E-SIGN** platform: a MERN-stack (MongoDB, Express, React, Node.js) monorepo that deploys **digital-signature workflows** across **development**, **UAT**, and **production** environments with a single `git push`.

---

## 🏗️ Current State (v1)

| Component           | Technology / Platform |
|---------------------|-----------------------|
| **Repository**      | GitHub monorepo (`dev`, `uat`, `main` branches) |
| **Backend**         | Node.js 20 + Express (port 3001 *inside* container) |
| **Frontend**        | React 18 + Vite (AWS Amplify, branch-aware builds) |
| **CI/CD**           | GitHub Actions → ECR → EC2 (backend) / Amplify (frontend) |
| **Database**        | MongoDB Atlas (one cluster per environment) |
| **Secrets**         | GitHub Environments (backend) & Amplify env-vars (frontend) |
| **Compute**         | 2 × EC2 (Amazon Linux 2023) |
| **Networking**      | Route 53 A-records → Nginx → Docker containers |
| **Orchestration**   | Docker (`--restart unless-stopped`) |
| **TLS/SSL**         | Let’s Encrypt certificates (Certbot) |
| **File Upload**     | Nginx `client_max_body_size 100m` |

---

## 🗂️ Folder Layout
B_CONSULTING_E-SIGN/
├── api/                   # Express backend
├── web/                   # React SPA (Vite)
│   ├── public/
│   ├── src/
│   ├── amplify.yml
│   └── …
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   └── Dockerfile.web
│   └── scripts/           # Terraform / CloudFormation stubs
├── .github/
│   └── workflows/
│       └── api.yml        # Re-usable GitHub Actions workflow
├── docker-compose.yml     # Local development
├── amplify.yml            # Amplify build spec
└── README.md
Copy

---

## 🚀 Push-to-Deploy Flow

### Backend (GitHub Actions)

1. `git push <branch>` triggers `.github/workflows/api.yml`.
2. Docker image built & tagged (`esign-api:<branch>-<sha>`).
3. Image pushed to **ECR** (`941377150152.dkr.ecr.us-east-1.amazonaws.com/esign-api`).
4. EC2 pulls & runs containers:
   - **dev** → `esign-api-dev` on host-port **3002**
   - **uat** → `esign-api-uat` on host-port **3003**
   - **prod** → `esign-api-prod` on host-port **3001**
5. Nginx reverse-proxies **HTTPS** traffic to containers.

### Frontend (AWS Amplify)

1. `git push <branch>` triggers Amplify.
2. Builds React with environment variables per branch.
3. Deploys to:
   - `dev.e-sign.eu.com`
   - `uat.e-sign.eu.com`
   - `e-sign.eu.com`

---

## 🌐 DNS & Endpoints

| Environment | Backend API Endpoint | Frontend URL |
|-------------|-----------------------|--------------|
| **dev**     | https://api-dev.e-sign.eu.com | https://dev.e-sign.eu.com |
| **uat**     | https://api-uat.e-sign.eu.com | https://uat.e-sign.eu.com |
| **prod**    | https://api.e-sign.eu.com     | https://e-sign.eu.com     |

---

## 🔒 Security Checklist

| Item | Status |
|------|--------|
| IAM least-privilege keys | ✅ |
| Secrets in GitHub Environments | ✅ |
| TLS 1.3 enforced | ✅ |
| Containers run as non-root | ✅ |
| Security Groups least-privilege | ✅ |
| Front-end env-vars managed by Amplify | ✅ |

---

## 📈 Scalability Roadmap

### Phase 2 – Quick Wins
- Blue-Green / Canary deployments  
- Application Load Balancer + Target Groups  
- AWS ACM for backend TLS  
- Secrets Manager / Parameter Store rotation  

### Phase 3 – Cloud-Native
- ECS Fargate migration  
- Auto-scaling on CPU/memory  
- CloudWatch Alarms → SNS  
- S3 + CloudFront for React assets  

### Phase 4 – Global & Resilient
- Multi-AZ / Multi-Region  
- MongoDB Atlas Global Cluster  
- ElastiCache (Redis)  
- API Gateway + WAF  
- OpenTelemetry + AWS X-Ray  

### Phase 5 – DevEx & SRE
- Terraform / CDK IaC  
- Feature Flags (LaunchDarkly / Flagsmith)  
- Chaos Engineering (AWS FIS)  
- Cost & Performance dashboards (Grafana / Datadog)

---

## 🧪 Local Dev Quick-Start

```bash
# 1. Backend environment
cp api/.env.example api/.env
# 2. Start everything
docker compose up --build
# 3. Open
#   Backend → http://localhost:3001
#   Frontend → http://localhost:3000
📚 Runbooks & Quick Links
Table
Copy
Task	Command / URL
List ECR repos	aws ecr describe-repositories --region us-east-1
List EC2 instances	aws ec2 describe-instances --filters "Name=tag:Name,Values=esign-*"
View certificates	sudo certbot certificates
Check Nginx logs	sudo journalctl -u nginx
GitHub Secrets	Repo → Settings → Environments
Amplify Console	AWS Amplify