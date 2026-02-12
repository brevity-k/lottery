import Card from '@/components/ui/Card';

interface FAQSectionProps {
  faqs: { question: string; answer: string }[];
}

export default function FAQSection({ faqs }: FAQSectionProps) {
  if (faqs.length === 0) return null;

  return (
    <Card className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
      <div className="divide-y divide-gray-200">
        {faqs.map((faq, i) => (
          <details key={i} className="group py-4 first:pt-0 last:pb-0">
            <summary className="flex cursor-pointer items-center justify-between text-left font-medium text-gray-900 hover:text-blue-600">
              <span className="pr-4">{faq.question}</span>
              <span className="ml-2 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Card>
  );
}
