---
title: Learn AI Pro
description: tools for people who already use ai: 3d, agents, training and local models.
---

# Learn AI Pro

this one is for people who are already good at using ai and just need help with what tools to use. no beginner stuff here.

new to all of this? start here instead.

[main guide](./) · [live benchmarks](#benchmarks)

## 3D Assets and 3D Modeling {#models-3d}

this is a job where you can pull in these models.

### paid

- opus 5.5
- sonnet 5.5
- gpt 6.2 astra
- gemini 4 neon

### local

- inkling 2 small
- inkling 2 mini
- glm-5.3-flash

"local" here means the weights are open, not that they'll run on any pc. inkling 2 small and glm-5.3-flash are huge mixture-of-experts models that need well over 100gb of memory, even compressed. inkling 2 mini is the one made for normal hardware, at about 20gb. check the model card before you download anything.

for 2d assets and image-to-3d models, check [the main guide](./#assets-2d).

### what i use

**opus 5.5, gpt 6.2 sol and gemini 4 neon, alongside glm-5.3-flash, depending on the task.**

## Free 3D Models for Your AI {#free-3d}

if you need help on 3d models, send this to your ai:

> `use https://fab.com to find free models for this project. prefer polished, low poly assets, and check each license and triangle count before using one.`

**fab will let you get hella free models that are polished, low poly and more.** starting from a good asset usually beats generating everything from scratch.

https://fab.com

## How to Maintain Subagents and Agents {#agents}

an agent is the thing doing your task. a subagent is a helper it hands a smaller job to, with its own context window, so your main session doesn't fill up with noise.

### setting one up

in claude code, a subagent is a markdown file. put it in `.claude/agents/` for one project, or `~/.claude/agents/` for all of them.

```
---
name: code-reviewer
description: use after code changes to find bugs. read only.
tools: Read, Grep, Glob
model: sonnet
---
review the changes. report real bugs with the file and line.
don't edit anything.
```

### keeping them useful

- **one job each.** a reviewer reviews, a researcher researches.
- **write a clear description.** it's how the main agent decides when to use it.
- **limit the tools.** if it only needs to read, don't let it edit.
- **match the model to the job.** save the expensive ones for the hard stuff.
- **update them when they mess up.** add the rule that would have prevented it.
- **delete the ones you never use.**
- **keep them in git,** so you can see what changed and roll it back.

**don't spawn a bunch of agents for something one agent can do.** more agents means more usage and more output to check.

https://code.claude.com/docs/en/sub-agents

## Live Benchmarks {#benchmarks}

numbers come from [artificial analysis](https://artificialanalysis.ai/). tap a button to sort, or search for a model.

<input id="search" type="search" placeholder="search models or companies" aria-label="search models or companies" hidden>

<div class="sorts" hidden>
    <button type="button" data-sort="intelligence" aria-pressed="true">smartest</button>
    <button type="button" data-sort="speed" aria-pressed="false">fastest</button>
    <button type="button" data-sort="price" aria-pressed="false">cheapest</button>
  </div>

<div class="table" hidden>
    <table>
      <thead><tr><th>model</th><th>intelligence</th><th>tokens/sec</th><th>$ in / 1m</th><th>$ out / 1m</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>

<p id="bench-status" role="status">loading benchmarks...</p>

[full leaderboard](https://artificialanalysis.ai/) · [data api docs](https://artificialanalysis.ai/data-api/docs#overview-hero)

## Training LLMs on Your Computer or Home Server {#training}

**i train llms on my home server.** if you want to get into it, here's where i'd point you.

### fine-tune, don't start from zero

training a model from scratch takes a ridiculous amount of data and compute. fine-tuning takes an existing open model and teaches it your style or task, which is far more realistic at home. lora and qlora only train a small set of extra weights, so they need much less memory.

### tools to look into

https://github.com/unslothai/unsloth

https://github.com/axolotl-ai-cloud/axolotl

https://huggingface.co/docs/trl

### a simple process

1. pick a small base model that fits your gpu, and check its license.
2. build a clean dataset. a few hundred good examples beat thousands of messy ones.
3. set some examples aside that the model never trains on.
4. run a short test first, then the full run.
5. compare it against the base model on those held-out examples.
6. export it, to gguf for example, and run it in ollama or lm studio.

### before you leave it running

- vram is usually the first limit you'll hit.
- save checkpoints, so a crash doesn't cost you the whole run.
- watch your temperatures and power usage.
- don't train on private data or keys you wouldn't want the model repeating.

## Why Local AI Can Compete With AI Plans {#local}

paid models are still really strong, especially on long, complicated tasks. local ai doesn't need to win everything to be worth it.

- **no usage limits.** run it as much as your hardware can handle.
- **privacy.** your code and files can stay on your own machine.
- **it works offline,** and nobody can change or retire the model you downloaded.
- **you can fine-tune it** on your own stuff.
- **cost over time.** there's no monthly bill, but hardware and electricity aren't free.

**my advice: let local models handle the repetitive work, and bring in a paid model when the local one gets stuck.**

test both on your own project before cancelling a plan or buying a new gpu.
