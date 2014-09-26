package mtfrp.lang

trait DatabaseDefinition extends DatabaseFunctionality {
  val database: driver.simple.Database
}