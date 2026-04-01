import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-20 py-12">
      {/* HERO SECTION */}
      <section className="text-center max-w-4xl px-4 space-y-6">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Survive Belgian Bureaucracy <br className="hidden md:block" />
          <span className="text-blue-600">Without the Headache.</span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Hi, I'm{" "}
          <span className="font-semibold text-gray-900">Rami Shamseddin</span>.
          When I first moved to Brussels, figuring out the rules, the commune,
          and the endless paperwork was a nightmare. I built this Digital
          Relocation Consultant to help newcomers set up their lives in Belgium
          smoothly and stress-free.
        </p>
      </section>

      {/* EXPECTATION VS REALITY SECTION (Building Trust!) */}
      <section className="w-full max-w-6xl px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            Expectation vs. Reality in Brussels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Myth 1 */}
            <div className="space-y-3">
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg font-medium border border-red-100 flex items-start">
                <span className="mr-2">❌</span> "I'll get my ID card in a
                week."
              </div>
              <div className="bg-green-50 text-green-800 px-4 py-4 rounded-lg shadow-inner border border-green-100">
                ✅ <span className="font-bold">The Truth:</span> Welcome to the
                waiting game. You'll get an "Annex 15" paper first. The actual
                A-Card requires a police visit to check you actually live there,
                taking weeks or months.
              </div>
            </div>

            {/* Myth 2 */}
            <div className="space-y-3">
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg font-medium border border-red-100 flex items-start">
                <span className="mr-2">❌</span> "Opening a bank account is
                instant."
              </div>
              <div className="bg-green-50 text-green-800 px-4 py-4 rounded-lg shadow-inner border border-green-100">
                ✅ <span className="font-bold">The Truth:</span> Traditional
                Belgian banks want to see your official ID first. You'll need to
                know which digital banks (like Revolut) work best while you wait
                for your paperwork.
              </div>
            </div>

            {/* Myth 3 */}
            <div className="space-y-3">
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg font-medium border border-red-100 flex items-start">
                <span className="mr-2">❌</span> "Everyone at the commune speaks
                English."
              </div>
              <div className="bg-green-50 text-green-800 px-4 py-4 rounded-lg shadow-inner border border-green-100">
                ✅ <span className="font-bold">The Truth:</span> Legally,
                administration must be done in French or Dutch. Going in
                unprepared can lead to being turned away. Knowing what documents
                to bring is half the battle.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE COVER SECTION (The Expanded Grid) */}
      <section className="w-full max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
          Everything You Need to Settle In
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition">
            <div className="text-4xl mb-4">🪪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Commune & ID
            </h3>
            <p className="text-gray-600 text-sm">
              Registering your address, surviving the police visit, and securing
              your Belgian residence permit (Carte d'Identité).
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              SIM Cards & Internet
            </h3>
            <p className="text-gray-600 text-sm">
              How to get a Belgian phone number fast (+32), the best mobile data
              plans, and setting up home Wi-Fi.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition">
            <div className="text-4xl mb-4">🏦</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Banking & Visas
            </h3>
            <p className="text-gray-600 text-sm">
              Setting up a blocked account for student visas, choosing the right
              bank, and renewing your legal status.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Housing & Leases
            </h3>
            <p className="text-gray-600 text-sm">
              Understanding a <i>contrat de bail</i> (lease agreement), the
              rental deposit (garantie locative), and avoiding housing scams.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Health (Mutuelle)
            </h3>
            <p className="text-gray-600 text-sm">
              Registering with a health insurance fund so your medical expenses
              and doctor visits are properly reimbursed.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition">
            <div className="text-4xl mb-4">🚇</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Transport (STIB/MIVB)
            </h3>
            <p className="text-gray-600 text-sm">
              Navigating Brussels public transport, getting your MOBIB card, and
              securing massive student discounts.
            </p>
          </div>
        </div>
      </section>

      {/* THE AI CALL TO ACTION */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 w-full max-w-5xl rounded-3xl p-10 md:p-14 text-center border border-blue-100 shadow-sm relative overflow-hidden">
        {/* Decorative background blurs for a modern look */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Meet Your Personal AI Consultant
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Don't want to read through endless government PDFs? I trained an AI
            on the actual Belgian legal codes. Just ask it a question about your
            specific situation, and it will give you a clear, actionable answer.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            Ask the AI Consultant
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
