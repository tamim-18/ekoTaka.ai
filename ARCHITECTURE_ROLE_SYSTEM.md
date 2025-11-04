# Role-Based Authentication Architecture

## Current Issues
1. **Hardcoded Email-Based Roles**: Only specific emails are brands, not scalable
2. **No User Choice**: Users can't select their role during sign-up
3. **Inconsistent Role Source**: Some places use email check, others use DB field

## Proposed Architecture

### Design Principles
1. **Database-Driven**: Role stored in User model, single source of truth
2. **User-Selectable**: Users choose role during sign-up
3. **Backward Compatible**: Existing users still work
4. **Secure**: Role can't be changed without proper authorization

### Implementation Plan

#### 1. User Model (Already Done ✅)
- `role` field: 'collector' | 'brand'
- Default: 'collector'
- Indexed for performance

#### 2. Sign-Up Flow
- **UI**: Add role selection (radio buttons or cards)
- **API**: Accept `role` parameter, validate, store in DB
- **Default**: If no role provided, default to 'collector'

#### 3. Role Checker Utility
- **Primary**: Use `user.role` from database
- **Fallback**: Email-based check for backward compatibility
- **Future**: Remove email fallback after migration

#### 4. API Routes
- Fetch user from DB using userId
- Check `user.role` directly
- Remove email-based checks

#### 5. Frontend Components
- Use `user.role` from AuthContext
- Remove email-based role checks

### Benefits
- ✅ Scalable: No hardcoded emails
- ✅ User-friendly: Clear role selection
- ✅ Maintainable: Single source of truth
- ✅ Flexible: Easy to add more roles later
- ✅ Secure: Role validated on sign-up

### Migration Strategy
1. Update sign-up form with role selection
2. Update sign-up API to use provided role
3. Update role-checker to use DB role first
4. Update all API routes
5. Update frontend components
6. (Future) Remove email fallback

