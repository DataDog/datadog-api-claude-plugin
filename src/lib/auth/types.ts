// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-present Datadog, Inc.

/**
 * OAuth2 Authentication Types for Datadog API
 */

/**
 * PKCE (Proof Key for Code Exchange) challenge data
 */
export interface PKCEChallenge {
  /** The random code verifier (43-128 characters, URL-safe) */
  codeVerifier: string;
  /** The SHA-256 hash of codeVerifier, base64url encoded */
  codeChallenge: string;
  /** The challenge method, always 'S256' */
  codeChallengeMethod: 'S256';
}

/**
 * OAuth2 tokens returned from token endpoint
 */
export interface OAuthTokens {
  /** The access token for API authentication */
  accessToken: string;
  /** The refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Token type, typically 'Bearer' */
  tokenType: string;
  /** Access token expiration time in seconds */
  expiresIn: number;
  /** Timestamp when the access token was issued (Unix timestamp in seconds) */
  issuedAt: number;
  /** Granted scopes (space-separated string) */
  scope?: string;
}

/**
 * Raw token response from Datadog OAuth2 token endpoint
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Authentication state during OAuth flow
 */
export interface AuthState {
  /** Random state parameter for CSRF protection */
  state: string;
  /** PKCE challenge data */
  pkce: PKCEChallenge;
  /** The redirect URI used for this auth flow */
  redirectUri: string;
  /** Timestamp when the auth flow started */
  startedAt: number;
}

/**
 * Stored token data (persisted to disk)
 * Keyed by Datadog site (e.g., 'datadoghq.com')
 */
export interface StoredTokens {
  [site: string]: OAuthTokens;
}

/**
 * Token storage interface - abstracts the underlying storage mechanism
 * Implemented by both FileTokenStorage (plaintext file) and SecureTokenStorage (OS keychain)
 */
export interface ITokenStorage {
  /**
   * Save tokens for a specific Datadog site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @param tokens The OAuth tokens to save
   */
  saveTokens(site: string, tokens: OAuthTokens): void;

  /**
   * Get tokens for a specific Datadog site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @returns The stored tokens, or null if none exist
   */
  getTokens(site: string): OAuthTokens | null;

  /**
   * Delete tokens for a specific Datadog site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @returns Whether tokens were deleted
   */
  deleteTokens(site: string): boolean;

  /**
   * Delete all stored tokens
   */
  deleteAllTokens(): void;

  /**
   * Check if valid (non-expired) tokens exist for a site
   * @param site The Datadog site (e.g., 'datadoghq.com')
   * @param includeRefreshable If true, consider tokens valid if they can be refreshed
   * @returns Whether valid tokens exist
   */
  hasValidTokens(site: string, includeRefreshable?: boolean): boolean;

  /**
   * Get all sites with stored tokens
   * @returns Array of site names
   */
  listSites(): string[];

  /**
   * Get storage location description (for display/debugging)
   * @returns Description of where tokens are stored
   */
  getStorageLocation(): string;

  /**
   * Get the storage backend type
   * @returns 'keychain' or 'file'
   */
  getBackendType(): 'keychain' | 'file';
}

/**
 * OAuth configuration
 */
export interface OAuthConfig {
  /** Datadog site (e.g., 'datadoghq.com') */
  site: string;
  /** OAuth2 client ID */
  clientId: string;
  /** Requested OAuth scopes */
  scopes: string[];
  /** Timeout for the OAuth flow in milliseconds */
  timeoutMs?: number;
}

/**
 * Result of an OAuth login attempt
 */
export interface LoginResult {
  /** Whether login was successful */
  success: boolean;
  /** Error message if login failed */
  error?: string;
  /** The obtained tokens if successful */
  tokens?: OAuthTokens;
}

/**
 * OAuth endpoints for a Datadog site
 */
export interface OAuthEndpoints {
  /** Authorization endpoint URL */
  authorizeUrl: string;
  /** Token endpoint URL */
  tokenUrl: string;
  /** Token revocation endpoint URL */
  revokeUrl: string;
}

/**
 * Default OAuth scopes to request
 * These map to current plugin tools that have available OAuth scopes.
 *
 * NOTE: Some tools do NOT have OAuth scopes available yet:
 * - Logs (requires logs_read - not available)
 * - Metrics submit (requires metrics_write - not available)
 * - RUM events search (requires rum_read - not available)
 * - RUM metrics (requires rum_metrics_read/write - not available)
 * - Key Management (requires api_keys_*, app_keys_* - not available)
 * - Fleet Automation (requires fleet_* - not available)
 */
export const DEFAULT_OAUTH_SCOPES = [
  // Dashboards
  'dashboards_read',
  'dashboards_write',

  // Monitors
  'monitors_read',
  'monitors_write',
  'monitors_downtime',

  // APM/Traces
  'apm_read',

  // SLOs
  'slos_read',
  'slos_write',
  'slos_corrections',

  // Incidents
  'incident_read',
  'incident_write',

  // Synthetics
  'synthetics_read',
  'synthetics_write',
  'synthetics_global_variable_read',
  'synthetics_global_variable_write',
  'synthetics_private_location_read',
  'synthetics_private_location_write',

  // Security
  'security_monitoring_signals_read',
  'security_monitoring_rules_read',
  'security_monitoring_findings_read',
  'security_monitoring_suppressions_read',
  'security_monitoring_filters_read',

  // RUM (only scopes available - not rum_read or rum_metrics_*)
  'rum_apps_read',
  'rum_apps_write',
  'rum_retention_filter_read',
  'rum_retention_filter_write',

  // Infrastructure
  'hosts_read',

  // Users
  'user_access_read',
  'user_self_profile_read',

  // Cases
  'cases_read',
  'cases_write',

  // Events
  'events_read',

  // Metrics (read only - metrics_write not available)
  'metrics_read',
  'timeseries_query',

  // Usage
  'usage_read',
] as const;

/**
 * OAuth client ID placeholder
 * Replace with actual Datadog CLI client ID when available
 */
export const DATADOG_CLI_CLIENT_ID = '90f37300-eaf8-4e0a-abb9-db3d85a38593';

/**
 * Default timeout for OAuth flow (5 minutes)
 */
export const DEFAULT_OAUTH_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Token refresh buffer - refresh token when it expires within this time
 * Default: 5 minutes before expiration
 */
export const TOKEN_REFRESH_BUFFER_SECONDS = 5 * 60;
