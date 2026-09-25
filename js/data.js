// Single source of truth for the site. Every section and every console
// command reads from here, so updating the portfolio means editing this file.
window.PROFILE = {
  name: "Nazanin Fereydoonizade",
  handle: "nazanin",
  title: "Software Engineer",
  headline: "Software engineer building banking, fintech and logistics backends on the JVM.",
  yearsOfExperience: 9,
  leadershipYears: 3,
  summary: [
    "Highly motivated and results-oriented software engineer with 9+ years of experience designing, developing and implementing complex enterprise applications.",
    "Currently a software engineer at Snappbox. More than 3 years of leadership experience on both backend and frontend, leading productive, friendly teams that are eager to take on time-sensitive projects.",
    "A fast learner with a strong desire to keep expanding her knowledge base."
  ],
  links: {
    email: "nazanin.fereydoonizade@gmail.com",
    github: "https://github.com/nazanin1998",
    linkedin: "https://www.linkedin.com/in/nazanin-fereydoonizade"
  },

  experience: [
    {
      id: "snappbox",
      company: "Snapp Box",
      role: "Java Application Developer",
      from: "2024-06",
      to: null,
      projects: [
        {
          name: "Snappbox",
          points: [
            "Develops new features and maintains existing ones across the Snappbox platform.",
            "Designed and implemented the live location sharing solution using EMQX."
          ]
        },
        {
          name: "Biker Streaming",
          points: [
            "Syncs full biker information, including profile, ban data, bank info and vehicles, from Cap venture to Box venture."
          ]
        },
        {
          name: "Fleet Management",
          points: [
            "Designed and implemented a Spring Boot fleet management application from scratch."
          ]
        }
      ],
      stack: ["Java", "Spring Boot", "EMQX"]
    },
    {
      id: "karafarin",
      company: "Negah (Karafarin Bank)",
      role: "Java Application Developer",
      from: "2023-03",
      to: "2024-06",
      projects: [
        {
          name: "Supply Chain Finance (SCF)",
          points: [
            "Designed and implemented the Spring Boot application from scratch as backend team lead.",
            "Built a framework for a microservice architecture using orchestration and the Saga pattern, with RabbitMQ as the message broker.",
            "Used Hibernate and Spring Data MongoDB, with Oracle as the database and Redis as the cache.",
            "Separated domains to apply domain-driven design across the microservices.",
            "Worked with Docker, Jenkins, Kubernetes and CI/CD."
          ]
        },
        {
          name: "Wallet",
          points: [
            "Deep understanding of accounting modules; implemented the General Ledger (GL) as an independent microservice."
          ]
        }
      ],
      stack: ["Java", "Spring Boot", "RabbitMQ", "Hibernate", "MongoDB", "Oracle", "Redis", "Docker", "Jenkins"]
    },
    {
      id: "shahr-bank",
      company: "City Development & Innovations (Shahr Bank)",
      role: "Frontend Team Lead / Backend Developer",
      from: "2020-12",
      to: "2023-03",
      projects: [
        {
          name: "Digital Banking Application",
          points: [
            "Designed and implemented a new mobile bank app from scratch for City Bank, with 1M+ active users, using Flutter on multiple platforms."
          ]
        },
        {
          name: "Banking Terminals Administration",
          points: [
            "Developed backend applications with the Spring Boot framework.",
            "Took part in the MongoDB database design.",
            "Used Spring Data, Spring Security and Keycloak."
          ]
        },
        {
          name: "Dynamic Widget Maker and Manager",
          points: []
        }
      ],
      stack: ["Java", "Spring Boot", "Spring Security", "Keycloak", "MongoDB", "Flutter"]
    }
  ],

  earlier: [
    { company: "Freelancer", role: "Mobile Application Developer", from: "2020-08", to: "2020-12" },
    { company: "Dokmeh Design Studio", role: "Node.js / Mobile Application Developer", from: "2020-05", to: "2020-12" },
    { company: "Mayadin Shahrdari Tehran Org.", role: "Mobile Application Developer (Freelance)", from: "2020-01", to: "2020-03" },
    { company: "World of Gammers", role: "Mobile Application Developer", from: "2019-02", to: "2019-10" },
    { company: "Mobagym", role: "Mobile Application Developer", from: "2018-06", to: "2018-08" },
    { company: "Tamasha", role: "Backend Developer (Node.js)", from: "2017-09", to: "2018-05" }
  ],

  // level: 4 = advanced, 3 = intermediate, 2 = pre-intermediate
  skills: {
    languages: [["Java", 4], ["Dart", 4], ["Python", 3]],
    frameworks: [
      ["Spring Boot", 4], ["Hibernate", 4], ["Spring Security / Keycloak", 4],
      ["Flutter", 4], ["Express.js", 3], ["Node.js", 2]
    ],
    databases: [
      ["MySQL", 4], ["MongoDB", 4], ["Oracle", 4],
      ["PostgreSQL", 3], ["Redis", 3], ["Elasticsearch", 2]
    ],
    platform: [
      ["RabbitMQ", 4], ["EMQX", 4], ["Git", 4], ["JIRA", 4],
      ["Apache Kafka", 3], ["Docker", 3],
      ["Prometheus / Grafana", null], ["Jenkins (CI/CD)", null], ["Spring Boot Admin", null]
    ],
    concepts: [["OOP", 4], ["AOP", 4], ["Microservice Architecture", 3], ["Domain-Driven Design", 3]]
  },

  education: [
    { degree: "M.E. Software Engineering", school: "Alzahra University", from: "2020", to: "2023", note: "Top Student" },
    { degree: "B.E. Software Engineering", school: "Alzahra University", from: "2016", to: "2020", note: "Top Student" }
  ]
};
