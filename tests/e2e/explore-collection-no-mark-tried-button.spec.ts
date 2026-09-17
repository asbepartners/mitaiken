import { test, expect } from "@playwright/test";

// Regression coverage for #62: みつける画面(ExperienceCard.tsx, featured
// variant)は、単一アイテムでも親子構造(コレクション)アイテムでも同じ
// 「やったことある」ボタンを出し、どちらもどの子項目を体験したか選ばせず
// に直接 onRequestMarkTried(id) を呼んでいた -- 親アイテム自体に targetId
// なしの記録が作られてしまう抜け穴だった。#62では「軽め」の方針を採用し、
// WishlistView と同じ isCollection 分岐に揃えて、親子アイテムはみつける
// 画面でも「やってみたい」のみを表示するようにした(記録は常にウィッシュ
// リスト経由の子項目選択に一本化)。この読み取り専用のテストは、その分岐
// が両方のアイテム種別で正しく効いていることを確認する(状態変更なしの
// ため後片付けは不要)。
const SINGLE_ITEM_TITLE = "銭湯めぐりをする";
const COLLECTION_ITEM_TITLE = "まだ行ったことのない都道府県に行く";

test.describe("みつける画面の「やったことある」ボタン表示", () => {
  test("単一アイテムには表示され、親子(コレクション)アイテムには表示されない", async ({ page }) => {
    await page.goto("/app");
    await page.locator("nav").getByText("みつける", { exact: true }).click();

    const singleCard = page.locator("div.snap-center").filter({ hasText: SINGLE_ITEM_TITLE });
    await expect(singleCard).toBeVisible();
    await expect(singleCard.getByRole("button", { name: "やったことある" })).toBeVisible();
    await expect(singleCard.getByRole("button", { name: "やってみたい" })).toBeVisible();

    const collectionCard = page.locator("div.snap-center").filter({ hasText: COLLECTION_ITEM_TITLE });
    await expect(collectionCard).toBeVisible();
    await expect(collectionCard.getByRole("button", { name: "やったことある" })).not.toBeVisible();
    // 「やってみたい」自体は引き続き利用できること(記録の入口を丸ごと
    // 塞いでいないこと)の確認
    await expect(collectionCard.getByRole("button", { name: "やってみたい" })).toBeVisible();
  });
});
