import type { ProvisionalRewriteResult } from "./provisionalRewrite";

// Fictional person (Maya Okafor) and employers, tailored to a made-up data
// analyst internship. Used to build the comparison screen before the
// rewriter's Server Action exists.
export const sampleRewrite: ProvisionalRewriteResult = {
  items: [
    {
      id: "exp-library",
      title: "Program Assistant, Brightwater Community Library",
      bullets: [
        {
          original: "Tracked attendance for weekend reading programs",
          rewritten:
            "Collected and organized attendance data for weekend reading programs",
          flagged: false,
        },
        {
          original: "Made a spreadsheet showing which programs were most popular",
          rewritten:
            "Built a spreadsheet report comparing program popularity to guide scheduling",
          flagged: false,
        },
        {
          original: "Helped 40 families sign up for library cards",
          rewritten: "Guided 40 families through library card registration",
          flagged: false,
        },
      ],
    },
    {
      id: "proj-transit",
      title: "Bus Delay Explorer (class project)",
      bullets: [
        {
          original: "Cleaned a public bus arrival dataset in Python",
          rewritten:
            "Cleaned and validated a public bus arrival dataset using Python",
          flagged: false,
        },
        {
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
