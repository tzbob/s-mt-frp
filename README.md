# Scala Multi-Tier FRP

We focus, firstly, on Functional Reactive Programming (FRP), which allows us to declaratively model the asynchronous user and client-server communication and, secondly, on multi-tier programming languages and frameworks, which remove the gap between client and server code.

Current web frameworks exploit the benefits of both approaches separately, but important additional benefits can be obtained from a deep integration of both ideas.
We propose Multi-tier FRP for the Web, a novel way of writing web applications where the FRP network spans client and server.

For more details please refer to this paper: ['Multi-tier Functional Reactive Programming for the Web'](https://lirias.kuleuven.be/bitstream/123456789/458251/1/sigplanconf-template.pdf) 

## Try it out!

Please note that this README describes a way to get our proof-of-concept
implementation running for experimentation.  Because it uses unstable
versions of some libraries and the libraries have changed since the
implementation, this README describes downloading old versions from
github for those libraries.  We have verified that this procedure
works for a user with a fresh scala install on our system, but this is
hard to guarantee.  We hope to develop our implementation further in
the future, particularly make it depend on more stable (versions of)
libraries.

### Install [SBT](http://www.scala-sbt.org/)

Please follow the install guide on the official [scala-sbt.org](http://www.scala-sbt.org/release/docs/Getting-Started/Setup.html#installing-sbt) website.

### Install [LMS](https://github.com/TiarkRompf/virtualization-lms-core)

    git clone https://github.com/TiarkRompf/virtualization-lms-core.git
    cd virtualization-lms-core
    git checkout a6ae135
    sbt publish-local
    cd ..

### Install [JS-Scala](https://github.com/js-scala/js-scala)

    git clone https://github.com/js-scala/js-scala.git
    cd js-scala
    git checkout 0b5771853a35a37d011f0ddebf770fdcd7fc8bc1
    sbt publish-local
    cd ..

### Install [Hokko](https://github.com/Tzbob/hokko)

    git clone https://github.com/Tzbob/s-frp.git
    cd s-frp
    git checkout 3cbd1769b8933c15ceb28a96
    sbt "project sfrpJVM" publish-local
    cd ..

### Run the examples

    git clone https://github.com/Tzbob/s-mt-frp.git
    cd s-mt-frp
    git checkout pldi15
    sbt "project examples" run

The 'Demo' object contains the bootstrapping code for the following examples:

- the Echo program is available at [http://localhost:8080/echo](http://localhost:8080/echo),
- the BasicChat program is available at [http://localhost:8080/basicchat](http://localhost:8080/basicchat),
- the Chat program is available at [http://localhost:8080/chat](http://localhost:8080/chat),
- the TestGlitches program is available at [http://localhost:8080/glitches](http://localhost:8080/glitches),
- the CounterBenchmark program is available at [http://localhost:8080/bench](http://localhost:8080/bench),
- the DatabaseBenchmark program is available at [http://localhost:8080/dbbench](http://localhost:8080/dbbench).

## Layout

The repository is split into **examples** and **core** containing demo and framework code.

### Examples

"smtfrp/examples" contains some small demo applications;

- ```TestGlitches``` demonstrates our glitch prevention when combining multiple external FRP networks,
- ```EchoProg``` is the simplest example, a message is taken to the server anonymously and broadcasted to all connections,
- ```BasicChatProg``` is a simple implementation of a chat application that shows improved networking performance using incremental behaviors,
- ```Demo``` demonstrates how a program written using our DSL is made available,
- ```...``` we have plenty of other small examples, some which use the database API and some that demonstrate our use of incremental behaviors.

### Core

You should look at "core/src/main/scala/mtfrp" when navigating through **core**, you will find three packages:

- **lang**: the DSL definitions for our multi-tier FRP language are located here e.g. ```MtFrpProg```
- **exp**: contains the implementations of our DSL definition in the LMS way e.g. ```MtFrpProgExp```
- **gen**: contains the JavaScript generators for all our implementatinons e.g. ```GenMtFrpProg```
