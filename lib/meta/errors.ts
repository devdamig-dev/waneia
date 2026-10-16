export class MetaSetupError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "MetaSetupError";
    this.code = code;
    this.status = status;
  }
}

// Never expose Graph response bodies, database diagnostics, codes or tokens.
export function publicMetaError(error: unknown) {
  if (error instanceof MetaSetupError) {
    return { code: error.code, message: error.message, status: error.status };
  }
  return {
    code: "INTEGRATION_UNAVAILABLE",
    message: "No pudimos completar la conexión. Volvé a iniciar el proceso.",
    status: 503,
  };
}
