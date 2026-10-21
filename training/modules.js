// To add a module: drop the PDF in training/modules/ and append an entry here. Nothing else to edit.
window.TRAINING = {
  title: "How a System Answers a Business Question",
  intro: "A six-module series on how a data system turns a plain-English business question into a trustworthy answer: finding the right sources, mapping language to concepts, inferring joins, detecting intent, matching fields, and choosing what to say.",
  modules: [
    {
      id: 1, file: "modules/module-1.pdf", pages: 6,
      title: "Foundations and Relevance",
      subtitle: "How a system decides which data sources matter for a question",
      objectives: [
        "Describe a business question and a set of data sources in formal notation",
        "Explain the three signals of a hybrid relevance score: semantic, lexical and conceptual",
        "Use Bayes' rule to combine relevance with trust in each source",
        "Treat \"which sources do I need?\" as a set-cover problem",
        "Compute a relevance ranking by hand on a small example"
      ]
    },
    {
      id: 2, file: "modules/module-2.pdf", pages: 10,
      title: "Concept Mapping",
      subtitle: "How synonyms, abbreviations, typos and codes resolve to the same business concept",
      objectives: [
        "Describe synonyms as equivalence classes and explain why transitivity needs guarding",
        "Measure surface-level similarity with edit distance",
        "Resolve ambiguous terms with a softmax over candidate concepts, and judge uncertainty with entropy",
        "Expand abbreviations with a noisy-channel (Bayesian) model",
        "Link raw codes to concepts with pointwise mutual information (PMI)",
        "Measure semantic distance in an ontology graph with path length and information content"
      ]
    },
    {
      id: 3, file: "modules/module-3.pdf", pages: 10,
      title: "Inferring Implicit Relationships",
      subtitle: "How a system connects data the question never links, and fills in what the user didn't say",
      objectives: [
        "Model a data landscape as a weighted schema graph",
        "Score a candidate join with containment, Jaccard and uniqueness",
        "Explain why edge costs use \u2212log P, and find the most probable join path",
        "Connect three or more entities at once with a Steiner tree",
        "Detect fan-out and chasm traps that silently inflate numbers",
        "Measure functional dependencies with conditional entropy",
        "Infer unstated constraints (time windows, default exclusions) as latent variables",
        "Combine weak signals with chain products and noisy-OR"
      ]
    },
    {
      id: 4, file: "modules/module-4.pdf", pages: 11,
      title: "Intent Detection and Entity Resolution",
      subtitle: "How a system works out what kind of answer the user wants, and which specific things they mean",
      objectives: [
        "Classify intent with Bayesian and softmax models, including multi-intent questions",
        "Map an intent to a structural template with slots to fill",
        "Choose the right aggregation operator, and avoid the average-of-averages trap",
        "Resolve relative time expressions into exact intervals",
        "Detect mentions in a question and tag them by type",
        "Score and link each mention to a specific entity, and resolve several jointly",
        "Decide when to abstain (NIL) and check that confidence is calibrated"
      ]
    },
    {
      id: 5, file: "modules/module-5.pdf", pages: 11,
      title: "Semantic Matching, Confidence and Ranking",
      subtitle: "How a system picks the exact fields for each part of the question, checks the result, and ranks its options",
      objectives: [
        "Match question slots to data fields with maximum-weight bipartite matching",
        "Validate literal values with exact, normalized and fuzzy lookup",
        "Combine confidence across pipeline stages and find the weakest stage to clarify",
        "Run sanity checks: reference values, robust outlier scores, Bayesian updates after a red flag",
        "Explain two-stage retrieval and the recall/precision trade-off",
        "Train a ranker with pointwise, pairwise and listwise objectives",
        "Add diversity to a ranking with MMR",
        "Evaluate rankings with Precision@k, Recall@k, MRR and nDCG"
      ]
    },
    {
      id: 6, file: "modules/module-6.pdf", pages: 11,
      title: "Answer Selection and the Full Pipeline",
      subtitle: "How a system chooses the final answer, decides when to ask instead, and presents the result",
      objectives: [
        "Choose between candidate answers with expected utility, including uneven error costs",
        "Treat explicit user requirements as hard constraints that come before any score",
        "Raise confidence when independent derivations agree",
        "Decide between answering, hedging and asking with the value of information",
        "Set an answer threshold from a risk\u2013coverage trade-off",
        "Match presentation format to intent, and round to real precision",
        "Trace one question end to end through all six modules"
      ]
    }
  ]
};
