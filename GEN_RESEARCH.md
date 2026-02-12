# Research: Improving PinV Widget Generation

**Goal:** Move from a single "sloppy prompt" to a data-driven, perfectible generation engine.

## 1. User Feedback Loop (RLHF)
- **UI Component:** Add a 1-5 star rating system to the widget previewer.
- **Data Capture:**
    ```json
    {
      "id": "uuid",
      "prompt": "user input string",
      "result": {
        "data_code": "...",
        "ui_code": "...",
        "params": "..."
      },
      "score": 1-5,
      "feedback": "optional text",
      "model": "model-id used",
      "latency": "ms",
      "timestamp": "iso-date"
    }
    ```
- **Storage:** Initially a JSONL file in `gen-feedback/dataset.jsonl` for easy analysis, eventually a dedicated Postgres table.

## 2. Analysis & Perfection Tooling
- **New Package: `pinv-gen`**
    - Purpose: Modularize the AI logic.
    - Features:
        - **System Prompt Management:** Versioned prompts.
        - **Evaluator Logic:** Scripts to run the dataset against different prompts/models and compare scores.
        - **"Ideal" Examples:** Curate a set of "Gold Standard" widgets (Perfect prompt -> Perfect code) to use for few-shot prompting.

## 3. Implementation Roadmap
1.  **Phase 1 (Data Collection):** Implement the UI feedback component in `web/` and a simple API endpoint to save results.
2.  **Phase 2 (Dataset Building):** Manually rate the last 50-100 generations to bootstrap the dataset.
3.  **Phase 3 (Evaluation Tool):** Create the `pinv-gen` package with a script that runs the dataset through different prompt variants.
4.  **Phase 4 (Automated Improvement):** Use an "LLM-as-a-Judge" to analyze low-scoring generations and suggest prompt improvements.

## 4. Why this matters
Proving the **integrity** of the code is only useful if the code is **good**. If we generate "hallucinated garbage" verifiably, it's still garbage. This research ensures the *content* is as high-fidelity as the *infrastructure*.
