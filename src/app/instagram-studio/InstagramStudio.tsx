"use client";

import { toPng } from "html-to-image";
import { useMemo, useRef, useState } from "react";
import { Experience } from "@/data/experiences";
import { useExperienceCatalog } from "@/hooks/useExperienceCatalog";
import { imageSource } from "@/lib/imageSource";
import styles from "./studio.module.css";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
}

function detailValue(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function buildCaption(experience: Experience) {
  return `${experience.title}\n\n${experience.description}\n\n気になった「はじめて」は、わたしのはじめて帖に残しておけます。\n\n#わたしのはじめて帖 #小さなはじめて #やってみたいこと`;
}

export default function InstagramStudio() {
  const { experiences, source, loading } = useExperienceCatalog();
  const availableExperiences = useMemo(
    () => experiences.filter((experience) => Boolean(experience.image)),
    [experiences],
  );
  const [selectedId, setSelectedId] = useState(availableExperiences[0]?.id ?? "");
  const selected =
    availableExperiences.find((experience) => experience.id === selectedId) ??
    availableExperiences[0];
  const [title, setTitle] = useState(availableExperiences[0]?.title ?? "");
  const [description, setDescription] = useState(availableExperiences[0]?.description ?? "");
  const [shioriFeeling, setShioriFeeling] = useState("");
  const [caption, setCaption] = useState(
    availableExperiences[0] ? buildCaption(availableExperiences[0]) : "",
  );
  const [titleSize, setTitleSize] = useState(68);
  const [bodySize, setBodySize] = useState(42);
  const [exporting, setExporting] = useState(false);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  function selectExperience(id: string) {
    const experience = availableExperiences.find((item) => item.id === id);
    if (!experience) return;
    setSelectedId(experience.id);
    setTitle(experience.title);
    setDescription(experience.description);
    setShioriFeeling("");
    setCaption(buildCaption(experience));
    setTitleSize(68);
    setBodySize(42);
  }

  if (!selected) {
    return (
      <main className={styles.emptyState}>
        {loading ? "体験マスタを読み込んでいます…" : "画像付きの体験マスタがありません。"}
      </main>
    );
  }

  const image = imageSource(selected.image, "");
  const category = detailValue(selected.categoryLabel, selected.category);

  async function downloadCard(index: number) {
    const node = cardRefs.current[index];
    if (!node) return;
    const dataUrl = await toPng(node, {
      cacheBust: true,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      pixelRatio: 1,
    });
    const link = document.createElement("a");
    link.download = `${safeFilename(selected.id)}-${String(index + 1).padStart(2, "0")}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function downloadAll() {
    setExporting(true);
    try {
      for (let index = 0; index < 4; index += 1) {
        await downloadCard(index);
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
    } finally {
      setExporting(false);
    }
  }

  function downloadCaption() {
    const blob = new Blob([caption], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.download = `${safeFilename(selected.id)}-caption.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const cards = [
    <article className={`${styles.card} ${styles.coverCard}`} key="cover">
      <BrandHeader page={1} />
      <div className={styles.coverFrame}>
        <div className={styles.coverImageInner}>
          {/* eslint-disable-next-line @next/next/no-img-element -- export requires a plain img node */}
          <img alt="" className={styles.coverImage} crossOrigin="anonymous" src={image} />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- export requires a plain img node */}
        <img alt="" className={styles.coverBubble} src="/instagram-studio/bubble-have-you-tried.webp" />
      </div>
      <div className={styles.coverCopy}>
        {/* eslint-disable-next-line @next/next/no-img-element -- export requires a plain img node */}
        <img alt="" className={styles.coverGirl} src="/instagram-studio/girl-telescope.webp" />
        <div>
          <span className={styles.category}>{category}</span>
          <h2 style={{ fontSize: titleSize }}>{title}</h2>
        </div>
      </div>
    </article>,
    <article className={`${styles.card} ${styles.noteCard}`} key="description">
      <BrandHeader page={2} />
      <div className={styles.noteCopy}>
        <p className={styles.eyebrow}>どんな体験？</p>
        <h2 style={{ fontSize: Math.max(48, titleSize - 10) }}>{title}</h2>
        <p className={styles.description} style={{ fontSize: bodySize }}>{description}</p>
      </div>
      <div className={styles.thinkingGirlWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element -- export requires a plain img node */}
        <img alt="" className={styles.thinkingGirl} src="/instagram-studio/girl-thinking-bubble.webp" />
      </div>
    </article>,
    <article className={`${styles.card} ${styles.feelingCard}`} key="feeling">
      <BrandHeader page={3} />
      <div className={styles.feelingCopy}>
        <p className={styles.eyebrow}>ちょっと気になる理由</p>
        <p className={styles.feelingMessage} style={{ fontSize: Math.max(24, bodySize - 12) }}>{shioriFeeling}</p>
      </div>
      <div className={styles.feelingGirlWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element -- export requires a plain img node */}
        <img alt="" className={styles.feelingGirl} src="/instagram-studio/girl-standing.webp" />
      </div>
      <CornerImage image={image} size={380} />
    </article>,
    <article className={`${styles.card} ${styles.ctaCard}`} key="cta">
      <BrandHeader page={4} />
      <div className={styles.ctaCopy}>
        <p>ちょっと気になる、を</p>
        <h2>忘れないうちに。</h2>
        <div className={styles.ctaRule} />
        <p className={styles.ctaText}>やってみたいことを見つけて、残しておく。</p>
        <strong>わたしのはじめて帖</strong>
        <span>hajimetecho.jp</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- export requires a plain img node */}
      <img alt="" className={styles.ctaIllustration} src="/instagram-studio/cta-hill.webp" />
    </article>,
  ];

  return (
    <main className={styles.studio}>
      <aside className={styles.controls}>
        <div>
          <p className={styles.toolLabel}>開発用ツール</p>
          <h1>Instagram投稿作成</h1>
          <p className={styles.source}>マスタ：{source === "supabase" ? "Supabase" : "ローカル"}</p>
        </div>
        <label>
          体験マスタ
          <select value={selected.id} onChange={(event) => selectExperience(event.target.value)}>
            {availableExperiences.map((experience) => <option key={experience.id} value={experience.id}>{experience.title}</option>)}
          </select>
        </label>
        <label>
          タイトル（入力した改行を反映）
          <textarea rows={3} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          説明文（入力した改行を反映）
          <textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          しおりちゃんの気持ち（3枚目・入力した改行を反映）
          <textarea
            placeholder={"この体験を、しおりちゃんはなぜやってみたいと思った？"}
            rows={6}
            value={shioriFeeling}
            onChange={(event) => setShioriFeeling(event.target.value)}
          />
        </label>
        <label>
          タイトル文字サイズ：{titleSize}px
          <input min="48" max="88" type="range" value={titleSize} onChange={(event) => setTitleSize(Number(event.target.value))} />
        </label>
        <label>
          本文文字サイズ：{bodySize}px
          <input min="28" max="56" type="range" value={bodySize} onChange={(event) => setBodySize(Number(event.target.value))} />
        </label>
        <label>
          キャプション
          <textarea rows={9} value={caption} onChange={(event) => setCaption(event.target.value)} />
        </label>
        <div className={styles.actions}>
          <button disabled={exporting} onClick={downloadAll} type="button">{exporting ? "書き出し中…" : "4枚をPNG保存"}</button>
          <button className={styles.secondaryButton} onClick={downloadCaption} type="button">キャプション保存</button>
        </div>
      </aside>
      <section className={styles.previews} aria-label="投稿プレビュー">
        {cards.map((card, index) => (
          <div className={styles.previewItem} key={index}>
            <div className={styles.previewFrame}>
              <div className={styles.previewScale}>
                <div ref={(node) => { cardRefs.current[index] = node; }}>{card}</div>
              </div>
            </div>
            <button className={styles.singleDownload} onClick={() => downloadCard(index)} type="button">{index + 1}枚目だけ保存</button>
          </div>
        ))}
      </section>
    </main>
  );
}

function BrandHeader({ page }: { page: number }) {
  return (
    <header className={styles.brandHeader}>
      <span className={styles.brandHeaderTitle}>
        <LeafIcon />
        わたしのはじめて帖
      </span>
      <span>{page} / 4</span>
    </header>
  );
}

function LeafIcon() {
  return (
    <svg className={styles.leafIcon} fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 27C16 27 7 23.5 7 14.5C7 9.5 11 6 16 5C21 6 25 9.5 25 14.5C25 23.5 16 27 16 27Z" fill="#9CB48A" />
      <path d="M16 27V6" stroke="#6E8A5C" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M16 11L12 8.5M16 16L11 14M16 21L12 19" stroke="#6E8A5C" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}

function CornerImage({ image, size = 390 }: { image: string; size?: number }) {
  return (
    <div className={styles.cornerImageWrap} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- export requires a plain img node */}
      <img alt="" crossOrigin="anonymous" src={image} />
    </div>
  );
}
