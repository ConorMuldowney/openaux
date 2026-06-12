import * as Sentry from "@sentry/node";

type ObservabilityLevel = "info" | "warn" | "error";

type ObservabilityContext = Record<string, unknown>;

type ObserveSignalInput = {
  name: string;
  level?: ObservabilityLevel;
  context?: ObservabilityContext;
};

type ObserveExceptionInput = {
  name: string;
  error: unknown;
  context?: ObservabilityContext;
};

let sentryInitialized = false;

function resolveSentryLevel(level: ObservabilityLevel): Sentry.SeverityLevel {
  switch (level) {
    case "error":
      return "error";
    case "warn":
      return "warning";
    default:
      return "info";
  }
}

function maybeInitializeSentry(): void {
  if (sentryInitialized) {
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    sentryInitialized = true;
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0"),
    enabled: true,
  });

  sentryInitialized = true;
}

function writeStructuredLog(
  level: ObservabilityLevel,
  name: string,
  context: ObservabilityContext,
): void {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    signal: name,
    ...context,
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

function captureSentryMessage(
  name: string,
  level: ObservabilityLevel,
  context: ObservabilityContext,
): void {
  maybeInitializeSentry();
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("observation", name);
    scope.setLevel(resolveSentryLevel(level));
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value);
    }
    Sentry.captureMessage(name);
  });
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : "Unknown error");
}

export function observeSignal({
  name,
  level = "info",
  context = {},
}: ObserveSignalInput): void {
  writeStructuredLog(level, name, context);
  captureSentryMessage(name, level, context);
}

export function observeException({
  name,
  error,
  context = {},
}: ObserveExceptionInput): void {
  const normalizedError = toError(error);

  writeStructuredLog("error", name, {
    ...context,
    errorMessage: normalizedError.message,
    errorName: normalizedError.name,
  });

  maybeInitializeSentry();
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("observation", name);
    scope.setLevel("error");
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value);
    }
    Sentry.captureException(normalizedError);
  });
}