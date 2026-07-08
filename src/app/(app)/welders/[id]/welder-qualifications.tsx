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
  deleteWpq,
  deleteValidation,
  saveValidation,
  setWelderQualificationActive,
  uploadSignedCertificate,
} from "./qualify/actions";
import { Plus } from "lucide-react";
import { QUAL_LIST_PAGE_SIZE } from "@/lib/qualify/profile-pagination";

export type { NdtRecordView, ValidationView };

export interface QualView extends QualProfileDetail {
  status: string;
}

export function WelderQualifications({
  welderId,
  listItems,
  selected,
  selectedId,
  totalCount,
  page,
}: {
  welderId: string;
  listItems: QualListItem[];
  selected: QualView | null;
  selectedId: string | null;
  totalCount: number;
  page: number;
}) {
  const { activeQualId, activePage, listLoading, detailLoading, navigate } =
    useQualificationNavigation({
      qualParam: "wpq",
      selectedId,
      page,
    });

  if (totalCount === 0) {
    return (
      <div className="rounded-(--radius-card) border border-dashed border-silver bg-panel px-6 py-16 text-center">
        <h3 className="font-display text-lg font-semibold text-onyx">
          No qualifications yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-graphite">
          Start the 4-step workflow to issue this welder&apos;s first
          certificate.
        </p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href={`/welders/${welderId}/qualify`} size="sm">
            <Plus className="h-4 w-4" /> New qualification
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <QualificationSidebar
        profilePath={`/welders/${welderId}`}
        qualParam="wpq"
        newQualHref={`/welders/${welderId}/qualify`}
        listItems={listItems}
        activeQualId={activeQualId}
        totalCount={totalCount}
        page={activePage}
        pageSize={QUAL_LIST_PAGE_SIZE}
        entityLabel="Welder"
        listLoading={listLoading}
        onNavigate={navigate}
      />

      {detailLoading ? (
        <QualificationDetailSkeleton />
      ) : (
        selected && (
          <QualificationProfileDetail
            entityId={welderId}
            entityKind="welder"
            selected={selected}
            qualifyHref={`/welders/${welderId}/qualify?wpq=${selected.id}`}
            onDeleteQual={() => deleteWpq(welderId, selected.id)}
            onDeleteValidation={(validationId) =>
              deleteValidation(welderId, validationId)
            }
            onSaveValidation={(fd) => saveValidation(welderId, selected.id, fd)}
            onUploadSignedCert={(fd) =>
              uploadSignedCertificate(welderId, selected.id, fd)
            }
            onSetQualificationActive={(active) =>
              setWelderQualificationActive(welderId, selected.id, active)
            }
            continuityLabel="6-month continuity (9.2)"
            certificateHint="After logging continuity, re-download the certificate — the 9.2 prolongation table will include the new date."
            deleteQualDescription="This permanently removes the qualification, its range of approval, NDT records, certificate, and every continuity/revalidation log and uploaded document. This cannot be undone."
          />
        )
      )}
    </div>
  );
}
