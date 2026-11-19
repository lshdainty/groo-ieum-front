import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ds/button";
import { Field } from "@/shared/ds/field";
import { Skeleton } from "@/shared/ds/skeleton";
import { SelectBoxRowsSkeleton } from "@/shared/ui/groo/skeleton-rows";

// 사용자 역할 지정의 기다림 — 틀(부서 · 직책 머리글, 역할 칸 라벨 · 설명, 바뀐 것 없음 안내, 저장 단추)은 실제와 같은 자리 · 글로 그리고
// (단추는 막힘), 서버에서 올 글(이름 t8 · 메일 · 부서 · 직책 값 t4 · 역할 이름 t5 · 설명 t3)만 글 줄 스켈레톤이다. 역할 줄은 실제와 같은
// Select Box 상자다(skeleton.md "틀은 먼저, 데이터 자리만 스켈레톤" · "크기 — 글은 글줄 높이"). 바깥 상자 · 여백은 UserRoleAssignment 와 같다
const UserRoleAssignmentSkeleton = () => {
  const { t } = useTranslation("admin");
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-user-role-skeleton>
      <div className="shrink-0 border-b border-stroke-neutral-subtle bg-bg-layer-default p-x4 md:p-x6">
        <div className="mb-x1 flex items-start gap-x2">
          <div className="min-w-0">
            <Skeleton text="t8" className="block w-[128px]" />
            <Skeleton text="t4" className="mb-x4 block w-[192px]" />
          </div>
        </div>
        <div className="flex gap-x4 text-t4 text-fg-neutral-subtle">
          <div className="flex items-center gap-x1">
            <span className="font-medium text-fg-neutral">{t("authority.department")}:</span>
            <Skeleton text="t4" className="inline-block w-[64px]" />
          </div>
          <div className="flex items-center gap-x1">
            <span className="font-medium text-fg-neutral">{t("authority.position")}:</span>
            <Skeleton text="t4" className="inline-block w-[48px]" />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-x4 md:p-x6">
        <Field label={t("authority.roles")} description={t("authority.userRolesHint")}>
          <SelectBoxRowsSkeleton count={4} control="check" />
        </Field>
        <div className="mt-x3 flex flex-col gap-x3 md:flex-row md:items-center md:justify-end">
          <p className="m-0 text-t4 text-fg-neutral-subtle">{t("authority.userRolesNoChanges")}</p>
          <Button className="w-full md:w-auto" disabled>
            {t("common:save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { UserRoleAssignmentSkeleton };
