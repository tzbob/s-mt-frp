import sbt._
import Keys._

object SMTFRPBuild extends Build {
  lazy val SMTFRPSettings = Project.defaultSettings ++ Seq(
    name := "SMTFRP",
    version := "0.1",
    scalaVersion := "2.10.2-RC1",
    scalaOrganization := "org.scala-lang.virtualized",

    scalacOptions += "-Yvirtualize",
    scalacOptions += "-Xexperimental",

    libraryDependencies ++= Seq(
      "org.scalatest" % "scalatest_2.10" % "2.0.M5b" % "test",
      "EPFL" %% "js-scala" % "0.4-SNAPSHOT",
      "io.spray" % "spray-can" % "1.1-M8",
      "io.spray" % "spray-routing" % "1.1-M8",
      "io.spray" % "spray-testkit" % "1.1-M8",
      "io.spray" %% "spray-json" % "1.2.5",
      "com.typesafe.akka" %% "akka-actor" % "2.1.4",
      "com.typesafe.akka" %% "akka-testkit" % "2.1.4",
      "js-scala" %% "forest" % "0.5-SNAPSHOT",
      "cc.co.scala-reactive" %% "reactive-core" % "0.4.0-SNAPSHOT"
    ),

    resolvers ++= Seq(
      Resolver.sonatypeRepo("snapshots"),
      "spray repo" at "http://repo.spray.io/"
    )
  )

  lazy val project = Project(
    id = "SMTFRP",
    base = file("."),
    settings = SMTFRPSettings)
}
