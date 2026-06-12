---
title: "How to Set Up an AI Voice Assistant for an Australian 03 Number"
description: "ElevenLabs, Vapi, and Retell cannot provision Australian 03 numbers directly. This step-by-step walks you through Twilio to ElevenLabs to n8n to Cal.com, with cost breakdown and the gotchas."
date: 2026-06-04
updated: 2026-06-11
image: /assets/post-06-hero.png
tags: [AI voice agent, Twilio Australia, ElevenLabs conversational AI Australia, AI receptionist with 03 number, Cal.com booking, n8n voice workflow]
faq:
  - q: "How long does Twilio identity verification take in Australia?"
    a: "Twilio identity verification for Australian numbers typically takes 1-3 business days. The bundle Twilio checks includes your ABN details, business address, and an authorised representative's identification (drivers licence or passport). The process is governed by ACMA, the Australian Communications and Media Authority, and Twilio cannot skip it. Plan to start the verification at least three business days before you want the number live."
  - q: "Do I need an ABN to buy an Australian phone number?"
    a: "Yes. Twilio's regulatory bundle for Australian numbers requires an active ABN (Australian Business Number), the trading name registered against the ABN, and a business address in Australia. If you are a sole trader without an ABN, you can register one for free at abr.gov.au — it usually takes 20-30 minutes online and clears within a day."
  - q: "Can I keep my existing business number when I switch to an AI receptionist?"
    a: "Yes, in most cases. You can port an existing Australian number from your current carrier (Telstra, Optus, Vodafone, TPG, etc.) into Twilio, and then import it into ElevenLabs using the same SIP trunk flow. Porting typically takes 5-10 business days, costs nothing, and the number is never out of service for more than a few minutes. The number stays with your business, not with the AI platform."
  - q: "What happens if the AI can't answer a question — does it escalate to a human?"
    a: "Yes, with the right configuration. The standard Amily build follows three rules: anything time-critical (burst pipes, gas, exposed wiring) escalates immediately to the on-call mobile via SMS. Anything the AI is not confident about (a specific quote, a warranty question, an unusual job description) escalates to the tradie's mobile with a written summary. Anything the AI can handle (booking, FAQ, address, hours) is handled in-call. The fallback is 'I'll have [Name] call you back within 30 minutes' — never 'I don't know' without a path forward."
  - q: "Is AI call recording legal in Australia under the Privacy Act 2024?"
    a: "AI call recording is legal in Australia, but it is regulated. You must disclose the recording at the start of the call ('This call may be recorded for quality and training purposes') and you must include the recording practice in your privacy policy. From 10 December 2026, businesses must also disclose the use of automated decision-making in their privacy policy under the Privacy Act 2024 amendments. Amily's standard build includes the disclosure line in the agent's greeting and a privacy policy template for clients."
---

![Diagram of the AI voice assistant setup for an Australian 03 number](/assets/post-06-hero.png)

> **TL;DR**
> - ElevenLabs, Vapi, Retell, and Bland **cannot** provision Australian 03 numbers directly. You must import the number from Twilio, which is the only mainstream provider selling AU local numbers to AI platforms.
> - A working DIY build takes **4-8 hours of focused time** plus **1-3 business days** for Twilio identity verification. Cost is **AUD $50-$80/month** in raw infrastructure.
> - The four components are: **Twilio AU** (the number), **ElevenLabs Conversational AI** (the voice agent), **n8n** (the workflow glue, free if self-hosted), and **Cal.com** (the booking calendar, free tier).
> - The fiddly bits are the Twilio regulatory setup, the ElevenLabs system prompt, the n8n webhook wiring for Cal.com, and the SMS confirmation flow.
> - If you would rather not spend a weekend on it, Amily's **AI Setup Consulting** is a one-off AUD $2,500 for trades (AUD $3,500 for professional services) and we hand you a working system. See [amily.ai/#setup](https://amily.ai/#setup).

Setting up an AI voice assistant with an Australian 03 number requires four pieces: a Twilio AU account (mandatory, because ElevenLabs and Vapi do not provision AU numbers), an ElevenLabs Conversational AI agent, an n8n workflow for the backend, and a Cal.com booking calendar. Total build time is 4-8 hours for a competent developer, 1-2 days for a non-technical founder. Total monthly cost is roughly $50-$80 in raw infrastructure: $3 for the 03 number, $0.10/min for voice, $0 for self-hosted n8n, $0 for Cal.com free tier — the full per-component pricing is benchmarked against a human receptionist and an offshore call centre in [AI Receptionist Cost in Melbourne: From $149/mo](/blog/virtual-receptionist-cost-melbourne-2026).

The catch: you will spend the bulk of that time on Twilio identity verification (1-3 business days), number porting, system prompt engineering, and n8n webhook wiring. None of it is hard — it is all quite well-documented — but it is fiddly, and a single misconfiguration will leave the agent silent on a Saturday afternoon when a customer is trying to book. The cost of that Saturday afternoon, in lost job value, is the focus of [The True Cost of Missed Calls for Melbourne Tradies](/blog/cost-of-missed-calls-melbourne-tradies) — most solo tradies lose about **$52,000 a year** to the same problem this guide solves.

This post walks through every step, with the gotchas, the cost breakdown, and a clear answer to the question: should you DIY or hire someone to do it for you?

## Why can't ElevenLabs, Vapi, or Retell give me an Australian 03 number directly?

None of the major conversational AI platforms — ElevenLabs, Vapi, Retell, Bland — provision Australian local numbers directly. They sell US and Canadian numbers out of the box (and a few UK and EU numbers in some cases), and they let you import numbers from external carriers via SIP trunking. Australian numbers are not in that default catalogue.

The reason is regulatory, not technical. Australian phone numbers are governed by the **Australian Communications and Media Authority (ACMA)**, which requires identity verification (ABN, business address, authorised representative ID) before a number can be activated. That process is expensive to operate at global scale, so AI platforms push AU customers to a carrier that already does it well: Twilio.

Twilio is the de facto gateway. You buy the number from Twilio, you verify your identity with Twilio, and then you import the number into your voice AI platform of choice using SIP trunking (Twilio's "Elastic SIP Trunking" product). ElevenLabs, Vapi, and Retell all support this pattern with a documented import flow. Once imported, the number behaves exactly like a native one — the platform handles inbound calls, the AI picks up, and the caller sees a normal Melbourne 03 number on their screen.

The practical takeaway: **Twilio is mandatory, not optional**, and you should plan for 1-3 business days of identity verification before the number lights up [Source: twilio.com/en-us/guidelines/au/regulatory].

## What do I need before I start building an AI receptionist with a 03 number?

You need five things in place before you write a single line of config. Get these lined up in one sitting — the friction is in the back-and-forth, not the individual setup tasks.

1. **Twilio account** (free to create) with an Australian business profile: ABN, business address, and an authorised representative's ID. Verification takes 1-3 business days. Twilio's AU regulatory guidelines are at [twilio.com/en-us/guidelines/au/regulatory](https://www.twilio.com/en-us/guidelines/au/regulatory).
2. **ElevenLabs account** (free tier is enough to start; you will need a paid plan for production voice minutes — Starter at ~$5/month covers roughly 30 minutes of agent conversation).
3. **n8n** — self-hosted on a Raspberry Pi or small VPS, or n8n Cloud from $8/month. n8n handles the webhook glue between ElevenLabs and Cal.com, and the SMS confirmation via Twilio.
4. **Cal.com** — free tier is fine for one person. Connect your Google Calendar so availability is real.
5. **A test mobile** — a second phone (a spare or a colleague's) to call the new 03 number and confirm the AI answers properly. Calling yourself from the same number is a useful trick to test the routing without a real customer.

You will also want a quiet afternoon, a notepad, and a willingness to read Twilio's docs at least once. The platforms are well-documented, but they assume you know what a webhook is and what JSON looks like.

## How do I provision a Twilio Australian 03 number and import it into ElevenLabs?

This is the meaty part. The flow is: Twilio account + verification, buy a number, set up Elastic SIP Trunking, point ElevenLabs at the trunk. Budget 30-60 minutes of hands-on time, plus 1-3 business days of waiting for verification.

### Step 1: Create a Twilio account and complete identity verification

Sign up at [twilio.com](https://www.twilio.com), choose Australia as the region, and complete the regulatory profile under **Console > Account > Regulatory Compliance**. You will need: an active **ABN**, the trading name and address registered against the ABN, and an authorised representative's drivers licence or passport.

The verification usually takes 1-3 business days. Some profiles clear in hours. Twilio will email you when the bundle is approved. **Do not** try to buy a number before verification — the purchase will fail and you will be stuck in a slow support loop.

### Step 2: Buy a local 03 number

Once verified, go to **Console > Phone Numbers > Buy a Number**, filter by region "AU" and locality "Melbourne" (or wherever you actually want). Local 03 numbers cost **AUD $3.00/month** plus per-minute usage [Source: twilio.com/en-us/voice/pricing/au]. Pick something memorable if you can — the last four digits of the number often become the customer's first memory of the business.

### Step 3: Set up an Elastic SIP Trunk

In the Twilio console, create an **Elastic SIP Trunk** and attach the 03 number as the termination. Note down the **Origination URI** (something like `amy1234.pstn.us1.twilio.com`) and the **SIP username/password**. This is the bridge between Twilio's phone network and ElevenLabs' voice platform.

Set the **voice URL** on the number to a temporary TwiML bin for now (you will swap this out once ElevenLabs is connected). A simple `<Response><Dial>` TwiML is enough to confirm the number is live.

### Step 4: Create an ElevenLabs Conversational AI agent

In the ElevenLabs dashboard, go to **Conversational AI > Agents > Create Agent**. Give the agent a name, pick a voice (the default "Rachel" or "Charlotte" work well for a Melbourne audience), and write a system prompt. The prompt is the most important part — it tells the agent who it is, what it does, and what questions to ask. A reasonable starter prompt:

> "You are Amily, a friendly receptionist for [Business Name], a plumbing company in Melbourne's south-east. Greet the caller, ask what they need help with, confirm the suburb, classify as standard job or emergency, and either book via the calendar tool or escalate emergencies to the on-call mobile. Speak warmly and clearly, in plain English. Keep calls under 3 minutes where possible."

### Step 5: Import the Twilio number into ElevenLabs

ElevenLabs supports SIP trunk import for Twilio numbers. In the agent's settings, go to **Phone > Import Number > SIP Trunk** and paste the **Origination URI** and credentials from Step 3. ElevenLabs will provision a public SIP address on their side; point your Twilio trunk's origination at it.

This is the part that goes wrong most often. The SIP credentials must match exactly, and the URI must include the transport (TLS) and the agent ID. Test with a quick inbound call from your mobile before moving on. If you hear ringing, then silence, then a hangup — your SIP credentials are wrong. If you hear the agent greet you, you are in business.

## How do I connect Cal.com booking and SMS confirmations to the voice agent?

This is where n8n earns its keep. ElevenLabs supports **custom webhook tools** — basically, the agent can call a URL you give it and use the response. We use that to ask n8n "is there a 4pm slot tomorrow?" and "please book the 4pm slot", and n8n talks to Cal.com in the background.

### Step 6: Build the Cal.com availability-check workflow in n8n

Create a new workflow in n8n with a **Webhook** node as the trigger. Set the authentication to a header secret. The webhook accepts three parameters: the event type ID (a number from Cal.com), the date the customer asked for, and the timezone ("Australia/Melbourne").

The webhook calls Cal.com's `GET /v1/availability` endpoint with those parameters and returns a list of free slots as JSON. The agent reads the JSON and offers the caller the next three available times in plain English.

### Step 7: Build the Cal.com booking workflow in n8n

A second webhook, same shape, but it calls Cal.com's `POST /v1/bookings` endpoint. The payload includes the event type, the start time, the caller's name, the caller's mobile (for the SMS), and a short note from the agent ("Customer mentioned a leaking hot water unit"). On success, the workflow returns the booking reference to the agent, who reads it back to the caller.

### Step 8: Build the SMS confirmation workflow in n8n

A third webhook fires after a successful booking. It uses Twilio's **Programmable SMS** API to send the customer a short confirmation: "G'day Sarah, your booking with [Business] is confirmed for Tuesday 4pm. Reply STOP to opt out." The same workflow also sends an internal notification — a Slack message to the tradie's phone, or an SMS to the on-call mobile.

### Step 9: Wire the webhooks into the ElevenLabs agent

In the agent's **Tools** section, add three tools, one per webhook. Each tool has a name ("check_availability", "book_appointment", "sendconfirmation"), a description in plain English, and the webhook URL. The system prompt references the tools by name. When the agent needs to book, it calls the tool; n8n does the work; the agent reads the result.

This is also where you add **emergency escalation**. A fourth tool ("escalate_emergency") sends an SMS to the on-call mobile with the caller's name, number, and the nature of the emergency, then returns "I've paged the on-call technician — they'll call you back within 15 minutes." The agent triggers that tool whenever the caller mentions burst pipes, gas, spark, flooding, or "no hot water and I have kids".

### Step 10: Test end-to-end

Call the 03 number from your test mobile. Walk through a happy-path booking: ask for a quote, get a time slot offered, confirm the booking, receive the SMS. Then walk through an emergency: mention a burst pipe, get the escalation message, receive the SMS on the on-call mobile. Then walk through a non-booking call: ask a pricing question, get a sensible answer, end the call. The whole test should take 10 minutes if the workflows are right.

## How much does a DIY AI voice receptionist cost in Australia per month?

The honest answer, for a single tradie business fielding 100-200 minutes of calls a month:

| Component | What it does | Monthly cost (AUD) |
|---|---|---|
| Twilio AU local 03 number | The number customers call | $3.00 |
| Twilio inbound voice usage | Per-minute telephony | ~$1.50-$2.00 (150 min × $0.010/min) |
| ElevenLabs Conversational AI | The voice agent, STT + LLM + TTS bundled | ~$13.50-$18.00 (~$0.09/min × 150 min) |
| n8n self-hosted (Pi) | Workflow glue | $0 |
| Cal.com | Booking calendar, free tier | $0 |
| Twilio SMS (booking confirmations) | ~150 SMS × $0.0796 | ~$12.00 |
| **Total** | | **~$30-$35/month** |

Add a buffer for ElevenLabs overage, occasional long calls, and SMS opt-outs, and you are at **AUD $50-$80/month** for a working system. Compared to a $3,500-$5,000/month human receptionist, the cost case writes itself.

The bigger costs are time and attention. The first 4-8 hours of setup are real work, and you will spend another 1-2 hours per month tuning the system prompt as you notice the kinds of calls it handles awkwardly. That time is the price of DIY.

## Should I build this myself, or hire Amily to set it up for me?

It depends on what your time is worth and how comfortable you are with webhooks, JSON, and Cal.com APIs. If you are a tradie who already runs your own ServiceM8 and your own Google Ads, you can probably get the DIY version working in a weekend. If the words "webhook" and "TwiML" make your eyes glaze over, the weekend will turn into three weekends, and the system will be half-built when your phone rings at 9pm on a Sunday.

**DIY makes sense if:** you are technical, you have a quiet weekend, you want full control over the prompts and workflows, and you are happy to maintain the system yourself. The cost is ~$30-$80/month in cash plus 5-10 hours of setup and 1-2 hours a month of ongoing tuning.

**Hiring Amily makes sense if:** you want a working system this week, you would rather be on the tools than debugging JSON, and you want someone to be accountable when the AI mishears a postcode at 2am. Our **AI Setup Consulting** is a one-off **AUD $2,500** for trades and hospitality, **AUD $3,500** for professional services, plus an optional **$299/month** retainer for ongoing tuning, prompt updates, and integration changes. See the full scope at [amily.ai/#setup](https://amily.ai/#setup).

The honest answer is that the build is well within reach for a competent technical founder, and out of reach for most busy operators. Knowing which one you are is the only question that matters.

---

**Want me to do this for you?** Amily's AI Setup Consulting is a one-off AUD $2,500 for trades and hospitality, AUD $3,500 for professional services — you get a working AI receptionist with a Melbourne 03 number, Cal.com booking, SMS confirmations, and emergency escalation, in about a week. See [amily.ai/#setup](https://amily.ai/#setup) or email [anthony@amily.ai](mailto:anthony@amily.ai) to scope your build.

**Not sure yet?** Book a free 15-min chat and we'll talk through your call volume, your current setup, and whether DIY or done-for-you makes more sense for your business. [amily.ai/#discovery](https://amily.ai/#discovery).

## Which sources were used for this AI voice setup guide?

- [Twilio Australia — regulatory guidelines](https://www.twilio.com/en-us/guidelines/au/regulatory) — ACMA-compliant identity verification and provisioning for AU local numbers.
- [Twilio Australia — voice pricing](https://www.twilio.com/en-us/voice/pricing/au) — $3/month for 03 number, $0.010/min inbound, $0.0252/min outbound to local, $0.0796/SMS.
- [ElevenLabs — Conversational AI overview](https://elevenlabs.io/docs/conversational-ai/overview) — STT + LLM + TTS bundled per-minute pricing, custom webhook tools, SIP trunk import.
- [ElevenLabs — Conversational AI pricing](https://elevenlabs.io/pricing) — Per-minute agent rate underpinning the cost model.
- [Cal.com — API documentation](https://cal.com/docs/api-reference/v1/introduction) — Availability check and booking endpoints used in the n8n workflows.
- [n8n — pricing and self-hosted guide](https://n8n.io/) — Workflow automation platform; self-hosted on Pi at $0/month.
- [OAIC — Privacy and commercially available AI products](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-the-privacy-and-the-use-of-commercially-available-ai-products) — Australian privacy guidance for AI call recording.
- [Ataccama — Australia Privacy Act 2024 amendments](https://www.ataccama.com/blog/australia-privacy-act-everything-you-need-to-know-2024) — 10 December 2026 ADM transparency deadline.
- [79dev — State of AI Search 2026](https://www.79dev.com/state-of-ai-search-2026) — Context for why customers arriving via AI channels are primed to engage with AI-assisted services.
- [ServiceM8, Tradify — tradie job management platforms](https://www.servicem8.com/) — Webhook integration points for the booking confirmation step.
