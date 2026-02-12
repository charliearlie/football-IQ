---
name: supabase-patterns
description: Use when creating or modifying Supabase queries, RLS policies, database migrations, edge functions, or typed client usage. Auto-invoke for any file touching lib/supabase, supabase/migrations, or supabase/functions.
---

## Supabase Conventions for This Project

### Typed Client

- Always import from `lib/supabase.ts`
- Never create ad-hoc Supabase clients
- Use generated types from `types/supabase.ts` (regenerate with `npx supabase gen types typescript`)

### RLS Policies

- Every table MUST have RLS enabled
- Always test policies with both authenticated and anonymous roles
- Name policies descriptively: `users_select_own`, `scores_insert_authenticated`
- Default deny — only allow what's explicitly needed

### Migrations

- Location: `supabase/migrations/`
- Naming: `YYYYMMDD_HHMMSS_description.sql` (use `npx supabase migration new description`)
- Always include both UP migration in the file
- Test migrations locally with `npx supabase db reset` before pushing
- Never modify an existing migration that's been applied — create a new one

### Queries

- Use `.select()` with explicit columns, never `select('*')` in production code
- Always handle errors: `const { data, error } = await supabase.from(...)`
- Use `.single()` when expecting one row
- Prefer server-side filtering over client-side

### Edge Functions

- Location: `supabase/functions/`
- Use Deno runtime
- Always validate input with Zod or similar
- Return proper HTTP status codes
- Include CORS headers for client access

### Realtime

- Only subscribe to channels you need
- Always unsubscribe on component unmount
- Use presence for multiplayer features, not polling
- Handle reconnection logic gracefully ### Performance - Use indexes on frequently queried columns - Avoid N+1 queries by using `.select()` with related tables - Cache results when appropriate, but invalidate on data changes

### Security

Never expose service role keys in client code - Use environment variables for sensitive information - Regularly review RLS policies and audit logs - Implement rate limiting on edge functions to prevent abuse

### Testing

Use Supabase's testing tools for RLS policies - Mock Supabase client in unit tests - Write integration tests for critical queries and edge functions - Test with both authenticated and anonymous users

## Additional Resources - [Supabase Documentation](https://supabase.com/docs) - [Supabase GitHub Repository](
