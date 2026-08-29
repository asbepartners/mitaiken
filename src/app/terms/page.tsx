import { LegalPage } from "@/components/LegalPage";
import { TermsContent } from "@/components/LegalContent";

export const metadata = { title: "利用規約 | わたしのはじめて帖" };

export default function TermsPage() {
  return (
    <LegalPage title="利用規約" updated="制定日：2026年8月29日" counterpartHref="/privacy" counterpartLabel="プライバシーポリシーを見る">
      <TermsContent />
    </LegalPage>
  );
}
