# Security Specification: Minhas Economias

## 1. Data Invariants

1. **User Ownership Invariant**: Every sub-collection document (`accounts`, `categories`, `transactions`, `dreams`) strictly belongs to the authenticated user identified by `{userId}` matching `request.auth.uid`.
2. **Identity Non-Spoofing**: The internal `userId` field inside any incoming document payload MUST strictly equal `request.auth.uid` and match `{userId}` from the document path.
3. **Immutability of Key Identifiers**: During updates, `{userId}` and `id` must be immutable (`incoming().userId == existing().userId` and `incoming().id == existing().id`).
4. **Relational Sync & Parent Gate**: Subcollection resources are isolated under `/users/{userId}/...`. A user cannot read, query, list, or write to any other user's collections.
5. **PII Isolation**: Root user document `/users/{userId}` contains user email and profile metadata; reads and writes are strictly restricted to the resource owner (`request.auth.uid == userId`).
6. **Strict Schema Constraints**: Strings have strict bounds (`maxLength`), enum fields (`type`) are strictly constrained, and required keys are enforced on create and update.

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Read/Write**: Attempting to read or write `/users/test-uid/accounts/acc1` with `request.auth == null` -> DENIED.
2. **Cross-User Account Access**: User `user-A` reading `/users/user-B/accounts/acc1` -> DENIED.
3. **Cross-User Account Injection**: User `user-A` creating `/users/user-B/accounts/acc1` with `userId: "user-A"` -> DENIED.
4. **Spoofed User ID in Body**: User `user-A` creating `/users/user-A/accounts/acc1` with `userId: "user-B"` -> DENIED.
5. **Shadow Field Injection**: Creating an account with unknown ghost fields `{ maliciousRole: "admin" }` -> DENIED.
6. **Path ID Tampering**: Attempting single-doc write where `{accountId}` has illegal symbols or exceeds 128 chars -> DENIED.
7. **Negative or Invalid Enum Type**: Account with `type: "crypto_token"` -> DENIED.
8. **Transaction Type Tampering**: Transaction with `type: "fraud"` -> DENIED.
9. **Category Ownership Hijack**: Updating existing category to mutate `userId` -> DENIED.
10. **Immortal Field Mutation**: Updating transaction to change original `id` -> DENIED.
11. **Denial of Wallet String Bomb**: Writing a description of 100KB -> DENIED (max 200 chars).
12. **Blanket Query Scraping**: Listing `/users/user-B/transactions` without being owner -> DENIED.

## 3. Test Runner Specification

The test matrix asserts that all 12 malicious vectors return `PERMISSION_DENIED` and only verified owners with compliant schema payloads succeed.
