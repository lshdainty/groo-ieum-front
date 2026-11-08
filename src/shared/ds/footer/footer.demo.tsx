import { DemoBlock, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  Footer,
  FooterBottom,
  FooterBrand,
  FooterColumn,
  FooterCopyright,
  FooterDivider,
  FooterInfo,
  FooterLink,
  FooterLinks,
  FooterNav,
  FooterSitemap,
  FooterText,
} from "./footer";

/** 카탈로그(/dev/ds) — 바닥 한 벌(탐색 · 선 · 안내) 1280 이상, 링크 크기 × 상태. 폭 좁음(1280 미만)은 화면 폭이 정해 카탈로그(1440)에서는 그리지 않는다 */
export const FooterDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="바닥 — 탐색 영역 + 선 + 안내 영역(정책 링크 · 안내 글 · 저작권)">
      <Specimen spec="footer" combo={{ width: "wide", linkSize: "medium" }}>
        <div>
          <Footer>
          <FooterNav>
            <FooterBrand name="그루" description="한 계정으로 여러 서비스를 써요." />
            <FooterSitemap>
              <FooterColumn title="서비스">
                <FooterLink href="#" size="medium">그루 담다</FooterLink>
                <FooterLink href="#" size="medium">그루 이음</FooterLink>
              </FooterColumn>
            </FooterSitemap>
          </FooterNav>
          <FooterDivider />
          <FooterInfo>
            <FooterLinks>
              <FooterLink href="#" size="medium">개인정보 처리방침</FooterLink>
            </FooterLinks>
            <FooterText>안내 글 자리예요.</FooterText>
            <FooterBottom>
              <FooterCopyright owner="그루" year={2026} />
            </FooterBottom>
          </FooterInfo>
        </Footer>
          </div>
      </Specimen>
    </DemoBlock>
    {(["medium", "large"] as const).map((size) => (
      <DemoBlock key={size} title={`링크 ${size}`}>
        <div className="flex gap-x6">
          {(["enabled", "hovered", "pressed", "focused"] as const).map((state) => (
            <Specimen key={state} spec="footer" combo={{ width: "wide", linkSize: size }} state={state}>
              <span className="inline-flex">
                <FooterLink href="#" size={size} external>
                  {state}
                </FooterLink>
              </span>
            </Specimen>
          ))}
        </div>
      </DemoBlock>
    ))}
  </div>
);
