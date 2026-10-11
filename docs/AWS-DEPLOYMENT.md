# Wonderland AWS Deployment

## Scope and architecture

This deployment keeps the completed React and Node.js application unchanged. CloudFormation provisions the shared `wonderland-production` stack (VPC, public/private subnets, ECR, private RDS MySQL, Secrets Manager, legacy S3/CloudFront, and rollback ECS resources), `wonderland-eks` (EKS and managed EC2 nodes), and `wonderland-amplify` (the public React frontend).

The live backend is EKS: the AWS Load Balancer Controller exposes only `api-gateway`; the auth, user, and business services remain internal ClusterIP services. CloudFront routes `/api/*` to the EKS ALB after its health check. ECS is retained as a rollback path and is not deleted automatically.

Cognito is not provisioned. The completed application uses its existing Node.js visitor and administrator authentication flow; adding Cognito would require changing the application's authentication contracts and is outside this infrastructure-only deployment.

## Prerequisites

1. Use AWS account `840514731609` in `ap-southeast-1`.
2. GitHub Environment `production` must contain the `AWS_DEPLOY_ROLE_ARN` secret for `wonderland-github-actions-deployer`.
3. Update the `wonderland-github-oidc` stack from `infrastructure/github-oidc-role.yaml` before an EKS deployment. This preserves the immutable GitHub OIDC subject and adds the EKS and node-group permissions required by the deployment workflow.
4. In AWS Secrets Manager, manually create `wonderland/production/amplify-github-token` as JSON with a `token` key. Use a GitHub fine-grained token that can read `wshsenanayaka/SE6020-wonderland-` and authorize the Amplify GitHub App. Never commit this token or add it to GitHub Actions secrets.

```json
{"token":"YOUR_GITHUB_FINE_GRAINED_TOKEN"}
```

The Amplify stack resolves this value directly from Secrets Manager. It is not printed in CloudFormation or workflow logs.

## Deployment order

1. Update `wonderland-github-oidc` in CloudFormation with `CAPABILITY_NAMED_IAM`.
2. Push to `main` or run **Continuous Deployment** manually.
3. The workflow validates templates, creates or updates `wonderland-production`, creates ECR repositories, pushes commit-SHA images, and publishes the legacy CloudFront frontend for rollback.
4. It deploys `wonderland-amplify`, starts and waits for an Amplify build of `frontend`, then prints the Amplify URL.
5. It deploys `wonderland-eks`, waits for the EKS cluster and `primary` managed node group, installs the AWS Load Balancer Controller, creates the Kubernetes Secret from Secrets Manager, applies manifests, waits for rollouts, and promotes CloudFront `/api/*` to the EKS ALB.

The workflow fails rather than reporting success when the Amplify GitHub token secret, Amplify build, EKS node group, Kubernetes rollout, or endpoint health check fails.

The Amplify app is a static Vite `WEB` application. It has no Amplify backend or SSR compute resources, so CloudFormation does not configure `IAMServiceRole` or `ComputeRoleArn`. Before every build, the workflow explicitly sets `WEB`, clears both optional role associations, and requires three consecutive role-free configuration reads before starting the build. This prevents a stale IAM role association from causing `Unable to assume specified IAM Role`.

## Frontend and API URLs

Get the URLs from workflow logs or CloudFormation outputs:

```powershell
aws cloudformation describe-stacks `
  --region ap-southeast-1 `
  --stack-name wonderland-amplify `
  --query "Stacks[0].Outputs[?OutputKey=='AmplifyFrontendUrl'].OutputValue" `
  --output text

aws cloudformation describe-stacks `
  --region ap-southeast-1 `
  --stack-name wonderland-production `
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" `
  --output text
```

Amplify receives the CloudFront origin as `VITE_API_BASE_URL` at build time; the existing frontend helper appends `/api` to requests. EKS receives the Amplify URL as `FRONTEND_ORIGIN`, plus the corresponding Stripe success and cancel URLs, through its generated ConfigMap.

## Verification

```powershell
$region = 'ap-southeast-1'
aws cloudformation describe-stacks --region $region --stack-name wonderland-production --query 'Stacks[0].StackStatus' --output text
aws cloudformation describe-stacks --region $region --stack-name wonderland-eks --query 'Stacks[0].StackStatus' --output text
aws cloudformation describe-stacks --region $region --stack-name wonderland-amplify --query 'Stacks[0].StackStatus' --output text
aws eks describe-cluster --region $region --name wonderland-production-eks --query 'cluster.status' --output text
aws eks describe-nodegroup --region $region --cluster-name wonderland-production-eks --nodegroup-name primary --query 'nodegroup.status' --output text
aws ecr describe-repositories --region $region --repository-names wonderland-production-api-gateway wonderland-production-auth-service wonderland-production-user-service wonderland-production-business-service
aws eks update-kubeconfig --region $region --name wonderland-production-eks
kubectl get nodes -o wide
kubectl get deployments,pods,services,ingress -n wonderland
kubectl rollout status deployment/api-gateway -n wonderland
```

Expected values are `UPDATE_COMPLETE` or `CREATE_COMPLETE` for the stacks, `ACTIVE` for EKS and its node group, Ready Kubernetes nodes, and Running/Ready Pods. Use the workflow's printed Amplify URL for the HTTPS frontend check.

## AWS Console verification

- **CloudFormation** -> **Stacks**: verify `wonderland-github-oidc`, `wonderland-production`, `wonderland-amplify`, and `wonderland-eks` are `UPDATE_COMPLETE` or `CREATE_COMPLETE`.
- **Amplify** -> `wonderland-production-frontend` -> **App settings** -> **General**: confirm the app platform is `WEB` and the service role is not set. Then open `main` to inspect the latest deployment, build-step logs, and generated frontend URL.
- **ECR** -> **Private repositories**: verify each `wonderland-production-*` repository has an image tagged with the Git commit SHA.
- **EKS** -> **Clusters** -> `wonderland-production-eks`: check the `primary` managed node group and the Resources view for the Wonderland workloads.
- **EC2** -> **Instances**: filter by the `aws:eks:cluster-name` tag with value `wonderland-production-eks` to see the managed worker nodes.
- **EC2** -> **Load balancers**: find the internet-facing EKS application load balancer created for `wonderland-api`; its target group must show healthy API gateway targets.

## Recovery and common errors

| Symptom | Safe action |
| --- | --- |
| `iam:ListAttachedRolePolicies` denied | Update `wonderland-github-oidc` with the current OIDC role template, wait for `UPDATE_COMPLETE`, then rerun CD. |
| EKS stack is `ROLLBACK_COMPLETE` or `ROLLBACK_FAILED` | Read CloudFormation Events, resolve the specific retained resource or permission issue, then recover or manually delete only the failed EKS stack. Never delete the database stack automatically. |
| Amplify token secret missing | Create the specified Secrets Manager secret with JSON key `token`, then rerun CD. |
| Amplify cannot assume an IAM role | Confirm the app platform is `WEB`, then rerun CD. It clears stale service and compute roles in place and verifies the result before starting the build. If the verification still fails, remove both role values in Amplify **App settings** -> **General**, save, then rerun CD. |
| Pods are not Ready | Read `kubectl get events -n wonderland --sort-by=.lastTimestamp` and `kubectl logs deployment/<service> -n wonderland`. |
| Amplify URL cannot call the API | Confirm the EKS ConfigMap has the Amplify URL in `FRONTEND_ORIGIN`, then restart the affected deployment. |

## Cost and cleanup

For a coursework demonstration, the largest recurring costs are the EKS control plane, one `t3.medium` managed EC2 node, the EKS ALB, RDS MySQL, and legacy ALB/ECS rollback resources. Amplify, ECR, S3, CloudFront, CloudWatch Logs, and Secrets Manager are usage-based. No NAT Gateway is created. Verify current Singapore pricing in the [AWS Pricing Calculator](https://calculator.aws/) before each deployment.

After the viva, first remove the EKS and Amplify stacks manually after confirming they are no longer needed. Keep `wonderland-production` until database exports and CloudFront/S3 retention requirements are understood: RDS production deletion uses snapshots and the frontend bucket and application secret are retained. Do not use automatic cleanup or `--force` deletion for stateful resources.

## Deployment status checklist

| Item | Status before a successful CD run |
| --- | --- |
| CloudFormation templates | Validated locally in CI |
| `wonderland-production` stack | Requires AWS verification |
| `wonderland-eks` EKS cluster and EC2 node group | Requires AWS verification |
| ECR images pushed | Requires AWS verification |
| Kubernetes Deployments and Pods Ready | Requires AWS verification |
| RDS available and private | Requires AWS verification |
| Amplify frontend public URL | Requires Amplify token secret and AWS verification |
| GitHub Actions deployment | Requires a successful `main` workflow run |
