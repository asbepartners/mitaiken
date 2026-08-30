import { LegalPage } from "@/components/LegalPage";
import { PrivacyContent } from "@/components/LegalContent";

export const metadata = { title: "プライバシーポリシー | わたしのはじめて帖" };

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー" updated="制定日：2026年8月29日　最終改定日：2026年8月30日" counterpartHref="/terms" counterpartLabel="利用規約を見る">
      <PrivacyContent />
    </LegalPage>
  );
}
