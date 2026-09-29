import type { EntityAuditUser } from "@/lib/types/entity-audit-user"

function AuditNameField({ label, name }: { label: string; name: string }) {
  return (
    <div className="py-2 px-3">
      <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
      <span className="text-sm block">{name}</span>
    </div>
  )
}

/** Read-only Created By / Updated By. A null or blank name omits that field. */
export function EntityAuditFields({
  createdBy,
  updatedBy,
}: {
  createdBy?: EntityAuditUser | null
  updatedBy?: EntityAuditUser | null
}) {
  const createdName = createdBy?.fullName.trim() ?? ""
  const updatedName = updatedBy?.fullName.trim() ?? ""
  if (!createdName && !updatedName) return null

  return (
    <>
      {createdName ? <AuditNameField label="Created By" name={createdName} /> : null}
      {updatedName ? <AuditNameField label="Updated By" name={updatedName} /> : null}
    </>
  )
}
