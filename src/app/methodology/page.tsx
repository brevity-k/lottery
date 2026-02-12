import { Metadata } from 'next';
import { breadcrumbSchema } from '@/lib/seo/structuredData';
import { SITE_URL, SITE_NAME, DISCLAIMER_TEXT } from '@/lib/utils/constants';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: `Our Methodology | ${SITE_NAME}`,
  description: 'Learn how My Lotto Stats calculates frequency analysis, hot & cold numbers, overdue detection, pair analysis, and statistical recommendations.',
  alternates: { canonical: `${SITE_URL}/methodology` },
};

export default function MethodologyPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Methodology', url: `${SITE_URL}/methodology` },
      ])} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Methodology' }]} />

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Our Methodology
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Transparency in how we analyze lottery data — our methods, our math, and our limitations.
        </p>

        <Card className="mb-8">
          <div className="prose prose-gray max-w-none">
            <h2 className="text-xl font-bold text-gray-900 mt-0">Frequency Analysis</h2>
            <p>Frequency analysis counts how often each number has appeared across all historical draws. For each number, we calculate:</p>
            <ul>
              <li><strong>Total appearances:</strong> The raw count of how many times a number has been drawn</li>
              <li><strong>Frequency percentage:</strong> Appearances divided by total draws — for Powerball white balls (5 drawn from 69), the expected frequency is approximately 7.25% per draw (5/69)</li>
              <li><strong>Deviation from expected:</strong> How far above or below the statistical average a number falls</li>
            </ul>
            <p>We calculate frequency separately for main numbers and bonus numbers, since they are drawn from different pools with different expected rates.</p>

            <h2 className="text-xl font-bold text-gray-900">Hot &amp; Cold Number Scoring</h2>
            <p>Our hot and cold system uses a <strong>weighted scoring model</strong> across three time horizons:</p>
            <ul>
              <li><strong>Recent draws (last 20):</strong> Weighted 3x — captures current momentum</li>
              <li><strong>Medium-term (last 100 draws):</strong> Weighted 2x — smooths short-term noise</li>
              <li><strong>All-time history:</strong> Weighted 1x — provides a baseline reference</li>
            </ul>
            <p>The composite score determines whether a number is classified as Hot (above average across all horizons), Warm (mixed signals), or Cold (below average). This multi-horizon approach avoids the pitfalls of relying on a single time frame — a number can be historically cold but recently hot, and our scoring reflects this nuance.</p>

            <h2 className="text-xl font-bold text-gray-900">Overdue Analysis</h2>
            <p>For each number, we track two metrics:</p>
            <ul>
              <li><strong>Current gap:</strong> How many consecutive draws have passed without this number appearing</li>
              <li><strong>Expected interval:</strong> The statistically expected gap between appearances, calculated as total numbers in the pool divided by numbers drawn per draw (e.g., for Powerball white balls: 69/5 = ~13.8 draws)</li>
            </ul>
            <p>The <strong>overdue ratio</strong> is the current gap divided by the expected interval. A ratio above 1.0 means the number has been absent longer than average. A ratio of 2.0 means it has been absent twice as long as expected. Note: being overdue does not make a number more likely to appear — each draw is independent.</p>

            <h2 className="text-xl font-bold text-gray-900">Pair, Triplet &amp; Quadruplet Analysis</h2>
            <p>We examine every possible two-number, three-number, and four-number combination across all historical draws:</p>
            <ul>
              <li><strong>Pairs:</strong> Every combination of 2 numbers from each draw — for a 5-number draw, that is C(5,2) = 10 pairs per draw</li>
              <li><strong>Triplets:</strong> Every combination of 3 numbers — C(5,3) = 10 triplets per draw</li>
              <li><strong>Quadruplets:</strong> Every combination of 4 numbers — C(5,4) = 5 quadruplets per draw</li>
            </ul>
            <p>We rank combinations by frequency and surface the most common co-occurrences. This adds a relationship dimension to the analysis — which numbers tend to appear together.</p>

            <h2 className="text-xl font-bold text-gray-900">Recommendation Engine</h2>
            <p>Our recommendation engine blends multiple statistical signals into a composite score for each number. We offer three strategies:</p>
            <ul>
              <li><strong>Balanced:</strong> 30% frequency + 30% hot/cold trend + 25% overdue + 15% pair bonus — a diversified approach</li>
              <li><strong>Trending:</strong> 20% frequency + 50% hot/cold + 15% overdue + 15% pair bonus — favors recent momentum</li>
              <li><strong>Contrarian:</strong> 15% frequency + 10% hot/cold + 60% overdue + 15% pair bonus — targets statistically overdue numbers</li>
            </ul>
            <p>For each strategy, we generate 3 sets of numbers. The pair bonus adds extra weight to numbers that frequently co-occur with other high-scoring numbers in the selection. The engine never duplicates numbers within a set and respects each game&apos;s format (e.g., 5 main + 1 bonus for Powerball, 5 main with no bonus for Take 5).</p>

            <h2 className="text-xl font-bold text-gray-900">Data Sources &amp; Integrity</h2>
            <p>All lottery data comes from the <strong>NY Open Data SODA API</strong> (data.ny.gov), a government-operated data platform. We fetch data daily and apply automated validation:</p>
            <ul>
              <li>Number range checks against each game&apos;s known format</li>
              <li>Draw date schedule validation</li>
              <li>Duplicate draw detection</li>
              <li>Record count guards (data can never shrink between updates)</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900">Important Limitations</h2>
            <p>All lottery drawings are <strong>independent random events</strong>. Each ball drawn has no memory of previous results. Our statistical analysis describes historical patterns — it does <strong>not predict future outcomes</strong>. Hot numbers are not more likely to appear next, and overdue numbers are not &quot;due&quot; for a correction.</p>
            <p>Modern lottery drawing machines are rigorously tested and regulated. Observed frequency variations in historical data are the natural result of randomness, not evidence of bias. Our tools are designed to make number exploration more engaging and data-driven, but they offer no advantage over random selection.</p>
          </div>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-sm text-amber-800">{DISCLAIMER_TEXT}</p>
        </div>
      </div>
    </>
  );
}
