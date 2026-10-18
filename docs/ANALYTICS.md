# Wonderland Monitoring And Analytics

## What is deployed

The analytics pipeline uses the existing private RDS MySQL instance as its source of truth. The business service creates privacy-safe reporting views during startup, the CD workflow creates separate database accounts, and Metabase runs as an internal EKS `ClusterIP` service.

No visitor names, email addresses, contact numbers, authentication tokens, or payment-provider identifiers are exposed through the reporting views.

| Report | Source | Measures |
| --- | --- | --- |
| Daily arrivals | `analytics_daily_arrivals` | Arrived bookings and visitors, grouped by check-in date |
| Ticket purchases | `analytics_ticket_purchases` | Paid bookings, ticket quantities, and paid revenue by ticket type/currency/date |
| Ride popularity | `analytics_ride_popularity` | Daily aggregate attraction impressions from the public attraction list |
| Busiest times | `analytics_busiest_times` | Paid booking and ticket demand by requested visit date and time slot |

The frontend sends each displayed attraction ID at most once per browser session per UTC day. This is an aggregate interest signal, not user tracking. Failed analytics events are ignored so they cannot interrupt normal browsing or bookings.

## Security model

CloudFormation creates and retains three separate Secrets Manager secrets:

- `wonderland/production/analytics-reporting`: the `wonderland_reporting` account. It has `SELECT` only on the four analytics views.
- `wonderland/production/metabase-metadata`: the `wonderland_metabase` account. It can manage only the separate `metabase` application database used by Metabase itself.
- `wonderland/production/metabase-encryption`: the Metabase encryption key.

The CD workflow reads these values without printing them, creates Kubernetes Secrets, and runs `wonderland-analytics-bootstrap` once. The Job creates the Metabase database and grants the reporting account access only to the named analytics views. Its temporary bootstrap Secret is deleted immediately after the Job completes; the completed Job is deleted automatically one hour later.

Metabase has no Ingress and no public LoadBalancer. Access it through authenticated Kubernetes access only:

```powershell
aws eks update-kubeconfig --region ap-southeast-1 --name wonderland-production-eks
kubectl port-forward --namespace wonderland service/metabase 3000:3000
```

Open `http://localhost:3000` and create the initial Metabase administrator account. This account is local to Metabase; it is not a Cognito user.

## Connect Metabase To Reporting Data

1. In Metabase, select **Add database** and choose **MySQL**.
2. Use the RDS endpoint from the `DatabaseEndpoint` output of `wonderland-production`, port `3306`, and the application database name from `DatabaseApplicationName`.
3. Retrieve the username and password from the `AnalyticsReportingSecretArn` output in AWS Secrets Manager. Do not copy the application database password or the Metabase metadata password into this connection.
4. Enable the encrypted MySQL connection option if your RDS configuration requires it.
5. Sync the schema. The reporting account can see only these four views, so saved questions cannot query personal booking data.

Create these dashboard cards:

- A line chart: `arrival_date` versus `arrived_visitors` from `analytics_daily_arrivals`.
- A stacked bar or table: `purchase_date`, `ticket_label`, `tickets_purchased`, and `paid_revenue` from `analytics_ticket_purchases`.
- A descending bar chart: `activity_name` versus `interest_events` from `analytics_ride_popularity`.
- A heat map or grouped bar chart: `visit_date` and `preferred_time_slot` versus `paid_tickets` from `analytics_busiest_times`.

Filter every card by the date column where applicable. Keep currency codes separated when showing revenue; the application supports more than one currency.

## Operational Monitoring

EKS control-plane API, audit, and authenticator logs are enabled in `infrastructure/eks-cluster.yaml`. Review them in CloudWatch Logs under the EKS cluster log group. Application availability remains observable from Kubernetes readiness and the public API health endpoint:

```powershell
kubectl get deployments,pods,services,jobs --namespace wonderland
kubectl logs job/wonderland-analytics-bootstrap --namespace wonderland
kubectl get ingress wonderland-api --namespace wonderland
```

The CD workflow waits for the business-service rollout, the analytics bootstrap Job, and the Metabase rollout. A failed Job or failed rollout stops deployment; it does not publish a misleading healthy status.

### Metabase account recovery

The bootstrap Job preserves an existing `wonderland_metabase` MySQL account. It does not reset that account on every deployment because it can own existing MySQL views. If the Job reports that the account is missing but is still a `DEFINER` for one or more views, do not drop the views or create a replacement account blindly. Use an RDS database administrator session to inspect the view definitions, recreate only the listed views with a valid application or administrator definer, and then rerun CD. The Job prints the affected schema and view names without revealing passwords.

## Retention And Changes

The analytics views retain only aggregate data derived from existing booking/check-in records. Their historical range therefore follows the existing RDS retention and backup policy. Before changing view definitions or credentials, update the CloudFormation stack and rerun CD so the bootstrap Job reapplies the intended least-privilege grants.
