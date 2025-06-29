# app/core/startup.py

from sqlalchemy.orm import Session
from ..db import schemas
from ..crud import crud

def seed_initial_data(db: Session) -> None:
    """
    Populates the database with initial default data if it doesn't exist.
    """
    # Seed default criteria
    if not crud.get_criteria(db):
        default_criteria = [
            schemas.CriterionCreate(
                name="Composition",
                description="Evaluate the rule of thirds, framing, balance, and leading lines.",
                weight=1.0,
                enabled=True
            ),
            schemas.CriterionCreate(
                name="Technical_Quality",
                description="Assess focus, exposure, sharpness, and noise levels.",
                weight=1.2,
                enabled=True
            ),
            schemas.CriterionCreate(
                name="Creativity",
                description="Judge the unique perspective, artistic vision, and originality.",
                weight=0.9,
                enabled=True
            ),
            schemas.CriterionCreate(
                name="Nature_Relevance",
                description="Consider the connection to nature, authenticity, and storytelling.",
                weight=1.1,
                enabled=True
            ),
        ]
        for c in default_criteria:
            crud.create_criterion(db, c)

    # Default EVALUATION_PROMPT seeding
    if not crud.get_prompts_by_type(db, "EVALUATION_PROMPT"):
        crud.create_prompt(
            db,
            schemas.PromptCreate(
                type="EVALUATION_PROMPT",
                enabled=True,
                template="""You are an expert photography judge. Evaluate this photograph for {criterion_name}.

                            {criterion_description}

                            Provide:
                            1. A score from 0.0 to 10.0
                            2. A brief rationale (2-3 sentences)

                            Format your response as:
                            SCORE: [number]
                            RATIONALE: [explanation]""",
                description="The default prompt used for evaluating a single criterion."
            )
        )

    # Default REASONING_PROMPT seeding
    if not crud.get_prompts_by_type(db, "REASONING_PROMPT"):
        crud.create_prompt(
            db,
            schemas.PromptCreate(
                type="REASONING_PROMPT",
                enabled=True,
                template="""You are the head judge of a photography competition. You have received feedback and scores from your panel of judges on a photograph. Your task is to synthesize this feedback and provide one final, authoritative assessment.

                            The photograph received a *preliminary* calculated score of {overall_score}/10 based on the panel's feedback.
                            The competition rules emphasize: {rules}

                            Here is the detailed feedback from the panel:
                            {feedback_summary}

                            Based on a holistic review of the photo's strengths and weaknesses, and considering the competition rules, you must now provide your final judgment. Decide if the preliminary score is accurate or if it needs adjustment. An adjustment might be warranted if the individual scores don't fully capture a significant flaw or an outstanding quality that transcends the individual criteria.

                            Your final output MUST be in the following format. Do not add any other text outside of this structure:
                            FINAL_SCORE: [Your final score out of 10. This can be the same as the preliminary score or a new one you deem more appropriate.]
                            RATIONALE: [Your final summary for the photographer in maximum 60 words. Explain the final score. Be concise, clear and neutral. Explain what is good about the photo, how it could be improved, and how well it fits the competition's specific rules. If you adjusted the score from the preliminary one, briefly explain why.]""",
                                                description="The default prompt for generating the final overall reasoning and a potentially revised final score."
                                            )
                                        )
    # Default RULES_SYNTHESIS_PROMPT seeding
    if not crud.get_prompts_by_type(db, "RULES_SYNTHESIS_PROMPT"):
        crud.create_prompt(
            db,
            schemas.PromptCreate(
                type="RULES_SYNTHESIS_PROMPT",
                enabled=True,
                template="""You are an expert photo competition analyst. Your task is to analyze the provided text, which contains information about past winners of the '{competition_name}' photography competition.
                            Based *only* on the text provided, identify the recurring themes, subjects, artistic styles, compositional techniques, and overall mood that seem to be favored by the judges.
                            From your analysis, generate a concise and informative "Competition Rules" description of around 100-150 words that could be used to guide an AI judge.
                            The description should be written in a neutral, guiding tone. Do not invent rules or criteria that are not supported by the source text.
                            **Source Text:**
                            ---
                            {aggregated_search_results}
                            ---
                            **Generated Competition Rules:**""",
                                                description="The default prompt for synthesizing competition guidelines from web search results."
                                            )
                                        )