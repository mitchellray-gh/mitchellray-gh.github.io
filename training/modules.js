// To add a module: drop the PDF in training/modules/ and append an entry here. Nothing else to edit.
window.TRAINING = {
  title: "How a System Answers a Business Question",
  intro: "A six-module series on how a data system turns a plain-English business question into a trustworthy answer: finding the right sources, mapping language to concepts, inferring joins, detecting intent, matching fields, and choosing what to say. Each module is an interactive lesson with diagrams, live calculators and self-checks; the original PDFs stay available for download.",
  modules: [
    {
      id: 1, file: "modules/module-1.pdf", pages: 6,
      title: "Foundations and Relevance",
      subtitle: "How a system decides which data sources matter for a question",
      summary: "The question: which data sources matter for this question? In: the question plus a list of sources, each with a description. Out: a ranked list of sources, each with a relevance score and a trust-adjusted probability. Why it matters: a wrong source gives a confident wrong answer, so the system ranks sources before it reads any data.",
      mistakes: [
        "Thinking a high match score means a source is trusted. Relevance and trust are separate; Bayes' rule combines them.",
        "Stopping at the top-ranked source. Set-cover asks whether the chosen sources together cover every part of the question.",
        "Treating BM25's k1 and b as the same knob. k1 controls how much repeated words count; b controls how much long documents are penalized."
      ],
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
      summary: "The question: which business concept does this word mean? In: a term such as 'rev', 'sales' or 'rvnu', plus the candidate concepts it could match. Out: the most likely concept and how sure the system is. Why it matters: different words for one idea must count as one, or totals split across several names.",
      mistakes: [
        "Assuming synonyms always chain. If 'bank' links to 'river' and 'river' links to 'money', that does not make 'bank' mean 'money' in every context.",
        "Trusting edit distance alone. Two spellings can be one edit apart and still mean different things; similarity is a clue, not proof.",
        "Reading high entropy as a wrong answer. High entropy means the system is unsure between candidates, so it should ask or hedge."
      ],
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
      summary: "The question: how do these tables connect, and what did the user leave unsaid? In: the database schema and the entities named in the question. Out: a join path with a confidence score, plus any assumed constraints such as a default time window. Why it matters: a bad join can multiply rows and silently inflate every total.",
      mistakes: [
        "Accepting a join just because column names match. Check containment, Jaccard overlap and uniqueness first.",
        "Ignoring fan-out. Joining a one-to-many table repeats the parent rows, so sums come out too big without any error message.",
        "Hiding inferred constraints. A default time window or exclusion the user never stated must be shown to them."
      ],
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
      summary: "The question: what kind of answer is wanted, and which specific things are meant? In: the question text and the known entities. Out: an intent (for example total, trend or comparison), filled slots, exact dates for relative phrases such as 'last quarter', and linked entities or an explicit NIL when nothing fits. Why it matters: the same words can ask for very different answers.",
      mistakes: [
        "Averaging averages. The mean of regional averages is not the overall average unless the regions are the same size. Use the right aggregation operator.",
        "Resolving 'last quarter' silently. Always state the exact start and end dates the system used.",
        "Forcing a link when the system should abstain. NIL is a valid answer; a confident wrong entity is worse than none."
      ],
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
      summary: "The question: which exact field answers each part of the question, and can the result be trusted? In: question slots, candidate fields, literal values and candidate results. Out: field matches, checked values, an overall confidence and a ranked list of options. Why it matters: choosing the wrong column is the most common error, and it looks completely normal.",
      mistakes: [
        "Multiplying confidences without looking. One weak stage drags the whole answer down; find that stage and clarify it.",
        "Using mean and standard deviation to spot outliers. One extreme value distorts both; median-based (robust) scores resist this.",
        "Judging a ranker by one number. Check Precision@k, Recall@k, MRR and nDCG together, because each one shows a different failure."
      ],
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
      summary: "The question: should the system answer, hedge, or ask the user first? In: candidate answers with probabilities, error costs, the user's hard requirements and the intent. Out: one chosen answer (or a hedge or a clarifying question), shown at a sensible precision. Why it matters: this last step decides whether the user sees a useful answer at all.",
      mistakes: [
        "Picking the most probable answer when mistakes cost different amounts. Choose by expected utility, which weighs both.",
        "Letting a score override an explicit requirement. Hard constraints such as 'only EMEA' come before any ranking.",
        "Asking a question when the answer is already clear enough. Ask only when the answer would change the decision (value of information).",
        "Showing false precision. 12.3456% when the data supports about 12% makes a rough number look exact."
      ],
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
