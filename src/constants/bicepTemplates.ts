import { DeploymentConfig } from '../types';

export const getStorageBicepCode = (config: DeploymentConfig) => {
  return `// Storage Account Module for ${config.projectName}
param location string = resourceGroup().location
param storageAccountName string
param storageSku string = '${config.storageSku}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: storageSku
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    encryption: {
      services: {
        file: {
          keyType: 'Account'
          enabled: true
        }
        blob: {
          keyType: 'Account'
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

@description('The Resource ID of the deployed Storage Account.')
output storageAccountId string = storageAccount.id

@description('The primary blob service endpoint URL.')
output primaryBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
`;
};

export const getAppServicePlanBicepCode = (config: DeploymentConfig) => {
  return `// App Service Plan Module for ${config.projectName}
param location string = resourceGroup().location
param appServicePlanName string
param skuName string = '${config.aspSkuName}'
param skuTier string = '${config.aspSkuTier}'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    reserved: ${config.dotnetVersion.startsWith('node') ? 'true' : 'false'}
  }
  kind: ${config.dotnetVersion.startsWith('node') ? '\'linux\'' : '\'app\''}
}

@description('The Resource ID of the App Service Plan.')
output appServicePlanId string = appServicePlan.id
`;
};

export const getAppServiceBicepCode = (config: DeploymentConfig) => {
  const linuxFxVersion = config.dotnetVersion === 'node18' ? 'NODE|18-lts' : config.dotnetVersion === 'node20' ? 'NODE|20-lts' : '';
  const isLinux = config.dotnetVersion.startsWith('node');
  
  return `// App Service / Web App Module
param location string = resourceGroup().location
param webAppName string
param appServicePlanId string
param appInsightsInstrumentationKey string
param appInsightsConnectionString string

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: ${config.enableHttpsOnly}
    siteConfig: {
      ${isLinux ? `linuxFxVersion: '${linuxFxVersion}'` : `netFrameworkVersion: '${config.dotnetVersion === 'v9.0' ? 'v9.0' : 'v8.0'}'`}
      appSettings: [
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsInstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: '${config.environmentType === 'prod' ? 'Production' : config.environmentType === 'test' ? 'Staging' : 'Development'}'
        }
        {
          name: 'WEBSITES_PORT'
          value: '8080'
        }
      ]
    }
  }
}

@description('The public domain endpoint of the Web App.')
output webAppUrl string = webApp.properties.defaultHostName
`;
};

export const getLogAnalyticsBicepCode = (config: DeploymentConfig) => {
  return `// Log Analytics Workspace Module
param location string = resourceGroup().location
param workspaceName string
param retentionInDays int = ${config.logAnalyticsRetentionDays}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2021-12-01-preview' = {
  name: workspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

@description('The Resource ID of the Log Analytics Workspace.')
output workspaceId string = logAnalyticsWorkspace.id
`;
};

export const getAppInsightsBicepCode = (config: DeploymentConfig) => {
  return `// Application Insights Module
param location string = resourceGroup().location
param appInsightsName string
param workspaceId string

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspaceId
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

@description('The Instrumentation Key of Application Insights.')
output instrumentationKey string = appInsights.properties.InstrumentationKey

@description('The Connection String of Application Insights.')
output connectionString string = appInsights.properties.ConnectionString
`;
};

export const getMainBicepCode = (config: DeploymentConfig) => {
  return `// Core Orchestration - main.bicep
targetScope = 'subscription'

@description('Primary location for all resources to be deployed')
param location string = '${config.location}'

@description('The base prefix name for infrastructure resources')
param projectName string = '${config.projectName}'

@description('Select target deployment environment')
@allowed([
  'dev'
  'test'
  'prod'
])
param environment string = '${config.environmentType}'

// Sku config parameters 
param storageSku string = '${config.storageSku}'
param appServicePlanSku string = '${config.aspSkuName}'
param appServicePlanTier string = '${config.aspSkuTier}'

// Naming variables following best practice patterns
var resourceGroupName = 'rg-\${projectName}-\${environment}'
var storageAccountName = 'st\${projectName}\${environment}\${uniqueString(subscription().subscriptionId, location)}'
var appServicePlanName = 'asp-\${projectName}-\${environment}'
var webAppName = 'app-\${projectName}-\${environment}'
var logAnalyticsWorkspaceName = 'law-\${projectName}-\${environment}'
var appInsightsName = 'appi-\${projectName}-\${environment}'

// Subscription Scope deployment for Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName
  location: location
  tags: {
    Project: projectName
    Environment: environment
    IaC: 'Bicep'
  }
}

// Log Analytics Module
module logAnalytics './modules/logAnalytics.bicep' = {
  scope: rg
  name: 'logAnalyticsDeploy'
  params: {
    location: location
    workspaceName: logAnalyticsWorkspaceName
  }
}

// Application Insights Module dependent on Workspace ResourceId
module appInsights './modules/applicationInsights.bicep' = {
  scope: rg
  name: 'appInsightsDeploy'
  params: {
    location: location
    appInsightsName: appInsightsName
    workspaceId: logAnalytics.outputs.workspaceId
  }
}

// Storage Account Module
module storage './modules/storage.bicep' = {
  scope: rg
  name: 'storageDeploy'
  params: {
    location: location
    storageAccountName: storageAccountName
    storageSku: storageSku
  }
}

// App Service Plan (Server Farm)
module appServicePlan './modules/appServicePlan.bicep' = {
  scope: rg
  name: 'appServicePlanDeploy'
  params: {
    location: location
    appServicePlanName: appServicePlanName
    skuName: appServicePlanSku
    skuTier: appServicePlanTier
  }
}

// App Service / Web App (Configured with App Insights appsettings)
module appService './modules/appService.bicep' = {
  scope: rg
  name: 'appServiceDeploy'
  params: {
    location: location
    webAppName: webAppName
    appServicePlanId: appServicePlan.outputs.appServicePlanId
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    appInsightsConnectionString: appInsights.outputs.connectionString
  }
}

// Outputs exported for pipeline or client use
@description('The name of the Resource Group created.')
output resourceGroupName string = resourceGroupName

@description('The fully qualified host name of the deployed App Service.')
output webAppUrl string = appService.outputs.webAppUrl

@description('The created Storage Account unique name.')
output storageAccountName string = storageAccountName
`;
};

export const getMainParametersJson = (config: DeploymentConfig) => {
  return `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "location": {
      "value": "${config.location}"
    },
    "projectName": {
      "value": "${config.projectName}"
    },
    "environment": {
      "value": "${config.environmentType}"
    },
    "storageSku": {
      "value": "${config.storageSku}"
    },
    "appServicePlanSku": {
      "value": "${config.aspSkuName}"
    },
    "appServicePlanTier": {
      "value": "${config.aspSkuTier}"
    }
  }
}`;
};

export const getDeployPowershell = (config: DeploymentConfig) => {
  return `# Azure Infrastructure Deployment Script - ${config.projectName}
# This script authenticates and deploys main.bicep using Azure CLI inside PowerShell.

$SubscriptionId = "" # Put Azure Subscription ID here
$Location = "${config.location}"
$ProjectName = "${config.projectName}"
$Environment = "${config.environmentType}"

# Step 1: Ensure logged into Azure
Write-Host "Verifying Azure CLI Authentication status..." -ForegroundColor Cyan
$AzSession = az account show --query "id" -o tsv 2>$null

if ([string]::IsNullOrEmpty($AzSession)) {
    Write-Host "No active session. Initiating 'az login'..." -ForegroundColor Yellow
    az login
} else {
    Write-Host "Active Azure Subscription connected list ID: $AzSession" -ForegroundColor Green
}

if ($SubscriptionId -ne "") {
    Write-Host "Setting subscription scope to $SubscriptionId" -ForegroundColor Cyan
    az account set --subscription $SubscriptionId
}

# Step 2: Run dry-run validation (What-if deployment)
Write-Host "Pre-checking blueprints: Running deployment 'What-if' verification dry-run..." -ForegroundColor Cyan
az deployment sub what-if \`
  --location $Location \`
  --template-file ./main.bicep \`
  --parameters ./main.parameters.json

$DeployChoice = Read-Host "Do you want to proceed with executing full provisioning in Azure? (Y/N)"
if ($DeployChoice -ne "Y" -and $DeployChoice -ne "y") {
    Write-Host "Deployment deployment aborted by user." -ForegroundColor Yellow
    Exit
}

# Step 3: Execute actual deployment
Write-Host "Launching full infrastructure deployment on Azure subscription scope..." -ForegroundColor Green
$DeploymentName = "Deploy-\$ProjectName-\$Environment-\$(Get-Date -Format 'yyyyMMddHHmmss')"

$Result = az deployment sub create \`
  --name $DeploymentName \`
  --location $Location \`
  --template-file ./main.bicep \`
  --parameters ./main.parameters.json \`
  --output json

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment SUCCESSFUL! Modular Bicep template components configured." -ForegroundColor Green
    $ParsedOutputs = $Result | ConvertFrom-Json
    Write-Host "Outputs generated:" -ForegroundColor Yellow
    Write-Host "Resource Group: " $ParsedOutputs.properties.outputs.resourceGroupName.value -ForegroundColor White
    Write-Host "Web App URL:    " https://$ParsedOutputs.properties.outputs.webAppUrl.value -ForegroundColor White
    Write-Host "Storage Name:   " $ParsedOutputs.properties.outputs.storageAccountName.value -ForegroundColor White
} else {
    Write-Error "Deployment FAILED. Inspect outputs, policy violations or subscription balance."
}
`;
};

export const getReadmeMarkdown = (config: DeploymentConfig) => {
  return `# Azure Web App Infrastructure (IaC with Bicep)

![Bicep Badge](https://img.shields.io/badge/Azure-Bicep-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Environment Badge](https://img.shields.io/badge/Environment-${config.environmentType.toUpperCase()}-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A portfolio-worthy repository showing **Infrastructure-as-Code (IaC)** best practices on Microsoft Azure using modular **Bicep** templates. 

Deploy a robust, modern serverless web application infrastructure configured with full application performance monitoring (APM) and diagnostic tracking.

## 🏗️ Architecture

The infrastructure deploys a subscription-scoped template that provisions a dedicated resource group housing the following interconnected Azure resources:

\`\`\`
                    +-----------------------------+
                    | Subscription Scope          |
                    | [Resource Group Created]    |
                    +--------------+--------------+
                                   |
        +--------------------------+--------------------------+
        |                          |                          |
+-------v-------+          +-------v-------+          +-------v-------+
|  Storage      |          |  App Service  |          | Log Analytics |
|  Account      |          |  Plan (Linux) |          | Workspace     |
| [Static/Blob] |          +-------+-------+          +-------+-------+
+---------------+                  |                          ^
                               +---v---+                      | (Sends Logs)
                               |  Web  |                      |
                               |  App  |------------+         |
                               +-------+            |         |
                                                    |         |
                                             +------v---------+-----+
                                             | Application Insights |
                                             |  [APM & Live Metrics]|
                                             +----------------------+
\`\`\`

## 🌟 Concepts Showcased

1. **Modular Template Design:** Distinct templates manage separate resource concerns (\`storage\`, \`hosting\`, \`monitoring\`) which are connected using secure inputs/outputs in \`main.bicep\`.
2. **Subscription-Scoped Deployments:** Automatically generates its own Resource Group targets within the specified Subscription and propagates regional deployments safely.
3. **Automated Resource References:** The Web App automatically receives Application Insights connection strings and Instrumentation keys directly from outputs via implicit module dependency chains.
4. **Subscription Parameterization:** Leverages parameter configurations with strict conditional parameters (e.g. environment restrictions).
5. **Durable Enterprise APM:** Logs from Application Insights are tied cleanly into a central Log Analytics Workspace.

## 📁 Repository Structure

\`\`\`
azure-bicep-infrastructure/
├── main.bicep                 # Central orchestration & Subscription-scope entry point
├── main.parameters.json       # Configured parameter schema variables
├── README.md                  # This high-quality documentation file
├── modules/
│   ├── storage.bicep          # Storage Account setup parameter configurations
│   ├── appServicePlan.bicep   # Pricing tier server hosting setup configurations
│   ├── appService.bicep       # App Service instance & application settings injection
│   ├── logAnalytics.bicep     # Centralized workspace logs retention
│   └── applicationInsights.bicep # Application performance metrics & dashboards
└── scripts/
    └── deploy.ps1             # PowerShell script leveraging Azure CLI for pipeline setup
\`\`\`

## 🚀 Deployment Steps

### Prerequisites
1. **Azure CLI** (version \`2.50.0\` or higher) & **Bicep CLI**.
2. **PowerShell 7** (if executing the helper deployment scripts).
3. An active **Azure Subscription**.

### Running the Deployment
You can deploy directly using Azure CLI:

\`\`\`bash
# 1. Login into your Azure command cell
az login

# 2. Scope to subscription of choice 
az account set --subscription "<YOUR-SUBSCRIPTION-ID>"

# 3. Trigger subscription deployment 
az deployment sub create \\
  --name "BicepLaunchDeploy" \\
  --location "${config.location}" \\
  --template-file ./main.bicep \\
  --parameters ./main.parameters.json
\`\`\`

Alternatively, execute the PowerShell script:
\`\`\`powershell
./scripts/deploy.ps1
\`\`\`

## 📊 Deployment Outputs

Upon successful completion, Bicep returns several outputs:
- **\`resourceGroupName\`**: Regional Resource Group containing resources.
- **\`webAppUrl\`**: Public web address.
- **\`storageAccountName\`**: Deployed Storage Name.
`;
};

export const CONCEPT_EXPLANATIONS = {
  parameters: {
    title: 'Parameters',
    desc: 'Parameters allow deployments to be flexible and reusable across distinct projects or environments. Users inject runtime factors such as project names, environment types, regions, and size specifications.',
    bicepSnippet: `param location string = 'eastus'
@allowed(['dev', 'test', 'prod'])
param environment string = 'dev'
param storageSku string`
  },
  variables: {
    title: 'Variables',
    desc: 'Variables hold values computed inside the template to simplify code maintenance. They are evaluated at compile time and reduce repeating expressions.',
    bicepSnippet: `var resourceGroupName = 'rg-\${projectName}-\${environment}'
var storageAccountName = 'st\${projectName}\${environment}\${uniqueString(subscription().subscriptionId, location)}'`
  },
  modules: {
    title: 'Modules',
    desc: 'Modules are separate Bicep files called by a main orchestration template. They isolate resource boundaries, make infrastructure templates highly modular, and enable developers to reuse templates easily.',
    bicepSnippet: `module storage './modules/storage.bicep' = {
  scope: rg
  name: 'storageDeploy'
  params: {
    location: location
    storageAccountName: storageAccountName
    storageSku: storageSku
  }
}`
  },
  outputs: {
    title: 'Outputs',
    desc: 'Outputs allow modules or child structures to produce values that can be passed to subsequent modules or exposed to deployment engines (like Azure Devops, GitHub Actions, or local terminals).',
    bicepSnippet: `output webAppUrl string = appService.outputs.webAppUrl
output primaryBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob`
  },
  resourceReferences: {
    title: 'Resource References',
    desc: 'Bicep dynamically references properties of already declared resources or modules using dot notation. This ensures that runtime properties like IP addresses and endpoints are populated smoothly.',
    bicepSnippet: `workspaceId: logAnalytics.outputs.workspaceId
appServicePlanId: appServicePlan.outputs.appServicePlanId`
  },
  dependencies: {
    title: 'Dependencies & Order',
    desc: 'Bicep automatically manages implicit dependencies when you reference one template\'s outputs in another template\'s parameters. This guarantees that Log Analytics is completed BEFORE Application Insights begins, and App Insights is ready BEFORE Web App configure settings.',
    bicepSnippet: `// Bicep automates deploying App Insights only after logAnalytics.outputs.workspaceId is ready
workspaceId: logAnalytics.outputs.workspaceId`
  }
};
