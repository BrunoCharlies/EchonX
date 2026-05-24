import type { Metadata } from "next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about EchonX profiles, X login, listening limits, on-device audio, and Pro audio comments.",
};

const items = [
  {
    q: "Is there a global feed?",
    a: "No. EchonX is profile-first. You browse people, choose who you want to hear, and manage listening from those profiles.",
  },
  {
    q: "How does X login work?",
    a: "We use OAuth 2.0 with PKCE, the industry standard for public clients. You authorize once with X, and EchonX issues a secure session on our servers.",
  },
  {
    q: "What is the difference between native and external profiles?",
    a: "Native EchonX profiles are created inside EchonX after you log in. They are always free to read with unlimited listening. External X profiles follow the listening limits of your subscription tier.",
  },
  {
    q: "Which posts are read automatically?",
    a: "Only posts created after your subscription begins are enqueued automatically. Older posts stay available, but you tap Listen to hear them on demand.",
  },
  {
    q: "How does audio playback work?",
    a: "Playback runs on-device whenever possible, so your queue sounds great while minimizing sensitive text leaving your hardware.",
  },
  {
    q: "Who can record audio comments?",
    a: "Audio comments are exclusive to Pro subscribers, ensuring we can invest in moderation, storage, and playback quality.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Frequently asked questions</h1>
      <p className="mt-4 text-muted-foreground">
        Straight answers in American English. Reach support inside the app once you are signed in.
      </p>
      <Accordion type="single" collapsible className="mt-10 w-full">
        {items.map((item, idx) => (
          <AccordionItem key={item.q} value={`item-${idx}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
