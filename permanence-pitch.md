# Permanence
*A personal creative memory system built around the phenomenology of encounter*

---

## The Problem

There is a particular kind of forgetting that happens to people who consume a lot of culture. It is not the forgetting of facts — you can look up when Duchamp made the first readymade, or what year Blade Runner was released. It is the forgetting of *encounter*: what it felt like to walk through a specific exhibition on a specific afternoon, what connections you made in real time, what questions it opened up in you, what it meant in the context of everything else you were thinking about at that moment.

This is the kind of memory that actually shapes a creative practice. Not the retrievable fact, but the lived encounter and the synthesis that followed. And it is almost entirely unarchived.

The tools that exist for saving cultural references — Pinterest, Are.na, Cosmos, Notion — are built around a different problem. They save *objects*: images, links, quotes, clippings. They are curatorial tools, and good ones. But they have a structural limitation: every object they contain was already mediated by someone else. Someone liked a particular frame from a film enough to screenshot and upload it. Someone found a quote worth extracting. The first-person encounter — your encounter — is already one step removed by the time it enters the system.

More importantly, none of these tools are built around the idea that the value of a cultural encounter compounds over time through synthesis. Saving a link to the MoMA page for a Duchamp exhibition is not the same as recording what you thought about it, what you learned, what it connected to, what it made you want to make. The link decays in usefulness. The synthesis appreciates.

---

## What Permanence Is

Permanence is a personal application for archiving creative encounters at the level of synthesis, not clipping. Its central object is called a **Pearl**.

A Pearl is a structured, multi-layered record of a single encounter with a primary source — where "primary source" is defined loosely as any discrete piece of media or experience that had a meaningful impact. A museum exhibition is a Pearl. An obscure webcomic read years ago is a Pearl. A photography monograph, a documentary, a specific artist's body of work, a website, a tweet thread that reoriented your thinking — each of these can be a Pearl.

The key distinction from existing tools: a Pearl is not a save. It is a record of an *encounter* — your encounter, from your perspective, including your state of mind, your real-time reactions, your synthesis, your connections to other things you know. The primary source is the nucleus, but the Pearl itself is the accumulated material around it.

---

## The Structure of a Pearl

Each Pearl is composed of five layers:

**The Envelope** is the structured metadata: title, source URL or location, source type, date of encounter, tags, and a mood field — a freeform note about your headspace that day. This layer is queryable and filterable.

**The Experiential Record** is a freeform long-form text field for the phenomenological account of the encounter itself. For the Duchamp exhibition at MoMA, this might include: arriving, the sequence of rooms, the works that stopped you cold, the ones that disappointed, the conversations that happened, the physical experience of being in the space. It is a first-person account of being there, not an analysis of the work.

**The Intellectual Synthesis** is a separate freeform field for the analytical layer: what you learned, what questions the encounter opened, what it connects to in your existing knowledge, what it might mean for your own practice. This is the layer most likely to be useful years later when working on a project, because it represents your thinking at peak engagement — immediately after the encounter, before the texture of it fades.

**The Professor Transcript** is a record of a dialogue conducted with an AI agent during or immediately after the encounter. The agent — called the Professor — functions as a knowledgeable interlocutor: it can explain historical context, answer specific questions about the work or artist, push back on interpretations, and surface connections the user might not have made. The transcript of this dialogue becomes a permanent layer of the Pearl, capturing a mode of thinking — inquiry in dialogue — that is different from thinking alone. This is not a chatbot interaction appended to a note. It is a structured intellectual session whose output is archived as part of the Pearl's permanent record.

**The Connection Graph** is a set of explicit links to other Pearls, annotated with a note explaining the connection. Over time, this becomes the most structurally interesting layer — a hand-built map of how your encounters relate to each other, created by you at the moment of synthesis when the connection is most visible.

Photos, scans, and other media attachments can be added to any Pearl.

---

## The Professor

The Professor is the AI layer inside Permanence, powered by Hermes Agent (Nous Research) running Kimi K2 via OpenRouter. It is not a general-purpose assistant. It has a specific role: to function as a knowledgeable expert during the Pearl creation process, helping the user go deeper into a source than they could alone.

When creating a Pearl, the user can open a Professor session. The Professor is given the Pearl's envelope as context — it knows what the source is, when the encounter happened, what the initial tags and mood are — and from that context it can answer questions, provide historical background, explain references, challenge interpretations, and suggest connections. It has access to web search for current and specific information.

The Professor's output is not the point. The user's synthesis is the point. The Professor is a tool for generating better synthesis, faster, at the moment of highest engagement. Its entire contribution — every exchange — is saved as the Pearl's transcript layer, so the dialogue itself becomes archival material.

---

## The Library and Retrieval

The Pearl library is the primary view of the application — a browsable, filterable collection of everything you have captured. The exact form of that interface is a design problem to be solved, but its functional requirements are clear: you need to be able to find a specific Pearl you remember, browse by type or tag, and surface Pearls you have forgotten about.

The search is semantic, not keyword-based — queries are matched against embedded representations of each Pearl's synthesis and experience layers. Searching for "objects that challenge authorship" should surface the Duchamp Pearl even if those exact words do not appear in it.

The more structurally interesting retrieval feature is what the system calls **threading**. The user describes a project, a theme, or a question — "I'm starting a project about the tension between anonymity and authorship in contemporary art" — and the Professor searches across the entire Pearl library, surfacing the most relevant Pearls and synthesizing a briefing document that draws on both the public knowledge of those sources and the user's own recorded reflections and connections. This is the feature that closes the loop: the system is not just an archive but an active participant in future creative work, drawing on the accumulated history of the user's encounters to brief them before something new.

---

## Technical Architecture

Permanence is built as a web application. The specific infrastructure decisions — where data lives, how it is stored, what services it depends on — will be driven by the design rather than predetermined. The guiding principle is that the user owns their data and the system should remain usable and portable over a long time horizon; the concrete implementation of that principle is flexible.

The Professor is powered by Hermes Agent, an open-source autonomous agent runtime developed by Nous Research. Hermes maintains memory across sessions and connects to the Permanence data layer via a custom skill — a set of tools that allow it to create, read, search, and thread Pearls. The underlying model is Kimi K2 accessed via OpenRouter, chosen for its strong reasoning capability at a cost point appropriate for a personal tool with moderate usage. The Professor lives inside the application as a built-in conversational interface; its exact form is a design decision still to be made.

Semantic search — the ability to retrieve Pearls by meaning rather than keyword — is a core capability. The implementation approach will be determined by the broader architecture decisions.

---

## What This Is Not

Permanence is not a read-it-later tool. It is not designed for high-volume capture. A Pearl requires real engagement — the user is expected to spend meaningful time with a source before or during Pearl creation. The bar is intentionally high: if you did not think about it, you do not make a Pearl for it. This is a feature, not a limitation. The value of the system depends on the density of synthesis in each Pearl, not the number of Pearls.

Permanence is not a social or collaborative tool. It is a single-user system built around a single person's subjective experience of culture. There is no sharing mechanism, no public library, no social graph. The privacy of the reflective layer — mood, personal connections, unfinished thinking — is a prerequisite for its honesty.

Permanence is not trying to replace the experience of consuming culture. It is trying to make that experience accumulate rather than dissipate.

---

## Why Now

The specific combination of capabilities that makes Permanence possible is recent. A persistent agent runtime with cross-session memory, running a capable model at low cost via a unified API, with semantic search available without institutional infrastructure — none of this existed in a usable form three years ago. The tool is being built because the infrastructure finally makes it buildable without institutional resources.

The personal creative memory problem is not new. Commonplace books, journals, sketchbooks, index cards — these are all prior attempts at the same thing. Permanence is a digital version of that tradition, with retrieval that scales, a dialogue partner built in, and a structure designed for the specific texture of how a contemporary creative person consumes culture.
