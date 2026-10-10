# Wonderland AWS CI/CD

This project uses GitHub Actions and AWS CloudFormation to build, validate, provision, and deploy the Wonderland microservices platform.

## Deployment Architecture

```text
GitHub Actions
  |-- CI: install, syntax-check, React build, Docker builds
  |-- CD: deploy CloudFormation, push containers, publish frontend
       |
       +--> Amazon ECR: four versioned service images
       +--> Amazon ECS Fargate: API Gateway, Auth, User, Business services
       +--> Application Load Balancer: routes public API traffic to API Gateway
       +--> CloudFront: public website and /api/* routing
       +--> Amazon S3: React production build
       +--> Amazon RDS MySQL: private application database
       +--> Secrets Manager: database, Stripe, and SMTP secrets
       +--> CloudWatch Logs: service logs and ECS Container Insights
```

The CloudFormation template is [wonderland-infrastructure.yaml](../wonderland-infrastructure.yaml). It uses two public subnets for Fargate and the load balancer, plus two private subnets for RDS.

## Pipeline Files

| File | Purpose |
| --- | --- |
| `.github/workflows/ci.yml` | Runs for pull requests and pushes. It installs dependencies, checks Node.js syntax, builds the React frontend, and builds all four service images. |
| `.github/workflows/cd.yml` | Runs only on `main` or manually. It deploys the AWS stack, pushes images to ECR, deploys the React build to S3, restarts ECS services, and invalidates CloudFront. |
| `infrastructure/github-oidc-role.yaml` | One-time bootstrap template that creates the GitHub Actions OIDC provider and deployment role. |
| `wonderland-infrastructure.yaml` | Main AWS infrastructure-as-code template. |

## One-Time AWS Setup

1. Install and configure the AWS CLI locally with an AWS identity allowed to create CloudFormation and IAM resources.

2. Create the GitHub OIDC deployment role. Replace the example values with your GitHub owner and repository name:

```powershell
aws cloudformation deploy `
  --stack-name wonderland-github-oidc `
  --template-file infrastructure/github-oidc-role.yaml `
  --capabilities CAPABILITY_NAMED_IAM `
  --parameter-overrides `
    ProjectName=wonderland
```

3. In the CloudFormation stack outputs, copy `DeploymentRoleArn`.

4. In GitHub, open `Settings -> Secrets and variables -> Actions` and add these repository secrets:

| Secret | Value |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | `DeploymentRoleArn` from the bootstrap stack. |
| `DB_PASSWORD` | New MySQL password, 8-64 characters. Only use letters, digits, and `! # $ % ^ & * ( ) _ + . -`. |

5. Push a commit to `main`. The first CD run creates the AWS infrastructure and ECR repositories, publishes the images, then starts the ECS services.

The workflow uses short-lived GitHub OIDC credentials. Do not add AWS access keys to GitHub secrets.

## Payment and Email Secrets

The main stack creates an AWS Secrets Manager secret with the output name `ApplicationSecretsArn`. After the first deployment, update its JSON value in AWS Secrets Manager while preserving `DB_PASSWORD`:

```json
{
  "DB_PASSWORD": "your-existing-database-password",
  "STRIPE_SECRET_KEY": "sk_test_or_live_key",
  "SMTP_HOST": "smtp.example.com",
  "SMTP_PORT": "587",
  "SMTP_SECURE": "false",
  "SMTP_USER": "smtp-user",
  "SMTP_PASSWORD": "smtp-password",
  "SMTP_FROM": "Wonderland Theme Park <no-reply@example.com>"
}
```

Then rerun the CD workflow or force a new ECS deployment so tasks read the new secret values.

## Manual Infrastructure Validation

After configuring the AWS CLI, validate the template before a manual deployment:

```powershell
aws cloudformation validate-template --template-body file://wonderland-infrastructure.yaml
```

## Cost and Cleanup

This template creates billable AWS services, including an Application Load Balancer, ECS Fargate tasks, RDS MySQL, CloudFront, S3, ECR, Secrets Manager, and CloudWatch logs. Use a separate AWS budget and delete the stack when your demonstration is complete.

The S3 frontend bucket and RDS database use retain/snapshot protection so important application data is not accidentally deleted with the stack. Delete retained resources manually only after confirming they are no longer needed.

## Security Notice

`AWS/wonderland-key.pem` is currently tracked by Git. The new `.gitignore` protects future `.pem` files, but it cannot protect a file already committed. Rotate that EC2 key pair in AWS, then remove the key from Git tracking without deleting your local copy:

```powershell
git rm --cached AWS/wonderland-key.pem
git add .gitignore
git commit -m "chore: remove tracked AWS private key"
```

If the key was ever pushed to a remote repository, rotate it before any other deployment activity.

