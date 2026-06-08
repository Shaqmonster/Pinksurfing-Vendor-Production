import commonPasswordsList from "./djangoCommonPasswords.json";

const COMMON_PASSWORDS = new Set(commonPasswordsList as string[]);

const SIMILARITY_THRESHOLD = 0.7;
const USER_ATTRIBUTES = ["email", "username", "first_name", "last_name"] as const;

export interface PasswordUserContext {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface PasswordRuleResult {
  id: string;
  label: string;
  passed: boolean;
}

function lcsLength(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    let prev = 0;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev + 1;
      } else {
        dp[j] = Math.max(dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }

  return dp[n];
}

/** Mirrors difflib.SequenceMatcher.ratio() used by Django's similarity check. */
function sequenceMatcherRatio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const matches = lcsLength(a.toLowerCase(), b.toLowerCase());
  return (2.0 * matches) / (a.length + b.length);
}

function getAttributeParts(value: string): string[] {
  const parts = value.split(/\W+/).filter(Boolean);
  return [...parts, value];
}

function isTooSimilarToUserAttributes(
  password: string,
  context: PasswordUserContext
): boolean {
  if (!password) return false;

  for (const attrName of USER_ATTRIBUTES) {
    const value = context[attrName];
    if (!value || typeof value !== "string") continue;

    for (const part of getAttributeParts(value)) {
      if (!part) continue;
      if (sequenceMatcherRatio(password, part) >= SIMILARITY_THRESHOLD) {
        return true;
      }
    }
  }

  return false;
}

type PasswordRule = {
  id: string;
  label: string;
  check: (password: string, context: PasswordUserContext) => boolean;
};

export const DJANGO_PASSWORD_RULES: PasswordRule[] = [
  {
    id: "min_length",
    label: "At least 8 characters",
    check: (password) => password.length >= 8,
  },
  {
    id: "not_numeric",
    label: "Cannot be entirely numeric",
    check: (password) => !/^\d+$/.test(password),
  },
  {
    id: "not_common",
    label: "Cannot be a commonly used password",
    check: (password) => !COMMON_PASSWORDS.has(password.toLowerCase()),
  },
  {
    id: "not_similar",
    label: "Cannot be too similar to your email or name",
    check: (password, context) =>
      !isTooSimilarToUserAttributes(password, context),
  },
];

export function evaluatePasswordRules(
  password: string,
  context: PasswordUserContext = {}
): PasswordRuleResult[] {
  return DJANGO_PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.check(password, context),
  }));
}

export function isPasswordValid(
  password: string,
  context: PasswordUserContext = {}
): boolean {
  if (!password) return false;
  return evaluatePasswordRules(password, context).every((rule) => rule.passed);
}
