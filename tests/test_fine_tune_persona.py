def test_prompt_load_contains_keywords():
    with open('02_ai_chat_persona/persona_prompt.txt') as f:
        content = f.read()
    assert 'FlirtyLuxe' in content
    assert 'OnlyFans' in content
