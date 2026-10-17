# Local Minikube Deployment

This local environment is separate from AWS. It runs the React frontend, four Node.js services, and a disposable MySQL instance in Minikube. It does not use EKS, ECR, RDS, Cognito, CloudFront, Stripe, AWS secrets, or any production credentials.

## Prerequisites

- Docker Desktop running.
- Minikube installed.
- `kubectl` installed.
- PowerShell on Windows.

Check the tools:

```powershell
docker version
minikube version
kubectl version --client
```

## Start

From the repository root, run:

```powershell
.\scripts\start-minikube.ps1
```

The script prompts for a disposable local MySQL password without writing it to a file. It then starts Minikube, enables the NGINX Ingress addon, builds images directly into Minikube, creates the namespace/configuration/secret, deploys MySQL and all Wonderland workloads, and waits for the rollouts.

When the script prints the Minikube IP, open an Administrator PowerShell window and add this line to the Windows hosts file at `C:\Windows\System32\drivers\etc\hosts`:

```text
<MINIKUBE_IP> wonderland.local api.wonderland.local
```

Open `http://wonderland.local` after saving the hosts file.

## Local authentication

The Minikube ConfigMap intentionally does not set Cognito values. The services therefore use the legacy local login behavior with the disposable local MySQL database. Cognito remains enabled only in AWS where CD injects the Cognito configuration.

## Useful commands

```powershell
kubectl config use-context minikube
kubectl get deployments,pods,services,ingress -n wonderland
kubectl get events -n wonderland --sort-by=.lastTimestamp
kubectl logs deployment/api-gateway -n wonderland --tail=100
kubectl rollout restart deployment/api-gateway -n wonderland
```

## Stop or remove

Stop the local cluster:

```powershell
minikube stop
```

Delete all local Minikube resources, including the disposable MySQL volume:

```powershell
minikube delete
```

Neither command changes AWS resources.
