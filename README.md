# Azure Infrastructure as Code with Bicep

Deploying production-ready Azure infrastructure using **Azure Bicep**, Microsoft's Infrastructure as Code (IaC) language for Azure Resource Manager (ARM).

This project demonstrates how to provision and manage Azure resources using reusable, modular Bicep templates while following Infrastructure as Code best practices.

---

## 🚀 Overview

This repository provisions a simple Azure web application environment using modular Bicep templates.

The infrastructure includes:

- Azure App Service Plan
- Azure Web App
- Azure Storage Account
- Log Analytics Workspace
- Application Insights

The project showcases reusable infrastructure modules, parameterized deployments, resource dependencies, and Azure CLI deployment workflows.

---

## 🏗 Architecture

```
                   Resource Group
                         │
     ┌───────────────────┼────────────────────┐
     │                   │                    │
     │                   │                    │
Storage Account     App Service Plan   Log Analytics
                           │                  │
                           │                  │
                      Azure Web App     Application Insights
```

---

## 📂 Project Structure

```
azure-bicep-infrastructure
│
├── main.bicep
├── main.parameters.json
├── README.md
│
├── modules
│   ├── storage.bicep
│   ├── appServicePlan.bicep
│   ├── appService.bicep
│   ├── logAnalytics.bicep
│   └── applicationInsights.bicep
│
├── scripts
│   └── deploy.ps1
│
└── images
    └── architecture.png
```

---

## ✨ Features

- Modular Bicep templates
- Parameterized deployments
- Infrastructure as Code (IaC)
- Azure Resource Manager deployment
- Reusable infrastructure modules
- Resource dependency management
- Production-style folder organization
- Azure CLI deployment support

---

## 🛠 Technologies

- Azure Bicep
- Azure Resource Manager (ARM)
- Azure CLI
- Azure App Service
- Azure Storage
- Azure Monitor
- Application Insights

---

## 📦 Resources Deployed

| Resource | Purpose |
|----------|---------|
| Storage Account | Object and file storage |
| App Service Plan | Compute hosting |
| Azure Web App | Web application hosting |
| Log Analytics Workspace | Centralized logging |
| Application Insights | Application monitoring |

---

## ⚙ Deployment

Login to Azure

```bash
az login
```

Create a Resource Group

```bash
az group create \
    --name rg-bicep-demo \
    --location eastus
```

Deploy the infrastructure

```bash
az deployment group create \
    --resource-group rg-bicep-demo \
    --template-file main.bicep \
    --parameters main.parameters.json
```



## 📈 Learning Outcomes

Through this project I explored:

- Azure Bicep syntax
- Infrastructure as Code principles
- ARM template deployments
- Resource dependencies
- Modular infrastructure design
- Azure CLI deployments
- Monitoring and diagnostics integration

---

## 🔮 Future Improvements

- Virtual Network deployment
- Azure Key Vault integration
- Azure SQL Database
- GitHub Actions CI/CD
- Azure Container Registry
- Custom Domains
- Managed Identity
- Private Endpoints

---

## 👩‍💻 Author

**Sankeerthana Verneni**

AI & Cloud Engineer

- GitHub: https://github.com/sankeerthana0
- LinkedIn: https://linkedin.com/sankeerthana-verneni-deploy

---

## ⭐ If you found this project useful, consider giving it a star!
