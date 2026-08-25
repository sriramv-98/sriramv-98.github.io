---
title: "Java, While You Have Some Java"
description: "Tracing Java's journey from applets and Servlets, through the EJB dependency mess, to how Spring and Spring Boot solved dependency injection and deployment."
pubDate: 2026-08-24
tags: ["java", "spring", "history"]
draft: false
image: "/img/java-coffee.svg"
imageAlt: "Illustration of a steaming coffee mug printed with JAVA, with coffee beans floating nearby"
---

I was contemplating what I wanted my first blog to be about, and decided it's better to go back to how my journey into software development started: Java. I got into coding with Java in 9th grade, as part of my school curriculum. And as one usually does when starting to code because of a school course, I began with theory and writing programs to generate the Fibonacci sequence, and so on. I remember learning the "features" of Java and answering exam questions by stating that Java was "platform independent," without probing deeper into why that was such a big deal when the language was created.

Java was created by a team at Sun Microsystems to make software that could run on any hardware device, essentially an embedded software. The aim was it could run anywhere without being rewritten, hence the "WORA" tag: write once, run anywhere. This goal shaped the creation of the JVM. Java code is compiled to bytecode, which the JVM can then run on any platform. The need for a platform-independent language stemmed from the fact that other languages had to be compiled to machine code specific to a given chip's architecture, a different chip meant code had to be written (or at least recompiled) differently. There was also a need for something less prone to crashing the underlying system. Traditional languages like C and C++ use manual pointers and manual memory allocation, which can cause memory leaks and crashes. Java eliminated a lot of that risk by managing memory itself and deliberately being more robust. That said, this vision didn't fully pan out at first. Java was ahead of its time in the early 90s, the low-cost chips it was originally aimed at (in embedded, consumer-electronics devices) simply didn't have the processing power or memory to run the JVM well.

The hardware eventually caught up, and Java now runs on billions of devices — but at the time, the way Java found relevance was through applets.

An applet is a small application embedded within a larger one. Today the term almost universally refers to "Java applets" specifically. A Java applet was a program embedded in a webpage that ran automatically when that page was visited. The browser would pull down the applet's code and hand it off to the local machine's Java plugin. Netscape's NPAPI (Netscape Plugin Application Programming Interface) was the plugin architecture that let a browser hand control of that applet-defined area of a page over to the computer's Java runtime. (If you've ever seen a "Java plugin" error in a browser years ago, now you know what it was doing.) Java applets were used for a wide range of things: online games, mortgage calculators, and more.

Giving a browser plugin the ability to hand control over to the operating system is not a great idea, and hackers exploited it easily. So while Java was fighting a losing battle here, it was quietly turning out to be a great backend server language. Its features (portability, memory safety, a large standard library) suited backend services well, and this helped drive the creation of a Java edition purpose-built for enterprise backend systems: **J2EE**, the Java 2 Platform, Enterprise Edition. Sun Microsystems also developed the Java Servlet as part of this push. That one decision set a lot of what follows into motion, and is a big part of how Java is used today.

The `HttpServlet` class enabled Java to respond to web requests directly, through methods like `doGet` and `doPost`. The catch: servlets had to build and print out raw HTML from inside Java code, which wasn't great for anything beyond the simplest dynamic rendering.

```java
public class HelloServlet extends HttpServlet {
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        PrintWriter out = res.getWriter();
        out.println("<html><body>");
        out.println("<h1>Hello, " + req.getParameter("name") + "</h1>");
        out.println("</body></html>");
    }
}
```

Then came JSP (JavaServer Pages): instead of starting from Java and printing out HTML, we start from HTML and embedded Java directly inside it — enabling dynamic rendering without turning the view into a series of `println` calls.

```html
<html>
<body>
<h1>Hello, <%= request.getParameter("name") %></h1>
</body>
</html>
```

This worked out well, and a number of well-known companies got their start on exactly this architecture. LinkedIn was one of them, it was initially a Java Servlet - JSP stack.

Servlets and JSP solved *how* Java could respond to a web request and render a page, but they didn't solve a bigger problem waiting just behind that: how do we manage all the objects a real backend application needs, and get that application running in front of users?

On the object-management side, J2EE's answer was Enterprise JavaBeans (EJB). A heavy component model where a single piece of business logic typically meant writing a remote interface, a local interface, an implementation class, and a verbose XML deployment descriptor, all just to have one object (technically a class) collaborate with another. Every class was responsible for constructing its own dependencies:

```java
public class OrderService {
    private PaymentGateway paymentGateway = new PaymentGateway();
    private InventoryService inventoryService = new InventoryService();
}
```

That's manageable for a small program, but it becomes brittle fast, change how `PaymentGateway` is built, and every class that did `new PaymentGateway()` has to change with it. We also can't swap in a fake version for a test without touching the production class itself. This is the exact problem **dependency injection** was built to solve — instead of a class constructing its own dependencies, it simply declares what it needs, and a container supplies them:

```java
public class OrderService {
    private final PaymentGateway paymentGateway;
    private final InventoryService inventoryService;

    public OrderService(PaymentGateway paymentGateway, InventoryService inventoryService) {
        this.paymentGateway = paymentGateway;
        this.inventoryService = inventoryService;
    }
}
```

This is precisely what the Spring framework introduced — a lightweight container that wires plain Java objects (POJO) together.

On the deployment side, there was a separate, equally real source of friction. Getting a Java web app in front of users traditionally meant:

1. Writing the app with the Servlet API.
2. Compiling it and packaging it, along with JSPs and a `web.xml`, into a WAR (Web Archive) file.
3. Separately installing and configuring an application server on the target machine.
4. Copying the WAR into that server's deployment folder and letting the server unpack it and mount it under a context path.

That's a lot of manual setup and coordination, repeated for every environment — dev, staging, production — and it only got harder as companies moved from one big application to many smaller services. Spring Boot is what finally addressed this half of the problem: it packages the application, all its dependencies, *and* an embedded server (Tomcat by default) into a single executable JAR. There's no separate server to install — the JAR contains its own. The command used to run it is:

```
java -jar java-app.jar
```

and that one command starts the application code and spins up its own embedded server in the same process. Deployment goes from "build a WAR, install a server, deploy into it" to "build one JAR, run it anywhere there's a JVM" — which is a big part of why Spring Boot mapped so cleanly onto the cloud and container-based deployment that followed.

A Spring Boot application was one of the first projects I worked on at my first job, so I went from generating the Fibonacci sequence in BlueJ to shipping features in a Spring Boot service, without ever seeing what sat in between. It was the embedded server that first made me stop and ask questions: why did this framework ship with its own server, and how did anyone deploy a Java app before that existed? That question is what sent me down the rabbit hole this post has been retracing — servlets and JSP, the mess EJB left behind, Spring's answer to it, and Spring Boot closing the last gap. If you're where I was, staring at a `@SpringBootApplication` annotation and wondering what it's actually doing for you, hopefully this gives some additional history and context.
