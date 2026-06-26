import { Quote } from 'lucide-react';

interface TestimonialHighlightProps {
  quote: string;
  authorName: string;
  authorCity: string;
  authorRole?: string;
}

export default function TestimonialHighlight({
  quote,
  authorName,
  authorCity,
  authorRole = 'Fotógrafo parceiro',
}: TestimonialHighlightProps) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">
          O que nossos parceiros dizem
        </h2>
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-border p-8 md:p-12">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <Quote className="h-10 w-10 text-primary/30 mb-4" />
              <blockquote className="text-lg md:text-xl font-serif italic text-foreground leading-relaxed mb-6">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {authorName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{authorName}</p>
                  <p className="text-sm text-muted-foreground">{authorRole} — {authorCity}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
