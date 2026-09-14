import { notFound } from "next/navigation";
import InstagramStudio from "./InstagramStudio";

export const metadata = {
  title: "Instagram投稿作成 | わたしのはじめて帖",
  robots: { index: false, follow: false },
};

export default function InstagramStudioPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <InstagramStudio />;
}
