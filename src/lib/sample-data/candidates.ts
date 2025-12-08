import { Candidate } from "@/lib/types/candidate"

export const sampleCandidates: Candidate[] = [
  {
    id: "1",
    name: "Umais Rasheed",
    postingTitle: null,
    email: "mianumais1997@gmail.com ",
    mobileNo: "0321-6781277",
    cnic: "61101-83552611",
    currentSalary: 1050000,
    expectedSalary: 1100000,
    city: "Islamabad",
    githubUrl: "https://github.com/umaiss/",
    linkedinUrl: "https://www.linkedin.com/in/umais-rasheed/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/:b:/p/raahim_z/IQByxRtJfd73RJ1W23nZsbCfAdTRvNSC73afmp0WK8D1IT4?e=tpQPwf",
    workExperiences: [
      {
        id: "we-1-1",
        employerName: "DPL",
        jobTitle: "React Native Developer",
        projects: [
          {
            id: "proj-exp-1-1-1",
            projectName: "Miracle Morning Routine",
            contributionNotes: "Ensured app stability and performance while adding new features and maintaining existing functionalities for 200,000+ users. Redesigned the app with enhanced UI/UX and performance. Implemented track player & video streaming, AppFlyer analytics, inapp purchases (RevenueCat), CodePush, and CI/CD. Added animations, bug fixes, deep linking, push notifications, Mixpanel analytics, and payment gateway integration. Integrated Cursor AI for AI-driven features."
          },
          {
            id: "proj-exp-1-1-2",
            projectName: "Pause Breathe Reflect",
            contributionNotes: "Designed and developed the app from scratch, setting up a stable and scalable architecture. Implemented native bridging for widgets, social logins, track player, and inapp purchases (RevenueCat). Integrated Redux Toolkit for state management, API integrations, deep linking, push notifications, and React Navigation to ensure a seamless user experience. Focused on performance optimization and maintainable code structure to support future enhancements."
          },
          {
            id: "proj-exp-1-1-3",
            projectName: "Parsley",
            contributionNotes: "Developed and enhanced the app by implementing API integrations, deep linking, and order notification handling. Utilized Redux for efficient state management and contributed to the addition of new features to improve user experience and app functionality."
          },
        ],
        startDate: new Date("2021-07-01"),
        endDate: undefined,
        techStacks: ["react native", "express.js", "node.js", "aws", "sql", "nextjs", "react"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US", "UK"]
      },
      {
        id: "we-1-2",
        employerName: "United Sol",
        jobTitle: "Junior Software Engineer (React Native)",
        projects: [
          {
            id: "proj-exp-1-2-1",
            projectName: "Grocery App with PrestaShop",
            contributionNotes: "Developed a scalable, user-friendly React Native grocery app with reusable components and seamless REST API integration for smooth data handling."
          },
        ],
        startDate: new Date("2020-08-01"),
        endDate: new Date("2021-07-31"),
        techStacks: ["react native"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US", "UK"]
      }
    ],
    projects: [
      {
        id: "standalone-proj-1-1",
        projectName: "code check in bot",
        contributionNotes: "Developed an automated code checking bot using React Native and Node.js to streamline code review processes and improve development workflow efficiency."
      },
    ],
    certifications: [],
    educations: [
      {
        id: "edu-1-1",
        universityLocationId: "loc-001-001",
        universityLocationName: "Sir Syed CASE Institute of Technology - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Computer Science",
        startMonth: new Date("2016-08-01"),
        endMonth: new Date("2020-08-30"),
        grades: "2.5/4.0",
        isTopper: false,
        isCheetah: false
      }
    ],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15")
  },
  {
    id: "2", 
    name: "Abdul Rehman",
    postingTitle: null, 
    email: "abdulrehman6149@gmail.com",
    mobileNo: "0316-7655438",
    cnic: "34202-61369325",
    currentSalary: null,
    expectedSalary: null,
    city: "Rawalpindi",
    githubUrl: null,
    linkedinUrl: "https://www.linkedin.com/in/abdulrehman6149/",
    source: "DPL Employee",
    status: "hired",
    resume: null,
    workExperiences: [
      {
        id: "we-2-1",
        employerName: "DPL",
        jobTitle: "Business Development Executive",
        projects: [],
        startDate: new Date("2024-08-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Rotational",
        workMode: "Hybrid",
        timeSupportZones: ["US", "UK", "EU"]
      },
      {
        id: "we-2-2",
        employerName: "medequips",
        jobTitle: "Service Engineer",
        projects: [],
        startDate: new Date("2017-05-01"),
        endDate: new Date("2020-04-30"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: ["US", "UK", "EU"]
      }
    ],
    certifications: [
      {
        id: "cert-2-1",
        certificationId: "cert-001",
        certificationName: "Foundations of Project Management",
        issueDate: new Date("2023-09-01"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/A6EWMBJ8PDEK"
      },
      {
        id: "cert-2-2",
        certificationId: "cert-002",
        certificationName: "Supervised Machine Learning: Regression and Classification",
        issueDate: new Date("2023-11-01"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/SQKGW92SGSEK"
      },
      {
        id: "cert-2-3",
        certificationId: "cert-003",
        certificationName: "Project Initiation: Starting a Successful Project",
        issueDate: new Date("2023-10-01"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/6QNZFV6C5FU9"
      },
      {
        id: "cert-2-4",
        certificationId: "cert-004",
        certificationName: "Project Planning: Putting It All Together",
        issueDate: new Date("2023-11-01"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/AJFXU7XN99QW"
      },
      {
        id: "cert-2-5",
        certificationId: "cert-005",
        certificationName: "Foundations of Cybersecurity",
        issueDate: new Date("2023-12-01"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/RN7VSPFAE4SB"
      },
      {
        id: "cert-2-6",
        certificationId: "cert-006",
        certificationName: "Machine Learning",
        issueDate: new Date("2023-10-01"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/specialization/Z4YNEXGMUE9R"
      },
      {
        id: "cert-2-7",
        certificationId: "cert-007",
        certificationName: "Introduction to Cybersecurity Tools & Cyberattacks",
        issueDate: new Date("2024-01-01"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/D7Q8WBDMDE7G"
      },
      {
        id: "cert-2-8",
        certificationId: "cert-008",
        certificationName: "Advanced Learning Algorithms",
        issueDate: new Date("2024-01-01"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/44XYEUAXL6WZ"
      }
    ],
    educations: [
      {
        id: "edu-2-1",
        universityLocationId: "loc-002-001",
        universityLocationName: "National University Of Modern Languages (NUML) - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Software Engineering",
        startMonth: new Date("2019-06-01"),
        endMonth: new Date("2023-06-30"),
        grades: "3.3/4.0",
        isTopper: false,
        isCheetah: false
      }
    ],
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-20")
  },
  {
    id: "3",
    name: "Muhammad Ahmad",
    postingTitle: null,
    email: "muhammadahmad23664@gmail.com",
    mobileNo: "0331-5152107",
    cnic: "61101-45606043",
    currentSalary: 110000,
    expectedSalary: 10000000,
    city: "Islamabad",
    githubUrl: "https://github.com/MA23664",
    linkedinUrl: "https://www.linkedin.com/in/muhammad-ahmad-1b8aa1241/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FMuhammad%20Ahmad%20CV%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-3-1",
        employerName: "DPL",
        jobTitle: "Software Engineer",
        projects: [
          {
            id: "proj-exp-3-1-1",
            projectName: "iapartments",
            contributionNotes: "Developed full-stack apartment management system using Angular, React, ASP.NET Core, and MySQL. Implemented AWS cloud services for scalable infrastructure and database management."
          }
        ],
        startDate: new Date("2024-07-01"),
        endDate: undefined,
        techStacks: ["angular", "react", "asp.net core", "aws", "mysql"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US"]
      },
      {
        id: "we-3-2",
        employerName: "Radwi",
        jobTitle: "Android Developer",
        projects: [],
        startDate: new Date("2023-10-01"),
        endDate: new Date("2024-06-30"),
        techStacks: ["android", "kotlin", "java", "firebase"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: []
      },
      {
        id: "we-3-3",
        employerName: "Eziline Software House",
        jobTitle: "Flutter Developer",
        projects: [
          {
            id: "proj-exp-3-3-1",
            projectName: "LMS App",
            contributionNotes: "Built a Learning Management System using Flutter and Dart with Firebase backend integration for real-time data synchronization and user authentication."
          },
          {
            id: "proj-exp-3-3-2",
            projectName: "Quran App",
            contributionNotes: "Developed a Quran reading application with Flutter, implementing smooth navigation, audio playback features, and Firebase for content management."
          },
          {
            id: "proj-exp-3-3-3",
            projectName: "Chat App",
            contributionNotes: "Created a real-time chat application using Flutter and Firebase, implementing messaging features, user authentication, and push notifications."
          }
        ],
        startDate: new Date("2022-08-01"),
        endDate: new Date("2022-11-30"),
        techStacks: ["flutter", "dart", "firebase"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: []
      }
    ],
    projects: [
      {
        id: "standalone-proj-3-1",
        projectName: "Expense Tracker",
        contributionNotes: "Developed a personal expense tracking application using Flutter and Dart, featuring budget management, expense categorization, and data visualization."
      },
      {
        id: "standalone-proj-3-2",
        projectName: "Food Recipe App",
        contributionNotes: "Built a food recipe mobile app with Flutter, implementing recipe search, ingredient lists, cooking instructions, and Firebase for recipe data storage."
      },
    ],
    certifications: [
      {
        id: "cert-3-1",
        certificationId: "cert-009",
        certificationName: "Create a Website Using Wordpress : Free Hosting & Sub-domain",
        issueDate: new Date("2022-03-21"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/certificate/MK4FCNCNB8R7"
      },
      {
        id: "cert-3-2",
        certificationId: "cert-010",
        certificationName: "Getting started with Flutter Development",
        issueDate: new Date("2022-03-29"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/certificate/PZ2RW68FNSTT"
      },
      {
        id: "cert-3-3",
        certificationId: "cert-011",
        certificationName: "Programming for Everybody (Getting Started with Python)",
        issueDate: new Date("2022-06-29"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/certificate/JH6U23S7HWUR"
      },
      {
        id: "cert-3-4",
        certificationId: "cert-012",
        certificationName: "Hands-on Introduction to Linux Commands and Shell Scripting",
        issueDate: new Date("2022-06-29"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/certificate/MR638X834G8Q"
      },
      {
        id: "cert-3-5",
        certificationId: "cert-013",
        certificationName: "Flutter Development",
        issueDate: new Date("2022-10-29"),
        expiryDate: undefined,
        certificationUrl: "https://www.bitdegree.org/api/certificate?slug=flutter-tutorial-from-beginner-level-to-expert-level&action=attachment&username=muhammad-ahmad1247958&utm_source=trn&utm_medium=email&utm_campaign=first_comp"
      },
      {
        id: "cert-3-6",
        certificationId: "cert-014",
        certificationName: "Game Design and Development 2: 2D Platformer",
        issueDate: new Date("2023-01-29"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/AV5AL43QTJNR?utm_source=link&utm_medium=certificate&utm_content=cert_image&utm_campaign=sharing_cta&utm_product=course"
      },
      {
        id: "cert-3-7",
        certificationId: "cert-015",
        certificationName: "Game Design and Development 1: 2D Shooter",
        issueDate: new Date("2023-01-29"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/AV5AL43QTJNR?utm_source=link&utm_medium=certificate&utm_content=cert_image&utm_campaign=sharing_cta&utm_product=course"
      },
      {
        id: "cert-3-8",
        certificationId: "cert-016",
        certificationName: "Python for Data Science, AI & Development",
        issueDate: new Date("2024-02-29"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/2ALYD8BWZ42X"
      },
      {
        id: "cert-3-9",
        certificationId: "cert-017",
        certificationName: "AI For Everyone",
        issueDate: new Date("2024-02-29"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/account/accomplishments/verify/49U7CQLAGCZ7"
      }
    ],
    educations: [
      {
        id: "edu-3-1",
        universityLocationId: "loc-003-001",
        universityLocationName: "Riphah International University - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Software Engineering",
        startMonth: new Date("2020-08-01"),
        endMonth: new Date("2024-06-30"),
        grades: "3.93/4.0",
        isTopper: true,
        isCheetah: true
      }
    ],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-22")
  },
  {
    id: "4",
    name: "Daniyal Rauf",
    postingTitle: null,
    email: "daniyalrathore14@gmail.com",
    mobileNo: "0344-6021955", 
    cnic: "34101-07389247",
    currentSalary: 310000,
    expectedSalary: 360000,
    city: "Islamabad",
    githubUrl: "https://github.com/emilychen",
    linkedinUrl: "https://www.linkedin.com/in/daniyal-rauf-rathore-a21ab31a6/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FDRR%20CV%20%283%29%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-4-1",
        employerName: "DPL",
        jobTitle: "React Native Developer",
        projects: [
          {
            id: "proj-exp-4-1-1",
            projectName: "Miracle Morning Routine",
            contributionNotes: "Feature development, app optimization for DPL"
          }
        ],
        startDate: new Date("2023-09-01"),
        endDate: undefined,
        techStacks: ["react native", "express.js", "node.js"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US", "UK"]
      },
      {
        id: "we-4-2",
        employerName: "Develo IT Solution",
        jobTitle: "React Native Developer & Team Lead",
        projects: [],
        startDate: new Date("2021-02-01"),
        endDate: new Date("2023-08-31"),
        techStacks: ["react native"],
        shiftType: null,
        workMode: null,
        timeSupportZones: ["US", "UK"]
      },
      {
        id: "we-4-3",
        employerName: "MYPro Appz",
        jobTitle: "React Native Developer",
        projects: [],
        startDate: new Date("2021-12-01"),
        endDate: new Date("2023-06-31"),
        techStacks: ["react native"],
        shiftType: null,
        workMode: "Remote",
        timeSupportZones: ["US", "UK"]
      },
      {
        id: "we-4-4",
        employerName: "Bellatrix Technology",
        jobTitle: "React Native Developer",
        projects: [],
        startDate: new Date("2020-09-01"),
        endDate: new Date("2021-02-01"),
        techStacks: ["react native"],
        shiftType: null,
        workMode: "Remote",
        timeSupportZones: ["US", "UK"]
      }
    ],
    projects: [
      {
        id: "standalone-proj-4-1",
        projectName: "The NTR - National Transfer Registry",
        contributionNotes: "Developed a national transfer registry system using React Native, implementing secure data transfer protocols and user registration features."
      },
      {
        id: "standalone-proj-4-2",
        projectName: "Digital Quran App",
        contributionNotes: "Built a digital Quran application with React Native, featuring verse navigation, audio playback, and bookmark functionality for enhanced user experience."
      },
      {
        id: "standalone-proj-4-3",
        projectName: "Gradi - Discover New Food",
        contributionNotes: "Created a food discovery app using React Native with Express.js backend, implementing restaurant search, menu browsing, and user reviews."
      },
      {
        id: "standalone-proj-4-4",
        projectName: "Roadlee Rescuer",
        contributionNotes: "Developed a roadside assistance app with React Native, implementing location services, emergency contact features, and real-time tracking capabilities."
      },
      {
        id: "standalone-proj-4-5",
        projectName: "Swyvery - Delivery App",
        contributionNotes: "Built a food delivery application using React Native and Node.js, implementing order management, payment integration, and real-time order tracking."
      },
      {
        id: "standalone-proj-4-6",
        projectName: "code check in bot",
        contributionNotes: "Developed an automated code review bot using React Native and Express.js to streamline development workflows and ensure code quality standards."
      },
    ],
    certifications: [],
    educations: [
      {
        id: "edu-4-1",
        universityLocationId: "loc-004-001",
        universityLocationName: "University of Gujrat - Gujrat",
        degreeName: "Bachelor of Science",
        majorName: "Computer Science",
        startMonth: new Date("2016-01-01"),
        endMonth: new Date("2020-01-01"),
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-18")
  },
  {
    id: "5",
    name: "Aliyan Latif",
    postingTitle: null,
    email: "aliyanlatif1122@gmail.com",
    mobileNo: "0331-5673669",
    cnic: "61101-49523849", 
    currentSalary: 450000,
    expectedSalary: 500000,
    city: "Islamabad",
    githubUrl: "https://github.com/aliyanlatif",
    linkedinUrl: "https://www.linkedin.com/in/aliyan-latif-4056171a7/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FAliyan%20Latif%27s%20Resume%202%20%282%29%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-5-1",
        employerName: "Ninjas Code",
        jobTitle: "Jr. Software Engineer (React JS & React Native)",
        projects: [
          {
            id: "proj-exp-5-1-1",
            projectName: "Multivendor Food Delivery System",
            contributionNotes: "Revamped UI, Expo upgrades, debugging"
          },
        ],
        startDate: new Date("2023-12-01"),
        endDate: new Date("2024-03-31"),
        techStacks: ["react", "react native", "javascript", "typescript"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-5-2",
        employerName: "DPL",
        jobTitle: "Software Engineer (React Native)",
        projects: [
          {
            id: "proj-exp-5-2-1",
            projectName: "Pause Breathe Reflect",
            contributionNotes: "Developed meditation and mindfulness app using React Native, TypeScript, and JavaScript, implementing breathing exercises, guided sessions, and progress tracking."
          },
          {
            id: "proj-exp-5-2-2",
            projectName: "The Breath Source",
            contributionNotes: "Built a breathing exercise application with React Native and TypeScript, featuring customizable breathing patterns, timer functionality, and user analytics."
          },
          {
            id: "proj-exp-5-2-3",
            projectName: "Miracle Morning Routine",
            contributionNotes: "Created a morning routine tracking app using React Native and JavaScript, implementing habit tracking, daily reminders, and progress visualization features."
          },
          {
            id: "proj-exp-5-2-4",
            projectName: "AscendEd",
            contributionNotes: "Developed an educational platform using React Native and TypeScript, implementing course management, student progress tracking, and interactive learning modules."
          }
        ],
        startDate: new Date("2024-03-01"),
        endDate: undefined,
        techStacks: ["react", "react native", "javascript", "typescript"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US"]
      }
    ],
    projects: [
      {
        id: "standalone-proj-5-1",
        projectName: "code check in bot",
        contributionNotes: "Developed an automated code review bot using React, React Native, JavaScript, and TypeScript to streamline code quality checks and development workflows."
      },
    ],
    certifications: [
      {
        id: "cert-5-1",
        certificationId: "cert-018",
        certificationName: "Scrum Fundamentals Certified (SFC)",
        issueDate: new Date("2022-03-01"),
        expiryDate: undefined,
        certificationUrl: "https://www.scrumstudy.com/certification/verify?type=SFC&number=906067"
      }
    ],
    educations: [
      {
        id: "edu-5-1",
        universityLocationId: "loc-005-001",
        universityLocationName: "Bahria University - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Computer Science",
        startMonth: new Date("2020-02-01"),
        endMonth: new Date("2024-01-31"),
        grades: null, 
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-25")
  },
  {
    id: "6",
    name: "Ubaid Khan",
    postingTitle: null,
    email: "dev.ubd99@gmail.com",
    mobileNo: "0315-6258145",
    cnic: "17301-49200307",
    currentSalary: 150000,
    expectedSalary: 200000,
    city: "Islamabad",
    linkedinUrl: "https://www.linkedin.com/in/ubd99/",
    source: "DPL Employee", 
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FCV%20UBD%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-6-1",
        employerName: "DPL",
        jobTitle: "PERN Stack Developer",
        projects: [
          {
            id: "proj-exp-6-1-1",
            projectName: "code check in bot",
            contributionNotes: "Developed MERN stack evaluation software. Built automated code checking system with tool calling capabilities."
          },
          {
            id: "proj-exp-6-1-2",
            projectName: "AscendEd",
            contributionNotes: "Worked on frontend & backend, developed UI, server-side logic for efficient data flow"
          }
        ],
        startDate: new Date("2025-05-01"),
        endDate: undefined,
        techStacks: ["Mern", "Mean", "postgresql", "express", "react", "node.js"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US", "UK"]
      }
    ],
    certifications: [
      {
        id: "cert-6-1",
        certificationId: "cert-019",
        certificationName: "CS-860 Artificial Intelligence",
        issueDate: new Date("2024-10-09"),
        expiryDate: new Date("2025-10-09"),
        certificationUrl: null
      },
      {
        id: "cert-6-2",
        certificationId: "cert-020",
        certificationName: "CS-871 Machine Learning",
        issueDate: new Date("2024-10-09"),
        expiryDate: new Date("2025-10-09"),
        certificationUrl: null
      },
      {
        id: "cert-6-3",
        certificationId: "cert-021",
        certificationName: "Coursera Course Certifications",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-6-4",
        certificationId: "cert-022",
        certificationName: "Google Developer Student Club (Core Team Member)",
        issueDate: new Date("2020-01-09"),
        expiryDate: new Date("2021-01-09"),
        certificationUrl: null
      }
    ],
    educations: [
      {
        id: "edu-6-1",
        universityLocationId: "loc-006-001",
        universityLocationName: "University of Peshawar - Peshawar",
        degreeName: "Bachelor of Science",
        majorName: "Computer Science",
        startMonth: new Date("2019-09-01"),
        endMonth: new Date("2023-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      },
      {
        id: "edu-6-2",
        universityLocationId: "loc-007-001",
        universityLocationName: "Comsats University - Islamabad",
        degreeName: "Master of Science",
        majorName: "Artificial Intelligence",
        startMonth: new Date("2025-09-01"),
        endMonth: undefined,
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-28")
  },
  {
    id: "7",
    name: "Sohaib Qamar",
    postingTitle: null,
    email: "qamarsohaib86@gmail.com",
    mobileNo: "0346-4320467",
    cnic: "3705-98857439",
    currentSalary: 950000,
    expectedSalary: 1000000,
    city: "Islamabad", 
    githubUrl: null,
    linkedinUrl: "https://www.linkedin.com/in/sohaibqamar86/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FSohaib%20Resume%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-7-1",
        employerName: "Freelancer",
        jobTitle: "Electronics & PCB Specialist",
        projects: [],
        startDate: new Date("2008-06-01"),
        endDate: new Date("2009-06-01"),
        techStacks: ["electronics", "pcb design"],
        shiftType: "Morning",
        workMode: "Remote",
        timeSupportZones: []
      },
      {
        id: "we-7-2",
        employerName: "CUST Research Centre",
        jobTitle: "Design Engineer",
        projects: [],
        startDate: new Date("2009-07-01"),
        endDate: new Date("2011-05-01"),
        techStacks: ["embedded systems", "hardware design"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-7-3",
        employerName: "Interactive Group of Companies",
        jobTitle: "Sr. Design Engineer",
        projects: [
          {
            id: "proj-exp-7-3-1",
            projectName: "Identify the Vechicles",
            contributionNotes: "RFID projects, API support, client coordination, site surveys"
          }
        ],
        startDate: new Date("2011-06-01"),
        endDate: new Date("2015-12-01"),
        techStacks: ["embedded systems", "firmware", "hardware design"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-7-4",
        employerName: "Electrosolz",
        jobTitle: "Technical Lead",
        projects: [
          {
            id: "proj-exp-7-4-1",
            projectName: "GPS tracker",
            contributionNotes: "Client Coordination, System Design, Team Lead, Firmware Development, Project Costing. Product development, US patents, embedded solutions, HR & admin management"
          }
        ],
        startDate: new Date("2016-01-01"),
        endDate: new Date("2021-07-01"),
        techStacks: ["c/c++", "python", "micro controllers", "embedded systems", "hardware design", "firmware", "STM32", "LoRa", "AWS IoT"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-7-5",
        employerName: "Freelance (Upwork)",
        jobTitle: "Embedded System Consultant",
        projects: [],
        startDate: new Date("2021-08-01"),
        endDate: new Date("2023-06-01"),
        techStacks: ["embedded systems", "firmware", "consulting"],
        shiftType: "Morning",
        workMode: "Remote",
        timeSupportZones: ["US", "UK", "EU"]
      },
      {
        id: "we-7-6",
        employerName: "DPL",
        jobTitle: "Sr. Embedded Firmware Engineer",
        projects: [
          {
            id: "proj-exp-7-6-1",
            projectName: "iapartments",
            contributionNotes: "Led embedded systems development for IoT-enabled smart thermostat. Designed firmware for microcontrollers, implemented hardware design, and integrated AWS IoT connectivity."
          }
        ],
        startDate: new Date("2023-07-01"),
        endDate: undefined,
        techStacks: ["c/c++", "python", "micro controllers", "embedded systems", "hardware design", "firmware", "ASP.NET Core", "Angular", "AWS IoT", "aws"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: ["US", "UK", "EU"]
      }
    ],
    projects: [
      {
        id: "standalone-proj-7-1",
        projectName: "Water Management BMS",
        contributionNotes: "Developed Building Management System for water monitoring using embedded systems, C/C++, and microcontrollers with real-time sensor data collection and IoT connectivity."
      },
      {
        id: "standalone-proj-7-2",
        projectName: "B-IoT Dustbin Monitoring",
        contributionNotes: "Built IoT-based smart dustbin monitoring system using embedded systems, firmware development, and AWS IoT for real-time waste level tracking and notifications."
      },
      {
        id: "standalone-proj-7-3",
        projectName: "Motion Simulator Ride",
        contributionNotes: "Designed and developed motion simulator control system using embedded systems, C/C++, and microcontrollers with precise motion control algorithms and sensor integration."
      },
      {
        id: "standalone-proj-7-4",
        projectName: "Autonomous Trade System",
        contributionNotes: "Developed automated trading system using Python, embedded systems, and firmware with real-time data processing and decision-making algorithms."
      },
      {
        id: "standalone-proj-7-5",
        projectName: "Wearables - multiple",
        contributionNotes: "Created multiple wearable device projects using embedded systems, firmware development, and microcontrollers with sensor integration and data processing capabilities."
      },
      {
        id: "standalone-proj-7-6",
        projectName: "code check in bot",
        contributionNotes: "Developed automated code checking system using Python and embedded systems to streamline development workflows and ensure code quality standards."
      },
    ],
    certifications: [
      {
        id: "cert-7-1",
        certificationId: "cert-023",
        certificationName: "RMA Process for Redline AN-80i",
        issueDate: new Date("2012-01-01"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-7-2",
        certificationId: "cert-024",
        certificationName: "Intellect Cameras Management Software Training",
        issueDate: new Date("2015-01-01"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-7-3",
        certificationId: "cert-025",
        certificationName: "Raspberry Pi, Web Server Training",
        issueDate: new Date("2015-01-01"),
        expiryDate: undefined,
        certificationUrl: null
      }
    ],
    educations: [
      {
        id: "edu-7-1",
        universityLocationId: "loc-001-001",
        universityLocationName: "Sir Syed CASE Institute of Technology - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Electrical Engineering",
        startMonth: new Date("2004-09-01"),
        endMonth: new Date("2008-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-30")
  },
  {
    id: "8",
    name: "Iqra Munawar",
    postingTitle: null,
    email: "iqramunawar21k8@gmail.com",
    mobileNo: "0314-7146674",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: null,
    linkedinUrl: "https://www.linkedin.com/in/iqra-munawar-a8342b187/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FIqra%5FResume%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-8-1",
        employerName: "Fair Deal Marketing",
        jobTitle: "Graphic Designer",
        projects: [],
        startDate: new Date("2023-08-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-8-2",
        employerName: "Sukail",
        jobTitle: "Graphic Designer",
        projects: [],
        startDate: new Date("2023-08-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-8-3",
        employerName: "Viltco Technologies",
        jobTitle: "UI/UX Designer",
        projects: [],
        startDate: new Date("2022-10-01"),
        endDate: new Date("2023-02-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-8-4",
        employerName: "Haier (Intern)",
        jobTitle: "Graphic Designer",
        projects: [],
        startDate: new Date("2021-07-01"),
        endDate: new Date("2021-08-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-8-5",
        employerName: "DPL",
        jobTitle: "Graphic Designer",
        projects: [],
        startDate: new Date("2025-11-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      }
    ],
    certifications: [],
    educations: [
      {
        id: "edu-8-1",
        universityLocationId: "loc-007-001",
        universityLocationName: "Comsats University - Islamabad",
        degreeName: "Bachelor of Design",
        majorName: "Design",
        startMonth: new Date("2018-09-01"),
        endMonth: new Date("2022-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "9",
    name: "Ahmed Rehman", 
    postingTitle: null,
    email: "ahmedrehman921@gmail.com",
    mobileNo: "0312-7113699",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: "https://ahmed4240.github.io/",
    linkedinUrl: "https://www.linkedin.com/in/ahmed-rehman-b73b11123/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/query?q=rehm&searchScope=all&id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FAhmed%2DRehman%2DAndroid%2DCV%20%282%29%2Epdf&parentview=7",
    workExperiences: [
      {
        id: "we-9-1",
        employerName: "Sementic Ltd",
        jobTitle: "Android Developer",
        projects: [],
        startDate: new Date("2019-01-01"),
        endDate: new Date("2021-04-01"),
        techStacks: ["Android", "Java", "Kotlin"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-9-2",
        employerName: "NinSol Technologies",
        jobTitle: "Senior Android Developer",
        projects: [],
        startDate: new Date("2021-04-01"),
        endDate: new Date("2021-10-01"),
        techStacks: ["Android", "Java", "Kotlin"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-9-3",
        employerName: "TheX Solution",
        jobTitle: "Senior Android Developer",
        projects: [],
        startDate: new Date("2021-10-01"),
        endDate: new Date("2022-09-01"),
        techStacks: ["Android", "Java", "Kotlin"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-9-4",
        employerName: "Absoluit",
        jobTitle: "Senior Android Developer",
        projects: [],
        startDate: new Date("2022-09-01"),
        endDate: undefined,
        techStacks: ["Android", "Java", "Kotlin"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
    ],
    projects: [
      {
        id: "standalone-proj-9-1",
        projectName: "Promote Master",
        contributionNotes: "Developed Android application using Java and Kotlin for marketing and promotion management, implementing user-friendly interfaces and data management features."
      },
      {
        id: "standalone-proj-9-2",
        projectName: "Cabsoluit",
        contributionNotes: "Built Android-based cab booking application using Java and Kotlin, implementing real-time location tracking, booking management, and payment integration."
      },
      {
        id: "standalone-proj-9-3",
        projectName: "Vibranta Connect",
        contributionNotes: "Created Android communication app using Java and Kotlin, implementing messaging features, user profiles, and real-time connectivity features."
      },
      {
        id: "standalone-proj-9-4",
        projectName: "EzyShifa",
        contributionNotes: "Developed healthcare Android application using Java and Kotlin, implementing appointment booking, medical records management, and telemedicine features."
      },
      {
        id: "standalone-proj-9-5",
        projectName: "Upswing Learning",
        contributionNotes: "Built educational Android platform using Java and Kotlin, implementing course management, student progress tracking, and interactive learning modules."
      },
      {
        id: "standalone-proj-9-6",
        projectName: "Upswing Attendance",
        contributionNotes: "Developed attendance management Android app using Java and Kotlin, implementing biometric integration, attendance tracking, and reporting features."
      }
    ],
    certifications: [
      {
        id: "cert-9-1",
        certificationId: "cert-026",
        certificationName: "Android Development",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-9-2",
        certificationId: "cert-027",
        certificationName: "Android Development",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-9-3",
        certificationId: "cert-028",
        certificationName: "Cybersecurity Fundamentals",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      }
    ],
    educations: [
      {
        id: "edu-9-1",
        universityLocationId: "loc-008-001",
        universityLocationName: "Lahore Garrison University - Lahore",
        degreeName: "Bachelor of Science",
        majorName: "Computer Science",
        startMonth: new Date("2016-03-01"),
        endMonth: new Date("2020-05-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "10",
    name: "Izza Shahzad", 
    postingTitle: null,
    email: "Izzashahzad2003@gmail.com",
    mobileNo: "0336-5544454",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Rawalpindi",
    githubUrl: "https://github.com/izza013",
    linkedinUrl: "https://www.linkedin.com/in/izza-shahzad-b43273267/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FIZZA%20SHAHZAD%20CV%20AI%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-10-1",
        employerName: "DPL",
        jobTitle: "GTO (QA)",
        projects: [],
        startDate: new Date("2025-11-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US", "UK"]
      },

      {
        id: "we-10-2",
        employerName: "AROK DEV",
        jobTitle: "Business Developer",
        projects: [],
        startDate: new Date("2025-05-01"),
        endDate: new Date("2025-06-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-10-3",
        employerName: "NESCOM",
        jobTitle: "AI Intern",
        projects: [],
        startDate: new Date("2024-06-15"),
        endDate: new Date("2024-07-15"),
        techStacks: ["AI", "machine learning"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-10-4",
        employerName: "Octaloop Technologies",
        jobTitle: "Jr. AI Developer",
        projects: [],
        startDate: new Date("2025-07-01"),
        endDate: undefined,
        techStacks: ["AI", "machine learning", "python"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-10-5",
        employerName: "Ufone & PTCL",
        jobTitle: "IT Intern",
        projects: [],
        startDate: new Date("2024-07-18"),
        endDate: new Date("2024-08-29"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      }
    ],
    projects: [
      {
        id: "standalone-proj-10-1",
        projectName: "Legal Document Summarization",
        contributionNotes: "Developed AI-powered legal document summarization system using machine learning and Python, implementing NLP algorithms to extract key information from legal documents."
      },
      {
        id: "standalone-proj-10-1",
        projectName: "Legal Document Summarization",
        contributionNotes: "Developed AI-powered legal document summarization system using machine learning and Python, implementing NLP algorithms to extract key information from legal documents."
      },
      {
        id: "standalone-proj-10-2",
        projectName: "Weapon Detection System",
        contributionNotes: "Built AI-based weapon detection system using machine learning and Python, implementing computer vision algorithms for real-time object detection and classification."
      },
      {
        id: "standalone-proj-10-3",
        projectName: "Image Editing App",
        contributionNotes: "Created AI-powered image editing application using machine learning and Python, implementing image processing algorithms and automated enhancement features."
      },
      {
        id: "standalone-proj-10-4",
        projectName: "Recipe Generator",
        contributionNotes: "Developed AI recipe generator using machine learning and Python, implementing natural language processing to create personalized recipes based on available ingredients."
      },
      {
        id: "standalone-proj-10-5",
        projectName: "Restaurant Ratings Predictor",
        contributionNotes: "Built machine learning model using Python to predict restaurant ratings, implementing data analysis and predictive algorithms for rating classification."
      },
      {
        id: "standalone-proj-10-6",
        projectName: "Chat App",
        contributionNotes: "Developed chat application with AI integration using Python, implementing real-time messaging features and machine learning for intelligent responses."
      },
      {
        id: "standalone-proj-10-7",
        projectName: "LMS App",
        contributionNotes: "Created Learning Management System with AI features using Python and machine learning, implementing personalized learning paths and automated content recommendations."
      },
    ],
    certifications: [
      {
        id: "cert-10-1",
        certificationId: "cert-029",
        certificationName: "Generative AI Training",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: "https://credsverse.com/credentials/58700f01-102a-497f-8304-396aede2a2ce"
      },
      {
        id: "cert-10-2",
        certificationId: "cert-030",
        certificationName: "Introduction to Machine Learning",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
    ],
    educations: [
      {
        id: "edu-10-1",
        universityLocationId: "loc-009-001",
        universityLocationName: "UET Taxila - Taxila",
        degreeName: "Bachelor of Science",
        majorName: "Software Engineering",
        startMonth: new Date("2021-09-01"),
        endMonth: new Date("2025-06-30"),
        grades: "3.59/4.0",
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "11",
    name: "Sara Nayab",
    postingTitle: null,
    email: "saraawan37405@gmail.com",
    mobileNo: "0346-0562771",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: null,
    linkedinUrl: "https://www.linkedin.com/in/sara-nayab",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FSara%20Nayab%5FResume%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-11-1",
        employerName: "Askari Bank",
        jobTitle: "QA Analyst (Internship)",
        projects: [],
        startDate: new Date("2022-03-01"),
        endDate: new Date("2022-04-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-11-2",
        employerName: "The MicroZone",
        jobTitle: "QA Analyst",
        projects: [],
        startDate: new Date("2023-07-01"),
        endDate: new Date("2024-02-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-11-3",
        employerName: "Hypersoft Inc",
        jobTitle: "QA Analyst",
        projects: [],
        startDate: new Date("2024-02-01"),
        endDate: new Date("2025-05-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-11-4",
        employerName: "DPL",
        jobTitle: "QA Engineer",
        projects: [],
        startDate: new Date("2025-07-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      }
    ],
    projects: [
      {
        id: "standalone-proj-11-1",
        projectName: "Chatbot",
        contributionNotes: "Performed comprehensive QA testing for chatbot application, implementing test cases, bug tracking, and ensuring functionality across multiple platforms and user scenarios."
      },
      {
        id: "standalone-proj-11-2",
        projectName: "Status Saver",
        contributionNotes: "Conducted quality assurance testing for status saver application, implementing test automation, regression testing, and ensuring data integrity and user experience quality."
      },
      {
        id: "standalone-proj-11-3",
        projectName: "Screen Mirroring",
        contributionNotes: "Performed QA testing for screen mirroring application, implementing compatibility testing across devices, performance testing, and ensuring seamless connectivity features."
      },
      {
        id: "standalone-proj-11-4",
        projectName: "PDF Reader",
        contributionNotes: "Conducted quality assurance for PDF reader application, implementing functional testing, performance testing, and ensuring compatibility with various PDF formats and file sizes."
      },
      {
        id: "standalone-proj-11-5",
        projectName: "AGORZ Delivery",
        contributionNotes: "Performed comprehensive QA testing for delivery application, implementing end-to-end testing, order tracking verification, and ensuring payment and delivery workflow accuracy."
      },
      {
        id: "standalone-proj-11-6",
        projectName: "Language Translator",
        contributionNotes: "Conducted QA testing for language translator application, implementing accuracy testing for translations, performance testing, and ensuring multi-language support functionality."
      },
      {
        id: "standalone-proj-11-7",
        projectName: "File Manager",
        contributionNotes: "Performed quality assurance testing for file manager application, implementing file operation testing, security testing, and ensuring data integrity across file management features."
      },
      {
        id: "standalone-proj-11-8",
        projectName: "Object Remover",
        contributionNotes: "Conducted QA testing for object removal application, implementing image processing accuracy testing, UI/UX testing, and ensuring seamless object detection and removal functionality."
      },
      {
        id: "standalone-proj-11-9",
        projectName: "Music Generator",
        contributionNotes: "Performed quality assurance testing for music generator application, implementing audio quality testing, generation algorithm verification, and ensuring user interface functionality."
      },
      {
        id: "standalone-proj-11-10",
        projectName: "IA Photo Enhancer",
        contributionNotes: "Conducted QA testing for AI photo enhancer application, implementing image enhancement quality testing, performance testing, and ensuring accurate AI processing results."
      },
      {
        id: "standalone-proj-11-11",
        projectName: "Chat App",
        contributionNotes: "Performed comprehensive QA testing for chat application, implementing real-time messaging testing, notification testing, and ensuring secure communication features."
      },
      {
        id: "standalone-proj-11-12",
        projectName: "LMS App",
        contributionNotes: "Conducted quality assurance testing for Learning Management System, implementing course management testing, student progress tracking verification, and ensuring educational content delivery accuracy."
      },
    ],
    certifications: [
      {
        id: "cert-11-1",
        certificationId: "cert-031",
        certificationName: "Six Sigma Principles",
        issueDate: new Date("2023-01-01"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-11-2",
        certificationId: "cert-032",
        certificationName: "Agile Project Management",
        issueDate: new Date("2023-01-01"),
        expiryDate: undefined,
        certificationUrl: null
      }
    ],
    educations: [
      {
        id: "edu-11-1",
        universityLocationId: "loc-002-001",
        universityLocationName: "National University Of Modern Languages (NUML) - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Software Engineering",
        startMonth: undefined,
        endMonth: undefined,
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "12",
    name: "Umair Tahir", 
    postingTitle: null,
    email: "umairmt18@gmail.com",
    mobileNo: "+92 349 4542278",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Rawalpindi",
    githubUrl: null,
    linkedinUrl: null,
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FUmair%20Tahir%20Resume%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-12-1",
        employerName: "Inexins Technologies",
        jobTitle: "AngularJS Intern",
        projects: [],
        startDate: new Date("2022-06-01"),
        endDate: new Date("2022-11-01"),
        techStacks: ["Angular", "TypeScript", "JavaScript"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-12-2",
        employerName: "Servixer LLC",
        jobTitle: ".NET Core Intern",
        projects: [],
        startDate: new Date("2022-11-01"),
        endDate: new Date("2023-04-01"),
        techStacks: [".NET Core", "C#"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-12-3",
        employerName: "Strahlen Studios",
        jobTitle: ".NET Core Developer",
        projects: [],
        startDate: new Date("2023-09-01"),
        endDate: new Date("2024-04-01"),
        techStacks: [".NET Core", "C#"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-12-4",
        employerName: "Cybersoft Vantage (CSV)",
        jobTitle: "Full Stack Developer",
        projects: [],
        startDate: new Date("2024-04-01"),
        endDate: undefined,
        techStacks: [".NET Core", "Angular", "TypeScript", "JavaScript"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-12-5",
        employerName: "DPL",
        jobTitle: "Full Stack Developer .NET",
        projects: [],
        startDate: new Date("2023-12-01"),
        endDate: undefined,
        techStacks: ["Angular", "TypeScript", "JavaScript", ".NET Core", "C#"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: []
      }
    ],
    projects: [
      {
        id: "standalone-proj-12-1",
        projectName: "COVID SOP Violation Detection (FYP)",
        contributionNotes: "Developed Final Year Project using Angular, TypeScript, and .NET Core for COVID SOP violation detection, implementing computer vision algorithms and real-time monitoring features."
      },
      {
        id: "standalone-proj-12-2",
        projectName: "COVID Tracker App",
        contributionNotes: "Built COVID tracking application using Angular, TypeScript, JavaScript, and .NET Core, implementing data visualization, statistics tracking, and real-time updates."
      },
      {
        id: "standalone-proj-12-3",
        projectName: "Streaming App (Freelance)",
        contributionNotes: "Developed streaming application using Angular, TypeScript, and .NET Core, implementing video playback, user authentication, and content management features."
      },
      {
        id: "standalone-proj-12-4",
        projectName: "LMS App",
        contributionNotes: "Created Learning Management System using Angular, TypeScript, JavaScript, and .NET Core, implementing course management, student progress tracking, and interactive learning modules."
      },
    ],
    certifications: [],
    educations: [
      {
        id: "edu-12-1",
        universityLocationId: "loc-005-001",
        universityLocationName: "Bahria University - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Software Engineering",
        startMonth: new Date("2018-09-01"),
        endMonth: new Date("2022-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "13",
    name: "Mahnoor Moosa Raza",
    postingTitle: null,
    email: "mahnoorraza477@gmail.com",
    mobileNo: "0333-3777526",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: "https://github.com/mahnoorraza",
    linkedinUrl: null,
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/query?q=mahnoor&searchScope=all&id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FMahnoor%20SQA%5FICV%2Epdf&parentview=7",
    workExperiences: [
      {
        id: "we-13-1",
        employerName: "Afiniti",
        jobTitle: "QA (Intern)",
        projects: [],
        startDate: new Date("2020-08-01"),
        endDate: new Date("2020-11-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-13-2",
        employerName: "XORD",
        jobTitle: "SQA Engineer",
        projects: [],
        startDate: new Date("2020-06-01"),
        endDate: new Date("2021-07-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-13-3",
        employerName: "Technology Ally Inc.",
        jobTitle: "Jr. SQA Engineer",
        projects: [],
        startDate: new Date("2021-08-01"),
        endDate: new Date("2022-07-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Remote",
        timeSupportZones: ["US"]
      },
      {
        id: "we-13-4",
        employerName: "Arpatech Pvt. Ltd",
        jobTitle: "SQA Analyst",
        projects: [],
        startDate: new Date("2022-07-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-13-5",
        employerName: "DPL",
        jobTitle: "Senior QA Automation Engineer",
        projects: [],
        startDate: new Date("2025-09-01"),
        endDate: undefined,
        techStacks: ["Selenium", "Java", "TestNG", "JUnit", "REST", "API", "Postman", "Jira"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: []
      }
    ],
    projects: [
      {
        id: "standalone-proj-13-1",
        projectName: "UTZ-RA Project",
        contributionNotes: "Performed comprehensive QA automation testing using Selenium, Java, TestNG, and JUnit, implementing test frameworks, API testing with Postman, and bug tracking with Jira."
      },
      {
        id: "standalone-proj-13-2",
        projectName: "License Renewal Connections",
        contributionNotes: "Conducted automated testing for license renewal system using Selenium and Java, implementing REST API testing with Postman and ensuring workflow accuracy through TestNG test suites."
      },
      {
        id: "standalone-proj-13-3",
        projectName: "Phoenix DAO / Tipply Tank",
        contributionNotes: "Performed QA automation testing using Selenium, Java, and TestNG, implementing REST API testing with Postman and comprehensive test coverage for blockchain-based application features."
      },
      {
        id: "standalone-proj-13-4",
        projectName: "HRQoL (pet health assessment)",
        contributionNotes: "Conducted automated testing for pet health assessment platform using Selenium, Java, and JUnit, implementing API testing with Postman and ensuring data accuracy and user experience quality."
      },
      {
        id: "standalone-proj-13-5",
        projectName: "INET ED (education platform)",
        contributionNotes: "Performed comprehensive QA automation for education platform using Selenium, Java, TestNG, and JUnit, implementing REST API testing and ensuring course management functionality accuracy."
      },
      {
        id: "standalone-proj-13-6",
        projectName: "EnrollSource",
        contributionNotes: "Conducted automated testing for enrollment system using Selenium, Java, and TestNG, implementing API testing with Postman and ensuring enrollment workflow accuracy and data integrity."
      },
      {
        id: "standalone-proj-13-7",
        projectName: "Afiniti ACT",
        contributionNotes: "Performed QA automation testing using Selenium, Java, TestNG, and JUnit, implementing REST API testing with Postman and comprehensive test coverage for customer interaction features."
      },
      {
        id: "standalone-proj-13-8",
        projectName: "Agent Megavaya",
        contributionNotes: "Conducted automated testing for agent management system using Selenium, Java, and TestNG, implementing API testing with Postman and ensuring agent workflow functionality and performance."
      },
      {
        id: "standalone-proj-13-9",
        projectName: "Mobile App Testing (Multiple)",
        contributionNotes: "Performed comprehensive mobile app testing across multiple applications using Selenium, Java, TestNG, and JUnit, implementing automated test suites and API testing with Postman."
      },
      {
        id: "standalone-proj-13-10",
        projectName: "LMS App",
        contributionNotes: "Conducted QA automation testing for Learning Management System using Selenium, Java, TestNG, and JUnit, implementing REST API testing and ensuring course delivery and student tracking accuracy."
      },
    ],
    certifications: [
      {
        id: "cert-13-1",
        certificationId: "cert-033",
        certificationName: "ISO 9001:2015 (QMS)",
        issueDate: new Date("2024-08-11"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-13-2",
        certificationId: "cert-034",
        certificationName: "ISQI A4Q Selenium Certified Tester",
        issueDate: new Date("2025-03-11"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-13-3",
        certificationId: "cert-035",
        certificationName: "ISTQB CT-FL",
        issueDate: new Date("2022-12-11"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-13-4",
        certificationId: "cert-036",
        certificationName: "Test Automation with Cypress",
        issueDate: new Date("2025-03-11"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-13-5",
        certificationId: "cert-037",
        certificationName: "Scrum Foundation Professional Certificate (SFPC)",
        issueDate: new Date("2020-08-11"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-13-6",
        certificationId: "cert-038",
        certificationName: "ISTQB Agile Tester Extension (CTFL-AT)",
        issueDate: new Date("2024-05-11"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-13-7",
        certificationId: "cert-039",
        certificationName: "Exploring service APIs through test automation",
        issueDate: new Date("2023-04-11"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-13-8",
        certificationId: "cert-040",
        certificationName: "White Belt Six Sigma",
        issueDate: new Date("2023-08-11"),
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-13-9",
        certificationId: "cert-041",
        certificationName: "TOSCA Test Automation Specialist Level 1",
        issueDate: new Date("2024-06-11"),
        expiryDate: undefined,
        certificationUrl: null
      }
    ],
    educations: [
      {
        id: "edu-13-1",
        universityLocationId: "loc-010-001",
        universityLocationName: "Iqra University - Karachi",
        degreeName: "Bachelor of Science",
        majorName: "Software Engineering",
        startMonth: new Date("2021-09-01"),
        endMonth: undefined,
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "14",
    name: "Umair Shahid", 
    postingTitle: null,
    email: "shahidumair622@gmail.com",
    mobileNo: "+92 321 5215701",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: null,
    linkedinUrl: "https://www.linkedin.com/in/umair-shahid-b72086243",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/query?q=resume&searchScope=all&id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FResume%20%2816%29%2Epdf&parentview=7",
    workExperiences: [
      {
        id: "we-14-1",
        employerName: "DPL",
        jobTitle: "GTO (Flutter)",
        projects: [],
        startDate: new Date("2025-09-01"),
        endDate: undefined,
        techStacks: ["Flutter", "Dart", "Firebase", "REST", "API", "Postman", "Jira"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-14-2",
        employerName: "TECKLOGICS",
        jobTitle: "Front-End Developer",
        projects: [],
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-01"),
        techStacks: ["React.js", "TypeScript", "JavaScript"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-14-3",
        employerName: "Cyber Reconnaissance & Combat",
        jobTitle: "Front-End Developer",
        projects: [],
        startDate: new Date("2022-07-01"),
        endDate: new Date("2022-06-30"),
        techStacks: ["React.js", "TypeScript", "JavaScript"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US", "UK"]
      }
    ],
    certifications: [
      {
        id: "cert-14-1",
        certificationId: "cert-004",
        certificationName: "Project Planning: Putting It All Together",
        issueDate: new Date("2023-01-06"),
        expiryDate: undefined,
        certificationUrl: "https://www.coursera.org/verify/example12"
      }
    ],
    educations: [
      {
        id: "edu-14-1",
        universityLocationId: "loc-005-001",
        universityLocationName: "Bahria University - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Information Technology",
        startMonth: new Date("2021-09-01"),
        endMonth: new Date("2025-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "15",
    name: "Sufi Hassan Asim",
    postingTitle: null,
    email: "hassanasim337@gmail.com",
    mobileNo: "+92 330 5241433",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: "https://github.com/Hassan-asim",
    linkedinUrl: "https://www.linkedin.com/in/sufi-hassan-asim",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/query?q=sufi&searchScope=all&id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FSufi%20Hassan%20Asim%20resume%2Epdf&parentview=7",
    workExperiences: [
      {
        id: "we-15-1",
        employerName: "Freelance/Remote",
        jobTitle: "Developer & AI Consultant",
        projects: [],
        startDate: new Date("2019-01-01"),
        endDate: undefined,
        techStacks: ["Flask", "MongoDB", "NLP", "LLaMA API", "YOLO v5-v10", "OpenCV", "PyTorch"],
        shiftType: "Morning",
        workMode: "Remote",
        timeSupportZones: ["US", "UK", "EU"]
      },
      {
        id: "we-15-2",
        employerName: "MarketMinds.pk",
        jobTitle: "Graphic Design Intern",
        projects: [],
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-15-3",
        employerName: "AICP",
        jobTitle: "UI/UX Design Intern",
        projects: [],
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-05-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-15-4",
        employerName: "AICP",
        jobTitle: "Problem Solving & Python Coding Intern",
        projects: [],
        startDate: new Date("2023-10-01"),
        endDate: new Date("2023-12-01"),
        techStacks: ["Python"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-15-5",
        employerName: "AICP",
        jobTitle: "EDA & Python Programming Intern",
        projects: [],
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-02-01"),
        techStacks: ["Python"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-15-6",
        employerName: "Launchify LLC",
        jobTitle: "AI Intern",
        projects: [],
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-06-01"),
        techStacks: ["AI", "machine learning"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      }
    ],
    projects: [
      {
        id: "standalone-proj-15-1",
        projectName: "PIXIE - AI Assistant Robot",
        contributionNotes: "Developed AI assistant robot using Python, NLP, LLaMA API, and PyTorch, implementing natural language understanding, conversation management, and intelligent response generation."
      },
      {
        id: "standalone-proj-15-2",
        projectName: "Virtual Dentist Analyzer",
        contributionNotes: "Built AI-powered dental analysis system using Python, OpenCV, and machine learning, implementing image processing algorithms for dental condition detection and analysis."
      },
      {
        id: "standalone-proj-15-3",
        projectName: "LifeAid Chatbot",
        contributionNotes: "Created healthcare chatbot using Flask, MongoDB, NLP, and LLaMA API, implementing natural language processing for medical queries and intelligent response generation."
      },
      {
        id: "standalone-proj-15-4",
        projectName: "Smart Real Estate Price Predictor",
        contributionNotes: "Developed machine learning model using Python and PyTorch for real estate price prediction, implementing data analysis and predictive algorithms for accurate price estimation."
      },
      {
        id: "standalone-proj-15-5",
        projectName: "Advanced Face & Gesture Recognition",
        contributionNotes: "Built computer vision system using OpenCV, YOLO v5-v10, and PyTorch for face and gesture recognition, implementing deep learning models for accurate detection and classification."
      },
      {
        id: "standalone-proj-15-6",
        projectName: "LingoTranslator NLP Tool",
        contributionNotes: "Developed natural language translation tool using Python, NLP, and LLaMA API, implementing multilingual translation algorithms and language processing features."
      },
      {
        id: "standalone-proj-15-7",
        projectName: "AI Virtual Classroom System",
        contributionNotes: "Created AI-powered virtual classroom using Flask, MongoDB, NLP, and machine learning, implementing intelligent tutoring, student interaction analysis, and automated assessment features."
      },
      {
        id: "standalone-proj-15-8",
        projectName: "Digit Recognition System",
        contributionNotes: "Built digit recognition system using OpenCV, PyTorch, and machine learning, implementing computer vision algorithms for accurate handwritten digit classification."
      },
      {
        id: "standalone-proj-15-9",
        projectName: "Life Safety Emergency App",
        contributionNotes: "Developed emergency response application using Flask, MongoDB, and AI, implementing real-time location tracking, emergency alerts, and intelligent routing algorithms."
      },
      {
        id: "standalone-proj-15-10",
        projectName: "Pixel Pal Browser Extension",
        contributionNotes: "Created browser extension with AI features using Python and machine learning, implementing intelligent content analysis and user assistance features."
      },
      {
        id: "standalone-proj-15-11",
        projectName: "Student Management System",
        contributionNotes: "Developed student management system using Flask and MongoDB, implementing data management, analytics, and automated reporting features for educational institutions."
      },
      {
        id: "standalone-proj-15-12",
        projectName: "Intelligent Object Detector",
        contributionNotes: "Built AI-powered object detection system using YOLO v5-v10, OpenCV, and PyTorch, implementing real-time object recognition and classification with high accuracy."
      },
      {
        id: "standalone-proj-15-13",
        projectName: "Sentiment Analysis Bot",
        contributionNotes: "Developed sentiment analysis bot using Python, NLP, and machine learning, implementing text analysis algorithms for emotion detection and sentiment classification."
      }
    ],
    certifications: [
      {
        id: "cert-15-1",
        certificationId: "cert-043",
        certificationName: "OpenCV Bootcamp",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-15-2",
        certificationId: "cert-044",
        certificationName: "Graphic Design",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-15-3",
        certificationId: "cert-045",
        certificationName: "WordPress",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-15-4",
        certificationId: "cert-046",
        certificationName: "Freelancing",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-15-5",
        certificationId: "cert-047",
        certificationName: "Social Media Marketing",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-15-6",
        certificationId: "cert-048",
        certificationName: "Business Email",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-15-7",
        certificationId: "cert-049",
        certificationName: "Strategic Planning",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
    ],
    educations: [
      {
        id: "edu-15-1",
        universityLocationId: "loc-007-001",
        universityLocationName: "Comsats - Islamabad",
        degreeName: "Master of Science",
        majorName: "Artificial Intelligence",
        startMonth: new Date("2021-09-01"),
        endMonth: new Date("2025-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      },
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "16",
    name: "Abdullah Amjad", 
    postingTitle: null,
    email: "abdullahamjad1212@gmail.com",
    mobileNo: "+92 311 5428964",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Rawalpindi",
    githubUrl: null,
    linkedinUrl: null,
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/query?q=abdullah&searchScope=all&id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FCV%5FAbdullah%2DAmjad%5FQA%2Epdf&parentview=7",
    workExperiences: [
      {
        id: "we-16-1",
        employerName: "DPL",
        jobTitle: "QA Engineer",
        projects: [],
        startDate: new Date("2025-09-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-16-2",
        employerName: "WRP (WeRplay)",
        jobTitle: "QA Engineer",
        projects: [],
        startDate: new Date("2023-03-01"),
        endDate: undefined,
        techStacks: ["Selenium", "Java", "TestNG", "JUnit", "REST", "API", "Postman", "Jira"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
    ],
    projects: [
      {
        id: "standalone-proj-16-1",
        projectName: "E-Commerce Platform",
        contributionNotes: "Performed comprehensive QA testing for e-commerce platform, implementing test cases for product management, shopping cart functionality, and checkout processes."
      },
      {
        id: "standalone-proj-16-2",
        projectName: "Game Testing",
        contributionNotes: "Conducted quality assurance testing for gaming applications, implementing gameplay testing, performance testing, and ensuring user experience quality across different devices."
      },
      {
        id: "standalone-proj-16-3",
        projectName: "Payment & Order Testing",
        contributionNotes: "Performed QA testing for payment and order management systems, implementing transaction testing, order processing verification, and ensuring secure payment gateway integration."
      },
      {
        id: "standalone-proj-16-4",
        projectName: "Regression & Compatibility Testing",
        contributionNotes: "Conducted regression and compatibility testing across multiple platforms and browsers, implementing automated test suites and ensuring application stability after updates."
      },
      {
        id: "standalone-proj-16-5",
        projectName: "Data Quality Checks",
        contributionNotes: "Performed data quality assurance testing, implementing data validation tests, integrity checks, and ensuring accurate data processing and storage across systems."
      },
    ],
    certifications: [],
    educations: [
      {
        id: "edu-16-1",
        universityLocationId: "loc-007-001",
        universityLocationName: "Comsats - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Computer Science",
        startMonth: new Date("2019-09-01"),
        endMonth: new Date("2023-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "17",
    name: "Mohid Anwar",
    postingTitle: null,
    email: "mohid.anwar@gmail.com",
    mobileNo: "+92 335 0122012",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: "https://github.com/Mohid-Anwar",
    linkedinUrl: "https://www.linkedin.com/in/mohid-anwar",
    source: "DPL Ex Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/query?q=mohid&searchScope=all&id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FMohid%20Anwar%20Resume%2Epdf&parentview=7",
    workExperiences: [
      {
        id: "we-17-1",
        employerName: "DPL",
        jobTitle: "GTO (React Native)",
        projects: [],
        startDate: new Date("2025-02-19"),
        endDate: new Date("2025-09-19"),
        techStacks: ["Mern", "Mean","React Native", "TypeScript", "JavaScript", "React", "Node.js", "Express", "AWS", "Docker", "CI/CD"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: []
      },
      {
        id: "we-17-2",
        employerName: "Freelance Developer (Remote)",
        jobTitle: "AI & Full-Stack Developer",
        projects: [],
        startDate: new Date("2019-01-01"),
        endDate: undefined,
        techStacks: ["AI", "full stack", "javascript", "python"],
        shiftType: "Morning",
        workMode: "Remote",
        timeSupportZones: []
      },
      {
        id: "we-17-3",
        employerName: "ASF Technologies Partners",
        jobTitle: "Intern",
        projects: [],
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-08-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
    ],
    projects: [
      {
        id: "standalone-proj-17-1",
        projectName: "CarFlex",
        contributionNotes: "Developed car rental application using React Native, TypeScript, and Node.js, implementing booking management, payment integration, and real-time availability tracking."
      },
      {
        id: "standalone-proj-17-2",
        projectName: "Twitter UI Clone",
        contributionNotes: "Built Twitter UI clone using React, TypeScript, and JavaScript, implementing social media features, real-time updates, and responsive design with modern UI/UX patterns."
      },
      {
        id: "standalone-proj-17-3",
        projectName: "Spotify Clone",
        contributionNotes: "Created music streaming application clone using React, TypeScript, and Node.js, implementing audio playback, playlist management, and user authentication features."
      },
      {
        id: "standalone-proj-17-4",
        projectName: "Responsive Todo App",
        contributionNotes: "Developed responsive todo application using React, TypeScript, and JavaScript, implementing task management, real-time updates, and cross-platform compatibility."
      },
      {
        id: "standalone-proj-17-5",
        projectName: "Pizza Shop Management System",
        contributionNotes: "Built pizza shop management system using MERN stack, implementing order management, inventory tracking, and customer management with Express.js backend and React frontend."
      },
      {
        id: "standalone-proj-17-6",
        projectName: "Gulshanabad Society Management System",
        contributionNotes: "Developed society management system using React, Node.js, and Express, implementing resident management, billing, maintenance tracking, and communication features."
      },
      {
        id: "standalone-proj-17-7",
        projectName: "Restaurant Management System",
        contributionNotes: "Created restaurant management system using MERN stack, implementing table management, order processing, menu management, and reporting features with AWS integration."
      },
      {
        id: "standalone-proj-17-8",
        projectName: "Chat App",
        contributionNotes: "Built real-time chat application using React Native, Node.js, and Express, implementing messaging features, user authentication, and push notifications with WebSocket integration."
      },
    ],
    certifications: [],
    educations: [
      {
        id: "edu-17-1",
        universityLocationId: "loc-007-001",
        universityLocationName: "Comsats - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Computer Science",
        startMonth: new Date("2021-09-01"),
        endMonth: new Date("2025-06-30"),
        grades: "3.41/4.0",
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "18",
    name: "Tassaduq Hussain", 
    postingTitle: null,
    email: "tassaduq955@gmail.com",
    mobileNo: "+92 301 8712103",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: "https://github.com/tassaduq-qbatch",
    linkedinUrl: "https://www.linkedin.com/in/tassaduq-hussain-253630131/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/query?q=tassaduq&searchScope=all&id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FTassaduq%20Hussain%2DResume%2Epdf&parentview=7",
    workExperiences: [
      {
        id: "we-18-1",
        employerName: "DPL",
        jobTitle: "Senior Software Engineer",
        projects: [],
        startDate: new Date("2025-07-01"),
        endDate: undefined,
        techStacks: ["React.js", "TypeScript", "Node.js", "Express", "PostgreSQL", "AWS S3"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US", "UK", "EU"]
      },
      {
        id: "we-18-2",
        employerName: "Qbatch",
        jobTitle: "Software Engineer",
        projects: [],
        startDate: new Date("2019-01-01"),
        endDate: new Date("2023-01-01"),
        techStacks: ["Java", "Spring Boot", "MySQL"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: ["US"]
      },
      {
        id: "we-18-3",
        employerName: "Ubiquify",
        jobTitle: "Senior Software Engineer",
        projects: [],
        startDate: new Date("2023-01-01"),
        endDate: undefined,
        techStacks: ["React.js", "TypeScript", "Node.js", "PostgreSQL"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-18-4",
        employerName: "United Sol",
        jobTitle: "Software Engineer",
        projects: [],
        startDate: new Date("2020-01-01"),
        endDate: new Date("2023-06-30"),
        techStacks: ["Java", "Spring Boot", "MySQL"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: ["US"]
      },
    ],
    projects: [
      {
        id: "standalone-proj-18-1",
        projectName: "EcomCircles (Lead)",
        contributionNotes: "Led development of e-commerce platform using React.js, TypeScript, Node.js, Express, and PostgreSQL, implementing product management, shopping cart, payment integration, and AWS S3 for media storage."
      },
      {
        id: "standalone-proj-18-2",
        projectName: "AutoOrdering (Lead)",
        contributionNotes: "Led development of automated ordering system using React.js, TypeScript, Node.js, and PostgreSQL, implementing order management, inventory tracking, and automated workflow features."
      },
      {
        id: "standalone-proj-18-3",
        projectName: "Gateless (Lead)",
        contributionNotes: "Led development of access control system using React.js, TypeScript, Node.js, Express, and PostgreSQL, implementing secure authentication, access management, and real-time monitoring features."
      },
      {
        id: "standalone-proj-18-4",
        projectName: "EII (Contributor)",
        contributionNotes: "Contributed to enterprise integration platform using React.js, TypeScript, Node.js, and PostgreSQL, implementing API integrations, data synchronization, and workflow automation features."
      },
      {
        id: "standalone-proj-18-5",
        projectName: "Page Optimizer (Contributor)",
        contributionNotes: "Contributed to page optimization tool using React.js, TypeScript, and Node.js, implementing performance analysis, optimization recommendations, and AWS S3 integration for asset management."
      },
      {
        id: "standalone-proj-18-6",
        projectName: "Bev360 (Contributor)",
        contributionNotes: "Contributed to beverage management platform using React.js, TypeScript, Node.js, Express, and PostgreSQL, implementing inventory management, order processing, and reporting features."
      },
      {
        id: "standalone-proj-18-7",
        projectName: "code check in bot",
        contributionNotes: "Developed automated code review bot using React.js, TypeScript, Node.js, and Express, implementing code quality checks, automated testing, and CI/CD integration."
      },
    ],
    certifications: [],
    educations: [
      {
        id: "edu-18-1",
        universityLocationId: "loc-011-001",
        universityLocationName: "Punjab University College of Information Technology - Lahore",
        degreeName: "Bachelor of Science",
        majorName: "Computer Science",
        startMonth: new Date("2019-09-01"),
        endMonth: new Date("2023-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "19",
    name: "Aaqib Khan",
    postingTitle: null,
    email: "aaqibkhanniazi91@gmail.com",
    mobileNo: "+92 302 7674359",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: null,
    linkedinUrl: "http://www.linkedin.com/in/aaqib-khan-niazi-a9764b156",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/query?q=aaqib&searchScope=all&id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FAaqib%20Khan%20resume%281%29%2Epdf&parentview=7",
    workExperiences: [
      {
        id: "we-19-1",
        employerName: "Asian IT House",
        jobTitle: "Full Stack Developer",
        projects: [],
        startDate: new Date("2021-12-01"),
        endDate: new Date("2022-12-01"),
        techStacks: ["React.js", "TypeScript", "Node.js", "PostgreSQL"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-19-2",
        employerName: "CanadaHitech",
        jobTitle: "Software Engineer",
        projects: [],
        startDate: new Date("2023-07-01"),
        endDate: new Date("2024-01-01"),
        techStacks: [".NET", "C#"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-19-3",
        employerName: "Merik Solutions",
        jobTitle: ".NET Developer",
        projects: [],
        startDate: new Date("2024-02-01"),
        endDate: undefined,
        techStacks: [".NET", "C#"],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-19-4",
        employerName: "DPL",
        jobTitle: "Full Stack Developer (.NET)",
        projects: [],
        startDate: new Date("2025-07-01"),
        endDate: undefined,
        techStacks: [".NET", "C#"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["US", "UK"]
      }
    ],
    projects: [
      {
        id: "standalone-proj-19-1",
        projectName: "Easy Ride",
        contributionNotes: "Developed ride-sharing application using .NET, C#, React.js, and TypeScript, implementing booking management, real-time tracking, and payment integration features."
      },
      {
        id: "standalone-proj-19-2",
        projectName: "Smart Indus City",
        contributionNotes: "Built smart city management platform using .NET, C#, React.js, TypeScript, and Node.js, implementing IoT integration, data analytics, and citizen services management."
      },
      {
        id: "standalone-proj-19-3",
        projectName: "Tap&Go",
        contributionNotes: "Created contactless payment application using .NET, C#, and React.js, implementing NFC payment processing, transaction management, and secure authentication features."
      },
      {
        id: "standalone-proj-19-4",
        projectName: "Bizfolio",
        contributionNotes: "Developed business portfolio management system using .NET, C#, React.js, TypeScript, and PostgreSQL, implementing portfolio tracking, analytics, and reporting features."
      },
      {
        id: "standalone-proj-19-5",
        projectName: "Dynaos",
        contributionNotes: "Built dynamic operating system interface using .NET, C#, React.js, and TypeScript, implementing system management, resource monitoring, and automation features."
      },
      {
        id: "standalone-proj-19-6",
        projectName: "Foodpanda",
        contributionNotes: "Developed food delivery platform using .NET, C#, React.js, TypeScript, and Node.js, implementing order management, restaurant integration, and real-time delivery tracking."
      },
      {
        id: "standalone-proj-19-7",
        projectName: "Savour Foods",
        contributionNotes: "Created food ordering application using .NET, C#, React.js, and PostgreSQL, implementing menu management, order processing, and customer management features."
      },
      {
        id: "standalone-proj-19-8",
        projectName: "Fazalerabbi Jewellers",
        contributionNotes: "Developed e-commerce platform for jewelry store using .NET, C#, React.js, TypeScript, and PostgreSQL, implementing product catalog, shopping cart, and payment integration."
      },
      {
        id: "standalone-proj-19-9",
        projectName: "Rana Petstore",
        contributionNotes: "Built pet store management system using .NET, C#, React.js, and PostgreSQL, implementing inventory management, order processing, and customer relationship features."
      },
      {
        id: "standalone-proj-19-10",
        projectName: "Punjab Cash & Carry",
        contributionNotes: "Developed wholesale management system using .NET, C#, React.js, TypeScript, and PostgreSQL, implementing bulk ordering, inventory tracking, and supplier management."
      },
      {
        id: "standalone-proj-19-11",
        projectName: "GPS tracker",
        contributionNotes: "Created GPS tracking application using .NET, C#, React.js, and Node.js, implementing real-time location tracking, route monitoring, and geofencing features."
      },
    ],
    certifications: [],
    educations: [
      {
        id: "edu-19-1",
        universityLocationId: "loc-003-001",
        universityLocationName: "Capital University of Science & Technology (CUST) - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Software Engineering",
        startMonth: new Date("2016-09-01"),
        endMonth: new Date("2020-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      },
      {
        id: "edu-19-2",
        universityLocationId: "loc-012-001",
        universityLocationName: "Capital University of Science & Technology (CUST) - Islamabad",
        degreeName: "Master of Science",
        majorName: "Computer Science",
        startMonth: new Date("2020-09-01"),
        endMonth: new Date("2022-06-30"),
        grades: null,
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "20",
    name: "Mahir Lodhi",
    postingTitle: null,
    email: "mahirlodhi98@gmail.com",
    mobileNo: "0334-5505730",
    cnic: null,
    currentSalary: null,
    expectedSalary: null,
    city: "Islamabad",
    githubUrl: null,
    linkedinUrl: "https://www.instagram.com/cameraholic01/",
    source: "DPL Employee",
    status: "hired",
    resume: "https://dplit-my.sharepoint.com/my?id=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments%2FIqra%5FResume%2Epdf&parent=%2Fpersonal%2Fraahim%5Fz%5Fdplit%5Fcom%2FDocuments",
    workExperiences: [
      {
        id: "we-20-1",
        employerName: "DPL",
        jobTitle: "Video Content Creator",
        projects: [],
        startDate: new Date("2025-01-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: []
      },
      {
        id: "we-20-2",
        employerName: "Cameraholic",
        jobTitle: "Videographer / Production (Freelance)",
        projects: [],
        startDate: undefined,
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-20-3",
        employerName: "Starland Marketing",
        jobTitle: "Photographer / Videographer",
        projects: [],
        startDate: new Date("2021-02-01"),
        endDate: new Date("2023-12-01"),
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-20-4",
        employerName: "Black Oaks Digital",
        jobTitle: "Videographer / Editor / Head of Production",
        projects: [],
        startDate: new Date("2020-02-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
      {
        id: "we-20-5",
        employerName: "Emumba",
        jobTitle: "Visual Content Creator / Head of Visual Production",
        projects: [],
        startDate: new Date("2023-01-01"),
        endDate: undefined,
        techStacks: [],
        shiftType: "Morning",
        workMode: "Onsite",
        timeSupportZones: []
      },
    ],
    projects: [
      {
        id: "standalone-proj-20-1",
        projectName: "Hanif Medical Complex",
        contributionNotes: "Created video content and promotional materials for medical complex, implementing professional videography, editing, and post-production to showcase medical facilities and services."
      },
      {
        id: "standalone-proj-20-2",
        projectName: "Discover Pakistan",
        contributionNotes: "Produced travel and tourism video content, implementing cinematic videography, storytelling, and visual effects to promote Pakistan's cultural and natural attractions."
      },
      {
        id: "standalone-proj-20-3",
        projectName: "DG ISPR",
        contributionNotes: "Created video content for ISPR, implementing professional production, editing, and post-production for official communications and promotional materials."
      },
      {
        id: "standalone-proj-20-4",
        projectName: "PRM Associates",
        contributionNotes: "Developed video marketing content for PRM Associates, implementing corporate videography, brand storytelling, and professional editing for business promotion."
      },
      {
        id: "standalone-proj-20-5",
        projectName: "Bill Solutions",
        contributionNotes: "Produced video content for Bill Solutions, implementing product demonstrations, corporate videos, and marketing materials with professional videography and editing."
      },
      {
        id: "standalone-proj-20-6",
        projectName: "Lodhi Autos",
        contributionNotes: "Created automotive video content for Lodhi Autos, implementing vehicle showcases, promotional videos, and marketing materials with professional videography and post-production."
      }
    ],
    certifications: [
      {
        id: "cert-20-1",
        certificationId: "cert-050",
        certificationName: "Professional Photography",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      },
      {
        id: "cert-20-2",
        certificationId: "cert-051",
        certificationName: "Prompt Engineering (Udemy)",
        issueDate: undefined,
        expiryDate: undefined,
        certificationUrl: null
      }
    ],
    educations: [
      {
        id: "edu-20-1",
        universityLocationId: "loc-003-001",
        universityLocationName: "Riphah International University - Islamabad",
        degreeName: "Bachelor of Science",
        majorName: "Media Studies",
        startMonth: new Date("2019-09-01"),
        endMonth: undefined,
        grades: "3.7/4.0",
        isTopper: null,
        isCheetah: null
      }
    ],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "21",
    name: "Ali Akbar",
    postingTitle: null,
    email: "ali.r@dplit.com",
    mobileNo: "+923317636402",
    cnic: null,
    currentSalary: 450000,
    expectedSalary: 500000,
    city: "Islamabad",
    githubUrl: null,
    linkedinUrl: "https://pk.linkedin.com/in/akbar784",
    source: "DPL Employee",
    status: "hired",
    resume: null,
    workExperiences: [
      {
        id: "we-21-1",
        employerName: "DPL",
        jobTitle: "Lead Software Engineer",
        projects: [
          {
            id: "proj-exp-21-1-1",
            projectName: "iapartments",
            contributionNotes: "Led development of apartment management system using ASP.NET Core, Angular, SQL, and .NET Core APIs, implementing full-stack architecture, database design, and RESTful API development for property management features."
          },
        ],
        startDate: new Date("2021-01-01"),
        endDate: undefined,
        techStacks: ["ASP.NET Core", ".NET Core", "c#", "sql", "angular", "javascript", "typescript", ".NET Core APIs"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["PAK", "US"]
      },
    ],
    projects: [],
    certifications: [],
    educations: [],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "22",
    name: "Haider Habib",
    postingTitle: null,
    email: "haider.h@dplit.com",
    mobileNo: "+923317636402",
    cnic: null,
    currentSalary: 250000,
    expectedSalary: 300000,
    city: "Islamabad",
    githubUrl: null,
    linkedinUrl: "https://pk.linkedin.com/in/haiderhs792",
    source: "DPL Employee",
    status: "hired",
    resume: null,
    workExperiences: [
      {
        id: "we-22-1",
        employerName: "DPL",
        jobTitle: "Senior React Native Developer",
        projects: [
          {
            id: "proj-exp-22-1-1",
            projectName: "Pause Breathe Reflect",
            contributionNotes: "Developed meditation and mindfulness app using React Native, TypeScript, and JavaScript, implementing breathing exercises, guided sessions, Firebase integration, and AWS cloud services for scalable backend infrastructure."
          },
          {
            id: "proj-exp-22-1-2",
            projectName: "Miracle Morning Routine",
            contributionNotes: "Built morning routine tracking app using React Native, JavaScript, TypeScript, Node.js, Express.js, and MongoDB, implementing habit tracking, daily reminders, and progress visualization with Firebase and AWS integration."
          },
          {
            id: "proj-exp-22-1-3",
            projectName: "The Breath Source",
            contributionNotes: "Created breathing exercise application using React Native, TypeScript, and JavaScript, implementing customizable breathing patterns, timer functionality, Firebase backend, and Docker containerization with CI/CD pipeline."
          },
        ],
        startDate: new Date("2022-01-01"),
        endDate: undefined,
        techStacks: ["react native", "javascript", "typescript", "flutter", "node.js", "express.js", "mongodb", "firebase", "aws", "docker", "ci/cd"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["PAK", "US"]
      },
    ],
    projects: [],
    certifications: [],
    educations: [],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "23",
    name: "Maryam Siddiqui",
    postingTitle: null,
    email: "maryam.i@dplit.com",
    mobileNo: "+923317636402",
    cnic: null,
    currentSalary: 150000,
    expectedSalary: 200000,
    city: "Islamabad",
    githubUrl: null,
    linkedinUrl: "https://pk.linkedin.com/in/maryam-siddiqui-35280621a",
    source: "DPL Employee",
    status: "hired",
    resume: null,
    workExperiences: [
      {
        id: "we-23-1",
        employerName: "DPL",
        jobTitle: "QA Automation Engineer",
        projects: [
          {
            id: "proj-exp-23-1-1",
            projectName: "iapartments",
            contributionNotes: "Performed comprehensive QA automation testing for apartment management system using Selenium, Java, TestNG, Maven, JUnit, and REST Assured, implementing API testing with Postman, CI/CD with Jenkins, Docker containerization, and AWS integration."
          },
          {
            id: "proj-exp-23-1-2",
            projectName: "Quran App",
            contributionNotes: "Conducted automated testing for Quran application using Selenium, Java, TestNG, and JUnit, implementing mobile app testing, API testing with Postman and REST Assured, Python scripts for test automation, and CI/CD pipeline with Jenkins and Docker."
          }
        ],
        startDate: new Date("2024-07-01"),
        endDate: undefined,
        techStacks: ["selenium", "java", "testng", "maven", "junit", "restassured", "postman", "jenkins", "docker", "ci/cd", "python", "aws"],
        shiftType: "Morning",
        workMode: "Hybrid",
        timeSupportZones: ["PAK", "US"]
      },
    ],
    projects: [],
    certifications: [],
    educations: [],
    createdAt: new Date("2023-12-28"),
    updatedAt: new Date("2024-02-01")
  },
]
