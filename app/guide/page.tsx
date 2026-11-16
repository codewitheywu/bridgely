import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../site";
import { Tour } from "./tour";

export const metadata: Metadata = { title: "How to use", description: "A step-by-step guide to TB Rewards for employees and admins." };

export default function GuidePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10"><Tour /></main>
      <SiteFooter />
    </>
  );
}
