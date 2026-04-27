# 🐛 QMD v0.3.2 Runtime Panic & Embedding Warning Investigation

## The Issues

1. **Rust Runtime Panic**
   ```text
   byte index 2285 is not a char boundary; it is inside '“'
   ```
   When running `qmd embed`, the engine crashed when processing certain documents (like `README.md`).

2. **Llama.cpp Warnings**
   ```text
   decode: cannot decode batches with this context (calling encode() instead)
   init: embeddings required but some input tokens were not marked as outputs -> overriding
   ```

## Findings

1. **The Rust Panic (`byte index is not a char boundary`)**:
   In `qmd` v0.3.2, the fallback document chunker was naively slicing string arrays by a hardcoded byte length (`end_pos = start + max_chars`) without checking if the index fell exactly between multi-byte UTF-8 character boundaries. When it hit a smart quote (`“`), it caused a runtime panic.

2. **The `llama.cpp` Warnings (`calling encode() instead`)**:
   The engine uses the `llama-cpp-2` Rust bindings and is hardcoded to call `ctx.decode()` for all models. For modern embedding models (like `embeddinggemma`), `llama.cpp` expects `encode()` and throws these warnings to let you know it's overriding the request and forcefully marking outputs.

3. **The Upstream Project (v0.5.0)**:
   The `qmd` upstream repository has completely rewritten the embedding engine on the `main` branch (unreleased `v0.5.0`), dropping `llama-cpp-2` entirely in favor of `fastembed` and `sqlite-vec`. This means both the tokenizer panic and the llama.cpp warnings are structurally eliminated in the upcoming release.

## Actions Taken

**1. Local Registry Patch**
Patched the local `~/.cargo/registry/src/.../qmd-0.3.2/src/llm.rs` cache to safely walk backward to valid UTF-8 boundaries and effectively silence the warnings. Forced a re-compile and re-install (`cargo install --path .`). `qmd embed` was confirmed to be actively processing the pending queue.

**2. Local Fork**
Created a local fork at `~/projects/qmd-fork` and applied the fixes there. If an environment update wipes the cargo registry cache and breaks the CLI tool before `v0.5.0` is published, run:
```bash
cargo install --path ~/projects/qmd-fork/qmd-cli --force
```

**3. Long-Term Strategy**
Wait for `qmd-cli v0.5.0` to be published on `crates.io`. Once available, run `cargo install qmd-cli` to securely adopt the new `fastembed` engine and permanently eliminate the `llama-cpp` dependency tree.
