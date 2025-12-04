# Edge Function Troubleshooting Runbook

**Date:** November 30, 2025
**Related To:** Worker Service Role Fallback (CODEBASE_REVIEW_2025_11.md § C.4)

## Context

The `team-gateway` Cloudflare Worker currently implements a fallback mechanism using the `SUPABASE_SERVICE_ROLE_KEY` when Supabase Edge Functions fail. This runbook provides detailed procedures for investigating Edge Function failures, monitoring the system during remediation, and safely removing the fallback logic.

**Location in codebase:** `workers/team-gateway/src/index.ts` lines 155-253

## Roles & Responsibilities

| Role                    | Responsibility                                                                | Contact                      |
| :---------------------- | :---------------------------------------------------------------------------- | :--------------------------- |
| **On-Call Engineer**    | Execution of investigation, initial triage, and rollback execution if needed. | On-Call Pager / #ops-channel |
| **SRE / DevOps Lead**   | Deployment authority, infrastructure verification, and rollback approval.     | @infra-lead                  |
| **Product Lead**        | Approval for feature disabling or fallback removal decisions.                 | @product-owner               |
| **Observability Owner** | Monitoring the 24-hour post-removal window and verifying alerts.              | @monitoring-lead             |

## Observed Failure Modes to Investigate

Before removing the fallback, understand which failure modes are occurring:

- **Timeouts**: Edge Function execution exceeds cold start + processing time
- **4xx authentication errors**: JWT expired, invalid token, missing auth header
- **5xx internal errors**: Database connection failures, RLS policy violations
- **Payload validation failures**: Malformed request body, missing required fields
- **Rate limiting**: Supabase Edge Function quotas exceeded

## Baseline / Pre-removal Verification

Before starting any changes, establish a performance baseline:

1.  **Measure Fallback Rate**: Query the following log sources to determine the percentage of requests currently triggering the fallback:
    - **Cloudflare Worker logs**: Use the Cloudflare dashboard (Workers → Logs) or `wrangler tail` CLI command for real-time logs
    - **Supabase Edge Function logs**: Access via Supabase dashboard (Edge Functions → Logs) or the Supabase Management API
    - **Custom observability sources**: If configured, also check Datadog/Grafana dashboards or any custom logging pipeline
2.  **Analyze Failure Distribution**: Check failure counts over the past 7 days. Are they uniform or clustered?
3.  **Identify Patterns**: Look for correlations with specific regions, times of day, or operation types (e.g., team join vs. leave).
4.  **Record Benchmark**: Save these metrics to compare against post-change performance.

## Investigation Steps

### 1. Check Edge Function Logs

- Access Supabase Dashboard → Edge Functions → `team-leave` (or relevant function)
- Review recent invocations for error patterns and stack traces
- Check deployment history for recent changes that correlate with failures

### 2. Reproduce with Same Payloads

- Capture failing request payloads from Worker logs
- Test Edge Function directly via `supabase functions invoke` with captured payloads
- Verify JWT token validity and expiration times
- Test with different user roles to isolate RLS policy issues

### 3. Enable Debug-Level Logging

- Add detailed logging to Edge Function: log incoming requests, auth context, database queries
- Add timing measurements to identify bottlenecks (cold start, DB query, transaction time)
- Log full error objects including stack traces and context

### 4. Capture Request/Response Timing

- Measure Edge Function cold start time vs. warm execution
- Track database query latency within the function
- Identify if timeouts occur during specific operations (e.g., cascading deletes)

### 5. Inspect Auth Token & Headers

- Verify JWT expiry and refresh token flow
- Check Authorization header format and Bearer token presence
- Validate that RLS policies allow the user to perform the operation
- Test with service role key directly to rule out permission issues

## Interim Monitoring & Alerting

**Implement these BEFORE removing the fallback:**

### 1. Create Alerts

- Alert on Edge Function 5xx error rate > 5% over 5-minute window
- Alert on p95 latency > 3 seconds (indicates timeouts)
- Alert on 401/403 auth failure rate spike
- Alert on Worker fallback usage (log and count fallback invocations)

### 2. Add Distributed Tracing

- Instrument Worker → Edge Function → Database call chain
- Use trace IDs to correlate Worker requests with Edge Function logs
- Track end-to-end latency from client → Worker → Edge Function → DB

### 3. Correlate with Worker Metrics

- Compare Worker success rate with/without fallback
- Identify if failures are concentrated in specific regions or time windows
- Check if failures correlate with Supabase maintenance or deployments

## Removal Plan

**Execute only after root cause is fixed:**

1.  **Staging Validation**: Deploy the Service Role fallback removal to the staging environment first.
2.  **Load Testing**: Run realistic traffic simulation for at least 24 hours in staging.
3.  **Verify Failure Rate**: Confirm Edge Function failure rate is <0.1% and all alert channels fire as expected in staging.
4.  **Production Deployment**: Deploy Worker change to remove Service Role fallback.
5.  **Monitor**: Watch for 24 hours using the defined metrics and alerts.

### Implementation Details

- **Update Error Handling**: Ensure the Worker returns a 500 error to the client if the Edge Function fails.
- **Client Retry**: Advise client-side implementation to handle 500 errors with exponential backoff.

### Worker-Level Retry Strategy

Before returning a 500 error to the client, the Worker should implement a short retry strategy:

1.  **Retry Configuration**:
    - Retry the Edge Function 2-3 times before failing
    - Use exponential backoff: start at ~100ms, double to ~200ms, then ~400ms (max ~1s)
    - Add small random jitter (±10-20%) to prevent thundering herd
    - Enforce a total per-request retry timeout (e.g., 3-5 seconds max)

2.  **Idempotency Requirements**:
    - Ensure Edge Function calls are idempotent, OR
    - Implement per-request deduplication using a request ID to avoid duplicate side effects

3.  **Observability**:
    - Log each retry attempt with attempt number, delay, and outcome
    - Emit metrics for retry counts and final success/failure rates
    - Include original error context when all retries fail

4.  **Configuration**:
    - Make retry count and delays configurable via environment variables or feature flags
    - Example: `EDGE_FUNCTION_MAX_RETRIES=3`, `EDGE_FUNCTION_INITIAL_DELAY_MS=100`

5.  **Final Failure**:
    - If all retries fail, return 500 to client with the original error context
    - Include a correlation ID for debugging
    - **Important**: The Worker will exhaust all configured retry attempts (with backoff and jitter) before returning a 500 to the client. Client-side retry logic should only execute after the Worker returns a final failure response. The correlation ID remains consistent across Worker retry attempts, allowing client retries to correlate failures for debugging.

### Post-Removal Documentation

After the removal is complete and verified:

1.  **Incident Report**: Summarize the root causes found and fixed.
2.  **System Improvements**: List all code, infrastructure, and configuration changes applied.
3.  **Doc Updates**: Update this runbook and deployment docs to reflect the new architecture and prevent regressions.

## Success Criteria

- Edge Function success rate > 99.9% over 7 consecutive days
- No Worker fallback invocations during monitoring period
- Alerts triggering appropriately on test failures
- Client-side retry logic handles transient failures gracefully
- Service Role key removed from Worker environment variables

## Rollback Procedure

If Edge Function failures spike after removing the fallback:

1.  **Immediate Revert**: Redeploy the previous Worker version (with fallback enabled).
2.  **Success Criteria**:
    - Zero fallback invocation errors.
    - Error rate drops below 1% within 5 minutes.
3.  **Monitoring Signals**:
    - Watch for repeated fallback triggers.
    - Monitor for rising error rates or degraded latency.
    - Check for user-impacting errors.
4.  **Escalation**:
    - Escalate to Engineering Lead if error rate exceeds 1% for any 5-minute window within 6 hours post-rollback.
    - Escalate if error rate exceeds 5% for two consecutive 15-minute windows.
5.  **Close Out**:
    - Document all observations and timestamps.
    - Do not close the incident until root cause is re-evaluated and a new plan is formed.
    - Return to "Investigation Steps".
