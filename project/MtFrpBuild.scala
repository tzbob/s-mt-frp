import sbt._
import Keys._

object MtFrpBuild extends Build {

  override lazy val settings = super.settings ++ Seq(
    isSnapshot := true,
    organization := "mtfrp",
    version := "0.3-SNAPSHOT",

    scalaVersion := "2.11.2",
    scalaOrganization := "org.scala-lang.virtualized",

    resolvers ++= Seq(
      Resolver.sonatypeRepo("snapshots")
    ),

    scalacOptions ++= Seq(
      "-encoding", "UTF-8",
      "-target:jvm-1.6",
      "-feature",
      "-deprecation",
      "-Xlint",
      "-Yinline-warnings",
      "-Yno-adapted-args",
      "-Ywarn-dead-code",
      "-Ywarn-numeric-widen", // bad implicit widening somewhere
      "-Ywarn-value-discard", // will require a lot of work
      "-Xfuture"
    )
  )

  lazy val root = Project("root", file("."))
    .aggregate(mtfrp, html, examples)

  lazy val mtfrp = Project("mtfrp", file("mtfrp"))
    .settings(
      name := "smtfrp-core",
      libraryDependencies ++= Seq(
        // "org.scala-lang.virtualized" % "scala-compiler" % "2.10.2",
        // "org.scala-lang.virtualized" % "scala-library" % "2.10.2",
        // "org.scala-lang.virtualized" % "scala-reflect" % "2.10.2",
        "EPFL" %% "lms" % "0.3-SNAPSHOT",
        "EPFL" %% "js-scala" % "0.4-SNAPSHOT",
        "com.github.tzbob" %% "hokko" % "0.1-SNAPSHOT",
        "io.spray" %% "spray-can" % "1.3.2",
        "io.spray" %% "spray-routing-shapeless2" % "1.3.2",

        "io.circe" %% "circe-core" % "0.3.0-SNAPSHOT",
        "io.circe" %% "circe-generic" % "0.3.0-SNAPSHOT",
        "io.circe" %% "circe-parser" % "0.3.0-SNAPSHOT",

        "com.typesafe.akka" %% "akka-actor" % "2.3.6",
        "org.slf4j" % "slf4j-nop" % "1.6.4",
        "org.scalatest" %% "scalatest" % "2.2.6" % "test"
      )
    )

  lazy val html = Project("html", file("html"))
    .settings(
      name := "smtfrp-html"
    )
    .dependsOn(mtfrp)

  lazy val examples = Project("examples", file("examples"))
    .settings(
      name := "smtfrp-examples"
    )
    .dependsOn(mtfrp, html)
}

// lazy val core = project.in(file("core"))
//   .settings(sharedSettings: _*)
//   .settings(
//   fork in run := true,
//   name := "smtfrp-core",
//     resolvers ++= Seq(
//       Resolver.sonatypeRepo("snapshots"),
//       "spray repo" at "http://repo.spray.io/"),
//     libraryDependencies ++= Seq(
//       "org.scala-lang.virtualized" % "scala-compiler" % "2.10.2",
//       "org.scala-lang.virtualized" % "scala-library" % "2.10.2",
//       "org.scala-lang.virtualized" % "scala-reflect" % "2.10.2",
//       "EPFL" %% "lms" % "0.3-SNAPSHOT",
//       "EPFL" %% "js-scala" % "0.4-SNAPSHOT",
//       "com.github.tzbob" %% "hokko" % "0.1-SNAPSHOT",
//       "io.spray" %% "spray-can" % "1.3.2",
//       "io.spray" %% "spray-routing-shapeless2" % "1.3.2",
//       "io.spray" %% "spray-json" % "1.2.6",
//       "com.typesafe.akka" %% "akka-actor" % "2.3.6",
//       "com.typesafe.slick" %% "slick" % "3.0.0-RC3",
//       "org.slf4j" % "slf4j-nop" % "1.6.4",
//       "com.chuusai" % "shapeless_2.10.4" % "2.0.0"))

// lazy val examples = project.in(file("examples"))
//   .settings(sharedSettings: _*).settings(
//   name := "smtfrp-examples",
//     libraryDependencies ++= Seq(
//       "org.postgresql" % "postgresql" % "9.3-1102-jdbc41",
//       "com.h2database" % "h2" % "1.3.166"))
//   .dependsOn(core)
