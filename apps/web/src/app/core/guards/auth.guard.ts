import { CanActivateFn } from '@angular/router';

// Stub: always passes. Auth check will be implemented in a future branch.
export const authGuard: CanActivateFn = () => true;
