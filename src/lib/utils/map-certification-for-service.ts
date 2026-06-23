import type { CandidateCertification } from "@/lib/types/candidate"
import type { CertificationForService } from "@/types/question-generation"

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function toIsoDate(value: Date | undefined | null): string | null {
  if (value == null) return null
  try {
    return value.toISOString()
  } catch {
    return null
  }
}

export interface CertificationCatalogFromApi {
  certificationName: string | null
  issuingBody: string | null
  issuingBodyUrl: string | null
}

/** Merge catalog fields from nested `certification` / issuer graph on GET candidate rows. */
export function parseCertificationCatalogFromApi(
  raw: Record<string, unknown>,
): CertificationCatalogFromApi {
  const nested = asRecord(raw.certification) ?? raw
  const issuer = asRecord(nested.issuer)
  const issuingBodyDto = asRecord(nested.issuingBody)

  const issuingBody =
    nested.issuingBody != null && typeof nested.issuingBody === "string"
      ? String(nested.issuingBody)
      : issuingBodyDto?.label != null
        ? String(issuingBodyDto.label)
        : issuer?.name != null
          ? String(issuer.name)
          : raw.issuerName != null
            ? String(raw.issuerName)
            : raw.certificationIssuerName != null
              ? String(raw.certificationIssuerName)
              : null

  const issuingBodyUrl =
    nested.issuingBodyUrl != null
      ? String(nested.issuingBodyUrl)
      : issuer?.websiteUrl != null
        ? String(issuer.websiteUrl)
        : null

  const certificationName =
    nested.name != null
      ? String(nested.name)
      : raw.certificationName != null
        ? String(raw.certificationName)
        : raw.name != null
          ? String(raw.name)
          : null

  return {
    certificationName: emptyToNull(certificationName),
    issuingBody: emptyToNull(issuingBody),
    issuingBodyUrl: emptyToNull(issuingBodyUrl),
  }
}

export function mapCertificationToServicePayload(
  cert: CandidateCertification,
): CertificationForService {
  const issuingBody =
    emptyToNull(cert.issuingBody) ?? emptyToNull(cert.certificationIssuerName)

  return {
    certificationName: emptyToNull(cert.certificationName) ?? cert.certificationName,
    certificationLevel: emptyToNull(cert.certificationLevel as string | null),
    issueDate: toIsoDate(cert.issueDate),
    expiryDate: toIsoDate(cert.expiryDate),
    certificationUrl: emptyToNull(cert.certificationUrl),
    issuingBody,
    issuingBodyUrl: emptyToNull(cert.issuingBodyUrl),
  }
}
