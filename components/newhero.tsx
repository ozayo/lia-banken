import Image from "next/image";

export function Newhero() {
  return (

    <>
      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          {/* Background pattern or subtle animation can go here for more dynamism */}
          <div className="h-full w-full bg-[url('/path/to/your/hero-background-pattern.svg')] bg-cover bg-center"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-up">
              Empowering Your Ambitions.
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90 animate-fade-in-up delay-100">
              Seamless banking solutions tailored for every stage of your journey – from campus to corporation.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 animate-fade-in-up delay-200">
              <button className="bg-white text-blue-700 hover:bg-blue-50 transition duration-300 font-bold py-3 px-8 rounded-full shadow-lg text-lg">
                Explore Accounts
              </button>
              <a 
                href="#learn-more" 
                className="text-white border-2 border-white hover:bg-white hover:text-blue-700 transition duration-300 font-semibold py-3 px-8 rounded-full text-lg"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center md:justify-end animate-fade-in-right">
            {/* Replace with your actual hero image */}
            <Image
              src="/images/hero-illustration.png" // Update this path to your image
              alt="Diverse individuals using digital banking"
              width={600}
              height={400}
              layout="intrinsic" 
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* --- */}

      {/* Tailored Solutions Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            Tailored Solutions for Every Goal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card for Students */}
            <div className="bg-white rounded-lg shadow-xl p-8 transform hover:scale-105 transition-transform duration-300 ease-in-out border-t-4 border-blue-500">
              <div className="text-blue-500 mb-6 text-5xl">
                <i className="fas fa-graduation-cap"></i> {/* Example Font Awesome Icon */}
                {/* Or use an SVG icon here */}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">For Students: Your Financial Jumpstart</h3>
              <p className="text-gray-600 mb-6">
                Manage your money effortlessly, track expenses, and save for your future with student-friendly accounts and exclusive benefits. Get smart about your finances from day one.
              </p>
              <ul className="text-gray-700 list-disc list-inside mb-6 space-y-2">
                <li><strong className="font-semibold">Zero-fee</strong> student accounts</li>
                <li>Budgeting tools & insights</li>
                <li>Student loan guidance</li>
                <li>Exclusive discounts with student ID</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-300 font-semibold">
                Open Student Account
              </button>
            </div>

            {/* Card for Schools */}
            <div className="bg-white rounded-lg shadow-xl p-8 transform hover:scale-105 transition-transform duration-300 ease-in-out border-t-4 border-green-500">
              <div className="text-green-500 mb-6 text-5xl">
                <i className="fas fa-school"></i> {/* Example Font Awesome Icon */}
                {/* Or use an SVG icon here */}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">For Schools: Streamlining Campus Finances</h3>
              <p className="text-gray-600 mb-6">
                Revolutionize your institution's financial operations with secure, efficient, and scalable banking solutions designed for educational needs. Simplify payments, payroll, and funding.
              </p>
              <ul className="text-gray-700 list-disc list-inside mb-6 space-y-2">
                <li>Automated tuition payment systems</li>
                <li>Secure payroll for staff & faculty</li>
                <li>Fundraising & grant management tools</li>
                <li>Dedicated institutional support</li>
              </ul>
              <button className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition duration-300 font-semibold">
                Partner with Lia Bank
              </button>
            </div>

            {/* Card for Businesses */}
            <div className="bg-white rounded-lg shadow-xl p-8 transform hover:scale-105 transition-transform duration-300 ease-in-out border-t-4 border-purple-500">
              <div className="text-purple-500 mb-6 text-5xl">
                <i className="fas fa-building"></i> {/* Example Font Awesome Icon */}
                {/* Or use an SVG icon here */}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">For Businesses: Fueling Your Growth</h3>
              <p className="text-gray-600 mb-6">
                From startups to established enterprises, Lia Bank provides robust financial tools and expert support to help your business thrive. Focus on innovation, we'll handle the banking.
              </p>
              <ul className="text-gray-700 list-disc list-inside mb-6 space-y-2">
                <li>Flexible business accounts</li>
                <li>Seamless payment processing</li>
                <li>Business loan & credit options</li>
                <li>Dedicated relationship manager</li>
              </ul>
              <button className="w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 transition duration-300 font-semibold">
                Discover Business Banking
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
