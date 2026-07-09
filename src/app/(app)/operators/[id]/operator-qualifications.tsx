"use client";

import { ButtonLink } from "@/components/ui/button";
import { QualificationDetailSkeleton } from "@/components/app/skeletons";
import {
  QualificationProfileDetail,
  type NdtRecordView,
  type QualProfileDetail,
  type ValidationView,
} from "@/components/qualify/qualification-profile-detail";
import {
  QualificationSidebar,
  type QualListItem,
} from "@/components/qualify/qualification-sidebar";
import { useQualificationNavigation } from "@/components/qualify/use-qualification-navigation";
import {
  deleteOq,
  deleteOperatorValidation,
  saveOperatorValidation,
  setOperatorQualificationActive,
  uploadSignedOperatorCertificate,
} from "./qualify/actions";
import { Plus } from "lucide-react";
import { QUAL_LIST_PAGE_SIZE } from "@/lib/qualify/profile-pagination";

export type { NdtRecordView, ValidationView };

export interface OperatorQualView extends QualProfileDetail {
  status: string;
}

export function OperatorQualifications({
  operatorId,
  listItems,
  selected,
  selectedId,
  totalCount,
  page,
}: {
  operatorId: string;
  listItems: QualListItem[];
  selected: OperatorQualView | null;
  selectedId: string | null;
  totalCount: number;
  page: number;
}) {
  const { activeQualId, activePage, listLoading, detailLoading, navigate } =
    useQualificationNavigation({
      qualParam: "oq",
      selectedId,
      page,
    });

  if (totalCount === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-panel px-6 py-16 text-center">
        <h3 className="font-display text-lg font-semibold text-onyx">
          No qualifications yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-graphite">
          Start the 4-step workflow to issue this operator&apos;s first
          certificate.
        </p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href={`/operators/${operatorId}/qualify`} size="sm">
            <Plus className="h-4 w-4" /> New qualification
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <QualificationSidebar
        profilePath={`/operators/${operatorId}`}
        qualParam="oq"
        newQualHref={`/operators/${operatorId}/qualify`}
        listItems={listItems}
        activeQualId={activeQualId}
        totalCount={totalCount}
        page={activePage}
        pageSize={QUAL_LIST_PAGE_SIZE}
        entityLabel="Operator"
        listLoading={listLoading}
        onNavigate={navigate}
      />

      {detailLoading ? (
        <QualificationDetailSkeleton />
      ) : (
        selected && (
          <QualificationProfileDetail
            entityId={operatorId}
            entityKind="operator"
            selected={selected}
            qualifyHref={`/operators/${operatorId}/qualify?oq=${selected.id}`}
            onDeleteQual={() => deleteOq(operatorId, selected.id)}
            onDeleteValidation={(validationId) =>
              deleteOperatorValidation(operatorId, validationId)
            }
            onSaveValidation={(fd) =>
              saveOperatorValidation(operatorId, selected.id, fd)
            }
            onUploadSignedCert={(fd) => {
              fd.set("_operator_id", operatorId);
              fd.set("_oq_id", selected.id);
              return uploadSignedOperatorCertificate(fd);
            }}
            onSetQualificationActive={(active) =>
              setOperatorQualificationActive(operatorId, selected.id, active)
            }
            continuityLabel="6-month continuity (6.2)"
            certificateHint="After logging continuity, re-download the certificate — the 6.2 confirmation table will include the new date."
            deleteQualDescription="This permanently removes the qualification, its range, NDT records, certificate, and every continuity/revalidation log and uploaded document. This cannot be undone."
          />
        )
      )}
    </div>
  );
}
