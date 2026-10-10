# Wonderland EKS Migration

## Phase 1: Current implementation

The repository already has a React/Vite frontend, four Node.js services, ECR repositories, RDS MySQL, CloudFront/S3 hosting, ECS Fargate, and GitHub Actions using GitHub OIDC. The Vite application builds to `frontend/dist` and uses same-origin `/api` requests by default. This is compatible with the existing CloudFront API behavior.

This migration adds Kubernetes in parallel. It does not delete ECS, the existing ALB, RDS, S3, CloudFront, ECR repositories, or snapshots.

## Phase 2: Target architecture and cost

`infrastructure/eks-cluster.yaml` creates one EKS control plane and a one-node `t3.medium` managed EC2 node group. Nodes use the existing public subnets to avoid NAT Gateway charges in this coursework environment. The control plane also uses the private subnets. The existing RDS instance stays private; the EKS stack adds a MySQL ingress rule only from the EKS node security group.

The Kubernetes ALB exposes only the API Gateway. Auth, user, and business services are `ClusterIP` services, so they are not publicly accessible. CloudFront remains the public HTTPS endpoint. Once the EKS ALB `/health` endpoint passes, the deployment changes the existing CloudFront `/api/*` origin to the EKS ALB. ECS remains available for rollback.

| Item | Approximate monthly cost | Notes |
| --- | ---: | --- |
| EKS control plane | USD 73 | USD 0.10/hour while the Kubernetes version has standard support. |
| One `t3.medium` worker | USD 35-45 | On-demand estimate; a second node doubles this compute cost. |
| Worker EBS and public IPv4 | USD 5-10 | Depends on EBS size and allocated addresses. |
| EKS ALB | USD 20-35+ | ALB hourly charge plus LCUs. |
| NAT Gateway | USD 0 | Deliberately not created. |
| Existing RDS, CloudFront, S3, ECR | Existing charges continue | Usage-dependent. |

Confirm current Singapore pricing in the [AWS Pricing Calculator](https://calculator.aws/) before approval. EKS incurs a cluster fee even if no Pods run; extended-support Kubernetes versions cost more. See [EKS pricing](https://aws.amazon.com/eks/pricing/), [RDS MySQL pricing](https://aws.amazon.com/rds/mysql/pricing/), [ALB pricing](https://aws.amazon.com/elasticloadbalancing/pricing/), and [NAT Gateway pricing](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-pricing.html).

## Phase 3: New files

- `infrastructure/eks-cluster.yaml`: EKS, managed EC2 node group, security groups, RDS ingress, EKS Pod Identity, and the AWS Load Balancer Controller IAM role.
- `kubernetes/namespace.yaml`: the `wonderland` namespace.
- `kubernetes/configmap.yaml`: non-secret database and internal service configuration. GitHub Actions renders only deployment-time placeholders.
- `kubernetes/*-deployment.yaml`: one rolling Deployment per service with health probes, resource requests, and resource limits.
- `kubernetes/services.yaml`: internal `ClusterIP` Services for the four microservices.
- `kubernetes/ingress.yaml`: an ALB ingress that targets only the API Gateway.
- `kubernetes/aws-load-balancer-controller-service-account.yaml`: the service account for EKS Pod Identity.

The CD job reads the existing AWS Secrets Manager secret at deployment time and creates or updates the `wonderland-application` Kubernetes Secret. Database and integration credentials are not committed to Git.

## Phase 4: CI/CD and AWS Console actions

CI validates Docker builds, Node syntax, available tests, the React build, CloudFormation templates, and Kubernetes manifests.

Normal push deployment stays ECS-based. EKS runs only through **Actions -> Continuous Deployment -> Run workflow** with `deploy_eks` checked. The EKS job creates or updates `wonderland-eks`, configures `kubectl`, deploys commit-SHA ECR images, waits for rollouts, creates the ALB, health-checks it, promotes CloudFront to EKS, invalidates CloudFront, and checks the public URLs. Failed jobs print CloudFormation and Kubernetes events; they do not delete resources.

Before using that manual workflow, update the existing `wonderland-github-oidc` CloudFormation stack with `infrastructure/github-oidc-role.yaml`. This adds EKS deployment actions to `wonderland-github-actions-deployer` without changing its GitHub OIDC trust policy.

AWS Console: **CloudFormation -> wonderland-github-oidc -> Update -> Replace current template -> Upload template -> Next -> acknowledge IAM changes -> Update stack**. Wait for `UPDATE_COMPLETE`, then run the manual EKS workflow. This manual workflow is the approval point that creates billable EKS, EC2, and ALB resources.

## Phase 5: Frontend hosting and TLS

The existing main stack already has a private S3 bucket, CloudFront Origin Access Control, `DefaultRootObject: index.html`, and 403/404 SPA fallbacks. CD builds `frontend/dist`, uploads it, invalidates CloudFront, and prints the `FrontendUrl`. The EKS job verifies that frontend after backend promotion.

CloudFront is the public HTTPS endpoint. For a custom frontend domain, request an ACM certificate in `us-east-1` and attach it to CloudFront. For direct HTTPS access to the EKS ALB, request an ACM certificate in `ap-southeast-1`, add HTTPS listener annotations to `kubernetes/ingress.yaml`, and create a Route 53 alias to the ALB. Do not expose the internal services.

## Phase 6: Verify deployment

```bash
export AWS_REGION=ap-southeast-1
export EKS_CLUSTER=wonderland-production-eks
export EKS_STACK=wonderland-eks
export APP_STACK=wonderland-production

aws eks describe-cluster --region "$AWS_REGION" --name "$EKS_CLUSTER" --query 'cluster.status' --output text
aws eks update-kubeconfig --region "$AWS_REGION" --name "$EKS_CLUSTER"
kubectl get nodes -o wide
kubectl get deployments,pods,services,ingress -n wonderland
kubectl rollout status deployment/api-gateway -n wonderland
kubectl get ingress wonderland-api -n wonderland -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Expected output: `ACTIVE`, at least one `Ready` node, Available Deployments, Running Pods, internal ClusterIP services, and an ALB hostname.

```bash
aws ecr describe-images --region "$AWS_REGION" --repository-name wonderland-production-api-gateway --query 'imageDetails[].imageTags' --output json
aws cloudformation describe-stacks --region "$AWS_REGION" --stack-name "$APP_STACK" --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'||OutputKey=='ApiUrl'].[OutputKey,OutputValue]" --output table
kubectl logs deployment/auth-service -n wonderland --tail=100
```

For an RDS connection check, use a short-lived diagnostic Pod only when needed:

```bash
kubectl run mysql-check -n wonderland --rm -it --restart=Never --image=mysql:8 -- mysql -h "$(aws cloudformation describe-stacks --region "$AWS_REGION" --stack-name "$APP_STACK" --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text)" -u wonderlandadmin -p
```

Enter the database password only at the prompt; never put it in a command, a file, or GitHub logs.

## Retiring ECS

Keep ECS and its ALB during a validation window. Verify login, registration, bookings, Stripe test payment, QR generation, email resend, administrator functions, and API health through CloudFront. Roll back by setting the main stack `ApiOriginDomain` to an empty value, restoring the ECS ALB origin. Only after explicit approval and successful verification should ECS services, the old ALB, and Cloud Map be removed in a separate reviewed change.

EC2 worker nodes are compute machines in the EKS managed node group. Kubernetes Deployments state the desired Pod count and rollout behavior; the scheduler places Pods on Ready nodes. EKS manages the Kubernetes control plane, while the managed node group manages the EC2 node lifecycle.
