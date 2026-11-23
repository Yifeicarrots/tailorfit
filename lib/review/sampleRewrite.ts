import type { Experience, RewriteResult } from "@/lib/types";

// Fictional person (Maya Okafor) and employers, tailored to a made-up data
// analyst internship. Used to build the comparison screen before the
// rewriter's Server Action exists.
export const sampleExperiences: Experience[] = [
  {
    id: "exp-library",
    type: "experience",
    title: "Program Assistant",
    organization: "Brightwater Community Library",
    startDate: "2024-06",
    endDate: null,
    bullets: [
      { id: "lib-1", text: "Tracked attendance for weekend reading programs" },
      {
        id: "lib-2",
        text: "Made a spreadsheet showing which programs were most popular",
      },
      { id: "lib-3", text: "Helped 40 families sign up for library cards" },
    ],
  },
  {
    id: "proj-transit",
    type: "project",
    title: "Bus Delay Explorer (class project)",
    startDate: "2025-01",
    endDate: "2025-04",
    bullets: [
      { id: "bus-1", text: "Cleaned a public bus arrival dataset in Python" },
      { id: "bus-2", text: "Made charts of which routes were late most often" },
    ],
  },
];

export const sampleRewrite: RewriteResult = {
  items: [
    {
      id: "exp-library",
      bullets: [
        {
          id: "lib-1",
          original: "Tracked attendance for weekend reading programs",
          rewritten:
            "Collected and organized attendance data for weekend reading programs",
          flagged: false,
        },
        {
          id: "lib-2",
          original: "Made a spreadsheet showing which programs were most popular",
          rewritten:
            "Built a spreadsheet report comparing program popularity to guide scheduling",
          flagged: false,
        },
        {
          id: "lib-3",
          original: "Helped 40 families sign up for library cards",
          rewritten: "Guided 40 families through library card registration",
          flagged: false,
        },
      ],
    },
    {
      id: "proj-transit",
      bullets: [
        {
          id: "bus-1",
          original: "Cleaned a public bus arrival dataset in Python",
          rewritten:
            "Cleaned and validated a public bus arrival dataset using Python",
          flagged: false,
        },
        {
          id: "bus-2",
          original: "Made charts of which routes were late most often",
          rewritten: "Made charts of which routes were late most often",
          flagged: true,
          flagReason:
            'Possible invented skill or employer "Tableau" is not in the original bullet',
        },
      ],
    },
  ],
};
