# Create Organisation Edge Function

This Supabase Edge Function creates an organisation for an authenticated user.

## Features

- **Authentication**: Requires a valid JWT token in the Authorization header
- **Idempotency**: Returns existing organisation if user already owns one
- **Atomic Operations**: Creates organisation, membership, and updates profile
- **Metadata Cleanup**: Clears pending organisation data from user metadata

## Request

**Method**: `POST`

**Headers**:
- `Authorization: Bearer <jwt-token>` (required)
- `Content-Type: application/json`

**Body**:
```json
{
  "name": "Organisation Name",
  "country_based": "Country Code",
  "what_we_do": "Description of activities",
  "existing_since": "2020" (optional),
  "website": "https://example.org" (optional),
  "logo_url": "https://example.org/logo.png" (optional),
  "social_links": [
    { "type": "twitter", "url": "https://twitter.com/..." }
  ] (optional)
}
```

## Response

**Success** (200):
```json
{
  "organisation_id": "uuid"
}
```

**Error** (4xx/5xx):
```json
{
  "error": "Error message"
}
```

## Behavior

1. **Validates request method** - Only accepts POST
2. **Validates Authorization header** - Ensures JWT token is present
3. **Authenticates user** - Uses anon client with JWT to get user ID
4. **Checks for existing org** - If user already owns an org, returns its ID (idempotent)
5. **Creates organisation** - Inserts with `created_by = user.id` and `verification_status = 'pending'`
6. **Creates membership** - Links user to org with `role = 'owner'`
7. **Updates profile** - Sets `kind = 'organisation'`, `organisation_id`, `organisation_name`, and `role = 'owner'`
8. **Clears metadata** - Removes `pending_org` from user metadata
9. **Returns organisation ID**

## Error Handling

- Method validation (405)
- Missing Authorization header (401)
- Invalid JWT token (401)
- Invalid JSON body (400)
- Missing required fields (400)
- Database errors (500)

## Environment Variables

Required environment variables (automatically provided by Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## Deployment

Deploy using Supabase CLI:

```bash
supabase functions deploy create-organisation
```

## Testing

Call the function with a valid JWT token:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/create-organisation \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organisation",
    "country_based": "US",
    "what_we_do": "Testing"
  }'
```
