from models.schemas import ScoreResult


def test_score_result_accepts_valid_scores() -> None:
    score = ScoreResult(
        pronunciation_score=80,
        grammar_score=85,
        fluency_score=78,
        vocabulary_score=82,
        naturalness_score=79,
        overall_score=81,
    )

    assert score.overall_score == 81
