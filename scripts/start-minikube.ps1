[CmdletBinding()]
param(
  [string]$Driver = 'docker',
  [string]$Namespace = 'wonderland'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is required. Install it and rerun this script."
  }
}

function Invoke-Kubectl([string[]]$Arguments) {
  & kubectl @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "kubectl $($Arguments -join ' ') failed."
  }
}

function Apply-RenderedManifest([string]$Path) {
  $content = Get-Content -LiteralPath $Path -Raw
  $content = $content.Replace('__ECR_REGISTRY__/wonderland-production-api-gateway:__IMAGE_TAG__', 'wonderland-local/api-gateway:dev')
  $content = $content.Replace('__ECR_REGISTRY__/wonderland-production-auth-service:__IMAGE_TAG__', 'wonderland-local/auth-service:dev')
  $content = $content.Replace('__ECR_REGISTRY__/wonderland-production-user-service:__IMAGE_TAG__', 'wonderland-local/user-service:dev')
  $content = $content.Replace('__ECR_REGISTRY__/wonderland-production-business-service:__IMAGE_TAG__', 'wonderland-local/business-service:dev')
  $content = $content.Replace('imagePullPolicy: IfNotPresent', 'imagePullPolicy: Never')
  $content | & kubectl apply -f -
  if ($LASTEXITCODE -ne 0) {
    throw "Could not apply $Path."
  }
}

Require-Command minikube
Require-Command kubectl
Require-Command docker

$securePassword = Read-Host 'Create a disposable local MySQL password' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $databasePassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}

if ([string]::IsNullOrWhiteSpace($databasePassword)) {
  throw 'A local MySQL password is required.'
}

& minikube start "--driver=$Driver"
if ($LASTEXITCODE -ne 0) {
  throw 'Minikube failed to start.'
}
& kubectl config use-context minikube
if ($LASTEXITCODE -ne 0) {
  throw 'Could not select the Minikube kubectl context.'
}
& minikube addons enable ingress
if ($LASTEXITCODE -ne 0) {
  throw 'Could not enable the Minikube NGINX Ingress addon.'
}
Invoke-Kubectl @('-n', 'ingress-nginx', 'rollout', 'status', 'deployment/ingress-nginx-controller', '--timeout=5m')

$images = @(
  @{ Name = 'api-gateway'; Path = 'backend/api-gateway' },
  @{ Name = 'auth-service'; Path = 'backend/auth-service' },
  @{ Name = 'user-service'; Path = 'backend/user-service' },
  @{ Name = 'business-service'; Path = 'backend/business-service' },
  @{ Name = 'frontend'; Path = 'frontend' }
)

foreach ($image in $images) {
  $buildPath = Join-Path $repoRoot $image.Path
  $dockerfile = Join-Path $buildPath 'Dockerfile'
  & minikube image build -t "wonderland-local/$($image.Name):dev" -f $dockerfile $buildPath
  if ($LASTEXITCODE -ne 0) {
    throw "Could not build Minikube image $($image.Name)."
  }
}

Invoke-Kubectl @('apply', '-f', (Join-Path $repoRoot 'kubernetes/namespace.yaml'))

$secretArgs = @(
  '-n', $Namespace, 'create', 'secret', 'generic', 'wonderland-application',
  "--from-literal=DB_PASSWORD=$databasePassword",
  '--from-literal=STRIPE_SECRET_KEY=',
  '--from-literal=SMTP_HOST=',
  '--from-literal=SMTP_PORT=587',
  '--from-literal=SMTP_SECURE=false',
  '--from-literal=SMTP_USER=',
  '--from-literal=SMTP_PASSWORD=',
  '--from-literal=SMTP_FROM=Wonderland Theme Park <no-reply@wonderland.local>',
  '--dry-run=client', '-o', 'yaml'
)
& kubectl @secretArgs | & kubectl apply -f -
if ($LASTEXITCODE -ne 0) {
  throw 'Could not create the local application Secret.'
}

$configArgs = @(
  '-n', $Namespace, 'create', 'configmap', 'wonderland-config',
  '--from-literal=DB_HOST=mysql',
  '--from-literal=DB_PORT=3306',
  '--from-literal=DB_USER=root',
  '--from-literal=DB_NAME=wonderland_db',
  '--from-literal=FRONTEND_ORIGIN=http://wonderland.local',
  '--from-literal=AUTH_SERVICE_URL=http://auth-service.wonderland.svc.cluster.local:4001',
  '--from-literal=USER_SERVICE_URL=http://user-service.wonderland.svc.cluster.local:4002',
  '--from-literal=BUSINESS_SERVICE_URL=http://business-service.wonderland.svc.cluster.local:4003',
  '--from-literal=STRIPE_SUCCESS_URL=http://wonderland.local/payment-success?session_id={CHECKOUT_SESSION_ID}',
  '--from-literal=STRIPE_CANCEL_URL=http://wonderland.local/payment-cancel',
  '--dry-run=client', '-o', 'yaml'
)
& kubectl @configArgs | & kubectl apply -f -
if ($LASTEXITCODE -ne 0) {
  throw 'Could not create the local ConfigMap.'
}

Invoke-Kubectl @('apply', '-f', (Join-Path $repoRoot 'kubernetes/minikube/mysql.yaml'))
Invoke-Kubectl @('-n', $Namespace, 'rollout', 'status', 'deployment/mysql', '--timeout=5m')

Apply-RenderedManifest (Join-Path $repoRoot 'kubernetes/api-gateway-deployment.yaml')
Apply-RenderedManifest (Join-Path $repoRoot 'kubernetes/auth-service-deployment.yaml')
Apply-RenderedManifest (Join-Path $repoRoot 'kubernetes/user-service-deployment.yaml')
Apply-RenderedManifest (Join-Path $repoRoot 'kubernetes/business-service-deployment.yaml')
Invoke-Kubectl @('apply', '-f', (Join-Path $repoRoot 'kubernetes/services.yaml'))
Invoke-Kubectl @('apply', '-f', (Join-Path $repoRoot 'kubernetes/minikube/frontend.yaml'))
Invoke-Kubectl @('apply', '-f', (Join-Path $repoRoot 'kubernetes/minikube/ingress.yaml'))

foreach ($deployment in 'api-gateway', 'auth-service', 'user-service', 'business-service', 'frontend') {
  Invoke-Kubectl @('-n', $Namespace, 'rollout', 'status', "deployment/$deployment", '--timeout=5m')
}

$minikubeIp = (& minikube ip).Trim()
Write-Host ''
Write-Host 'Minikube deployment is ready.' -ForegroundColor Green
Write-Host "Add this line to your hosts file as Administrator: $minikubeIp wonderland.local api.wonderland.local"
Write-Host 'Then browse to: http://wonderland.local'
Write-Host "Inspect resources with: kubectl get deployments,pods,services,ingress -n $Namespace"
