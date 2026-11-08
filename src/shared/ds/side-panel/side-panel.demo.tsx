import { Button } from "@/shared/ds/button";
import { DemoBlock } from "@/shared/ds/catalog/DemoKit";
import { OverlayStage } from "@/shared/ds/overlay/overlay-stage";

import { SidePanel, SidePanelBody, SidePanelContent, SidePanelFooter } from "./side-panel";

const ROWS = Array.from({ length: 12 }, (_, i) => `항목 ${i + 1}`);

/** 카탈로그(/dev/ds) — 오른쪽 medium(기본) 한 장을 무대 안에 연다. 왼쪽 서랍 · 크기 · 끝 흐림 조합은 같은 부품 값이라 이 한 장으로 기본값만 잰다 */
export const SidePanelDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="오른쪽 · medium 720 · 조회 — 머리 닫기 버튼 + 바닥">
      <OverlayStage
        spec="side-panel"
        combo={{ side: "right", size: "medium", scrollFog: "off" }}
        width={960}
        height={520}
      >
        {(container) => (
          <SidePanel open modal={false} container={container}>
            <SidePanelContent title="상세" description="설명 한 문장이에요.">
              <SidePanelBody>
                {ROWS.map((r) => (
                  <p key={r} className="py-x2 text-t5 text-fg-neutral">
                    {r}
                  </p>
                ))}
              </SidePanelBody>
              <SidePanelFooter>
                <Button variant="neutralWeak">취소</Button>
                <Button variant="neutralSolid">저장</Button>
              </SidePanelFooter>
            </SidePanelContent>
          </SidePanel>
        )}
      </OverlayStage>
    </DemoBlock>
  </div>
);
