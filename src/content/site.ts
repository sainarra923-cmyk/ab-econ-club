// Text for the About and Resources pages. Edit here to change what those pages say.

export const site = {
  name: "Acton-Boxborough Economics Club",
  shortName: "AB Econ",
  tagline:
    "Students at Acton-Boxborough Regional High School explaining the economy, one argument at a time.",
  meeting: "We meet weekly after school.",
  contactEmail: "", // e.g. "abeconclub@gmail.com". Leave empty to hide.
};

export const about = {
  intro:
    "The Acton-Boxborough Economics Club is a student-run club for anyone curious about how money, markets, and policy shape everyday life. No background required.",
  sections: [
    {
      heading: "What we do",
      body: "Each week we take a story from the news and work through the economics behind it: who benefits, who pays, and what the data says. We prepare teams for economics competitions, host guest speakers, and publish member writing on this site.",
    },
    {
      heading: "Who it's for",
      body: "Anyone at AB. Some members are taking AP Macro or Micro, some are heading toward business or policy, and some just like a good argument. Meetings are open, so you can come once and see if it's for you.",
    },
    {
      heading: "Write for the blog",
      body: "Any member can write a post. Bring an idea to an officer, and we'll help you shape it, edit it, and publish it with your name on it.",
    },
  ],
};

export type Resource = { name: string; url: string; description: string };

export const resources: { heading: string; intro: string; items: Resource[] }[] = [
  {
    heading: "Competitions",
    intro: "Competitions the club prepares for or that members can enter. Check each site for current dates and eligibility.",
    items: [
      {
        name: "National Economics Challenge",
        url: "https://www.councilforeconed.org/",
        description:
          "Run by the Council for Economic Education. Teams of high school students answer questions on micro, macro, and current events.",
      },
      {
        name: "Fed Challenge",
        url: "https://www.federalreserveeducation.org/",
        description:
          "Teams analyze the economy and present a monetary policy recommendation to judges. Several Federal Reserve Banks host their own regional versions.",
      },
      {
        name: "Wharton Global High School Investment Competition",
        url: "https://globalyouth.wharton.upenn.edu/competitions/investment-competition/",
        description:
          "Teams manage a simulated portfolio for a client case and present their strategy.",
      },
      {
        name: "International Economics Olympiad",
        url: "https://ecolymp.org/",
        description:
          "An international competition covering economic theory, financial literacy, and a business case.",
      },
    ],
  },
  {
    heading: "Data and reading",
    intro: "Where we go for numbers and explanations.",
    items: [
      {
        name: "FRED",
        url: "https://fred.stlouisfed.org/",
        description:
          "Free economic data from the St. Louis Fed. The fastest way to make a chart of almost any U.S. statistic.",
      },
      {
        name: "Marginal Revolution University",
        url: "https://mru.org/",
        description: "Free short videos covering intro micro, macro, and more.",
      },
      {
        name: "Khan Academy: Economics",
        url: "https://www.khanacademy.org/economics-finance-domain",
        description: "Full free courses lined up with AP Macro and AP Micro.",
      },
    ],
  },
];
