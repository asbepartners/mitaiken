import { test, expect } from "@playwright/test";

// Regression coverage for #58-style journeys, extended to オリジナル(自作)
// アイテム: anonymous-visitor.spec.ts and anonymous-collection-item.spec.ts
// already confirm that catalog items can be freely wishlisted while logged
// out, with login only required at the moment of actually saving a
// やったことある record. useCustomExperiences.createExperience and
// useExperienceStatus.toggleWishlist both work purely off localStorage when
// there's no session (see page.tsx's onCreateOriginal, which only gates on
// canSave(), never on auth), so the same should hold for an original item a
// visitor creates from scratch. This spec had no prior coverage at all.
test.use({ storageState: { cookies: [], origins: [] } });

const ITEM_TITLE = "未ログインE2Eテスト用オリジナル体験";
const RECORD_DATE = "2026-03-12";

async function goToTab(page: import("@playwright/test").Page, label: string) {
  await page.locator("nav").getByText(label, { exact: true }).click();
}

test.describe("未ログインでのオリジナルアイテムの利用", () => {
  test("作成はログイン不要で、やったことあるの決定でだけログインを求められる", async ({ page }) => {
    await page.goto("/app");
    await goToTab(page, "やってみたい");

    await page.getByRole("button", { name: "＋ オリジナルのはじめてを追加" }).click();
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();
    await page.getByLabel("体験名").fill(ITEM_TITLE);
    await page.getByLabel("カテゴリ").selectOption({ index: 1 });
    await page.getByRole("button", { name: "やってみたいに追加" }).click();
    await expect(page.getByText("体験を作る")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();

    // やってみたいリストに(ローカルに)反映されていること
    const row = page.locator("li", { hasText: ITEM_TITLE });
    await expect(row).toBeVisible();

    // やったことある: フォームは自由に開いて入力できる -- ここでもログイン画面は出ない
    await row.getByRole("button", { name: `${ITEM_TITLE}をやってみた` }).click();
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();
    await page.locator('input[type="date"]').fill(RECORD_DATE);

    // 保存(決定)しようとした瞬間だけログインを求められる
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.getByText("メールアドレスでログイン")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("あなたの大切な記録を守るために")).toBeVisible();
  });
});
