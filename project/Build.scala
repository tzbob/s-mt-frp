import sbt._
import Keys._

object SMTFRPBuild extends Build {
  lazy val rootSettings = Defaults.defaultSettings ++ Seq(
    version := "0.1",
    scalaVersion := "2.10.2-RC1",
    scalaOrganization := "org.scala-lang.virtualized",
    scalacOptions ++= Seq("-deprecation", "-unchecked", "-Xexperimental", "-Yvirtualize"),
    cancelable := true,
    resolvers ++= Seq(
      Resolver.sonatypeRepo("snapshots"),
      "spray repo" at "http://repo.spray.io/")
  )

  lazy val deps = Seq(
    "org.scalatest" % "scalatest_2.10" % "2.0.M5b" % "test",
    "io.spray" % "spray-testkit" % "1.2.0" % "test",
    "EPFL" %% "js-scala" % "0.4-SNAPSHOT",
    "io.spray" % "spray-can" % "1.2.0",
    "io.spray" % "spray-routing" % "1.2.0",
    "io.spray" %% "spray-json" % "1.2.5",
    "com.typesafe.akka" %% "akka-actor" % "2.2.3",
    "js-scala" %% "forest" % "0.5-SNAPSHOT",
    "cc.co.scala-reactive" %% "reactive-core" % "0.4.0-SNAPSHOT"
  )

  lazy val root = Project(
    "root",
    file("."),
    settings = rootSettings
  ).aggregate(core, examples)

  lazy val core = Project(
    "core",
    file("core"),
    settings = rootSettings ++ Seq(
      libraryDependencies ++= deps,
      name := "smtfrp-core"
    )
  )

  lazy val examples = Project(
    "examples",
    file("examples"),
    settings = rootSettings ++ Seq(
      name := "smtfrp-examples"
    )
  ).dependsOn(core)
}
