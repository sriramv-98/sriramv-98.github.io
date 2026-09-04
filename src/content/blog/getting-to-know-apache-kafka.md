---
title: "Getting to Know Apache Kafka"
description: "How LinkedIn's data pipeline problems led to Apache Kafka — producers, brokers, topics, partitions, and how queues, pub-sub, and event streaming differ."
pubDate: 2026-09-03
tags: ["kafka", "distributed-systems", "messaging"]
draft: false
image: "/img/kafka-simple.svg"
imageAlt: "Simplified diagram of a producer writing to a Kafka topic split into partitions, read by two consumers"
---

When I was interning at Cisco, I used to catch up with my fellow interns over lunch. During one of these conversations, someone mentioned the term "Apache Kafka." When I asked what it did, he said it was used for streaming events or messages. I also heard the term "pub-sub" thrown around.

So I did a little deep dive, and here's what I learned. Services need data — sometimes a continuous flow of it. An easy example we see day to day is the continuous tracking of a cab or a delivery driver. We could build an API and make a synchronous call to fetch the result, but that introduces latency, and if the service gets overloaded, let's say, a million users all polling for tracking data at once then that latency compounds during peak hours. The server processing those requests sequentially (no matter how much you scale it horizontally) ends up with requests piling up faster than it can drain them.

LinkedIn was facing a similar issue with the analytics data it was producing. Activity events were emitted in XML, parsed by an hourly ETL job, and loaded into Oracle RDBMS and Hadoop clusters for offline analysis. Separately, real-time continuous data flowed as regular logs into Zenoss, their monitoring tool. Neither pipeline talked to the other, and both were point-to-point and every new system that wanted this data had to be wired up to it individually. That recreated the exact problem I described above — one place for every client to read from meant the same availability and latency issues, just moved a layer down the stack.

To solve this, LinkedIn built Apache Kafka. Before going further into Kafka itself, it's worth laying out the messaging patterns that solve the underlying problem. The fix is asynchronous communication. Instead of a client calling a service and blocking until data is ready, it gets notified once the data becomes available. The concepts are simple — a **producer** is the service that produces data, a **consumer** is what reads and uses that data, and a **broker** sits in between, routing data to the right consumer and notifying it that something new has arrived.

This asynchronous pattern shows up in three main patterns:

1. **Queues** — one producer pushes data onto a queue, and a consumer reads it sequentially, one message at a time.
2. **Pub-Sub** — one producer, many consumers. A broker sits in the middle; consumers subscribe to a topic, and the broker notifies every subscriber of that topic when a new message arrives.
3. **Event streaming** — essentially a stream of logs. A consumer can read it in real time, or rewind it to replay historical data.

Coming back to Kafka, it implements the event-streaming pattern. Apache Kafka is an event-streaming platform used to build real-time streaming data pipelines. Here are its important building blocks:

1. **Topic**: the fundamental unit of organization in Kafka. A topic stores an **ordered** named, append-only log, similar to a folder, where each event is a file inside it.
2. **Events**: a single record inside a topic — the actual message a producer writes (e.g. "user 42 clicked button X at 10:02:03"). Events are never deleted just because they've been read; they stick around until a retention policy expires them, which is what makes replaying history possible.
3. **Broker**: a server in the Kafka cluster that stores and serves data for one or more partitions. A Kafka cluster is just a group of brokers working together, more the brokers, the more a topic's data and traffic can be spread out.
4. **Partitions**: each topic is split into partitions, and every partition is its own independent, ordered log. This is what makes Kafka scale — partitions get spread across brokers, so producers can write to many machines at once and consumers can read from many machines at once. Kafka only guarantees ordering *within* a partition, not across an entire topic.
5. **Producer**: the application that writes events to a topic. A producer decides where each event goes. It is usually round robin, but if you attach a key to an event, Kafka hashes that key to consistently route it to the same partition every time. Basically ensuring that bucketing is consistent amongst the partitions.
6. **Consumers**: client applications that read events from a topic. Each consumer tracks its own **offset**, so that it can pause, catch up, or replay from an earlier point without affecting any other consumer reading the same topic. Consumers are usually organized into **consumer groups**: within one group, each partition is read by only one consumer instance.
7. **Replication**: every partition is copied across multiple brokers, so that if one broker goes down, another replica already has the data and can take over as the new leader. One broker is always the "leader" for a given partition and it handles all reads and writes for it, while the others quietly stay in sync as followers, ready to step in.

### How this actually helped, at scale

LinkedIn didn't just fix its own pipeline, it ended up open-sourcing the fix, and Kafka became the backbone a lot of the industry now runs on:

- **LinkedIn** still uses Kafka as the activity-tracking spine of the site — every view, click, and interaction flows through it into both real-time features (like "who's viewed your profile") and offline systems for ML training and analytics.
- **Uber** runs Kafka across dozens of clusters, over 20,000 topics, and roughly 200,000 partitions, peaking around 12 million messages a second.
- **Netflix** built Keystone, its real-time stream-processing platform, with Kafka as the messaging backbone.

The common thread: all three needed the same thing LinkedIn originally needed — one durable, replayable log that any number of producers and consumers could plug into, without wiring up a custom point-to-point connection for every new system that wanted the data.

### Putting it all together

Here's roughly how a topic, its partitions, and a couple of consumer groups fit together:

![Apache Kafka core building blocks — a topic with 3 partitions spread across brokers, a producer writing events, and two consumer groups reading them independently](/img/kafka-diagram.png)

---

Funny enough, my friend's one-line answer at lunch — "it's used for streaming events" was an undersell. Kafka isn't just a way to move events from A to B; it's a durable, replayable log that decouples how fast something happens from how fast every system that cares about it can keep up. Next time this comes up over lunch, I'll have a lot more to say back.
