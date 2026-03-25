import { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants';
import { breadcrumbSchema } from '@/lib/seo/structuredData';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

export const metadata: Metadata = {
  title: `Responsible Gaming - ${SITE_NAME}`,
  description: 'Information about responsible lottery play, setting budgets, recognizing problem gambling signs, and where to get help.',
  openGraph: {
    title: `Responsible Gaming - ${SITE_NAME}`,
    description: 'Information about responsible lottery play, setting budgets, recognizing problem gambling signs, and where to get help.',
    url: `${SITE_URL}/responsible-gaming`,
  },
  alternates: { canonical: `${SITE_URL}/responsible-gaming` },
};

export default function ResponsibleGamingPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Responsible Gaming', url: `${SITE_URL}/responsible-gaming` },
      ])} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Responsible Gaming' }]} />

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Responsible Gaming</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <p className="text-blue-800 font-medium">
            If you or someone you know needs help with problem gambling, call or text the National Problem Gambling Helpline:
            <span className="block text-xl font-bold mt-1">1-800-522-4700</span>
            Available 24/7 &mdash; free and confidential.
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6">

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Playing Responsibly</h2>
          <p className="text-gray-600">
            The lottery is a form of entertainment, not a financial strategy. Tickets are best thought of the same way as a movie ticket or a night out &mdash; a small, fixed cost for a fun experience. The odds of winning a major jackpot are extremely low, and no statistical pattern can change that. Approaching the lottery with realistic expectations and a firm budget is the foundation of responsible play.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Setting a Budget</h2>
          <p className="text-gray-600">
            Decide how much you are willing to spend before you buy any tickets &mdash; and stick to it. A few practical guidelines:
          </p>
          <ul className="text-gray-600 space-y-2 list-disc list-inside">
            <li>Treat ticket spending as a discretionary entertainment expense, not an investment.</li>
            <li>Never use money set aside for rent, bills, groceries, or savings.</li>
            <li>Never chase losses by buying more tickets after a losing draw.</li>
            <li>Set a weekly or monthly spending cap and track it the same way you would any other budget line.</li>
            <li>If you play regularly, consider setting reminders to review your total spending each month.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Signs of Problem Gambling</h2>
          <p className="text-gray-600">
            Problem gambling can develop gradually. The following warning signs may indicate that lottery play has moved beyond entertainment:
          </p>
          <ul className="text-gray-600 space-y-2 list-disc list-inside">
            <li>Spending more than you can afford, or more than you originally intended.</li>
            <li>Borrowing money from friends, family, or credit accounts to buy tickets.</li>
            <li>Hiding your lottery spending from people close to you.</li>
            <li>Feeling anxious, irritable, or preoccupied when you are not playing.</li>
            <li>Continuing to play in order to recover money you have already lost.</li>
            <li>Neglecting work, school, or family responsibilities because of gambling activities.</li>
            <li>Believing that a &quot;system&quot; or &quot;strategy&quot; will eventually produce a win.</li>
          </ul>
          <p className="text-gray-600">
            Recognizing these signs early is the most important step. Help is available and recovery is possible.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Self-Exclusion Programs</h2>
          <p className="text-gray-600">
            Most US states offer voluntary self-exclusion programs that allow individuals to restrict their own access to lottery or gambling services for a set period of time. Enrolling in a self-exclusion program is a practical, private step you can take on your own terms.
          </p>
          <p className="text-gray-600">
            To find your state&apos;s self-exclusion options, contact your state lottery commission directly or visit the National Council on Problem Gambling website at <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ncpgambling.org</a> for a directory of state resources.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Getting Help</h2>
          <p className="text-gray-600">
            The following organizations provide free, confidential support for individuals and families affected by problem gambling:
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 text-lg">National Council on Problem Gambling (NCPG)</h3>
              <p className="text-gray-600 mt-1">
                Helpline: <strong>1-800-522-4700</strong> (call or text) &mdash; 24/7, free, confidential<br />
                Website: <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ncpgambling.org</a>
              </p>
              <p className="text-gray-500 text-sm mt-2">
                The NCPG helpline connects callers with local treatment referrals, support groups, and financial counseling resources anywhere in the US.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 text-lg">Gamblers Anonymous</h3>
              <p className="text-gray-600 mt-1">
                Website: <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">gamblersanonymous.org</a>
              </p>
              <p className="text-gray-500 text-sm mt-2">
                A fellowship of people who share their experience, strength, and hope with each other. In-person and online meetings available worldwide.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 text-lg">National Problem Gambling Helpline</h3>
              <p className="text-gray-600 mt-1">
                <strong>1-800-522-4700</strong> &mdash; Available 24 hours a day, 7 days a week<br />
                Free, confidential, no judgment.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Our Commitment</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-800">
              {SITE_NAME} is an informational platform. We do not sell tickets, facilitate gambling, or encourage excessive play. We believe in transparency, education, and responsible engagement with lottery games. All statistical analysis on this site is provided for entertainment and informational purposes only &mdash; past patterns do not predict future outcomes.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
