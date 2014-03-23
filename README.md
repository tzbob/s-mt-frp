# Scala Multi-Tier FRP

We focus, firstly, on Functional Reactive Programming (FRP), which allows us to declaratively model the asynchronous user and client-server communication and, secondly, on multi-tier programming languages and frameworks, which remove the gap between client and server code.

Current web frameworks exploit the benefits of both approaches separately, but important additional benefits can be obtained from a deep integration of both ideas.
We propose Multi-tier FRP for the Web, a novel way of writing web applications where the FRP network spans client and server.

## Try it out!

### Install [SBT](http://www.scala-sbt.org/)

Please follow the install guide on the official [scala-sbt.org](http://www.scala-sbt.org/release/docs/Getting-Started/Setup.html#installing-sbt) website.

### Install [LMS](https://github.com/TiarkRompf/virtualization-lms-core)

    git clone git@github.com:TiarkRompf/virtualization-lms-core.git
    cd virtualization-lms-core
    sbt publish-local
    cd ..

### Install [JS-Scala](https://github.com/js-scala/js-scala)

    git clone git@github.com:js-scala/js-scala.git
    cd js-scala
    sbt publish-local
    cd ..

### Install [Forest](https://github.com/js-scala/forest)
    git clone git@github.com:js-scala/forest.git
    cd forest/forest
    sbt publish-local
    cd ../..

### Install [Reactive](https://github.com/nafg/reactive/)

    git clone git@github.com:nafg/reactive.git
    cd reactive
    git checkout v0.4.0
    sbt publish-local
    cd ..

### Run the examples

    git clone git@github.com:Tzbob/s-mt-frp.git
    cd s-mt-frp
    sbt "project examples" run

The 'Demo' object contains the following code:
```
...
val echoRoute = PageCompiler.makeRoute(echoProg)("echo")
val guestRoute = PageCompiler.makeRoute(guestProg)("guest")
val basicChatRoute = PageCompiler.makeRoute(basicChatProg)("basicchat")
val chatRoute = PageCompiler.makeRoute(chatProg)("chat")
startServer("::1", port = 8080)...
```
Which indicates that;

- the Echo program is available at [http://localhost:8080/echo](http://localhost:8080/echo),
- the GuestBook program is available at [http://localhost:8080/guest](http://localhost:8080/guest),
- the BasicChat program is available at [http://localhost:8080/basicchat](http://localhost:8080/basicchat),
- the Chat program is available at [http://localhost:8080/chat](http://localhost:8080/chat).

## Layout

The repository is split into **examples** and **core** containing demo and framework code.

### Examples

"smtfrp/examples" contains some small demo applications;

- ```EasyHTML``` demonstrates how additional JavaScript modules can be defined,
- ```EchoProg``` is the simplest example, a message is taken to the server anonymously and broadcasted to all connections,
- ```GuestbookProg``` introduces an example to keep state on the server,
- ```BasicChatProg``` is a simple implementation of a chat application,
- ```ChatProg``` extends on the simple chat implementation and adds private messaging, this example displays the expressive power of our approach when dealing with connection identification,
- ```Demo``` demonstrates how a program written using our DSL is made available.

### Core

You should look at "core/src/main/scala/mtfrp" when navigating through **core**, you will find three packages:

- **lang**: the DSL definitions for our multi-tier FRP language are located here e.g. ```MtFrpProg```
- **exp**: contains the implementations of our DSL definition in the LMS way e.g. ```MtFrpProgExp```
- **gen**: contains the JavaScript generators for all our implementatinons e.g. ```GenMtFrpProg```
