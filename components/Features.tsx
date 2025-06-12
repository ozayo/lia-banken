

const features = [
  {
    title: "Easy Internship Applications",
    description: "Students can apply to suitable companies in just a few clicks.",

  },
  {
    title: "Secure Registration via Schools",
    description: "Only verified school email addresses are allowed for registration.",

  },
  {
    title: "Smart Filtering for Employers",
    description: "Employers can find ideal candidates using filters like city, school, and program.",

  },
  {
    title: "Manage Internship Periods",
    description: "Schools can create and track LIA periods, including programs, terms, and student placements.",

  },
  {
    title: "Publish Profile & Upload CV",
    description: "Students can easily share their resumes and cover letters on the platform.",

  },
  {
    title: "Two-Way Invitation System",
    description: "Students can apply to companies, and companies can send direct invitations to students.",

  },
];

const Features = () => {
  return (
    <section className="mt-16 md:mt-0 mb-20 pb-16">
      {/* Heading */}
      <div>
        <h2 className="text-3xl lg:text-3xl font-bold lg:tracking-tight">
          Connecting Students, Schools, and Employers
        </h2>
        <p className="text-lg mt-4 text-slate-600">
          LIA Banken is built to streamline the internship (LIA) process for students, schools, and companies. From registration to placement, everything happens in one collaborative platform.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 mt-16 gap-16">
        {features.map((feature, index) => (
          <div key={index} className="flex gap-4 items-start">
            {/* Icon */}

            {/* Title & Description */}
            <div>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-slate-500 mt-2 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;