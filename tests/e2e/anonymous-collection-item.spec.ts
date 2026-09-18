import { test, expect } from "@playwright/test";

// Regression coverage for #58: anonymous-visitor.spec.ts only exercises a
// single (non-collection) master item while logged out. The 親子構造(コレ
// クション)side of the anonymous journey had no coverage at all -- neither
// "やってみたいへの追加は自由にできる" nor "子項目の記録決定でログインを
// 求められる". This spec fills that gap. It doesn't need to complete the
// login (that full round trip, for a single item, is covered separately by
// anonymous-login-completes-record.spec.ts), so -- like
// anonymous-visitor.spec.ts -- it never writes anything to the backend and
// needs no afterEach cleanup.
test.use({ storageState: { cookies: [], origins: [] } });

const COLLECTION_TITLE = "気になっているレストランに行く";
const TARGET_TITLE = "テストレストランに行く";
const RECORD_DATE = "2026-04-20";

async function goToTab(page: import("@playwright/test").Page, label: string) {
  await page.locator("nav").getByText(label, { exact: true }).click();
}

test.describe("未ログインでの親子構造(コレクション)アイテムの利用", () => {
  test("やってみたい追加は自由にでき、子項目のやったことある決定でだけログインを求められる", async ({ page }) => {
    await page.goto("/app");
    await goToTab(page, "みつける");
    const card = page.locator("div.snap-center").filter({ hasText: COLLECTION_TITLE });
    await expect(card).toBeVisible();

    // やってみたいへの追加はログイン不要
    await card.getByRole("button", { name: "やってみたい" }).click();
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();

    // マスタ単一アイテム向けの追加時詳細シートはコレクションには出ない
    await page.waitForTimeout(2000);
    await expect(page.getByText("やってみたいの詳細を編集")).not.toBeVisible();
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();

    await goToTab(page, "やってみたい");
    const row = page.locator("li", { hasText: COLLECTION_TITLE });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: `${COLLECTION_TITLE}の詳細` }).click();

    // 詳細画面の閲覧・子項目の追加自体はログイン不要
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();
    await page.getByRole("button", { name: "＋ 項目を追加" }).click();
    await page.getByLabel("行き先・項目").fill(TARGET_TITLE);
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();

    const targetRow = page.locator("li", { hasText: TARGET_TITLE });
    await expect(targetRow).toBeVisible();

    // 子項目のやったことあるフォームも自由に開いて入力できる
    await targetRow.getByRole("button", { name: "やってみた！" }).click();
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();
    await page.locator('input[type="date"]').fill(RECORD_DATE);

    // 決定(保存)しようとした瞬間だけログインを求められる
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.getByText("メールアドレスでログイン")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("あなたの大切な記録を守るために")).toBeVisible();
  });
});
