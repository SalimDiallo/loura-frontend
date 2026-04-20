/**
 * Test du tokenManager
 */
import { tokenManager } from '@/lib/api/client';
import { beforeEach, describe, expect, it } from 'vitest';

describe('tokenManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should set and get access token', () => {
    tokenManager.setTokens('test_access', 'test_refresh');

    const access = tokenManager.getAccessToken();
    const refresh = tokenManager.getRefreshToken();

    console.log('Access token:', access);
    console.log('Refresh token:', refresh);
    console.log('localStorage access:', localStorage.getItem('loura_access_token'));
    console.log('localStorage refresh:', localStorage.getItem('loura_refresh_token'));

    expect(access).toBe('test_access');
    expect(refresh).toBe('test_refresh');
  });

  it('should save and get user', () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    tokenManager.saveUser(user);
    const retrieved = tokenManager.getUser();

    expect(retrieved).toEqual(user);
  });

  it('should clear all tokens', () => {
    tokenManager.setTokens('access', 'refresh');
    tokenManager.saveUser({ id: '1', email: 'test@example.com' });

    tokenManager.clearTokens();

    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getRefreshToken()).toBeNull();
    expect(tokenManager.getUser()).toBeNull();
  });
});
